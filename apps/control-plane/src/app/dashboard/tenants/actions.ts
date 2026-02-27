'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { tenantSchema } from '@/lib/validators';
import { buildDefaultPrompt, DEFAULT_HANDOFF_RULES } from '@/lib/default-prompts';

function buildModulesJson(formData: FormData) {
  return {
    calendar: formData.get('module_calendar') === '1',
  };
}

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

  const trialEndsAt = parsed.data.plan === 'trial'
    ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    : null;

  const modulesJson = buildModulesJson(formData);

  const tenant = await prisma.tenant.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug || null,
      status: parsed.data.status,
      plan: parsed.data.plan,
      modulesJson,
      trialEndsAt,
      chatwootAccountId: parsed.data.chatwootAccountId ?? null,
    },
  });

  await prisma.aiSettings.create({
    data: {
      tenantId: tenant.id,
      enabled: true,
      model: 'gpt-4.1-mini',
      systemPrompt: buildDefaultPrompt(tenant.name),
      handoffRulesJson: DEFAULT_HANDOFF_RULES,
    },
  });

  if (modulesJson.calendar) {
    await prisma.calendarConfig.create({ data: { tenantId: tenant.id } });
  }

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

  const modulesJson = buildModulesJson(formData);

  const updateData: Record<string, unknown> = {
    name: parsed.data.name,
    slug: parsed.data.slug || null,
    status: parsed.data.status,
    plan: parsed.data.plan,
    modulesJson,
    chatwootAccountId: parsed.data.chatwootAccountId ?? null,
  };

  if (parsed.data.plan === 'trial') {
    updateData.trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  } else {
    updateData.trialEndsAt = null;
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: updateData,
  });

  if (modulesJson.calendar) {
    await prisma.calendarConfig.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    });
  }

  revalidatePath('/dashboard/tenants');
  redirect('/dashboard/tenants');
}

export async function deleteTenantAction(tenantId: string) {
  const now = new Date();
  await prisma.$transaction([
    prisma.tenantUser.updateMany({ where: { tenantId }, data: { deletedAt: now } }),
    prisma.conversationLink.updateMany({ where: { tenantId }, data: { deletedAt: now } }),
    prisma.tenantChannel.updateMany({ where: { tenantId }, data: { deletedAt: now } }),
    prisma.knowledgeEntry.updateMany({ where: { tenantId }, data: { deletedAt: now } }),
    prisma.whatsAppTemplate.updateMany({ where: { tenantId }, data: { deletedAt: now } }),
    prisma.tenant.update({ where: { id: tenantId }, data: { deletedAt: now } }),
  ]);
  revalidatePath('/dashboard/tenants');
}
