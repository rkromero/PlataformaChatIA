import type { FastifyInstance } from 'fastify';
import { env } from '../lib/env.js';
import { logger, tenantLogger } from '../lib/logger.js';
import { resolveTenant } from '../services/tenant-resolver.js';
import { sendMessage, addLabel } from '../services/chatwoot.js';
import { generateReply } from '../services/openai.js';
import { syncLeadToCrm } from '../services/crm.js';
import {
  upsertConversationLink,
  existsLeadForPhone,
} from '../services/conversation-link.js';
import type { HandoffRules } from '@chat-platform/shared/types';

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/webhooks/chatwoot', async (request, reply) => {
    const secret = request.headers['x-webhook-secret'] as string | undefined;
    if (secret && secret !== env.CHATWOOT_WEBHOOK_SECRET) {
      logger.warn('Invalid webhook secret');
      return reply.status(200).send({ ok: false, reason: 'invalid_secret' });
    }

    const body = request.body as Record<string, unknown>;

    reply.status(200).send({ ok: true });

    try {
      await handleWebhook(body);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : '';
      logger.error({ error: msg, stack }, 'Unhandled error in webhook handler');
    }
  });
}

async function handleWebhook(body: Record<string, unknown>) {
  const event = body.event as string;
  logger.info({ event, messageType: body.message_type, hasAccount: !!body.account }, 'Webhook received');

  if (event !== 'message_created') return;

  const account = body.account as { id: number } | undefined;
  if (!account?.id) return;

  const messageType = body.message_type as string | undefined;
  if (messageType !== 'incoming') return;

  const sender = body.sender as { type?: string } | undefined;
  if (sender?.type === 'agent') return;

  const conversation = body.conversation as {
    id: number;
    labels?: string[];
    meta?: {
      assignee?: { id: number } | null;
      sender?: { id: number; name?: string; phone_number?: string };
    };
    contact?: { id: number; name?: string; phone_number?: string };
  } | undefined;

  if (!conversation?.id) return;

  const inbox = body.inbox as { id: number } | undefined;
  const content = (body.content as string) ?? '';

  const tenant = await resolveTenant(account.id, inbox?.id);
  if (!tenant) {
    logger.info({ accountId: account.id }, 'No tenant found, skipping');
    return;
  }

  const log = tenantLogger(tenant.id);
  const settings = tenant.aiSettings;

  if (!settings?.enabled) {
    log.info('AI disabled for tenant, skipping');
    return;
  }

  const labels = conversation.labels ?? [];
  const handoffRules = settings.handoffRulesJson as HandoffRules;

  if (labels.includes(handoffRules.handoffTag)) {
    log.info({ conversationId: conversation.id }, 'Handoff tag present, skipping');
    return;
  }

  if (conversation.meta?.assignee) {
    log.info({ conversationId: conversation.id }, 'Agent assigned, skipping');
    return;
  }

  const contactPhone =
    conversation.contact?.phone_number ??
    conversation.meta?.sender?.phone_number ??
    null;

  const contactName =
    conversation.contact?.name ??
    conversation.meta?.sender?.name ??
    null;

  const contactId =
    conversation.contact?.id ??
    conversation.meta?.sender?.id ??
    null;

  const contentLower = content.toLowerCase();
  const isHandoffRequest = handoffRules.keywords.some((kw: string) =>
    contentLower.includes(kw.toLowerCase()),
  );

  if (isHandoffRequest) {
    log.info({ conversationId: conversation.id }, 'Handoff requested by user');
    await addLabel(account.id, conversation.id, handoffRules.handoffTag);
    await sendMessage(
      account.id,
      conversation.id,
      'Te estoy transfiriendo con un asesor. Un momento por favor.',
    );
    return;
  }

  const aiReply = await generateReply(settings.model, settings.systemPrompt, content);
  await sendMessage(account.id, conversation.id, aiReply);

  // CRM sync (async, non-blocking)
  syncLeadInBackground({
    tenantId: tenant.id,
    conversationId: conversation.id,
    contactId,
    contactPhone,
    contactName,
    inboxId: inbox?.id ?? null,
    lastMessage: content,
  }).catch((err) => log.error({ err }, 'Background CRM sync failed'));
}

async function syncLeadInBackground(params: {
  tenantId: string;
  conversationId: number;
  contactId: number | null;
  contactPhone: string | null;
  contactName: string | null;
  inboxId: number | null;
  lastMessage: string;
}) {
  const {
    tenantId, conversationId, contactId, contactPhone,
    contactName, inboxId, lastMessage,
  } = params;

  if (contactPhone && (await existsLeadForPhone(tenantId, contactPhone))) {
    await upsertConversationLink({
      tenantId,
      conversationId,
      contactId,
      phone: contactPhone,
    });
    return;
  }

  const crmLeadId = await syncLeadToCrm({
    tenant_id: tenantId,
    source: 'whatsapp',
    phone: contactPhone,
    name: contactName,
    chatwoot_conversation_id: conversationId,
    chatwoot_inbox_id: inboxId,
    last_message: lastMessage,
  });

  await upsertConversationLink({
    tenantId,
    conversationId,
    contactId,
    phone: contactPhone,
    crmLeadId,
  });
}
