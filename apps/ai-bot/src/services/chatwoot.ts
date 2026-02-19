import { env } from '../lib/env.js';
import { withRetry } from '../lib/retry.js';
import { tenantLogger } from '../lib/logger.js';

export async function sendMessage(
  accountId: number,
  conversationId: number,
  content: string,
) {
  const log = tenantLogger(`cw-${accountId}`);
  const url = `${env.CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;

  await withRetry(
    async () => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          api_access_token: env.CHATWOOT_API_TOKEN,
        },
        body: JSON.stringify({ content, message_type: 'outgoing', private: false }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Chatwoot sendMessage failed ${res.status}: ${body}`);
      }
    },
    { label: 'chatwoot.sendMessage' },
  );

  log.info({ conversationId }, 'Message sent to Chatwoot');
}

export async function addLabel(
  accountId: number,
  conversationId: number,
  label: string,
) {
  const log = tenantLogger(`cw-${accountId}`);

  const getUrl = `${env.CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}`;
  const getRes = await fetch(getUrl, {
    headers: { api_access_token: env.CHATWOOT_API_TOKEN },
  });

  let currentLabels: string[] = [];
  if (getRes.ok) {
    const data = (await getRes.json()) as { labels?: string[] };
    currentLabels = data.labels ?? [];
  }

  if (currentLabels.includes(label)) return;

  const url = `${env.CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/labels`;

  await withRetry(
    async () => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          api_access_token: env.CHATWOOT_API_TOKEN,
        },
        body: JSON.stringify({ labels: [...currentLabels, label] }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Chatwoot addLabel failed ${res.status}: ${body}`);
      }
    },
    { label: 'chatwoot.addLabel' },
  );

  log.info({ conversationId, label }, 'Label added to conversation');
}
