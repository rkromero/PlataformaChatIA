const PLATFORM_URL = process.env.CHATWOOT_PLATFORM_URL ?? process.env.CHATWOOT_BASE_URL ?? '';
const PLATFORM_TOKEN = process.env.CHATWOOT_PLATFORM_TOKEN ?? '';

interface ChatwootAccount {
  id: number;
  name: string;
}

interface ChatwootUser {
  id: number;
  email: string;
}

async function platformFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!PLATFORM_URL || !PLATFORM_TOKEN) {
    throw new Error('CHATWOOT_PLATFORM_URL and CHATWOOT_PLATFORM_TOKEN are required');
  }

  const res = await fetch(`${PLATFORM_URL}/platform/api/v1${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      api_access_token: PLATFORM_TOKEN,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chatwoot Platform API error (${res.status}): ${text}`);
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
