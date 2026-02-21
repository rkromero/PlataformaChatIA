'use server';

import { prisma } from '@/lib/db';
import { createToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/email';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

export async function forgotPasswordAction(_prev: unknown, formData: FormData) {
  const parsed = schema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { email } = parsed.data;

  const user = await prisma.tenantUser.findFirst({ where: { email } });
  if (user) {
    const token = await createToken(email, 'password_reset', 1);
    await sendPasswordResetEmail(email, token);
  }

  return { success: true };
}
