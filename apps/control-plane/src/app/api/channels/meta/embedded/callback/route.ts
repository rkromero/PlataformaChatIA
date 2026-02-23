import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createWhatsAppInbox } from '@/lib/chatwoot-platform';
import { exchangeEmbeddedCodeForToken, resolveEmbeddedAssets } from '@/lib/meta-embedded';
import { encryptJson } from '@chat-platform/shared/crypto';
import { getPlanLimits } from '@chat-platform/shared/plans';

function redirectWithStatus(request: NextRequest, status: 'success' | 'error', message?: string) {
  const url = new URL('/dashboard/channels/connect-whatsapp', request.url);
  url.searchParams.set('embedded', status);
  if (message) url.searchParams.set('message', message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const businessId = request.nextUrl.searchParams.get('business_id');
  const wabaId = request.nextUrl.searchParams.get('waba_id');
  const phoneNumberId = request.nextUrl.searchParams.get('phone_number_id');
  const errorReason =
    request.nextUrl.searchParams.get('error_description')
    || request.nextUrl.searchParams.get('error');

  if (errorReason) {
    return redirectWithStatus(request, 'error', errorReason);
  }

  if (!code) {
    return redirectWithStatus(request, 'error', 'Meta no devolvió un código de autorización.');
  }

  const session = await getSession();
  if (!session) {
    return redirectWithStatus(
      request,
      'error',
      'Tu sesión expiró. Iniciá sesión de nuevo y repetí la conexión.',
    );
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { id: true, name: true, plan: true, chatwootAccountId: true },
    });

    if (!tenant || !tenant.chatwootAccountId) {
      return redirectWithStatus(
        request,
        'error',
        'No se encontró configuración de tenant/chatwoot para completar la conexión.',
      );
    }

    const limits = getPlanLimits(tenant.plan);
    if (limits.maxChannels !== -1) {
      const currentChannels = await prisma.tenantChannel.count({
        where: { tenantId: session.tenantId },
      });
      if (currentChannels >= limits.maxChannels) {
        return redirectWithStatus(
          request,
          'error',
          `Tu plan ${limits.name} permite máximo ${limits.maxChannels} canal(es).`,
        );
      }
    }

    const token = await exchangeEmbeddedCodeForToken(code);
    const assets = await resolveEmbeddedAssets(token.accessToken, {
      businessId,
      wabaId,
      phoneNumberId,
    });

    const inbox = await createWhatsAppInbox(
      tenant.chatwootAccountId,
      `WhatsApp - ${tenant.name}`,
      assets.phoneNumber,
      assets.phoneNumberId,
      assets.wabaId,
      token.accessToken,
    );

    const configEncryptedJson = encryptJson({
      source: 'embedded_signup',
      businessId: assets.businessId,
      wabaId: assets.wabaId,
      phoneNumberId: assets.phoneNumberId,
      phoneNumber: assets.phoneNumber,
      accessToken: token.accessToken,
      tokenExpiresAt: token.expiresIn
        ? new Date(Date.now() + token.expiresIn * 1000).toISOString()
        : null,
    });

    await prisma.tenantChannel.create({
      data: {
        tenantId: session.tenantId,
        type: 'whatsapp',
        chatwootInboxId: inbox.id,
        configEncryptedJson,
      },
    });

    return redirectWithStatus(request, 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return redirectWithStatus(request, 'error', message);
  }
}
