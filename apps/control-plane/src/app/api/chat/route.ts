import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

function getChatwootConfig() {
  const url = process.env[String('CW_PLATFORM_URL')] || process.env[String('CHATWOOT_BASE_URL')] || '';
  const token = process.env[String('CW_PLATFORM_KEY')] || '';
  return { url, token };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const leadId = request.nextUrl.searchParams.get('leadId');
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

  const lead = await prisma.conversationLink.findFirst({
    where: { id: leadId, tenantId: session.tenantId },
    select: { chatwootConversationId: true, tenant: { select: { chatwootAccountId: true } } },
  });

  if (!lead || !lead.tenant.chatwootAccountId || lead.chatwootConversationId <= 0) {
    return NextResponse.json({ messages: [], linked: false });
  }

  const { url, token } = getChatwootConfig();
  if (!url || !token) return NextResponse.json({ messages: [], linked: true });

  try {
    const res = await fetch(
      `${url}/api/v1/accounts/${lead.tenant.chatwootAccountId}/conversations/${lead.chatwootConversationId}/messages`,
      { headers: { api_access_token: token } },
    );

    if (!res.ok) return NextResponse.json({ messages: [], linked: true });

    const data = await res.json();
    const messages = ((data.payload ?? []) as Array<{
      id: number;
      content: string | null;
      message_type: number;
      created_at: number;
      sender?: { name?: string; type?: string };
    }>)
      .filter((m) => m.content)
      .slice(-30)
      .map((m) => ({
        id: m.id,
        content: m.content,
        type: m.message_type === 0 ? 'incoming' : 'outgoing',
        sender: m.sender?.name ?? (m.message_type === 0 ? 'Cliente' : 'Bot/Agente'),
        timestamp: m.created_at,
      }));

    return NextResponse.json({ messages, linked: true });
  } catch {
    return NextResponse.json({ messages: [], linked: true });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json();
  const { leadId, message } = body as { leadId: string; message: string };

  if (!leadId || !message?.trim()) {
    return NextResponse.json({ error: 'leadId and message required' }, { status: 400 });
  }

  const lead = await prisma.conversationLink.findFirst({
    where: { id: leadId, tenantId: session.tenantId },
    select: { chatwootConversationId: true, tenant: { select: { chatwootAccountId: true } } },
  });

  if (!lead || !lead.tenant.chatwootAccountId || lead.chatwootConversationId <= 0) {
    return NextResponse.json({ error: 'Lead no vinculado a conversación' }, { status: 400 });
  }

  const { url, token } = getChatwootConfig();
  if (!url || !token) {
    return NextResponse.json({ error: 'Chatwoot no configurado' }, { status: 503 });
  }

  try {
    const res = await fetch(
      `${url}/api/v1/accounts/${lead.tenant.chatwootAccountId}/conversations/${lead.chatwootConversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          api_access_token: token,
        },
        body: JSON.stringify({
          content: message.trim(),
          message_type: 'outgoing',
          private: false,
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Chatwoot error: ${text}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error de conexión con Chatwoot' }, { status: 502 });
  }
}
