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

  // Check if a manual lead exists with the same phone → merge instead of creating duplicate
  if (phone) {
    const manualLead = await prisma.conversationLink.findFirst({
      where: {
        tenantId,
        phone: normalizePhone(phone),
        chatwootConversationId: { lt: 0 },
      },
    });

    if (!manualLead) {
      // Also try exact match
      const exactMatch = await prisma.conversationLink.findFirst({
        where: {
          tenantId,
          phone,
          chatwootConversationId: { lt: 0 },
        },
      });

      if (exactMatch) {
        return mergeManualLead(exactMatch.id, conversationId, contactId, contactName, lastMessage, crmLeadId, log);
      }
    } else {
      return mergeManualLead(manualLead.id, conversationId, contactId, contactName, lastMessage, crmLeadId, log);
    }
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

async function mergeManualLead(
  manualLeadId: string,
  conversationId: number,
  contactId: number | null | undefined,
  contactName: string | null | undefined,
  lastMessage: string | null | undefined,
  crmLeadId: string | null | undefined,
  log: ReturnType<typeof tenantLogger>,
) {
  const updated = await prisma.conversationLink.update({
    where: { id: manualLeadId },
    data: {
      chatwootConversationId: conversationId,
      chatwootContactId: contactId ?? undefined,
      contactName: contactName ?? undefined,
      lastMessage: lastMessage?.slice(0, 500) ?? undefined,
      crmLeadId: crmLeadId ?? undefined,
    },
  });

  log.info({ conversationId, mergedFrom: manualLeadId }, 'Merged manual lead with real conversation');
  return updated;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

export async function existsLeadForPhone(tenantId: string, phone: string): Promise<boolean> {
  const count = await prisma.conversationLink.count({
    where: { tenantId, phone, crmLeadId: { not: null } },
  });
  return count > 0;
}
