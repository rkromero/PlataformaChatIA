import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { getPlanLimits, getCurrentPeriod } from '@chat-platform/shared/plans';

export default async function DashboardPage() {
  const session = await requireSession();
  const isSuperAdmin = session.role === 'super_admin';

  if (!isSuperAdmin) {
    const tenantCheck = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { onboardingCompleted: true },
    });
    if (tenantCheck && !tenantCheck.onboardingCompleted) {
      redirect('/dashboard/onboarding');
    }
  }

  if (isSuperAdmin) {
    const [tenantCount, userCount, channelCount, conversationCount] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenantUser.count(),
      prisma.tenantChannel.count(),
      prisma.conversationLink.count(),
    ]);

    const stats = [
      { label: 'Tenants', value: tenantCount, color: 'text-brand-600 dark:text-brand-400' },
      { label: 'Usuarios', value: userCount, color: 'text-purple-600 dark:text-purple-400' },
      { label: 'Channels', value: channelCount, color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Conversaciones', value: conversationCount, color: 'text-amber-600 dark:text-amber-400' },
    ];

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Panel de Administración</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vista global de toda la plataforma
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className={`mt-2 text-3xl font-semibold tabular-nums ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
  });

  const period = getCurrentPeriod();
  const [channelCount, conversationCount, usage] = await Promise.all([
    prisma.tenantChannel.count({ where: { tenantId: session.tenantId } }),
    prisma.conversationLink.count({ where: { tenantId: session.tenantId } }),
    prisma.usageRecord.findUnique({
      where: { tenantId_period: { tenantId: session.tenantId, period } },
    }),
  ]);

  const limits = getPlanLimits(tenant?.plan ?? 'starter');
  const messagesUsed = usage?.messages ?? 0;
  const usagePercent = Math.min((messagesUsed / limits.messagesPerMonth) * 100, 100);
  const barColor = usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-brand-600';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenido, {tenant?.name ?? 'tu negocio'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Resumen de tu cuenta — Plan {limits.name}
        </p>
      </div>

      {/* Usage bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mensajes este mes</p>
          <Link href="/dashboard/plan" className="text-xs font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
            Ver plan →
          </Link>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums">{messagesUsed.toLocaleString()}</span>
          <span className="text-sm text-gray-400">/ {limits.messagesPerMonth.toLocaleString()}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${usagePercent}%` }} />
        </div>
        {usagePercent >= 100 && (
          <p className="mt-2 text-xs font-medium text-red-500">
            Límite alcanzado — <Link href="/dashboard/plan" className="underline">Upgrade tu plan</Link>
          </p>
        )}
        {usagePercent >= 80 && usagePercent < 100 && (
          <p className="mt-2 text-xs font-medium text-amber-500">Casi al límite del plan</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Canales</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {channelCount}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversaciones</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {conversationCount}
          </p>
        </div>
      </div>
    </div>
  );
}
