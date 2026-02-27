'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { registerSchema } from '@/lib/validators';
import {
  createChatwootAccount,
  createChatwootUser,
  linkUserToAccount,
} from '@/lib/chatwoot-platform';
import { createToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';
import { buildDefaultPrompt, DEFAULT_HANDOFF_RULES } from '@/lib/default-prompts';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export async function registerAction(_prev: unknown, formData: FormData) {
  const parsed = registerSchema.safeParse({
    businessName: formData.get('businessName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { businessName, email, password } = parsed.data;

  const existingUser = await prisma.tenantUser.findFirst({ where: { email } });
  if (existingUser) {
    return { error: 'Ya existe una cuenta con ese email' };
  }

  let baseSlug = generateSlug(businessName);
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  let chatwootAccountId: number | null = null;
  let chatwootUserId: number | null = null;

  try {
    const account = await createChatwootAccount(businessName);
    chatwootAccountId = account.id;

    const cwUser = await createChatwootUser(email, businessName, password);
    chatwootUserId = cwUser.id;

    await linkUserToAccount(chatwootAccountId, chatwootUserId);
  } catch (err) {
    console.error('Chatwoot Platform API error (non-blocking):', err);
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const tenant = await prisma.tenant.create({
    data: {
      name: businessName,
      slug,
      status: 'active',
      plan: 'trial',
      trialEndsAt,
      chatwootAccountId,
    },
  });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      email,
      passwordHash,
      role: 'owner',
    },
  });

  await prisma.aiSettings.create({
    data: {
      tenantId: tenant.id,
      enabled: true,
      model: 'gpt-4.1-mini',
      systemPrompt: buildDefaultPrompt(businessName),
      handoffRulesJson: DEFAULT_HANDOFF_RULES,
    },
  });

  const verifyToken = await createToken(email, 'email_verification', 24);
  sendVerificationEmail(email, verifyToken).catch(() => {});

  await createSession({
    userId: user.id,
    tenantId: tenant.id,
    email: user.email,
    role: user.role,
  });

  redirect('/dashboard/onboarding');
}
