'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { z } from 'zod';

const entrySchema = z.object({
  category: z.string().min(1),
  title: z.string().min(2, 'Mínimo 2 caracteres').max(200),
  content: z.string().min(5, 'Mínimo 5 caracteres').max(5000, 'Máximo 5000 caracteres'),
});

export async function createKnowledgeEntryAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();

  const parsed = entrySchema.safeParse({
    category: formData.get('category'),
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await prisma.knowledgeEntry.create({
    data: {
      tenantId: session.tenantId,
      ...parsed.data,
    },
  });

  revalidatePath('/dashboard/knowledge');
  return { success: true };
}

export async function updateKnowledgeEntryAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();
  const id = formData.get('id') as string;

  const parsed = entrySchema.safeParse({
    category: formData.get('category'),
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await prisma.knowledgeEntry.updateMany({
    where: { id, tenantId: session.tenantId },
    data: parsed.data,
  });

  revalidatePath('/dashboard/knowledge');
  return { success: true };
}

export async function toggleKnowledgeEntryAction(id: string) {
  const session = await requireSession();

  const entry = await prisma.knowledgeEntry.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { enabled: true },
  });

  if (entry) {
    await prisma.knowledgeEntry.updateMany({
      where: { id, tenantId: session.tenantId },
      data: { enabled: !entry.enabled },
    });
  }

  revalidatePath('/dashboard/knowledge');
}

export async function deleteKnowledgeEntryAction(id: string) {
  const session = await requireSession();

  await prisma.knowledgeEntry.deleteMany({
    where: { id, tenantId: session.tenantId },
  });

  revalidatePath('/dashboard/knowledge');
}
