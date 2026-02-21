import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { getPlanLimits, getCurrentPeriod, PLAN_LIMITS } from '@chat-platform/shared/plans';
import { PlanSelector } from './plan-selector';

export default async function PlanPage() {
  const session = await requireSession();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { plan: true, name: true },
  });

  if (!tenant) return null;

  const period = getCurrentPeriod();
  const usage = await prisma.usageRecord.findUnique({
    where: { tenantId_period: { tenantId: session.tenantId, period } },
  });

  const limits = getPlanLimits(tenant.plan);
  const messagesUsed = usage?.messages ?? 0;
  const usagePercent = Math.min((messagesUsed / limits.messagesPerMonth) * 100, 100);

  const channelCount = await prisma.tenantChannel.count({
    where: { tenantId: session.tenantId },
  });
  const userCount = await prisma.tenantUser.count({
    where: { tenantId: session.tenantId },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Plan y uso</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestioná tu plan y monitoreá el consumo de tu cuenta
        </p>
      </div>

      {/* Usage overview */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <UsageCard
          label="Mensajes este mes"
          current={messagesUsed}
          limit={limits.messagesPerMonth}
          percent={usagePercent}
        />
        <UsageCard
          label="Canales activos"
          current={channelCount}
          limit={limits.maxChannels}
          percent={limits.maxChannels === -1 ? 0 : (channelCount / limits.maxChannels) * 100}
          unlimited={limits.maxChannels === -1}
        />
        <UsageCard
          label="Usuarios"
          current={userCount}
          limit={limits.maxUsers}
          percent={limits.maxUsers === -1 ? 0 : (userCount / limits.maxUsers) * 100}
          unlimited={limits.maxUsers === -1}
        />
      </div>

      {/* Plan selector */}
      <h2 className="mb-4 text-lg font-semibold">Tu plan actual: {limits.name}</h2>
      <PlanSelector currentPlan={tenant.plan} plans={PLAN_LIMITS} />
    </div>
  );
}

function UsageCard({
  label,
  current,
  limit,
  percent,
  unlimited = false,
}: {
  label: string;
  current: number;
  limit: number;
  percent: number;
  unlimited?: boolean;
}) {
  const isWarning = percent >= 80 && percent < 100;
  const isDanger = percent >= 100;
  const barColor = isDanger
    ? 'bg-red-500'
    : isWarning
      ? 'bg-amber-500'
      : 'bg-brand-600';

  return (
    <div className="card">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums">{current.toLocaleString()}</span>
        <span className="text-sm text-gray-400">
          / {unlimited ? '∞' : limit.toLocaleString()}
        </span>
      </div>
      {!unlimited && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
      {isDanger && (
        <p className="mt-2 text-xs font-medium text-red-500">Límite alcanzado</p>
      )}
      {isWarning && (
        <p className="mt-2 text-xs font-medium text-amber-500">Casi al límite</p>
      )}
    </div>
  );
}
