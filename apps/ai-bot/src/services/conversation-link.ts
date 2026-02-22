import { prisma } from '../lib/db.js';
import { tenantLogger } from '../lib/logger.js';

interface UpsertParams {
  tenantId: string;
  conversationId: number;
  contactId?: number | null;
  phone?: string | null;
  contactName?: string | null;
  lastMessage?: string | null;
  crmLeadId?: string | null;
}

export async function upsertConversationLink({
  tenantId,
  conversationId,
  contactId,
  phone,
  contactName,
  lastMessage,
  crmLeadId,
}: UpsertParams) {
  const log = tenantLogger(tenantId);

  const existing = await prisma.conversationLink.findUnique({
    where: {
      tenantId_chatwootConversationId: {
        tenantId,
        chatwootConversationId: conversationId,
      },
    },
  });

  if (existing) {
    const updateData: Record<string, unknown> = {};
    if (crmLeadId && !existing.crmLeadId) updateData.crmLeadId = crmLeadId;
    if (contactName && !existing.contactName) updateData.contactName = contactName;
    if (lastMessage) updateData.lastMessage = lastMessage.slice(0, 500);

    if (Object.keys(updateData).length > 0) {
      await prisma.conversationLink.update({
        where: { id: existing.id },
        data: updateData,
      });
      log.info({ conversationId }, 'Updated conversation link');
    }
    return existing;
  }

  const link = await prisma.conversationLink.create({
    data: {
      tenantId,
      chatwootConversationId: conversationId,
      chatwootContactId: contactId ?? null,
      phone: phone ?? null,
      contactName: contactName ?? null,
      lastMessage: lastMessage?.slice(0, 500) ?? null,
      crmLeadId: crmLeadId ?? null,
    },
  });

  log.info({ conversationId, linkId: link.id }, 'Created conversation link');
  return link;
}

export async function existsLeadForPhone(tenantId: string, phone: string): Promise<boolean> {
  const count = await prisma.conversationLink.count({
    where: { tenantId, phone, crmLeadId: { not: null } },
  });
  return count > 0;
}
