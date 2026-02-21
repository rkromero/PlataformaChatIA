'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import type { TenantPlan } from '@prisma/client';

const VALID_PLANS: TenantPlan[] = ['starter', 'pro', 'enterprise'];

export async function changePlanAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();
  const newPlan = formData.get('plan') as string;

  if (!VALID_PLANS.includes(newPlan as TenantPlan)) {
    return { error: 'Plan no válido' };
  }

  if (newPlan === 'enterprise') {
    return { error: 'Para Enterprise contactanos directamente' };
  }

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { plan: newPlan as TenantPlan },
  });

  revalidatePath('/dashboard/plan');
  return { success: true, message: `Plan actualizado a ${newPlan}` };
}
