'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

export async function saveOnboardingBotAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();
  const businessName = String(formData.get('businessName') || '').trim();
  const systemPrompt = formData.get('systemPrompt') as string;

  if (!businessName || businessName.length < 2) {
    return { error: 'Ingresá el nombre de tu negocio (mínimo 2 caracteres)' };
  }

  if (!systemPrompt || systemPrompt.length < 10) {
    return { error: 'El prompt debe tener al menos 10 caracteres' };
  }

  const normalizedPrompt = systemPrompt
    .replace(/\{nombre\}/gi, businessName)
    .replace(/\{businessName\}/gi, businessName);

  await prisma.$transaction([
    prisma.tenant.update({
      where: { id: session.tenantId },
      data: { name: businessName },
    }),
    prisma.aiSettings.update({
      where: { tenantId: session.tenantId },
      data: { systemPrompt: normalizedPrompt },
    }),
  ]);

  return { success: true };
}

export async function completeOnboardingAction() {
  const session = await requireSession();

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { onboardingCompleted: true },
  });

  redirect('/dashboard');
}
