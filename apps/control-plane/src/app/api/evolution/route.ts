import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  isEvolutionConfigured,
  createInstance,
  getQrCode,
  getInstanceStatus,
  deleteInstance,
} from '@/lib/evolution-api';
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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const action = request.nextUrl.searchParams.get('action');
  const instanceName = request.nextUrl.searchParams.get('instance');

  if (!isEvolutionConfigured()) {
    return NextResponse.json({ error: 'Evolution API no configurada' }, { status: 503 });
  }

  if (action === 'status' && instanceName) {
    const state = await getInstanceStatus(instanceName);
    return NextResponse.json({ state });
  }

  if (action === 'qr' && instanceName) {
    try {
      const qr = await getQrCode(instanceName);
      return NextResponse.json({ base64: qr.base64, pairingCode: qr.pairingCode });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  if (action === 'check') {
    return NextResponse.json({ configured: isEvolutionConfigured() });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if (!isEvolutionConfigured()) {
    return NextResponse.json({ error: 'Evolution API no configurada' }, { status: 503 });
  }

  const body = await request.json();
  const { action } = body as { action: string };

  if (action === 'create') {
    return await handleCreate(session.tenantId);
  }

  if (action === 'confirm') {
    const { instanceName, channelId } = body as { instanceName: string; channelId?: string };
    return await handleConfirm(session.tenantId, instanceName, channelId);
  }

  if (action === 'delete') {
    const { instanceName, channelId } = body as { instanceName: string; channelId?: string };
    return await handleDelete(session.tenantId, instanceName, channelId);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function handleCreate(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, slug: true, plan: true, chatwootAccountId: true },
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
  const instanceName = `wa-${slug}-${Date.now()}`.replace(/[^a-zA-Z0-9-]/g, '');

  try {
    const cwUrl = process.env['CW_PLATFORM_URL'] || process.env['CHATWOOT_BASE_URL'] || '';
    const cwToken = process.env['CW_PLATFORM_KEY'] || '';

    let chatwootConfig: { chatwootAccountId: number; chatwootToken: string; chatwootUrl: string } | undefined;
    if (tenant.chatwootAccountId && cwUrl && cwToken) {
      chatwootConfig = {
        chatwootAccountId: tenant.chatwootAccountId,
        chatwootToken: cwToken,
        chatwootUrl: cwUrl,
      };
    }

    const result = await createInstance(instanceName, chatwootConfig);

    const configEncryptedJson = safeEncrypt({
      instanceName,
      evolutionApiKey: result.hash?.apikey ?? '',
      connectionType: 'qr',
    });

    const channel = await prisma.tenantChannel.create({
      data: {
        tenantId,
        type: 'whatsapp_qr',
        chatwootInboxId: 0,
        configEncryptedJson,
        evolutionInstance: instanceName,
      },
    });

    let qrBase64 = result.qrcode?.base64 ?? null;

    if (!qrBase64) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const qr = await getQrCode(instanceName);
        qrBase64 = qr.base64 ?? null;
      } catch {}
    }

    return NextResponse.json({
      instanceName,
      channelId: channel.id,
      qrBase64,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al crear instancia';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function handleConfirm(tenantId: string, instanceName: string, channelId?: string) {
  const state = await getInstanceStatus(instanceName);

  if (state !== 'open') {
    return NextResponse.json({ error: 'La instancia aún no está conectada', state }, { status: 400 });
  }

  if (channelId) {
    await prisma.tenantChannel.updateMany({
      where: { id: channelId, tenantId },
      data: { chatwootInboxId: -1 },
    });
  }

  return NextResponse.json({ ok: true, state: 'open' });
}

async function handleDelete(tenantId: string, instanceName: string, channelId?: string) {
  try {
    await deleteInstance(instanceName);
  } catch {}

  if (channelId) {
    await prisma.tenantChannel.deleteMany({
      where: { id: channelId, tenantId },
    });
  }

  return NextResponse.json({ ok: true });
}
