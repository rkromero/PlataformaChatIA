import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

function getOpenAIKey(): string {
  return process.env[String('OPENAI_API_KEY')] ?? '';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Sandbox no disponible: falta configurar OPENAI_API_KEY en el control-plane.' },
      { status: 503 },
    );
  }

  const body = await request.json();
  const message = (body.message as string)?.trim();
  const history = (body.history as ChatMessage[]) ?? [];

  if (!message) {
    return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
  }

  const [settings, knowledgeEntries] = await Promise.all([
    prisma.aiSettings.findUnique({
      where: { tenantId: session.tenantId },
    }),
    prisma.knowledgeEntry.findMany({
      where: { tenantId: session.tenantId, enabled: true },
      select: { category: true, title: true, content: true },
    }),
  ]);

  if (!settings) {
    return NextResponse.json({ error: 'No hay configuración de AI. Completá el onboarding primero.' }, { status: 400 });
  }

  let systemPrompt = settings.systemPrompt;

  if (knowledgeEntries.length > 0) {
    const knowledgeContext = buildKnowledgeContext(knowledgeEntries, message);
    if (knowledgeContext) {
      systemPrompt += knowledgeContext;
    }
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: message },
  ];

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('OpenAI error:', res.status, text);
      return NextResponse.json({ error: 'Error al generar respuesta de IA' }, { status: 502 });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? 'No se pudo generar una respuesta.';

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Sandbox OpenAI call failed:', err);
    return NextResponse.json({ error: 'Error de conexión con OpenAI' }, { status: 502 });
  }
}

function buildKnowledgeContext(
  entries: Array<{ category: string; title: string; content: string }>,
  query: string,
): string {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return '';

  const scored = entries.map((entry) => {
    const entryTokens = tokenize(`${entry.title} ${entry.content}`);
    const matches = queryTokens.filter((t) => entryTokens.includes(t)).length;
    return { entry, score: matches };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5).filter((s) => s.score > 0);

  if (top.length === 0) {
    const fallback = entries.slice(0, 3);
    if (fallback.length === 0) return '';
    return formatContext(fallback);
  }

  return formatContext(top.map((s) => s.entry));
}

function formatContext(entries: Array<{ category: string; title: string; content: string }>): string {
  const lines = entries.map((e) => `[${e.category}] ${e.title}: ${e.content}`);
  return `\n\n--- Base de conocimiento ---\n${lines.join('\n')}\n--- Fin ---`;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\W+/)
    .filter((t) => t.length > 2);
}
