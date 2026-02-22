const getConfig = () => ({
  url: (process.env['WAHA_API_URL'] || '').replace(/\/$/, ''),
  key: process.env['WAHA_API_KEY'] || '',
});

async function wahaFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { url, key } = getConfig();
  if (!url || !key) throw new Error('WAHA no configurada');

  const res = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': key,
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`WAHA error ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export function isWahaConfigured(): boolean {
  const { url, key } = getConfig();
  return !!(url && key);
}

export function getWahaUrl(): string {
  return getConfig().url;
}

interface WahaSession {
  name: string;
  status: string;
  me?: { id: string; pushName: string } | null;
  config?: Record<string, unknown>;
}

export async function createSession(
  sessionName: string,
  webhookUrl: string,
): Promise<WahaSession> {
  return wahaFetch<WahaSession>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      name: sessionName,
      start: true,
      config: {
        webhooks: [
          {
            url: webhookUrl,
            events: ['message', 'session.status'],
          },
        ],
      },
    }),
  });
}

export async function getSession(sessionName: string): Promise<WahaSession> {
  return wahaFetch<WahaSession>(`/api/sessions/${sessionName}`);
}

interface WahaQr {
  value: string;
  mimetype?: string;
}

export async function getQrCode(sessionName: string): Promise<string | null> {
  try {
    const data = await wahaFetch<WahaQr>(`/api/${sessionName}/auth/qr`, {
      method: 'POST',
      body: JSON.stringify({ format: 'image' }),
    });
    return data.value ?? null;
  } catch {
    return null;
  }
}

export async function getSessionStatus(
  sessionName: string,
): Promise<string> {
  try {
    const session = await getSession(sessionName);
    return session.status ?? 'STOPPED';
  } catch {
    return 'STOPPED';
  }
}

export async function stopSession(sessionName: string): Promise<void> {
  await wahaFetch(`/api/sessions/${sessionName}/stop`, { method: 'POST' });
}

export async function deleteSession(sessionName: string): Promise<void> {
  try {
    await wahaFetch(`/api/sessions/${sessionName}`, { method: 'DELETE' });
  } catch {
    // ignore if session doesn't exist
  }
}

export async function sendText(
  sessionName: string,
  chatId: string,
  text: string,
): Promise<void> {
  await wahaFetch('/api/sendText', {
    method: 'POST',
    body: JSON.stringify({
      session: sessionName,
      chatId,
      text,
    }),
  });
}
