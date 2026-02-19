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

  let user;
  try {
    user = await prisma.tenantUser.findFirst({
      where: { email },
      include: { tenant: true },
    });
  } catch (err) {
    return { error: `DB error: ${String(err)}` };
  }

  if (!user) {
    return { error: 'Credenciales inválidas' };
  }

  let valid;
  try {
    valid = await bcrypt.compare(password, user.passwordHash);
  } catch (err) {
    return { error: `Bcrypt error: ${String(err)}` };
  }

  if (!valid) {
    return { error: 'Credenciales inválidas' };
  }

  if (user.tenant.status === 'paused') {
    return { error: 'Tu cuenta está pausada. Contactá al administrador.' };
  }

  try {
    await createSession({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    return { error: `Session error: ${String(err)}` };
  }

  redirect('/dashboard');
}
