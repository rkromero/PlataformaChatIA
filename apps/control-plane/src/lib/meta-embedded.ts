interface GraphListResponse<T> {
  data?: T[];
}

interface GraphPhoneNumber {
  id: string;
  display_phone_number?: string;
}

interface GraphWaba {
  id: string;
  phone_numbers?: GraphPhoneNumber[];
}

export interface EmbeddedTokenResult {
  accessToken: string;
  expiresIn: number | null;
}

export interface EmbeddedAssetResult {
  businessId: string | null;
  wabaId: string;
  phoneNumberId: string;
  phoneNumber: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} no está configurado`);
  return value;
}

function getGraphApiVersion(): string {
  return process.env.META_GRAPH_VERSION || 'v22.0';
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const clean = phone.replace(/[^\d+]/g, '');
  if (!clean) return null;
  return clean.startsWith('+') ? clean : `+${clean.replace(/[^\d]/g, '')}`;
}

async function graphGet<T>(
  path: string,
  accessToken: string,
  params?: Record<string, string>,
): Promise<T> {
  const version = getGraphApiVersion();
  const url = new URL(`https://graph.facebook.com/${version}${path}`);
  url.searchParams.set('access_token', accessToken);
  Object.entries(params || {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || 'Error consultando Graph API';
    throw new Error(msg);
  }

  return data as T;
}

async function listWabasFromMe(accessToken: string): Promise<GraphWaba[]> {
  const fields = 'id,phone_numbers{id,display_phone_number}';
  const owned = await graphGet<GraphListResponse<GraphWaba>>(
    '/me/owned_whatsapp_business_accounts',
    accessToken,
    { fields },
  ).catch(() => ({ data: [] }));

  if (owned.data && owned.data.length > 0) return owned.data;

  const assigned = await graphGet<GraphListResponse<GraphWaba>>(
    '/me/whatsapp_business_accounts',
    accessToken,
    { fields },
  ).catch(() => ({ data: [] }));

  return assigned.data || [];
}

async function getPhoneFromWaba(
  accessToken: string,
  wabaId: string,
): Promise<GraphPhoneNumber | null> {
  const data = await graphGet<GraphWaba>(`/${wabaId}`, accessToken, {
    fields: 'phone_numbers{id,display_phone_number}',
  }).catch(() => null);

  return data?.phone_numbers?.[0] || null;
}

async function getPhoneById(
  accessToken: string,
  phoneNumberId: string,
): Promise<GraphPhoneNumber | null> {
  return graphGet<GraphPhoneNumber>(`/${phoneNumberId}`, accessToken, {
    fields: 'id,display_phone_number',
  }).catch(() => null);
}

export async function exchangeEmbeddedCodeForToken(
  code: string,
): Promise<EmbeddedTokenResult> {
  const clientId = getRequiredEnv('META_APP_ID');
  const clientSecret = getRequiredEnv('META_APP_SECRET');
  const redirectUri = getRequiredEnv('META_REDIRECT_URI');

  const url = new URL('https://graph.facebook.com/oauth/access_token');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('client_secret', clientSecret);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('code', code);

  const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
  const data = await res.json();

  if (!res.ok || !data?.access_token) {
    const msg = data?.error?.message || 'No se pudo intercambiar el code por access_token';
    throw new Error(msg);
  }

  return {
    accessToken: data.access_token as string,
    expiresIn: typeof data.expires_in === 'number' ? data.expires_in : null,
  };
}

export async function resolveEmbeddedAssets(
  accessToken: string,
  fallback: {
    businessId?: string | null;
    wabaId?: string | null;
    phoneNumberId?: string | null;
  },
): Promise<EmbeddedAssetResult> {
  let wabaId = fallback.wabaId || null;
  let phoneNumberId = fallback.phoneNumberId || null;
  let phoneNumber: string | null = null;

  if (!wabaId || !phoneNumberId) {
    const wabas = await listWabasFromMe(accessToken);
    const selectedWaba = wabas[0] || null;
    if (selectedWaba) {
      wabaId = wabaId || selectedWaba.id;
      if (!phoneNumberId && selectedWaba.phone_numbers?.[0]?.id) {
        phoneNumberId = selectedWaba.phone_numbers[0].id;
      }
      if (!phoneNumber && selectedWaba.phone_numbers?.[0]?.display_phone_number) {
        phoneNumber = normalizePhone(selectedWaba.phone_numbers[0].display_phone_number);
      }
    }
  }

  if (wabaId && !phoneNumberId) {
    const phone = await getPhoneFromWaba(accessToken, wabaId);
    if (phone?.id) {
      phoneNumberId = phone.id;
      phoneNumber = phoneNumber || normalizePhone(phone.display_phone_number);
    }
  }

  if (phoneNumberId && !phoneNumber) {
    const phone = await getPhoneById(accessToken, phoneNumberId);
    phoneNumber = normalizePhone(phone?.display_phone_number);
  }

  if (!wabaId || !phoneNumberId || !phoneNumber) {
    throw new Error(
      'No se pudieron resolver automáticamente los activos de WhatsApp (WABA/phone).',
    );
  }

  return {
    businessId: fallback.businessId || null,
    wabaId,
    phoneNumberId,
    phoneNumber,
  };
}
