const getConfig = () => ({
  url: (process.env['EVOLUTION_API_URL'] || '').replace(/\/$/, ''),
  key: process.env['EVOLUTION_API_KEY'] || '',
});

async function evoFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { url, key } = getConfig();
  if (!url || !key) throw new Error('Evolution API no configurada');

  const res = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Evolution API error ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export function isEvolutionConfigured(): boolean {
  const { url, key } = getConfig();
  return !!(url && key);
}

export async function createInstance(instanceName: string, chatwootConfig?: {
  chatwootAccountId: number;
  chatwootToken: string;
  chatwootUrl: string;
}) {
  const body: Record<string, unknown> = {
    instanceName,
    integration: 'WHATSAPP-BAILEYS',
    qrcode: true,
    rejectCall: false,
    groupsIgnore: true,
  };

  if (chatwootConfig) {
    body.chatwoot_account_id = chatwootConfig.chatwootAccountId;
    body.chatwoot_token = chatwootConfig.chatwootToken;
    body.chatwoot_url = chatwootConfig.chatwootUrl;
    body.chatwoot_sign_msg = true;
    body.chatwoot_reopen_conversation = true;
    body.chatwoot_conversation_pending = false;
  }

  return evoFetch<{
    instance: { instanceName: string; status: string };
    hash: { apikey: string };
    qrcode?: { base64: string };
  }>('/instance/create', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getQrCode(instanceName: string) {
  const data = await evoFetch<Record<string, unknown>>(`/instance/connect/${instanceName}`, {
    method: 'GET',
  });

  const base64 =
    (data.base64 as string) ??
    (data.qrcode as Record<string, unknown>)?.base64 ??
    (data.code as string) ??
    null;

  const pairingCode = (data.pairingCode as string) ?? null;

  return { base64, pairingCode };
}

export async function getInstanceStatus(instanceName: string) {
  try {
    const data = await evoFetch<{
      instance?: { instanceName: string; state: string };
    }>(`/instance/connectionState/${instanceName}`, {
      method: 'GET',
    });
    return data.instance?.state ?? 'unknown';
  } catch {
    return 'disconnected';
  }
}

export async function deleteInstance(instanceName: string) {
  return evoFetch(`/instance/delete/${instanceName}`, {
    method: 'DELETE',
  });
}

export async function setEvolutionChatwoot(
  instanceName: string,
  chatwootAccountId: number,
  chatwootToken: string,
  chatwootUrl: string,
) {
  return evoFetch('/chatwoot/set/' + instanceName, {
    method: 'POST',
    body: JSON.stringify({
      enabled: true,
      account_id: chatwootAccountId,
      token: chatwootToken,
      url: chatwootUrl,
      sign_msg: true,
      reopen_conversation: true,
      conversation_pending: false,
    }),
  });
}
