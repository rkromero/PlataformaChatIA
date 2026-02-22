import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

function getChatwootConfig() {
  const url = process.env[String('CW_PLATFORM_URL')] || process.env[String('CHATWOOT_BASE_URL')] || '';
  const token = process.env[String('CW_PLATFORM_KEY')] || '';
  return { url, token };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;

  const conv = await prisma.conversationLink.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { tenant: { select: { chatwootAccountId: true } } },
  });

  if (!conv || !conv.tenant.chatwootAccountId || conv.chatwootConversationId <= 0) {
    return NextResponse.json({ messages: [], labels: [] });
  }

  const { url, token } = getChatwootConfig();
  if (!url || !token) return NextResponse.json({ messages: [], labels: [] });

  const accountId = conv.tenant.chatwootAccountId;
  const cwConvId = conv.chatwootConversationId;

  try {
    const [msgsRes, convRes] = await Promise.all([
      fetch(`${url}/api/v1/accounts/${accountId}/conversations/${cwConvId}/messages`, {
        headers: { api_access_token: token },
      }),
      fetch(`${url}/api/v1/accounts/${accountId}/conversations/${cwConvId}`, {
        headers: { api_access_token: token },
      }),
    ]);

    let messages: Array<{
      id: number;
      content: string;
      type: string;
      sender: string;
      timestamp: number;
      private: boolean;
    }> = [];

    let labels: string[] = [];

    if (msgsRes.ok) {
      const data = await msgsRes.json();
      messages = ((data.payload ?? []) as Array<{
        id: number;
        content: string | null;
        message_type: number;
        created_at: number;
        private: boolean;
        sender?: { name?: string; type?: string };
      }>)
        .filter((m) => m.content)
        .slice(-50)
        .map((m) => ({
          id: m.id,
          content: m.content!,
          type: m.message_type === 0 ? 'incoming' : 'outgoing',
          sender: m.sender?.name ?? (m.message_type === 0 ? 'Cliente' : 'Bot/Agente'),
          timestamp: m.created_at,
          private: m.private ?? false,
        }));
    }

    if (convRes.ok) {
      const convData = await convRes.json();
      labels = convData.labels ?? [];
    }

    return NextResponse.json({ messages, labels });
  } catch {
    return NextResponse.json({ messages: [], labels: [] });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { action, message } = body as { action?: string; message?: string };

  const conv = await prisma.conversationLink.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { tenant: { select: { chatwootAccountId: true } } },
  });

  if (!conv || !conv.tenant.chatwootAccountId || conv.chatwootConversationId <= 0) {
    return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
  }

  const { url, token } = getChatwootConfig();
  if (!url || !token) {
    return NextResponse.json({ error: 'Chatwoot no configurado' }, { status: 503 });
  }

  const accountId = conv.tenant.chatwootAccountId;
  const cwConvId = conv.chatwootConversationId;

  if (action === 'take') {
    return await toggleHandoff(url, token, accountId, cwConvId, true);
  }

  if (action === 'release') {
    return await toggleHandoff(url, token, accountId, cwConvId, false);
  }

  if (action === 'send' && message?.trim()) {
    try {
      const res = await fetch(
        `${url}/api/v1/accounts/${accountId}/conversations/${cwConvId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', api_access_token: token },
          body: JSON.stringify({ content: message.trim(), message_type: 'outgoing', private: false }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: text }, { status: 502 });
      }

      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: 'Error de conexión' }, { status: 502 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function toggleHandoff(
  cwUrl: string,
  token: string,
  accountId: number,
  convId: number,
  take: boolean,
) {
  try {
    const getRes = await fetch(
      `${cwUrl}/api/v1/accounts/${accountId}/conversations/${convId}`,
      { headers: { api_access_token: token } },
    );

    if (!getRes.ok) {
      return NextResponse.json({ error: 'No se pudo obtener la conversación' }, { status: 502 });
    }

    const convData = await getRes.json();
    const currentLabels: string[] = convData.labels ?? [];
    const tag = 'human_handoff';

    let newLabels: string[];
    if (take) {
      newLabels = currentLabels.includes(tag) ? currentLabels : [...currentLabels, tag];
    } else {
      newLabels = currentLabels.filter((l: string) => l !== tag);
    }

    const labelRes = await fetch(
      `${cwUrl}/api/v1/accounts/${accountId}/conversations/${convId}/labels`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', api_access_token: token },
        body: JSON.stringify({ labels: newLabels }),
      },
    );

    if (!labelRes.ok) {
      const text = await labelRes.text();
      return NextResponse.json({ error: text }, { status: 502 });
    }

    return NextResponse.json({ ok: true, labels: newLabels });
  } catch {
    return NextResponse.json({ error: 'Error de conexión' }, { status: 502 });
  }
}
