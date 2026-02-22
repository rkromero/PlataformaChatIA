'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import type { LeadStage } from '@prisma/client';
import { z } from 'zod';

const newLeadSchema = z.object({
  contactName: z.string().min(1, 'El nombre es obligatorio').max(200),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function createLeadAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();

  const parsed = newLeadSchema.safeParse({
    contactName: formData.get('contactName'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.conversationLink.create({
    data: {
      tenantId: session.tenantId,
      chatwootConversationId: 0,
      contactName: parsed.data.contactName,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      stage: 'new',
    },
  });

  revalidatePath('/dashboard/crm');
  return { success: true };
}

export async function moveLeadAction(leadId: string, stage: string) {
  const session = await requireSession();

  await prisma.conversationLink.updateMany({
    where: { id: leadId, tenantId: session.tenantId },
    data: { stage: stage as LeadStage },
  });

  revalidatePath('/dashboard/crm');
}

export async function updateLeadNotesAction(leadId: string, notes: string) {
  const session = await requireSession();

  await prisma.conversationLink.updateMany({
    where: { id: leadId, tenantId: session.tenantId },
    data: { notes: notes || null },
  });

  revalidatePath('/dashboard/crm');
}

export async function updateLeadNameAction(leadId: string, contactName: string) {
  const session = await requireSession();

  await prisma.conversationLink.updateMany({
    where: { id: leadId, tenantId: session.tenantId },
    data: { contactName: contactName || null },
  });

  revalidatePath('/dashboard/crm');
}

export async function deleteLeadAction(leadId: string) {
  const session = await requireSession();

  await prisma.conversationLink.deleteMany({
    where: { id: leadId, tenantId: session.tenantId },
  });

  revalidatePath('/dashboard/crm');
}
