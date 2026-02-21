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
  const entries = await prisma.knowledgeEntry.findMany({
    where: { tenantId, enabled: true },
    select: { category: true, title: true, content: true },
    orderBy: { category: 'asc' },
  });

  if (entries.length === 0) return '';

  const ranked = rankByRelevance(entries, userMessage);
  const selected = ranked.slice(0, 15);

  const lines = selected.map(
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

function rankByRelevance(
  entries: KnowledgeChunk[],
  query: string,
): KnowledgeChunk[] {
  const queryWords = tokenize(query);
  if (queryWords.length === 0) return entries;

  const scored = entries.map((entry) => {
    const entryWords = tokenize(`${entry.title} ${entry.content}`);
    let score = 0;

    for (const qw of queryWords) {
      for (const ew of entryWords) {
        if (ew === qw) {
          score += 3;
        } else if (ew.includes(qw) || qw.includes(ew)) {
          score += 1;
        }
      }
    }

    const titleWords = tokenize(entry.title);
    for (const qw of queryWords) {
      if (titleWords.some((tw) => tw === qw)) {
        score += 5;
      }
    }

    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.entry);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\W+/)
    .filter((w) => w.length > 2);
}
