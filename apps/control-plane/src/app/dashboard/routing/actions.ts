'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { isAdmin } from '@/lib/agent-filter';
import { z } from 'zod';
import type { RoutingRuleType } from '@prisma/client';

const VALID_TYPES: RoutingRuleType[] = ['round_robin', 'fixed', 'geo'];

const ruleSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  type: z.string().refine((v) => VALID_TYPES.includes(v as RoutingRuleType)),
  assignedAgentId: z.string().optional().nullable(),
  priority: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  conditionsJson: z.record(z.unknown()).default({}),
});

export async function createRuleAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: 'No autorizado' };

  const raw = JSON.parse(formData.get('data') as string);
  const parsed = ruleSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.routingRule.create({
    data: {
      tenantId: session.tenantId,
      name: parsed.data.name,
      type: parsed.data.type as RoutingRuleType,
      assignedAgentId: parsed.data.assignedAgentId || null,
      priority: parsed.data.priority,
      isActive: parsed.data.isActive,
      conditionsJson: parsed.data.conditionsJson,
    },
  });

  revalidatePath('/dashboard/configuracion');
  return { success: true };
}

export async function updateRuleAction(ruleId: string, _prev: unknown, formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: 'No autorizado' };

  const raw = JSON.parse(formData.get('data') as string);
  const parsed = ruleSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.routingRule.updateMany({
    where: { id: ruleId, tenantId: session.tenantId },
    data: {
      name: parsed.data.name,
      type: parsed.data.type as RoutingRuleType,
      assignedAgentId: parsed.data.assignedAgentId || null,
      priority: parsed.data.priority,
      isActive: parsed.data.isActive,
      conditionsJson: parsed.data.conditionsJson,
    },
  });

  revalidatePath('/dashboard/configuracion');
  return { success: true };
}

export async function deleteRuleAction(ruleId: string) {
  const session = await requireSession();
  if (!isAdmin(session)) return;

  await prisma.routingRule.deleteMany({
    where: { id: ruleId, tenantId: session.tenantId },
  });

  revalidatePath('/dashboard/configuracion');
}

export async function assignAgentAction(leadId: string, agentId: string | null) {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: 'No autorizado' };

  await prisma.conversationLink.updateMany({
    where: { id: leadId, tenantId: session.tenantId },
    data: { assignedAgentId: agentId || null },
  });

  revalidatePath('/dashboard/crm');
  return { success: true };
}
