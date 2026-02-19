'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { aiSettingsSchema } from '@/lib/validators';

export async function saveAiSettingsAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();

  const parsed = aiSettingsSchema.safeParse({
    enabled: formData.get('enabled') === 'on',
    model: formData.get('model'),
    systemPrompt: formData.get('systemPrompt'),
    handoffKeywords: formData.get('handoffKeywords'),
    handoffTag: formData.get('handoffTag'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  const { enabled, model, systemPrompt, handoffKeywords, handoffTag } = parsed.data;

  const keywords = handoffKeywords
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  await prisma.aiSettings.update({
    where: { tenantId: session.tenantId },
    data: {
      enabled,
      model,
      systemPrompt,
      handoffRulesJson: { keywords, handoffTag },
    },
  });

  revalidatePath('/dashboard/ai-settings');
  return { success: true };
}
