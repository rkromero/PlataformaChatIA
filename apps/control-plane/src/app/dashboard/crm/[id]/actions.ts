'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { agentLeadFilter } from '@/lib/agent-filter';
import type { LeadStage } from '@prisma/client';

function revalidateLead(id: string) {
  revalidatePath(`/dashboard/crm/${id}`);
  revalidatePath('/dashboard/crm');
}

async function findOwnedLead(leadId: string) {
  const session = await requireSession();
  const filter = agentLeadFilter(session);

  const lead = await prisma.conversationLink.findFirst({
    where: { id: leadId, tenantId: session.tenantId, ...filter },
  });

  if (!lead) throw new Error('Lead no encontrado');
  return { session, lead };
}

export async function updateLeadFieldAction(
  leadId: string,
  field: 'contactName' | 'phone' | 'notes' | 'stage',
  value: string,
) {
  await findOwnedLead(leadId);

  const data: Record<string, unknown> = {};
  if (field === 'stage') {
    data.stage = value as LeadStage;
  } else {
    data[field] = value || null;
  }

  await prisma.conversationLink.update({
    where: { id: leadId },
    data,
  });

  revalidateLead(leadId);
}

export async function addTagAction(leadId: string, tag: string) {
  const { lead } = await findOwnedLead(leadId);
  const normalizedTag = tag.trim().toLowerCase();
  if (!normalizedTag) return;

  const currentTags = (lead.tags ?? []) as string[];
  if (currentTags.includes(normalizedTag)) return;

  await prisma.conversationLink.update({
    where: { id: leadId },
    data: { tags: [...currentTags, normalizedTag] },
  });

  revalidateLead(leadId);
}

export async function removeTagAction(leadId: string, tag: string) {
  const { lead } = await findOwnedLead(leadId);
  const currentTags = (lead.tags ?? []) as string[];

  await prisma.conversationLink.update({
    where: { id: leadId },
    data: { tags: currentTags.filter((t) => t !== tag) },
  });

  revalidateLead(leadId);
}

export async function createTaskAction(leadId: string, title: string, dueDate: string | null) {
  const { session } = await findOwnedLead(leadId);

  await prisma.leadTask.create({
    data: {
      tenantId: session.tenantId,
      conversationLinkId: leadId,
      title,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  revalidateLead(leadId);
}

export async function toggleTaskAction(taskId: string, leadId: string) {
  await findOwnedLead(leadId);

  const task = await prisma.leadTask.findUnique({ where: { id: taskId } });
  if (!task) return;

  await prisma.leadTask.update({
    where: { id: taskId },
    data: {
      completed: !task.completed,
      completedAt: task.completed ? null : new Date(),
    },
  });

  revalidateLead(leadId);
}

export async function deleteTaskAction(taskId: string, leadId: string) {
  await findOwnedLead(leadId);

  await prisma.leadTask.delete({ where: { id: taskId } });

  revalidateLead(leadId);
}
