'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/tokens';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export async function resetPasswordAction(_prev: unknown, formData: FormData) {
  const parsed = schema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const email = await verifyToken(parsed.data.token, 'password_reset');
  if (!email) return { error: 'El link expiró o es inválido. Pedí uno nuevo.' };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const updated = await prisma.tenantUser.updateMany({
    where: { email },
    data: { passwordHash },
  });

  if (updated.count === 0) return { error: 'Usuario no encontrado' };

  return { success: true };
}
