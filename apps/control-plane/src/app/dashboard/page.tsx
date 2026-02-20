import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

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

  const [channelCount, conversationCount] = await Promise.all([
    prisma.tenantChannel.count({ where: { tenantId: session.tenantId } }),
    prisma.conversationLink.count({ where: { tenantId: session.tenantId } }),
  ]);

  const stats = [
    { label: 'Canales', value: channelCount, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Conversaciones', value: conversationCount, color: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenido, {tenant?.name ?? 'tu negocio'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Resumen de tu cuenta
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
