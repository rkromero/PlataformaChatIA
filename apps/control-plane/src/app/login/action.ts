'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { loginSchema } from '@/lib/validators';

export async function loginAction(_prev: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { email, password } = parsed.data;

  const user = await prisma.tenantUser.findFirst({
    where: { email },
    include: { tenant: true },
  });

  if (!user) {
    return { error: 'Credenciales inválidas' };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: 'Credenciales inválidas' };
  }

  if (user.tenant.status === 'paused') {
    return { error: 'Tu cuenta está pausada. Contactá al administrador.' };
  }

  await createSession({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
  });

  redirect('/dashboard');
}
