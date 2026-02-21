'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { createWhatsAppInbox, getChatwootUrl } from '@/lib/chatwoot-platform';
import { encryptJson } from '@chat-platform/shared/crypto';
import { getPlanLimits } from '@chat-platform/shared/plans';
import { z } from 'zod';

const connectSchema = z.object({
  phoneNumber: z.string().min(8, 'Número de teléfono requerido').regex(/^\+\d+$/, 'Formato: +541112345678'),
  phoneNumberId: z.string().min(5, 'Phone Number ID requerido'),
  wabaId: z.string().min(5, 'WABA ID requerido'),
  accessToken: z.string().min(10, 'Access Token requerido'),
});

export async function connectWhatsAppAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();

  const parsed = connectSchema.safeParse({
    phoneNumber: formData.get('phoneNumber'),
    phoneNumberId: formData.get('phoneNumberId'),
    wabaId: formData.get('wabaId'),
    accessToken: formData.get('accessToken'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { phoneNumber, phoneNumberId, wabaId, accessToken } = parsed.data;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { chatwootAccountId: true, plan: true, name: true },
  });

  if (!tenant) {
    return { error: 'Tenant no encontrado' };
  }

  if (!tenant.chatwootAccountId) {
    return { error: 'Tu cuenta no tiene Chatwoot configurado. Contactá soporte.' };
  }

  const limits = getPlanLimits(tenant.plan);
  if (limits.maxChannels !== -1) {
    const currentChannels = await prisma.tenantChannel.count({
      where: { tenantId: session.tenantId },
    });
    if (currentChannels >= limits.maxChannels) {
      return { error: `Tu plan ${limits.name} permite máximo ${limits.maxChannels} canal(es). Actualizá tu plan para agregar más.` };
    }
  }

  let inboxId: number;
  let webhookUrl: string | undefined;

  try {
    const inbox = await createWhatsAppInbox(
      tenant.chatwootAccountId,
      `WhatsApp - ${tenant.name}`,
      phoneNumber,
      phoneNumberId,
      wabaId,
      accessToken,
    );
    inboxId = inbox.id;
    webhookUrl = inbox.webhook_url;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    if (msg.includes('422')) {
      return { error: 'Credenciales inválidas. Verificá que el Phone Number ID, WABA ID y Access Token sean correctos.' };
    }
    return { error: `Error al crear inbox en Chatwoot: ${msg}` };
  }

  const configEncryptedJson = encryptJson({ phoneNumberId, wabaId, accessToken });

  await prisma.tenantChannel.create({
    data: {
      tenantId: session.tenantId,
      type: 'whatsapp',
      chatwootInboxId: inboxId,
      configEncryptedJson,
    },
  });

  revalidatePath('/dashboard/channels');

  const chatwootUrl = getChatwootUrl();
  const callbackUrl = `${chatwootUrl}/webhooks/whatsapp/${phoneNumber.replace('+', '')}`;

  return {
    success: true,
    inboxId,
    callbackUrl,
    webhookUrl: webhookUrl || callbackUrl,
  };
}
