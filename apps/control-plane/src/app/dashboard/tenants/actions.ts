'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { tenantSchema } from '@/lib/validators';

export async function createTenantAction(_prev: unknown, formData: FormData) {
  const raw = formData.get('chatwootAccountId');
  const chatwootAccountId = raw && String(raw).trim() !== '' ? raw : undefined;

  const parsed = tenantSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || undefined,
    status: formData.get('status'),
    plan: formData.get('plan'),
    chatwootAccountId,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  if (parsed.data.chatwootAccountId) {
    const existing = await prisma.tenant.findUnique({
      where: { chatwootAccountId: parsed.data.chatwootAccountId },
    });
    if (existing) {
      return { error: `Ya existe un tenant con Chatwoot Account ID ${parsed.data.chatwootAccountId}` };
    }
  }

  if (parsed.data.slug) {
    const existingSlug = await prisma.tenant.findUnique({ where: { slug: parsed.data.slug } });
    if (existingSlug) {
      return { error: `El slug "${parsed.data.slug}" ya está en uso` };
    }
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug || null,
      status: parsed.data.status,
      plan: parsed.data.plan,
      chatwootAccountId: parsed.data.chatwootAccountId ?? null,
    },
  });

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
  const raw = formData.get('chatwootAccountId');
  const chatwootAccountId = raw && String(raw).trim() !== '' ? raw : undefined;

  const parsed = tenantSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || undefined,
    status: formData.get('status'),
    plan: formData.get('plan'),
    chatwootAccountId,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  if (parsed.data.chatwootAccountId) {
    const existing = await prisma.tenant.findUnique({
      where: { chatwootAccountId: parsed.data.chatwootAccountId },
    });
    if (existing && existing.id !== tenantId) {
      return { error: `Ya existe otro tenant con Chatwoot Account ID ${parsed.data.chatwootAccountId}` };
    }
  }

  if (parsed.data.slug) {
    const existingSlug = await prisma.tenant.findUnique({ where: { slug: parsed.data.slug } });
    if (existingSlug && existingSlug.id !== tenantId) {
      return { error: `El slug "${parsed.data.slug}" ya está en uso` };
    }
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug || null,
      status: parsed.data.status,
      plan: parsed.data.plan,
      chatwootAccountId: parsed.data.chatwootAccountId ?? null,
    },
  });

  revalidatePath('/dashboard/tenants');
  redirect('/dashboard/tenants');
}

export async function deleteTenantAction(tenantId: string) {
  await prisma.tenant.delete({ where: { id: tenantId } });
  revalidatePath('/dashboard/tenants');
}
