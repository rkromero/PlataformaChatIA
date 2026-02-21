import { prisma } from '../lib/db.js';
import { getPlanLimits, getCurrentPeriod } from '@chat-platform/shared/plans';

interface UsageCheck {
  allowed: boolean;
  current: number;
  limit: number;
}

export async function checkAndIncrementUsage(
  tenantId: string,
  plan: string,
): Promise<UsageCheck> {
  const limits = getPlanLimits(plan);
  const period = getCurrentPeriod();

  const record = await prisma.usageRecord.upsert({
    where: { tenantId_period: { tenantId, period } },
    create: { tenantId, period, messages: 1 },
    update: { messages: { increment: 1 } },
  });

  if (record.messages > limits.messagesPerMonth) {
    await prisma.usageRecord.update({
      where: { tenantId_period: { tenantId, period } },
      data: { messages: { decrement: 1 } },
    });
    return { allowed: false, current: record.messages - 1, limit: limits.messagesPerMonth };
  }

  return { allowed: true, current: record.messages, limit: limits.messagesPerMonth };
}
