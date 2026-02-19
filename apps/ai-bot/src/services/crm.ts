import { env } from '../lib/env.js';
import { withRetry } from '../lib/retry.js';
import { tenantLogger } from '../lib/logger.js';
import type { CrmLeadPayload } from '@chat-platform/shared/types';

export async function syncLeadToCrm(payload: CrmLeadPayload): Promise<string | null> {
  const log = tenantLogger(payload.tenant_id);

  if (!env.CRM_BASE_URL || !env.CRM_API_KEY) {
    log.info('CRM not configured, skipping sync');
    return null;
  }

  try {
    const leadId = await withRetry(
      async () => {
        const res = await fetch(`${env.CRM_BASE_URL}/api/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.CRM_API_KEY}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(`CRM sync failed ${res.status}: ${body}`);
        }

        const data = (await res.json()) as { id: string };
        return data.id;
      },
      { label: 'crm.syncLead' },
    );

    log.info({ leadId, phone: payload.phone ? '***' : null }, 'Lead synced to CRM');
    return leadId;
  } catch (err) {
    log.error({ err }, 'Failed to sync lead to CRM after retries');
    return null;
  }
}
