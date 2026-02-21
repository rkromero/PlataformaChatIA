interface ChatwootAccount {
  id: number;
  name: string;
}

interface ChatwootUser {
  id: number;
  email: string;
}

interface ChatwootInbox {
  id: number;
  name: string;
  webhook_url?: string;
}

function getEnv(name: string): string {
  return process.env[name] ?? '';
}

function getConfig() {
  const url = getEnv('CW_PLATFORM_URL') || getEnv('CHATWOOT_BASE_URL');
  const token = getEnv('CW_PLATFORM_KEY');
  return { url, token };
}

async function platformFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { url, token } = getConfig();
  if (!url || !token) {
    throw new Error('CW_PLATFORM_URL and CW_PLATFORM_KEY are required');
  }

  const res = await fetch(`${url}/platform/api/v1${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      api_access_token: token,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chatwoot Platform API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

async function accountFetch<T>(
  accountId: number,
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { url, token } = getConfig();
  if (!url || !token) {
    throw new Error('CW_PLATFORM_URL and CW_PLATFORM_KEY are required');
  }

  const res = await fetch(`${url}/api/v1/accounts/${accountId}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      api_access_token: token,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chatwoot Account API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function createChatwootAccount(name: string): Promise<ChatwootAccount> {
  return platformFetch<ChatwootAccount>('/accounts', { name });
}

export async function createChatwootUser(
  email: string,
  name: string,
  password: string,
): Promise<ChatwootUser> {
  return platformFetch<ChatwootUser>('/users', {
    name,
    email,
    password,
    custom_attributes: {},
  });
}

export async function linkUserToAccount(
  accountId: number,
  userId: number,
  role: 'administrator' | 'agent' = 'administrator',
): Promise<void> {
  await platformFetch(`/accounts/${accountId}/account_users`, {
    user_id: userId,
    role,
  });
}

export async function createWhatsAppInbox(
  accountId: number,
  name: string,
  phoneNumber: string,
  phoneNumberId: string,
  wabaId: string,
  accessToken: string,
): Promise<ChatwootInbox> {
  return accountFetch<ChatwootInbox>(accountId, '/inboxes', {
    name,
    channel: {
      type: 'whatsapp',
      phone_number: phoneNumber,
      provider: 'whatsapp_cloud',
      provider_config: {
        api_key: accessToken,
        phone_number_id: phoneNumberId,
        business_account_id: wabaId,
      },
    },
  });
}

export function getChatwootUrl(): string {
  return getEnv('CW_PLATFORM_URL') || getEnv('CHATWOOT_BASE_URL');
}
