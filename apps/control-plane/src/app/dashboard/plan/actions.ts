'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import type { TenantPlan } from '@prisma/client';

const UPGRADEABLE_PLANS: TenantPlan[] = ['starter', 'pro'];

export async function changePlanAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();
  const newPlan = formData.get('plan') as string;

  if (!UPGRADEABLE_PLANS.includes(newPlan as TenantPlan)) {
    if (newPlan === 'enterprise') {
      return { error: 'Para Enterprise contactanos directamente' };
    }
    if (newPlan === 'trial') {
      return { error: 'No podés volver al plan de prueba' };
    }
    return { error: 'Plan no válido' };
  }

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      plan: newPlan as TenantPlan,
      trialEndsAt: null,
    },
  });

  revalidatePath('/dashboard/plan');
  return { success: true, message: `Plan actualizado a ${newPlan}` };
}
