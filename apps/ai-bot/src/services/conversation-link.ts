import { prisma } from '../lib/db.js';
import { tenantLogger } from '../lib/logger.js';
import { calculateLeadScore } from './lead-scoring.js';

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
  const aiSettings = await prisma.aiSettings.findUnique({
    where: { tenantId },
    select: { leadScoringEnabled: true },
  });
  const scoringEnabled = Boolean(aiSettings?.leadScoringEnabled);

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
    if (lastMessage && scoringEnabled) {
      const scoreResult = calculateLeadScore(lastMessage, existing.leadScore);
      updateData.leadScore = scoreResult.score;
      updateData.leadTemperature = scoreResult.temperature;
    }

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
        source: { not: 'chatwoot' },
      },
    });

    if (!manualLead) {
      const exactMatch = await prisma.conversationLink.findFirst({
        where: {
          tenantId,
          phone,
          source: { not: 'chatwoot' },
        },
      });

      if (exactMatch) {
        return mergeManualLead(
          exactMatch.id,
          exactMatch.leadScore,
          scoringEnabled,
          conversationId,
          contactId,
          contactName,
          lastMessage,
          crmLeadId,
          log,
        );
      }
    } else {
      return mergeManualLead(
        manualLead.id,
        manualLead.leadScore,
        scoringEnabled,
        conversationId,
        contactId,
        contactName,
        lastMessage,
        crmLeadId,
        log,
      );
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
      ...(scoringEnabled && lastMessage
        ? (() => {
            const scoreResult = calculateLeadScore(lastMessage, 0);
            return {
              leadScore: scoreResult.score,
              leadTemperature: scoreResult.temperature,
            };
          })()
        : {}),
    },
  });

  log.info({ conversationId, linkId: link.id }, 'Created conversation link');
  return link;
}

async function mergeManualLead(
  manualLeadId: string,
  previousScore: number,
  scoringEnabled: boolean,
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
      source: 'chatwoot',
      ...(scoringEnabled && lastMessage
        ? (() => {
            const scoreResult = calculateLeadScore(lastMessage, previousScore);
            return {
              leadScore: scoreResult.score,
              leadTemperature: scoreResult.temperature,
            };
          })()
        : {}),
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
