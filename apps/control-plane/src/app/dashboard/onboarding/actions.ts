'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

export async function saveOnboardingBotAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();
  const systemPrompt = formData.get('systemPrompt') as string;

  if (!systemPrompt || systemPrompt.length < 10) {
    return { error: 'El prompt debe tener al menos 10 caracteres' };
  }

  await prisma.aiSettings.update({
    where: { tenantId: session.tenantId },
    data: { systemPrompt },
  });

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
