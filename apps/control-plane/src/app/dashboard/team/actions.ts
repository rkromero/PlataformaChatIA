'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { createToken } from '@/lib/tokens';
import { sendTeamInviteEmail } from '@/lib/email';
import { getPlanLimits } from '@chat-platform/shared/plans';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'agent']),
});

export async function inviteTeamMemberAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();

  if (session.role !== 'owner' && session.role !== 'super_admin') {
    return { error: 'Solo el owner puede invitar miembros' };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { email, role } = parsed.data;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { name: true, plan: true },
  });
  if (!tenant) return { error: 'Tenant no encontrado' };

  const limits = getPlanLimits(tenant.plan);
  if (limits.maxUsers !== -1) {
    const currentUsers = await prisma.tenantUser.count({ where: { tenantId: session.tenantId } });
    if (currentUsers >= limits.maxUsers) {
      return { error: `Tu plan ${limits.name} permite máximo ${limits.maxUsers} usuario(s). Actualizá tu plan.` };
    }
  }

  const existing = await prisma.tenantUser.findFirst({
    where: { tenantId: session.tenantId, email },
  });
  if (existing) return { error: 'Este email ya es parte del equipo' };

  const token = await createToken(email, 'team_invite', 168, {
    tenantId: session.tenantId,
    role,
  });
  await sendTeamInviteEmail(email, token, tenant.name, role);

  revalidatePath('/dashboard/team');
  return { success: true, message: `Invitación enviada a ${email}` };
}

export async function removeTeamMemberAction(userId: string) {
  const session = await requireSession();

  if (session.role !== 'owner' && session.role !== 'super_admin') return;
  if (userId === session.userId) return;

  await prisma.tenantUser.deleteMany({
    where: { id: userId, tenantId: session.tenantId },
  });

  revalidatePath('/dashboard/team');
}
