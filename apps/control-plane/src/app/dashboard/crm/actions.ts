'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { agentLeadFilter, isAdmin } from '@/lib/agent-filter';
import { routeLead } from '@/lib/routing-engine';
import type { LeadStage } from '@prisma/client';
import { z } from 'zod';
import { LOSS_REASONS } from './loss-reasons';

const newLeadSchema = z.object({
  contactName: z.string().min(1, 'El nombre es obligatorio').max(200),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function createLeadAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: 'No autorizado' };

  const parsed = newLeadSchema.safeParse({
    contactName: formData.get('contactName'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const manualId = -Math.floor(Math.random() * 2_000_000_000);

  const leadData = {
    phone: parsed.data.phone || null,
    source: 'manual' as const,
    contactName: parsed.data.contactName,
  };

  const assignedAgentId = await routeLead(session.tenantId, leadData);

  await prisma.conversationLink.create({
    data: {
      tenantId: session.tenantId,
      chatwootConversationId: manualId,
      contactName: parsed.data.contactName,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      stage: 'new',
      source: 'manual',
      assignedAgentId,
    },
  });

  revalidatePath('/dashboard/crm');
  return { success: true };
}

const lossReasonSchema = z.enum(
  LOSS_REASONS.map((item) => item.value) as [string, ...string[]],
);

export async function moveLeadAction(
  leadId: string,
  stage: string,
  lossReason?: string,
  lossReasonDetail?: string,
) {
  const session = await requireSession();
  const filter = agentLeadFilter(session);

  if (stage === 'lost') {
    const parsedReason = lossReasonSchema.safeParse(lossReason);
    if (!parsedReason.success) {
      return { error: 'Debes seleccionar un motivo de pérdida.' };
    }
  }

  const data: Record<string, unknown> = {
    stage: stage as LeadStage,
  };
  if (stage === 'lost') {
    data.lossReason = lossReason;
    data.lossReasonDetail = lossReasonDetail?.trim() ? lossReasonDetail.trim() : null;
    data.lostAt = new Date();
  } else {
    data.lossReason = null;
    data.lossReasonDetail = null;
    data.lostAt = null;
  }

  await prisma.conversationLink.updateMany({
    where: { id: leadId, tenantId: session.tenantId, ...filter },
    data,
  });

  revalidatePath('/dashboard/crm');
  return { success: true };
}

export async function updateLeadNotesAction(leadId: string, notes: string) {
  const session = await requireSession();
  const filter = agentLeadFilter(session);

  await prisma.conversationLink.updateMany({
    where: { id: leadId, tenantId: session.tenantId, ...filter },
    data: { notes: notes || null },
  });

  revalidatePath('/dashboard/crm');
}

export async function updateLeadNameAction(leadId: string, contactName: string) {
  const session = await requireSession();
  const filter = agentLeadFilter(session);

  await prisma.conversationLink.updateMany({
    where: { id: leadId, tenantId: session.tenantId, ...filter },
    data: { contactName: contactName || null },
  });

  revalidatePath('/dashboard/crm');
}

export async function deleteLeadAction(leadId: string) {
  const session = await requireSession();
  if (!isAdmin(session)) return;

  await prisma.conversationLink.updateMany({
    where: { id: leadId, tenantId: session.tenantId },
    data: { deletedAt: new Date() },
  });

  revalidatePath('/dashboard/crm');
}
