'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { verifyTokenFull } from '@/lib/tokens';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export async function acceptInviteAction(_prev: unknown, formData: FormData) {
  const parsed = schema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const result = await verifyTokenFull(parsed.data.token, 'team_invite');
  if (!result || !result.payload) {
    return { error: 'La invitación expiró o es inválida.' };
  }

  const { email, payload } = result;
  const tenantId = payload.tenantId as string;
  const role = (payload.role as string) ?? 'agent';

  const existing = await prisma.tenantUser.findFirst({
    where: { tenantId, email },
  });
  if (existing) return { error: 'Ya tenés una cuenta en este equipo.' };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.tenantUser.create({
    data: {
      tenantId,
      email,
      passwordHash,
      role: role as 'admin' | 'agent',
      emailVerified: true,
    },
  });

  await createSession({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
  });

  redirect('/dashboard');
}
