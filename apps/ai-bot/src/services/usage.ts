import { prisma } from '../lib/db.js';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { getPlanLimits, getCurrentPeriod } from '@chat-platform/shared/plans';

interface UsageCheck {
  allowed: boolean;
  current: number;
  limit: number;
}

const notifiedThisPeriod = new Map<string, Set<number>>();

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
    sendUsageNotification(tenantId, period, 100);
    return { allowed: false, current: record.messages - 1, limit: limits.messagesPerMonth };
  }

  const today = new Date().toISOString().slice(0, 10);
  prisma.dailyUsage.upsert({
    where: { tenantId_date: { tenantId, date: today } },
    create: { tenantId, date: today, messages: 1 },
    update: { messages: { increment: 1 } },
  }).catch(() => {});

  const percent = Math.round((record.messages / limits.messagesPerMonth) * 100);
  if (percent >= 80) {
    sendUsageNotification(tenantId, period, percent >= 100 ? 100 : 80);
  }

  return { allowed: true, current: record.messages, limit: limits.messagesPerMonth };
}

function sendUsageNotification(tenantId: string, period: string, threshold: number) {
  const key = `${tenantId}:${period}`;
  if (!notifiedThisPeriod.has(key)) notifiedThisPeriod.set(key, new Set());
  const sent = notifiedThisPeriod.get(key)!;
  if (sent.has(threshold)) return;
  sent.add(threshold);

  const cpUrl = env.CONTROL_PLANE_URL;
  const secret = env.INTERNAL_SECRET;
  if (!cpUrl || !secret) return;

  fetch(`${cpUrl}/api/notify-usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': secret,
    },
    body: JSON.stringify({ tenantId, percent: threshold }),
  }).catch((err) => logger.error({ err }, 'Failed to send usage notification'));
}
