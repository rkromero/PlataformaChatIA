import type { FastifyInstance } from 'fastify';
import { logger, tenantLogger } from '../lib/logger.js';
import { prisma } from '../lib/db.js';
import { generateReply } from '../services/openai.js';
import { wahaSendText, wahaGetMessages, isWahaConfigured } from '../services/waha.js';
import { checkAndIncrementUsage } from '../services/usage.js';
import { getKnowledgeContext } from '../services/knowledge.js';
import { upsertConversationLink, existsLeadForPhone } from '../services/conversation-link.js';
import { syncLeadToCrm } from '../services/crm.js';
import type { HandoffRules } from '@chat-platform/shared/types';

interface WahaMessagePayload {
  id: string;
  timestamp: number;
  from: string;
  fromMe: boolean;
  to: string;
  body: string;
  hasMedia: boolean;
  media?: {
    url: string;
    mimetype: string;
    filename?: string;
  };
}

interface WahaWebhookBody {
  event: string;
  session: string;
  me?: { id: string; pushName: string };
  payload: WahaMessagePayload;
}

export async function wahaWebhookRoutes(app: FastifyInstance) {
  app.post('/webhooks/waha', async (request, reply) => {
    if (!isWahaConfigured()) {
      return reply.status(200).send({ ok: false, reason: 'waha_not_configured' });
    }

    const body = request.body as WahaWebhookBody;
    reply.status(200).send({ ok: true });

    try {
      await handleWahaWebhook(body);
    } catch (err) {
      logger.error({ err }, 'Unhandled error in WAHA webhook handler');
    }
  });
}

async function handleWahaWebhook(body: WahaWebhookBody) {
  const { event, session: sessionName, payload } = body;

  logger.info({ event, session: sessionName }, 'WAHA webhook received');

  if (event !== 'message') return;
  if (!payload || payload.fromMe) return;

  const messageText = payload.body || '';
  const senderChatId = payload.from;

  if (!senderChatId || !messageText) return;

  const phone = chatIdToPhone(senderChatId);
  const contactName = extractName(body);

  const tenant = await resolveTenantFromSession(sessionName);
  if (!tenant) {
    logger.info({ sessionName }, 'No tenant found for WAHA session, skipping');
    return;
  }

  const log = tenantLogger(tenant.id);
  const settings = tenant.aiSettings;

  if (!settings?.enabled) {
    log.info('AI disabled for tenant, skipping');
    return;
  }

  const handoffRules = settings.handoffRulesJson as unknown as HandoffRules;
  const contentLower = messageText.toLowerCase();
  const isHandoffRequest = handoffRules.keywords.some((kw: string) =>
    contentLower.includes(kw.toLowerCase()),
  );

  if (isHandoffRequest) {
    log.info({ chatId: senderChatId }, 'Handoff requested by user (WAHA)');
    await wahaSendText(
      sessionName,
      senderChatId,
      'Te estoy transfiriendo con un asesor. Un momento por favor.',
    );
    return;
  }

  const usage = await checkAndIncrementUsage(tenant.id, tenant.plan);
  if (!usage.allowed) {
    log.info({ current: usage.current, limit: usage.limit }, 'Monthly limit reached');
    await wahaSendText(
      sessionName,
      senderChatId,
      'Nuestro servicio de atención automática alcanzó el límite mensual. Por favor contactanos directamente.',
    );
    return;
  }

  const [history, knowledgeContext] = await Promise.all([
    wahaGetMessages(sessionName, senderChatId, 10),
    getKnowledgeContext(tenant.id, messageText),
  ]);

  const enrichedPrompt = settings.systemPrompt + knowledgeContext;

  const aiReply = await generateReply(
    settings.model,
    enrichedPrompt,
    messageText,
    history,
  );

  await wahaSendText(sessionName, senderChatId, aiReply);

  syncLeadInBackground({
    tenantId: tenant.id,
    sessionName,
    chatId: senderChatId,
    phone,
    contactName,
    lastMessage: messageText,
  }).catch((err) => log.error({ err }, 'Background CRM sync failed (WAHA)'));
}

function chatIdToPhone(chatId: string): string {
  return chatId.replace(/@.*$/, '');
}

function extractName(body: WahaWebhookBody): string | null {
  return body.me?.pushName ?? null;
}

async function resolveTenantFromSession(sessionName: string) {
  const channel = await prisma.tenantChannel.findFirst({
    where: { evolutionInstance: sessionName, type: 'whatsapp_qr' },
    include: {
      tenant: {
        include: { aiSettings: true },
      },
    },
  });

  if (!channel?.tenant) return null;
  if (channel.tenant.status !== 'active') return null;

  return channel.tenant;
}

async function syncLeadInBackground(params: {
  tenantId: string;
  sessionName: string;
  chatId: string;
  phone: string | null;
  contactName: string | null;
  lastMessage: string;
}) {
  const { tenantId, chatId, phone, contactName, lastMessage } = params;

  const uniqueConvId = -Math.abs(hashCode(tenantId + chatId));

  if (phone && (await existsLeadForPhone(tenantId, phone))) {
    await upsertConversationLink({
      tenantId,
      conversationId: uniqueConvId,
      phone,
      contactName,
      lastMessage,
    });
    return;
  }

  const crmLeadId = await syncLeadToCrm({
    tenant_id: tenantId,
    source: 'whatsapp',
    phone,
    name: contactName,
    chatwoot_conversation_id: uniqueConvId,
    chatwoot_inbox_id: null,
    last_message: lastMessage,
  });

  await upsertConversationLink({
    tenantId,
    conversationId: uniqueConvId,
    phone,
    contactName,
    lastMessage,
    crmLeadId,
  });
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}
