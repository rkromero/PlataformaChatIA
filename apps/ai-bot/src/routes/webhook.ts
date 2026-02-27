import type { FastifyInstance } from 'fastify';
import { env } from '../lib/env.js';
import { logger, tenantLogger } from '../lib/logger.js';
import { resolveTenant } from '../services/tenant-resolver.js';
import { sendMessage, addLabel, getConversationMessages } from '../services/chatwoot.js';
import { generateReply, generateReplyWithToolResults } from '../services/openai.js';
import type { ToolCall } from '../services/openai.js';
import { syncLeadToCrm } from '../services/crm.js';
import {
  upsertConversationLink,
  existsLeadForPhone,
} from '../services/conversation-link.js';
import { checkAndIncrementUsage } from '../services/usage.js';
import { getKnowledgeContext } from '../services/knowledge.js';
import { isTrialExpired } from '@chat-platform/shared/plans';
import {
  extractAttachments,
  getAudioAttachment,
  getImageAttachments,
  downloadMedia,
  mediaToBase64Url,
} from '../services/media.js';
import { transcribeAudio } from '../services/transcription.js';
import { bufferMessage } from '../services/message-buffer.js';
import type { HandoffRules } from '@chat-platform/shared/types';
import { getCalendarContext } from '../services/calendar-context.js';
import { executeCalendarTool } from '../services/calendar-tools.js';
import { prisma } from '../lib/db.js';
import { transformReply } from '../lib/message-transform.js';

const MAX_TOOL_ROUNDS = 3;

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
      logger.error({ err }, 'Unhandled error in webhook handler');
    }
  });
}

async function handleWebhook(body: Record<string, unknown>) {
  const event = body.event as string;
  logger.info({ event, messageType: body.message_type }, 'Webhook received');

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

  if (tenant.plan === 'trial' && isTrialExpired(tenant.trialEndsAt)) {
    log.info('Trial expired, skipping AI reply');
    await sendMessage(
      account.id,
      conversation.id,
      'Nuestro período de prueba finalizó. Contactanos para seguir usando el servicio.',
    );
    return;
  }

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

  const attachments = extractAttachments(body);
  const audioAttachment = getAudioAttachment(attachments);
  const imageAttachments = getImageAttachments(attachments);

  let effectiveContent = content;
  let imageBase64Urls: string[] = [];

  if (audioAttachment) {
    log.info({ attachmentId: audioAttachment.id }, 'Processing audio attachment');
    const transcription = await transcribeAudio(audioAttachment.data_url);

    if (transcription) {
      effectiveContent = transcription;
      log.info('Audio transcribed, using transcription as message');
    } else {
      await sendMessage(
        account.id,
        conversation.id,
        'Recibí tu audio pero no pude entenderlo. ¿Podrías escribirme el mensaje?',
      );
      return;
    }
  }

  if (imageAttachments.length > 0) {
    log.info({ count: imageAttachments.length }, 'Processing image attachments');

    const downloadResults = await Promise.allSettled(
      imageAttachments.slice(0, 3).map(async (att) => {
        const { buffer, contentType } = await downloadMedia(att.data_url);
        return mediaToBase64Url(buffer, contentType);
      }),
    );

    imageBase64Urls = downloadResults
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map((r) => r.value);

    if (imageBase64Urls.length === 0) {
      log.warn('Failed to download all images');
    }
  }

  if (!effectiveContent && imageBase64Urls.length === 0) {
    log.info('No text, audio, or images to process, skipping');
    return;
  }

  const contentLower = effectiveContent.toLowerCase();
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

  const hasMedia = imageBase64Urls.length > 0 || !!audioAttachment;

  if (hasMedia) {
    await processAiReply({
      tenant, settings, log, account, conversation,
      effectiveContent, imageBase64Urls,
      contactId, contactPhone, contactName, inboxId: inbox?.id ?? null,
    });
  } else {
    const bufferKey = `cw:${tenant.id}:${conversation.id}`;
    bufferMessage(bufferKey, effectiveContent, async (combinedText) => {
      try {
        await processAiReply({
          tenant, settings, log, account, conversation,
          effectiveContent: combinedText, imageBase64Urls: [],
          contactId, contactPhone, contactName, inboxId: inbox?.id ?? null,
        });
      } catch (err) {
        log.error({ err }, 'Error processing buffered Chatwoot message');
      }
    });
  }
}

