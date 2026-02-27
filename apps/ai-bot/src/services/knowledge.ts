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

  if (entries.length === 0) {
    return '\n\n--- BASE DE CONOCIMIENTO ---\n' +
      'IMPORTANTE: La base de conocimiento de este negocio está VACÍA. No tiene información cargada sobre servicios, productos, precios, menú, horarios ni ningún otro dato.\n' +
      'NO inventes ni supongas ningún servicio, producto, tratamiento, plato ni precio. Si el cliente pregunta por algo específico, respondé: "Todavía no tengo esa información cargada, pero puedo conectarte con alguien del equipo que te ayude."\n' +
      '--- Fin ---';
  }

  const lines = entries.map(
    (e) => `[${e.category}] ${e.title}\n${e.content}`,
  );

  return (
    '\n\n--- BASE DE CONOCIMIENTO DEL NEGOCIO ---\n' +
    'Esta es TODA la información disponible. SOLO podés usar estos datos para responder. ' +
    'Si el cliente pregunta algo que NO está en esta lista, decile que no tenés esa info y ofrecé conectarlo con el equipo.\n\n' +
    lines.join('\n\n') +
    '\n--- Fin de la base de conocimiento ---'
  );
}
