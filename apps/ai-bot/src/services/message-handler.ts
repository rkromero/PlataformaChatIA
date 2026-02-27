import { prisma } from '../lib/db.js';
import { tenantLogger } from '../lib/logger.js';
import { generateReply, generateReplyWithToolResults } from './openai.js';
import type { ToolCall } from './openai.js';
import { checkAndIncrementUsage } from './usage.js';
import { getKnowledgeContext } from './knowledge.js';
import {
  upsertConversationLink,
  existsLeadForPhone,
} from './conversation-link.js';
import { syncLeadToCrm } from './crm.js';
import { routeNewLead } from './lead-router.js';
import { isTrialExpired } from '@chat-platform/shared/plans';
import type { HandoffRules } from '@chat-platform/shared/types';
import { getCalendarContext } from './calendar-context.js';
import { executeCalendarTool } from './calendar-tools.js';
import { transformReply } from '../lib/message-transform.js';
import { bufferMessage } from './message-buffer.js';

const MAX_TOOL_ROUNDS = 3;

interface IncomingMessageParams {
  tenantId: string;
  chatId: string;
  messageText: string;
  contactName: string | null;
  isReplyToMessage?: boolean;
  sendReply: (text: string) => Promise<void>;
}

export async function handleIncomingMessage(params: IncomingMessageParams) {
  const { tenantId, chatId, messageText, contactName, isReplyToMessage, sendReply } = params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { aiSettings: true },
  });

  if (!tenant || tenant.status !== 'active') return;

  const settings = tenant.aiSettings;
  if (!settings?.enabled) return;
  if (
    settings.disableReactionReplies &&
    isReplyToMessage &&
    isEmojiOnly(messageText)
  ) {
    const log = tenantLogger(tenantId);
    log.info({ chatId }, 'Skipping reaction-like reply message');
    return;
  }

  const debounceMs = (settings.messageWindowSeconds ?? 4) * 1000;
  const bufferKey = `waqr:${tenantId}:${chatId}`;

  bufferMessage(bufferKey, messageText, async (combinedText) => {
    try {
      await processMessage({
        tenantId, chatId, messageText: combinedText, contactName, sendReply,
      });
    } catch (err) {
      const log = tenantLogger(tenantId);
      log.error({ err, chatId }, 'Error processing buffered WhatsApp QR message');
    }
  }, debounceMs);
}

