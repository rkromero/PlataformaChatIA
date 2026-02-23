import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} no está configurado`);
  return value;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const appId = requiredEnv('META_APP_ID');
    const redirectUri = requiredEnv('META_REDIRECT_URI');
    const configId = requiredEnv('META_EMBEDDED_CONFIG_ID');
    const version = process.env.META_GRAPH_VERSION || 'v22.0';

    const statePayload = Buffer.from(
      JSON.stringify({
        tenantId: session.tenantId,
        userId: session.userId,
        ts: Date.now(),
      }),
      'utf8',
    ).toString('base64url');

    const authUrl = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
    authUrl.searchParams.set('client_id', appId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set(
      'scope',
      'whatsapp_business_management,whatsapp_business_messaging',
    );
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', statePayload);
    authUrl.searchParams.set('config_id', configId);

    return NextResponse.json({ url: authUrl.toString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo generar URL de Embedded Signup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
