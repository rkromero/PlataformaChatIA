import { prisma } from '../lib/db.js';

interface KnowledgeChunk {
  category: string;
  title: string;
  content: string;
}

export async function getKnowledgeContext(
  tenantId: string,
  userMessage: string,
): Promise<string> {
  let entries: KnowledgeChunk[] = [];

  if (userMessage.trim().length > 2) {
    try {
      entries = await prisma.$queryRawUnsafe<KnowledgeChunk[]>(
        `SELECT category, title, content
         FROM knowledge_entries
         WHERE tenant_id = $1::uuid
           AND enabled = true
           AND deleted_at IS NULL
           AND search_vector @@ plainto_tsquery('spanish', $2)
         ORDER BY ts_rank(search_vector, plainto_tsquery('spanish', $2)) DESC
         LIMIT 15`,
        tenantId,
        userMessage,
      );
    } catch {
      entries = [];
    }
  }

  if (entries.length === 0) {
    entries = await prisma.knowledgeEntry.findMany({
      where: { tenantId, enabled: true },
      select: { category: true, title: true, content: true },
      orderBy: { category: 'asc' },
      take: 15,
    });
  }

  if (entries.length === 0) return '';

  const lines = entries.map(
    (e) => `[${e.category}] ${e.title}\n${e.content}`,
  );

  return (
    '\n\n--- BASE DE CONOCIMIENTO DEL NEGOCIO ---\n' +
    'Usá esta información para responder las consultas del cliente. ' +
    'Si la respuesta está en esta base de conocimiento, usala. ' +
    'Si no encontrás la respuesta acá, decile al cliente que vas a consultar con el equipo.\n\n' +
    lines.join('\n\n')
  );
}
