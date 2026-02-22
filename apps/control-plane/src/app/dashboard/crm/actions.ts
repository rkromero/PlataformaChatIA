'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import type { LeadStage } from '@prisma/client';

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
