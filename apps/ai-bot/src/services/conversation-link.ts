import { prisma } from '../lib/db.js';
import { tenantLogger } from '../lib/logger.js';

interface UpsertParams {
  tenantId: string;
  conversationId: number;
  contactId?: number | null;
  phone?: string | null;
  crmLeadId?: string | null;
}

export async function upsertConversationLink({
  tenantId,
  conversationId,
  contactId,
  phone,
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
    if (crmLeadId && !existing.crmLeadId) {
      await prisma.conversationLink.update({
        where: { id: existing.id },
        data: { crmLeadId },
      });
      log.info({ conversationId, crmLeadId }, 'Updated conversation link with CRM lead');
    }
    return existing;
  }

  const link = await prisma.conversationLink.create({
    data: {
      tenantId,
      chatwootConversationId: conversationId,
      chatwootContactId: contactId ?? null,
      phone: phone ?? null,
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
