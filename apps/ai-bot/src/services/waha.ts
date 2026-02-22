import { env } from '../lib/env.js';
import { withRetry } from '../lib/retry.js';
import { tenantLogger } from '../lib/logger.js';

function getConfig() {
  return {
    url: (env.WAHA_API_URL || '').replace(/\/$/, ''),
    key: env.WAHA_API_KEY || '',
  };
}

export function isWahaConfigured(): boolean {
  const { url, key } = getConfig();
  return !!(url && key);
}

export async function wahaSendText(
  sessionName: string,
  chatId: string,
  text: string,
) {
  const { url, key } = getConfig();
  const log = tenantLogger(`waha-${sessionName}`);

  await withRetry(
    async () => {
      const res = await fetch(`${url}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': key,
        },
        body: JSON.stringify({ session: sessionName, chatId, text }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`WAHA sendText failed ${res.status}: ${body}`);
      }
    },
    { label: 'waha.sendText' },
  );

  log.info({ chatId: chatId.slice(0, 10) + '...' }, 'Message sent via WAHA');
}

export async function wahaGetMessages(
  sessionName: string,
  chatId: string,
  limit = 10,
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const { url, key } = getConfig();

  try {
    const res = await fetch(
      `${url}/api/messages?chatId=${encodeURIComponent(chatId)}&limit=${limit}&session=${sessionName}`,
      {
        headers: { 'X-Api-Key': key },
      },
    );

    if (!res.ok) return [];

    const messages = (await res.json()) as Array<{
      fromMe: boolean;
      body: string;
    }>;

    return messages
      .filter((m) => m.body)
      .slice(-limit)
      .map((m) => ({
        role: (m.fromMe ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.body,
      }));
  } catch {
    return [];
  }
}
