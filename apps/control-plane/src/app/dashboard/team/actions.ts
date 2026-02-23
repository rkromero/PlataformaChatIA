'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { getPlanLimits } from '@chat-platform/shared/plans';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createAgentSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['admin', 'agent']),
});

export async function createAgentAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();

  if (session.role !== 'owner' && session.role !== 'super_admin') {
    return { error: 'Solo el owner puede agregar miembros' };
  }

  const parsed = createAgentSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { email, password, role } = parsed.data;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { plan: true },
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

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.tenantUser.create({
    data: {
      tenantId: session.tenantId,
      email,
      passwordHash,
      role,
      emailVerified: true,
    },
  });

  revalidatePath('/dashboard/team');
  return { success: true, message: `${role === 'agent' ? 'Agente' : 'Admin'} ${email} creado` };
}

export async function removeTeamMemberAction(userId: string) {
  const session = await requireSession();

  if (session.role !== 'owner' && session.role !== 'super_admin') return;
  if (userId === session.userId) return;

  await prisma.tenantUser.updateMany({
    where: { id: userId, tenantId: session.tenantId },
    data: { deletedAt: new Date() },
  });

  revalidatePath('/dashboard/team');
}
