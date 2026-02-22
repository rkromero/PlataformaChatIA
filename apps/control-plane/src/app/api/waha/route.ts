import { NextResponse, type NextRequest } from 'next/server';
import { getSession as getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  isWahaConfigured,
  ensureSession,
  getQrCode,
  getSessionStatus,
  stopSession,
} from '@/lib/waha-api';
import { getPlanLimits } from '@chat-platform/shared/plans';

const SESSION_NAME = 'default';

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

  if (action === 'status') {
    const status = await getSessionStatus(SESSION_NAME);
    return NextResponse.json({ status });
  }

  if (action === 'qr') {
    const qr = await getQrCode(SESSION_NAME);
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
  if (action === 'delete') return handleDelete(session.tenantId, body.channelId);

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

  try {
    const aiBotUrl = process.env['AI_BOT_URL'] || '';
    const webhookUrl = aiBotUrl
      ? `${aiBotUrl.replace(/\/$/, '')}/webhooks/waha`
      : '';

    const wahaSession = await ensureSession(SESSION_NAME, webhookUrl);

    const existing = await prisma.tenantChannel.findFirst({
      where: { tenantId, evolutionInstance: SESSION_NAME, type: 'whatsapp_qr' },
    });

    let channelId = existing?.id;

    if (!existing) {
      const configEncryptedJson = safeEncrypt({
        sessionName: SESSION_NAME,
        connectionType: 'qr',
      });

      const channel = await prisma.tenantChannel.create({
        data: {
          tenantId,
          type: 'whatsapp_qr',
          chatwootInboxId: 0,
          configEncryptedJson,
          evolutionInstance: SESSION_NAME,
        },
      });
      channelId = channel.id;
    }

    let qr: string | null = null;

    if (wahaSession.status === 'SCAN_QR_CODE') {
      qr = await getQrCode(SESSION_NAME);
    }

    if (!qr) {
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await getSessionStatus(SESSION_NAME);
        if (status === 'SCAN_QR_CODE') {
          qr = await getQrCode(SESSION_NAME);
          if (qr) break;
        }
        if (status === 'WORKING') break;
      }
    }

    return NextResponse.json({
      sessionName: SESSION_NAME,
      channelId,
      qr,
      status: wahaSession.status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al crear sesión WAHA';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function handleDelete(tenantId: string, channelId?: string) {
  try { await stopSession(SESSION_NAME); } catch {}

  if (channelId) {
    await prisma.tenantChannel.deleteMany({
      where: { id: channelId, tenantId },
    });
  }

  return NextResponse.json({ ok: true });
}
