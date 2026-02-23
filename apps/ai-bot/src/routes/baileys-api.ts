import type { FastifyInstance } from 'fastify';
import { logger } from '../lib/logger.js';
import {
  createSession,
  getSessionQr,
  getSessionStatus,
  sendMessage,
  deleteSession,
} from '../services/baileys-manager.js';

export async function baileysApiRoutes(app: FastifyInstance) {
  app.post('/api/sessions', async (request, reply) => {
    const { tenantId } = request.body as { tenantId?: string };
    if (!tenantId) {
      return reply.status(400).send({ error: 'tenantId required' });
    }

    try {
      const result = await createSession(tenantId);
      return reply.send(result);
    } catch (err) {
      logger.error({ err, tenantId }, 'Failed to create Baileys session');
      return reply
        .status(500)
        .send({ error: 'Failed to create session' });
    }
  });

  app.get<{ Params: { tenantId: string } }>(
    '/api/sessions/:tenantId/qr',
    async (request) => {
      const { tenantId } = request.params;
      const qr = getSessionQr(tenantId);
      return { qr };
    },
  );

  app.get<{ Params: { tenantId: string } }>(
    '/api/sessions/:tenantId/status',
    async (request) => {
      const { tenantId } = request.params;
      const status = getSessionStatus(tenantId);
      return { status };
    },
  );

  app.post<{ Params: { tenantId: string } }>(
    '/api/sessions/:tenantId/send',
    async (request, reply) => {
      const { tenantId } = request.params;
      const { chatId, text } = request.body as {
        chatId?: string;
        text?: string;
      };

      if (!chatId || !text) {
        return reply
          .status(400)
          .send({ error: 'chatId and text required' });
      }

      try {
        await sendMessage(tenantId, chatId, text);
        return { ok: true };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Send failed';
        return reply.status(502).send({ error: msg });
      }
    },
  );

  app.delete<{ Params: { tenantId: string } }>(
    '/api/sessions/:tenantId',
    async (request) => {
      const { tenantId } = request.params;
      await deleteSession(tenantId);
      return { ok: true };
    },
  );
}
