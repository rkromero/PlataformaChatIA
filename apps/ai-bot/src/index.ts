import Fastify from 'fastify';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { webhookRoutes } from './routes/webhook.js';
import { wahaWebhookRoutes } from './routes/waha-webhook.js';

const app = Fastify({ logger: false });

app.get('/health', async () => ({ status: 'ok', service: 'ai-bot' }));

app.register(webhookRoutes);
app.register(wahaWebhookRoutes);

async function start() {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info({ port: env.PORT }, 'AI Bot started');
  } catch (err) {
    logger.fatal(err, 'Failed to start');
    process.exit(1);
  }
}

start();
