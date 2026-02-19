import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await requireSession();

  const [tenantCount, channelCount, conversationCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenantChannel.count({ where: { tenantId: session.tenantId } }),
    prisma.conversationLink.count({ where: { tenantId: session.tenantId } }),
  ]);

  const stats = [
    { label: 'Tenants', value: tenantCount, color: 'text-brand-600 dark:text-brand-400' },
    { label: 'Channels', value: channelCount, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Conversations', value: conversationCount, color: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Vista general de tu plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
