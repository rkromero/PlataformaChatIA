'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import {
  syncTemplatesFromMeta,
  getChannelConfig,
  createMetaTemplate,
  sendTemplateMessage,
} from '@/lib/meta-templates';
import { z } from 'zod';

export async function syncTemplatesAction() {
  const session = await requireSession();

  try {
    const count = await syncTemplatesFromMeta(session.tenantId);
    revalidatePath('/dashboard/templates');
    return { success: true, count };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return { error: msg };
  }
}

const createSchema = z.object({
  name: z.string()
    .min(1, 'Nombre requerido')
    .max(60)
    .regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y guiones bajos'),
  category: z.enum(['UTILITY', 'MARKETING']),
  language: z.string().min(2).default('es'),
  bodyText: z.string().min(1, 'El cuerpo es requerido').max(1024),
});

export async function createTemplateAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();

  const parsed = createSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    language: formData.get('language') || 'es',
    bodyText: formData.get('bodyText'),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const config = await getChannelConfig(session.tenantId);
  if (!config) return { error: 'No hay canal WhatsApp configurado' };

  try {
    const result = await createMetaTemplate(
      config,
      parsed.data.name,
      parsed.data.category,
      parsed.data.language,
      parsed.data.bodyText,
    );

    await prisma.whatsAppTemplate.create({
      data: {
        tenantId: session.tenantId,
        metaId: result.id,
        name: parsed.data.name,
        language: parsed.data.language,
        category: parsed.data.category,
        status: 'PENDING',
        components: [{ type: 'BODY', text: parsed.data.bodyText }],
      },
    });

    revalidatePath('/dashboard/templates');
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    if (msg.includes('100')) return { error: 'Nombre de plantilla ya existe o es inválido.' };
    return { error: `Error de Meta: ${msg}` };
  }
}

export async function sendTemplateAction(
  leadId: string,
  templateName: string,
  language: string,
  params: string[],
) {
  const session = await requireSession();

  const lead = await prisma.conversationLink.findFirst({
    where: { id: leadId, tenantId: session.tenantId },
    select: { phone: true },
  });

  if (!lead?.phone) return { error: 'El lead no tiene teléfono' };

  const config = await getChannelConfig(session.tenantId);
  if (!config) return { error: 'No hay canal WhatsApp configurado' };

  try {
    await sendTemplateMessage(config, lead.phone, templateName, language, params);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return { error: `Error al enviar: ${msg}` };
  }
}

export async function deleteTemplateAction(templateId: string) {
  const session = await requireSession();

  await prisma.whatsAppTemplate.deleteMany({
    where: { id: templateId, tenantId: session.tenantId },
  });

  revalidatePath('/dashboard/templates');
}
