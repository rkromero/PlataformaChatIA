import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { agentLeadFilter } from '@/lib/agent-filter';
import { sendText } from '@/lib/waha-api';

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

  const filter = agentLeadFilter(session);
  const lead = await prisma.conversationLink.findFirst({
    where: { id: leadId, tenantId: session.tenantId, ...filter },
    select: {
      chatwootConversationId: true,
      source: true,
      wahaChatId: true,
      phone: true,
      tenant: { select: { chatwootAccountId: true } },
    },
  });

  if (!lead) return NextResponse.json({ messages: [], linked: false });

  if (lead.source === 'chatwoot') {
    return getChatwootMessages(lead);
  }

  if (lead.source === 'whatsapp_qr') {
    const dbMessages = await prisma.message.findMany({
      where: { conversationLinkId: leadId },
      orderBy: { timestamp: 'asc' },
      take: 50,
    });

    const messages = dbMessages.map((m) => ({
      id: m.id,
      content: m.content,
      type: m.direction === 'incoming' ? 'incoming' : 'outgoing',
      sender: m.senderName ?? (m.direction === 'incoming' ? 'Cliente' : 'Bot/Agente'),
      timestamp: Math.floor(m.timestamp.getTime() / 1000),
    }));

    return NextResponse.json({ messages, linked: true, channel: 'whatsapp_qr' });
  }

  return NextResponse.json({ messages: [], linked: false });
}

async function getChatwootMessages(lead: {
  chatwootConversationId: number | null;
  source: string;
  tenant: { chatwootAccountId: number | null };
}) {
  if (!lead.tenant.chatwootAccountId) {
    return NextResponse.json({ messages: [], linked: false });
  }

  const { url, token } = getChatwootConfig();
  if (!url || !token) return NextResponse.json({ messages: [], linked: true, channel: 'chatwoot' });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(
      `${url}/api/v1/accounts/${lead.tenant.chatwootAccountId}/conversations/${lead.chatwootConversationId}/messages`,
      { headers: { api_access_token: token }, signal: controller.signal },
    );
    clearTimeout(timeoutId);

    if (!res.ok) return NextResponse.json({ messages: [], linked: true, channel: 'chatwoot' });

    const data = await res.json();
    const messages = ((data.payload ?? []) as Array<{
      id: number;
      content: string | null;
      message_type: number;
      created_at: number;
      sender?: { name?: string; type?: string };
    }>)
      .filter((m) => m.content)
      .slice(-50)
      .map((m) => ({
        id: m.id,
        content: m.content,
        type: m.message_type === 0 ? 'incoming' : 'outgoing',
        sender: m.sender?.name ?? (m.message_type === 0 ? 'Cliente' : 'Bot/Agente'),
        timestamp: m.created_at,
      }));

    return NextResponse.json({ messages, linked: true, channel: 'chatwoot' });
  } catch {
    return NextResponse.json({ messages: [], linked: true, channel: 'chatwoot' });
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

  const postFilter = agentLeadFilter(session);
  const lead = await prisma.conversationLink.findFirst({
    where: { id: leadId, tenantId: session.tenantId, ...postFilter },
    select: {
      chatwootConversationId: true,
      source: true,
      wahaChatId: true,
      phone: true,
      tenantId: true,
      tenant: { select: { chatwootAccountId: true } },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
  }

  if (lead.source === 'chatwoot') {
    return sendViaChatwoot(lead, message.trim());
  }

  if (lead.source === 'whatsapp_qr') {
    return sendViaWhatsAppQr(lead, message.trim(), leadId, session.userId);
  }

  return NextResponse.json({ error: 'Canal no soportado para envío directo' }, { status: 400 });
}

async function sendViaChatwoot(
  lead: { chatwootConversationId: number | null; tenant: { chatwootAccountId: number | null } },
  text: string,
) {
  if (!lead.tenant.chatwootAccountId) {
    return NextResponse.json({ error: 'Lead no vinculado a conversación' }, { status: 400 });
  }

  const { url, token } = getChatwootConfig();
  if (!url || !token) {
    return NextResponse.json({ error: 'Chatwoot no configurado' }, { status: 503 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(
      `${url}/api/v1/accounts/${lead.tenant.chatwootAccountId}/conversations/${lead.chatwootConversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          api_access_token: token,
        },
        body: JSON.stringify({
          content: text,
          message_type: 'outgoing',
          private: false,
        }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ error: `Chatwoot error: ${body}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error de conexión con Chatwoot' }, { status: 502 });
  }
}

async function sendViaWhatsAppQr(
  lead: { tenantId: string; wahaChatId: string | null; phone: string | null },
  text: string,
  leadId: string,
  agentUserId: string,
) {
  const chatId = lead.wahaChatId ?? (lead.phone ? `${lead.phone.replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);

  if (!chatId) {
    return NextResponse.json({ error: 'No se encontró el chatId del contacto' }, { status: 400 });
  }

  try {
    await sendText(lead.tenantId, chatId, text);

    await prisma.message.create({
      data: {
        tenantId: lead.tenantId,
        conversationLinkId: leadId,
        agentUserId,
        direction: 'outgoing',
        content: text,
        senderName: 'Agente',
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al enviar';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
