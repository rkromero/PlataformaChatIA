'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { channelSchema } from '@/lib/validators';
import { encryptJson } from '@chat-platform/shared/crypto';

export async function createChannelAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();

  const parsed = channelSchema.safeParse({
    type: formData.get('type'),
    chatwootInboxId: formData.get('chatwootInboxId'),
    phoneNumberId: formData.get('phoneNumberId'),
    wabaId: formData.get('wabaId'),
    accessToken: formData.get('accessToken'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  const { type, chatwootInboxId, phoneNumberId, wabaId, accessToken } = parsed.data;

  const configEncryptedJson = encryptJson({ phoneNumberId, wabaId, accessToken });

  await prisma.tenantChannel.create({
    data: {
      tenantId: session.tenantId,
      type,
      chatwootInboxId,
      configEncryptedJson,
    },
  });

  revalidatePath('/dashboard/channels');
  redirect('/dashboard/channels');
}

export async function deleteChannelAction(channelId: string) {
  const session = await requireSession();

  await prisma.tenantChannel.deleteMany({
    where: { id: channelId, tenantId: session.tenantId },
  });

  revalidatePath('/dashboard/channels');
}
