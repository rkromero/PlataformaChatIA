import { NextResponse, type NextRequest } from 'next/server';

function getVerifyToken(): string {
  return process.env.META_WEBHOOK_VERIFY_TOKEN || '';
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token && token === getVerifyToken() && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Webhook verify token inválido' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Fase 2: dejamos el endpoint listo y aceptamos eventos.
    // El procesamiento de mensajes/eventos se integra en una fase posterior.
    console.log('[meta:webhook] event', JSON.stringify(body).slice(0, 1000));

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
