function getAiBotUrl(): string {
  return (process.env['AI_BOT_URL'] || '').replace(/\/$/, '');
}

export function isWahaConfigured(): boolean {
  return !!getAiBotUrl();
}

async function aiBotFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = getAiBotUrl();
  if (!url) throw new Error('AI_BOT_URL no configurada');

  const res = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`AI Bot error ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function ensureSession(
  tenantId: string,
): Promise<{ status: string; qr: string | null }> {
  return aiBotFetch<{ status: string; qr: string | null }>(
    '/api/sessions',
    {
      method: 'POST',
      body: JSON.stringify({ tenantId }),
    },
  );
}

export async function getQrCode(
  tenantId: string,
): Promise<string | null> {
  try {
    const data = await aiBotFetch<{ qr: string | null }>(
      `/api/sessions/${tenantId}/qr`,
    );
    return data.qr;
  } catch {
    return null;
  }
}

export async function getSessionStatus(
  tenantId: string,
): Promise<string> {
  try {
    const data = await aiBotFetch<{ status: string }>(
      `/api/sessions/${tenantId}/status`,
    );
    return data.status ?? 'STOPPED';
  } catch {
    return 'STOPPED';
  }
}

export async function sendText(
  tenantId: string,
  chatId: string,
  text: string,
): Promise<void> {
  await aiBotFetch(`/api/sessions/${tenantId}/send`, {
    method: 'POST',
    body: JSON.stringify({ chatId, text }),
  });
}

export async function deleteSessionAndCleanup(
  tenantId: string,
): Promise<void> {
  try {
    await aiBotFetch(`/api/sessions/${tenantId}`, { method: 'DELETE' });
  } catch {
    // Ignore — session might not exist
  }
}