async function processMessage(params: IncomingMessageParams) {
  const { tenantId, chatId, messageText, contactName, sendReply } = params;
  const phone = chatIdToPhone(chatId);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { aiSettings: true },
  });

  if (!tenant || tenant.status !== 'active') return;

  if (tenant.plan === 'trial' && isTrialExpired(tenant.trialEndsAt)) {
    const expiredMsg = 'Nuestro período de prueba finalizó. Contactanos para seguir usando el servicio.';
    await sendReply(expiredMsg);
    return;
  }

  const log = tenantLogger(tenantId);
  const convLink = await ensureConversationLink(
    tenantId,
    chatId,
    phone,
    contactName,
  );

  await saveMessage(tenantId, convLink.id, 'incoming', messageText, contactName || phone);

  if (convLink.handoffActive) {
    log.info({ chatId }, 'Handoff active, skipping AI reply');
    await prisma.conversationLink.update({
      where: { id: convLink.id },
      data: { lastMessage: messageText.slice(0, 500) },
    });
    return;
  }

  const settings = tenant.aiSettings;
  if (!settings?.enabled) return;

  const handoffRules = settings.handoffRulesJson as unknown as HandoffRules;
  const contentLower = messageText.toLowerCase();
  const isHandoffRequest = handoffRules.keywords.some((kw: string) =>
    contentLower.includes(kw.toLowerCase()),
  );

  if (isHandoffRequest) {
    const handoffMsg =
      'Te estoy transfiriendo con un asesor. Un momento por favor.';
    await sendReply(handoffMsg);
    await saveMessage(tenantId, convLink.id, 'outgoing', handoffMsg, 'Bot');
    await prisma.conversationLink.update({
      where: { id: convLink.id },
      data: { handoffActive: true, lastMessage: handoffMsg },
    });
    return;
  }

  const usage = await checkAndIncrementUsage(tenantId, tenant.plan);
  if (!usage.allowed) {
    const limitMsg =
      'Nuestro servicio de atención automática alcanzó el límite mensual. Por favor contactanos directamente.';
    await sendReply(limitMsg);
    await saveMessage(tenantId, convLink.id, 'outgoing', limitMsg, 'Bot');
    return;
  }

  const recentMessages = await prisma.message.findMany({
    where: { conversationLinkId: convLink.id },
    orderBy: { timestamp: 'desc' },
    take: 10,
    select: { direction: true, content: true },
  });
  const history = recentMessages.reverse().map((m) => ({
    role: m.direction === 'incoming' ? ('user' as const) : ('assistant' as const),
    content: m.content.length > 500 ? m.content.slice(0, 500) + '...' : m.content,
  }));

  const [knowledgeContext, calendarCtx] = await Promise.all([
    getKnowledgeContext(tenantId, messageText),
    getCalendarContext(tenantId),
  ]);

  const enrichedPrompt = settings.systemPrompt + knowledgeContext + calendarCtx.promptAddendum;
  const tools = calendarCtx.enabled ? calendarCtx.tools : undefined;

  const toolContext = {
    tenantId,
    conversationLinkId: convLink.id,
    clientPhone: phone || null,
    clientName: contactName,
  };

  let result = await generateReply(
    settings.model,
    enrichedPrompt,
    messageText,
    history,
    [],
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
      messageText,
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
    await sendReply(part);
  }

  await saveMessage(tenantId, convLink.id, 'outgoing', aiReply, 'Bot');

  await prisma.conversationLink.update({
    where: { id: convLink.id },
    data: { lastMessage: aiReply.slice(0, 500) },
  });

  syncLeadInBackground({
    tenantId,
    chatId,
    phone,
    contactName,
    lastMessage: messageText,
  }).catch((err) => log.error({ err }, 'Background CRM sync failed'));
}

async function ensureConversationLink(
  tenantId: string,
  chatId: string,
  phone: string,
  contactName: string | null,
) {
  const uniqueConvId = -Math.abs(hashCode(tenantId + chatId));

  const existing = await prisma.conversationLink.findUnique({
    where: {
      tenantId_chatwootConversationId: {
        tenantId,
        chatwootConversationId: uniqueConvId,
      },
    },
  });

  if (existing) {
    const updates: Record<string, unknown> = {};
    if (!existing.wahaChatId) updates.wahaChatId = chatId;
    if (contactName && !existing.contactName)
      updates.contactName = contactName;
    if (!existing.phone && phone) updates.phone = phone;

    if (Object.keys(updates).length > 0) {
      return prisma.conversationLink.update({
        where: { id: existing.id },
        data: updates,
      });
    }
    return existing;
  }

  const assignedAgentId = await routeNewLead(tenantId, phone, contactName).catch(() => null);

  return prisma.conversationLink.create({
    data: {
      tenantId,
      chatwootConversationId: uniqueConvId,
      phone: phone || null,
      contactName: contactName || null,
      wahaChatId: chatId,
      source: 'whatsapp_qr',
      assignedAgentId,
    },
  });
}

async function saveMessage(
  tenantId: string,
  conversationLinkId: string,
  direction: 'incoming' | 'outgoing',
  content: string,
  senderName: string | null,
) {
  await prisma.message.create({
    data: { tenantId, conversationLinkId, direction, content, senderName },
  });
}

function chatIdToPhone(chatId: string): string {
  return chatId.replace(/@.*$/, '');
}

function isEmojiOnly(text: string): boolean {
  const compact = text.trim().replace(/\s+/g, '');
  if (!compact) return false;
  const stripped = compact.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]/gu, '');
  return stripped.length === 0;
}

async function syncLeadInBackground(params: {
  tenantId: string;
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
