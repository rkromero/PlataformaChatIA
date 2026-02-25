import Fastify from 'fastify';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { webhookRoutes } from './routes/webhook.js';
import { baileysApiRoutes } from './routes/baileys-api.js';
import { reconnectActiveSessions } from './services/baileys-manager.js';
import { startReminderLoop } from './services/appointment-reminders.js';

const app = Fastify({ logger: false });

app.get('/health', async () => ({ status: 'ok', service: 'ai-bot' }));

app.register(webhookRoutes);
app.register(baileysApiRoutes);

async function start() {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info({ port: env.PORT }, 'AI Bot started');

    reconnectActiveSessions().catch((err) =>
      logger.error({ err }, 'Failed to reconnect Baileys sessions on startup'),
    );

    startReminderLoop();
  } catch (err) {
    logger.fatal(err, 'Failed to start');
    process.exit(1);
  }
}

start();
