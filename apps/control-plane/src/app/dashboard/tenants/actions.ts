'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { tenantSchema } from '@/lib/validators';

export async function createTenantAction(_prev: unknown, formData: FormData) {
  const parsed = tenantSchema.safeParse({
    name: formData.get('name'),
    status: formData.get('status'),
    plan: formData.get('plan'),
    chatwootAccountId: formData.get('chatwootAccountId'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  const existing = await prisma.tenant.findUnique({
    where: { chatwootAccountId: parsed.data.chatwootAccountId },
  });

  if (existing) {
    return { error: `Ya existe un tenant con Chatwoot Account ID ${parsed.data.chatwootAccountId}` };
  }

  const tenant = await prisma.tenant.create({ data: parsed.data });

  await prisma.aiSettings.create({
    data: {
      tenantId: tenant.id,
      enabled: true,
      model: 'gpt-4.1-mini',
      systemPrompt: `Eres un asistente de atención al cliente de ${tenant.name}. Responde de forma breve, amable y profesional en español. Haz una sola pregunta por mensaje.`,
      handoffRulesJson: {
        keywords: ['humano', 'asesor', 'agente', 'persona'],
        handoffTag: 'human_handoff',
      },
    },
  });

  revalidatePath('/dashboard/tenants');
  redirect('/dashboard/tenants');
}

export async function updateTenantAction(tenantId: string, _prev: unknown, formData: FormData) {
  const parsed = tenantSchema.safeParse({
    name: formData.get('name'),
    status: formData.get('status'),
    plan: formData.get('plan'),
    chatwootAccountId: formData.get('chatwootAccountId'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  const existing = await prisma.tenant.findUnique({
    where: { chatwootAccountId: parsed.data.chatwootAccountId },
  });

  if (existing && existing.id !== tenantId) {
    return { error: `Ya existe otro tenant con Chatwoot Account ID ${parsed.data.chatwootAccountId}` };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: parsed.data,
  });

  revalidatePath('/dashboard/tenants');
  redirect('/dashboard/tenants');
}

export async function deleteTenantAction(tenantId: string) {
  await prisma.tenant.delete({ where: { id: tenantId } });
  revalidatePath('/dashboard/tenants');
}
