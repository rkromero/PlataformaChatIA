import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { getPlanLimits, getCurrentPeriod, isTrialExpired, getTrialDaysLeft } from '@chat-platform/shared/plans';

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
      { label: 'Tenants', value: tenantCount, color: 'text-brand-400' },
      { label: 'Usuarios', value: userCount, color: 'text-purple-400' },
      { label: 'Channels', value: channelCount, color: 'text-emerald-400' },
      { label: 'Conversaciones', value: conversationCount, color: 'text-amber-400' },
    ];

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-100">Panel de Administración</h1>
          <p className="mt-1 text-sm text-gray-400">
            Vista global de toda la plataforma
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card">
              <p className="text-sm font-medium text-gray-400">{stat.label}</p>
              <p className={`mt-2 text-3xl font-semibold tabular-nums ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const period = getCurrentPeriod();
  const [tenant, channelCount, conversationCount, usage] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.tenantChannel.count({ where: { tenantId: session.tenantId } }),
    prisma.conversationLink.count({ where: { tenantId: session.tenantId } }),
    prisma.usageRecord.findUnique({
      where: { tenantId_period: { tenantId: session.tenantId, period } },
    }),
  ]);

  const limits = getPlanLimits(tenant?.plan ?? 'trial');
  const messagesUsed = usage?.messages ?? 0;
  const usagePercent = Math.min((messagesUsed / limits.messagesPerMonth) * 100, 100);
  const barColor = usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-brand-500';

  const isTrial = tenant?.plan === 'trial';
  const trialExpired = isTrial && isTrialExpired(tenant?.trialEndsAt);
  const daysLeft = isTrial ? getTrialDaysLeft(tenant?.trialEndsAt) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-100">
          Bienvenido, {tenant?.name ?? 'tu negocio'}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Resumen de tu cuenta — Plan {limits.name}
        </p>
      </div>

      {isTrial && !trialExpired && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-brand-500/20 bg-brand-500/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/20">
              <svg className="h-5 w-5 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-100">
                Período de prueba — {daysLeft} día{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-brand-300">
                Tenés {limits.messagesPerMonth} mensajes para probar. Elegí un plan para desbloquear todo.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/configuracion"
            className="flex-shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-500"
          >
            Elegir plan
          </Link>
        </div>
      )}

      {isTrial && trialExpired && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-100">
                Tu período de prueba terminó
              </p>
              <p className="text-xs text-red-300">
                Tu bot dejó de responder. Elegí un plan para reactivar todo al instante.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/configuracion"
            className="flex-shrink-0 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500"
          >
            Elegir plan ahora
          </Link>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-400">Mensajes este mes</p>
          <Link href="/dashboard/configuracion" className="text-xs font-medium text-brand-400 hover:text-brand-300">
            Ver plan →
          </Link>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums text-gray-100">{messagesUsed.toLocaleString()}</span>
          <span className="text-sm text-gray-500">/ {limits.messagesPerMonth.toLocaleString()}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${usagePercent}%` }} />
        </div>
        {usagePercent >= 100 && (
          <p className="mt-2 text-xs font-medium text-red-400">
            Límite alcanzado — <Link href="/dashboard/configuracion" className="underline">Upgrade tu plan</Link>
          </p>
        )}
        {usagePercent >= 80 && usagePercent < 100 && (
          <p className="mt-2 text-xs font-medium text-amber-400">Casi al límite del plan</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm font-medium text-gray-400">Canales</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-400">
            {channelCount}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-400">Conversaciones</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-400">
            {conversationCount}
          </p>
        </div>
      </div>
    </div>
  );
}
