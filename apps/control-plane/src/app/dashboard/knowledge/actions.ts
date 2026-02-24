'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { capKnowledgeEntries, parseKnowledgeFile, parseKnowledgeFromUrl } from '@/lib/knowledge-import';
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

  await prisma.knowledgeEntry.updateMany({
    where: { id, tenantId: session.tenantId },
    data: { deletedAt: new Date() },
  });

  revalidatePath('/dashboard/knowledge');
}

const uploadSchema = z.object({
  category: z.string().min(1),
});

const ALLOWED_EXTENSIONS = new Set(['pdf', 'xlsx', 'xls', 'csv']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
]);

export async function uploadKnowledgeFileAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();

  const parsed = uploadSchema.safeParse({
    category: formData.get('category'),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { error: 'Seleccioná un archivo PDF o Excel' };
  }

  const fileName = file.name || '';
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { error: 'Formato no soportado. Usá PDF, XLSX, XLS o CSV.' };
  }

  // Browsers may omit MIME for some local files, so we validate when present.
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: 'Tipo de archivo no permitido para importación.' };
  }

  if (file.size === 0) {
    return { error: 'El archivo está vacío' };
  }

  if (file.size > 15 * 1024 * 1024) {
    return { error: 'El archivo supera el máximo de 15MB' };
  }

  let entries: Awaited<ReturnType<typeof parseKnowledgeFile>>;
  try {
    entries = await parseKnowledgeFile(file);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo procesar el archivo';
    return { error: message };
  }

  if (entries.length === 0) {
    return { error: 'No se encontró texto útil para importar en el archivo' };
  }

  const cappedEntries = capKnowledgeEntries(entries);
  if (cappedEntries.length === 0) {
    return { error: 'El contenido del archivo excede los límites de importación.' };
  }

  await prisma.knowledgeEntry.createMany({
    data: cappedEntries.map((entry) => ({
      tenantId: session.tenantId,
      category: parsed.data.category,
      title: entry.title.slice(0, 200),
      content: entry.content.slice(0, 5000),
      enabled: true,
    })),
  });

  revalidatePath('/dashboard/knowledge');
  return { success: true, message: `Importación completa: ${cappedEntries.length} entrada(s) creada(s)` };
}

const urlImportSchema = z.object({
  category: z.string().min(1),
  url: z
    .string()
    .trim()
    .url('Ingresá una URL válida (incluí https://)')
    .refine((value) => /^https?:\/\//i.test(value), 'La URL debe empezar con http:// o https://'),
});

export async function importKnowledgeUrlAction(_prev: unknown, formData: FormData) {
  const session = await requireSession();

  const parsed = urlImportSchema.safeParse({
    category: formData.get('category'),
    url: formData.get('url'),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  let entries: Awaited<ReturnType<typeof parseKnowledgeFromUrl>>;
  try {
    entries = await parseKnowledgeFromUrl(parsed.data.url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo importar la URL';
    return { error: message };
  }

  const cappedEntries = capKnowledgeEntries(entries);
  if (cappedEntries.length === 0) {
    return { error: 'El contenido de la URL excede los límites de importación.' };
  }

  await prisma.knowledgeEntry.createMany({
    data: cappedEntries.map((entry) => ({
      tenantId: session.tenantId,
      category: parsed.data.category,
      title: entry.title.slice(0, 200),
      content: entry.content.slice(0, 5000),
      enabled: true,
    })),
  });

  revalidatePath('/dashboard/knowledge');
  return { success: true, message: `Importación web completa: ${cappedEntries.length} entrada(s) creada(s)` };
}
