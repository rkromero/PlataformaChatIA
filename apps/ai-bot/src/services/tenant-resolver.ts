import { prisma } from '../lib/db.js';
import { tenantLogger } from '../lib/logger.js';

interface TenantWithSettings {
  id: string;
  name: string;
  chatwootAccountId: number | null;
  aiSettings: {
    enabled: boolean;
    model: string;
    systemPrompt: string;
    handoffRulesJson: unknown;
  } | null;
}

export async function resolveTenant(
  accountId: number,
  inboxId?: number,
): Promise<TenantWithSettings | null> {
  let tenant = await prisma.tenant.findUnique({
    where: { chatwootAccountId: accountId },
    include: { aiSettings: true },
  });

  if (!tenant && inboxId) {
    const channel = await prisma.tenantChannel.findFirst({
      where: { chatwootInboxId: inboxId },
      include: { tenant: { include: { aiSettings: true } } },
    });
    tenant = channel?.tenant ?? null;
  }

  if (!tenant) return null;

  if (tenant.status !== 'active') {
    tenantLogger(tenant.id).info('Tenant is not active, skipping');
    return null;
  }

  return tenant;
}
