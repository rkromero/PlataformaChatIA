import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlanLimits, getCurrentPeriod } from '@chat-platform/shared/plans';
import { AnalyticsChart } from './chart';

export default async function AnalyticsPage() {
  const session = await requireSession();

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10);

  const dailyData = await prisma.dailyUsage.findMany({
    where: {
      tenantId: session.tenantId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
    select: { date: true, messages: true },
  });

  const days: { date: string; messages: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const found = dailyData.find((r) => r.date === dateStr);
    days.push({ date: dateStr, messages: found?.messages ?? 0 });
  }

  const totalMessages = days.reduce((sum, d) => sum + d.messages, 0);
  const avgPerDay = Math.round(totalMessages / 30);
  const peakDay = days.reduce((max, d) => (d.messages > max.messages ? d : max), days[0]);

  const period = getCurrentPeriod();
  const monthlyUsage = await prisma.usageRecord.findUnique({
    where: { tenantId_period: { tenantId: session.tenantId, period } },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { plan: true },
  });
  const limits = getPlanLimits(tenant?.plan ?? 'starter');
  const monthMessages = monthlyUsage?.messages ?? 0;

  const conversationCount = await prisma.conversationLink.count({
    where: { tenantId: session.tenantId },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Rendimiento de tu bot en los últimos 30 días
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="card">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mensajes (30 días)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{totalMessages.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Promedio por día</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{avgPerDay}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Día pico</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{peakDay.messages}</p>
          <p className="text-xs text-gray-400">{peakDay.date}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total conversaciones</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{conversationCount}</p>
        </div>
      </div>

      {/* Monthly progress */}
      <div className="card mb-8">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Uso mensual ({period})</p>
          <span className="text-sm tabular-nums text-gray-500">
            {monthMessages.toLocaleString()} / {limits.messagesPerMonth.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full rounded-full transition-all ${
              monthMessages >= limits.messagesPerMonth
                ? 'bg-red-500'
                : monthMessages >= limits.messagesPerMonth * 0.8
                  ? 'bg-amber-500'
                  : 'bg-brand-600'
            }`}
            style={{ width: `${Math.min((monthMessages / limits.messagesPerMonth) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Mensajes por día</h2>
        <AnalyticsChart data={days} />
      </div>
    </div>
  );
}
