import { prisma } from '../lib/db.js';
import { tenantLogger } from '../lib/logger.js';
import { generateReply } from './openai.js';
import { checkAndIncrementUsage } from './usage.js';
import { getKnowledgeContext } from './knowledge.js';
import {
  upsertConversationLink,
  existsLeadForPhone,
} from './conversation-link.js';
import { syncLeadToCrm } from './crm.js';
import type { HandoffRules } from '@chat-platform/shared/types';

interface IncomingMessageParams {
  tenantId: string;
  chatId: string;
  messageText: string;
  contactName: string | null;
  sendReply: (text: string) => Promise<void>;
}

export async function handleIncomingMessage(params: IncomingMessageParams) {
  const { tenantId, chatId, messageText, contactName, sendReply } = params;
  const phone = chatIdToPhone(chatId);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { aiSettings: true },
  });

  if (!tenant || tenant.status !== 'active') return;

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
  });
  const history = recentMessages.reverse().map((m) => ({
    role:
      m.direction === 'incoming'
        ? ('user' as const)
        : ('assistant' as const),
    content: m.content,
  }));

  const knowledgeContext = await getKnowledgeContext(tenantId, messageText);
  const enrichedPrompt = settings.systemPrompt + knowledgeContext;

  const aiReply = await generateReply(
    settings.model,
    enrichedPrompt,
    messageText,
    history,
  );

  await sendReply(aiReply);
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

  return prisma.conversationLink.create({
    data: {
      tenantId,
      chatwootConversationId: uniqueConvId,
      phone: phone || null,
      contactName: contactName || null,
      wahaChatId: chatId,
      source: 'whatsapp_qr',
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