async function processAiReply(params: {
  tenant: { id: string; plan: string };
  settings: { model: string; systemPrompt: string; removeOpeningSigns: boolean; splitLongMessages: boolean };
  log: ReturnType<typeof tenantLogger>;
  account: { id: number };
  conversation: { id: number };
  effectiveContent: string;
  imageBase64Urls: string[];
  contactId: number | null;
  contactPhone: string | null;
  contactName: string | null;
  inboxId: number | null;
}) {
  const {
    tenant, settings, log, account, conversation,
    effectiveContent, imageBase64Urls,
    contactId, contactPhone, contactName, inboxId,
  } = params;

  const usage = await checkAndIncrementUsage(tenant.id, tenant.plan);
  if (!usage.allowed) {
    log.info({ current: usage.current, limit: usage.limit }, 'Monthly message limit reached');
    await sendMessage(
      account.id,
      conversation.id,
      'Nuestro servicio de atención automática alcanzó el límite mensual. Por favor contactanos directamente para continuar la conversación.',
    );
    return;
  }

  const [history, knowledgeContext, calendarCtx] = await Promise.all([
    getConversationMessages(account.id, conversation.id, 10),
    getKnowledgeContext(tenant.id, effectiveContent),
    getCalendarContext(tenant.id),
  ]);

  const enrichedPrompt = settings.systemPrompt + knowledgeContext + calendarCtx.promptAddendum;
  const tools = calendarCtx.enabled ? calendarCtx.tools : undefined;

  const convLink = await prisma.conversationLink.findFirst({
    where: { tenantId: tenant.id, chatwootConversationId: conversation.id },
    select: { id: true, phone: true, contactName: true },
  });

  const toolContext = {
    tenantId: tenant.id,
    conversationLinkId: convLink?.id ?? null,
    clientPhone: contactPhone ?? convLink?.phone ?? null,
    clientName: contactName ?? convLink?.contactName ?? null,
  };

  let result = await generateReply(
    settings.model,
    enrichedPrompt,
    effectiveContent,
    history,
    imageBase64Urls,
    tools,
  );

  let rounds = 0;
  while (result.toolCalls.length > 0 && rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    const toolResults: Array<{ tool_call_id: string; content: string }> = [];

    for (const tc of result.toolCalls) {
      log.info({ tool: tc.name, args: tc.arguments }, 'Executing calendar tool');
      const output = await executeCalendarTool(tc.name, tc.arguments, toolContext);
      toolResults.push({ tool_call_id: tc.id, content: output });
    }

    result = await generateReplyWithToolResults(
      settings.model,
      enrichedPrompt,
      effectiveContent,
      history,
      result.toolCalls,
      toolResults,
      calendarCtx.tools,
    );
  }

  const aiReply = result.text || 'Lo siento, no pude procesar la solicitud.';

  const replyParts = transformReply(aiReply, {
    removeOpeningSigns: settings.removeOpeningSigns,
    splitLongMessages: settings.splitLongMessages,
  });

  for (const part of replyParts) {
    await sendMessage(account.id, conversation.id, part);
  }

  syncLeadInBackground({
    tenantId: tenant.id,
    conversationId: conversation.id,
    contactId,
    contactPhone,
    contactName,
    inboxId,
    lastMessage: effectiveContent,
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
      contactName,
      lastMessage,
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
    contactName,
    lastMessage,
    crmLeadId,
  });
}
