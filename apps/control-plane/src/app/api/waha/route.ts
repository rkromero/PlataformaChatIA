import { NextResponse, type NextRequest } from 'next/server';
import { getSession as getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  isWahaConfigured,
  createSession,
  getQrCode,
  getSessionStatus,
  deleteSession,
} from '@/lib/waha-api';
import { getPlanLimits } from '@chat-platform/shared/plans';

function safeEncrypt(data: Record<string, string>): string {
  try {
    const { encryptJson } = require('@chat-platform/shared/crypto');
    return encryptJson(data);
  } catch {
    return JSON.stringify(data);
  }
}

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if (!isWahaConfigured()) {
    return NextResponse.json({ error: 'WAHA no configurada' }, { status: 503 });
  }

  const action = request.nextUrl.searchParams.get('action');
  const sessionName = request.nextUrl.searchParams.get('session');

  if (action === 'status' && sessionName) {
    const status = await getSessionStatus(sessionName);
    return NextResponse.json({ status });
  }

  if (action === 'qr' && sessionName) {
    const qr = await getQrCode(sessionName);
    return NextResponse.json({ qr });
  }

  if (action === 'check') {
    return NextResponse.json({ configured: isWahaConfigured() });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if (!isWahaConfigured()) {
    return NextResponse.json({ error: 'WAHA no configurada' }, { status: 503 });
  }

  const body = await request.json();
  const { action } = body as { action: string };

  if (action === 'create') return handleCreate(session.tenantId);
  if (action === 'delete') return handleDelete(session.tenantId, body.sessionName, body.channelId);

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function handleCreate(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, slug: true, plan: true },
  });

  if (!tenant) return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });

  const limits = getPlanLimits(tenant.plan);
  if (limits.maxChannels !== -1) {
    const currentChannels = await prisma.tenantChannel.count({ where: { tenantId } });
    if (currentChannels >= limits.maxChannels) {
      return NextResponse.json({
        error: `Tu plan ${limits.name} permite máximo ${limits.maxChannels} canal(es).`,
      }, { status: 403 });
    }
  }

  const slug = tenant.slug || tenantId.slice(0, 8);
  const sessionName = `wa-${slug}-${Date.now()}`.replace(/[^a-zA-Z0-9-]/g, '');

  try {
    const aiBotUrl = process.env['AI_BOT_URL'] || process.env['CONTROL_PLANE_URL'] || '';
    const webhookUrl = aiBotUrl
      ? `${aiBotUrl.replace(/\/$/, '')}/webhooks/waha`
      : '';

    const wahaSession = await createSession(sessionName, webhookUrl);

    const configEncryptedJson = safeEncrypt({
      sessionName,
      connectionType: 'qr',
    });

    const channel = await prisma.tenantChannel.create({
      data: {
        tenantId,
        type: 'whatsapp_qr',
        chatwootInboxId: 0,
        configEncryptedJson,
        evolutionInstance: sessionName,
      },
    });

    let qr: string | null = null;

    if (wahaSession.status === 'SCAN_QR_CODE') {
      qr = await getQrCode(sessionName);
    }

    if (!qr) {
      for (let i = 0; i < 4; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await getSessionStatus(sessionName);
        if (status === 'SCAN_QR_CODE' || status === 'STARTING') {
          qr = await getQrCode(sessionName);
          if (qr) break;
        }
      }
    }

    return NextResponse.json({
      sessionName,
      channelId: channel.id,
      qr,
      status: wahaSession.status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al crear sesión WAHA';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function handleDelete(tenantId: string, sessionName?: string, channelId?: string) {
  if (sessionName) {
    try { await deleteSession(sessionName); } catch {}
  }

  if (channelId) {
    await prisma.tenantChannel.deleteMany({
      where: { id: channelId, tenantId },
    });
  }

  return NextResponse.json({ ok: true });
}
