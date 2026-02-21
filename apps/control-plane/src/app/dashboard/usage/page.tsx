import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { getPlanLimits, getCurrentPeriod } from '@chat-platform/shared/plans';

export default async function UsagePage() {
  const session = await requireSession();

  if (session.role !== 'super_admin') {
    redirect('/dashboard');
  }

  const period = getCurrentPeriod();

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      plan: true,
      status: true,
      usageRecords: {
        where: { period },
        select: { messages: true },
      },
      _count: {
        select: { channels: true, users: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = tenants.map((t) => {
    const limits = getPlanLimits(t.plan);
    const messages = t.usageRecords[0]?.messages ?? 0;
    const percent = Math.min((messages / limits.messagesPerMonth) * 100, 100);
    return { ...t, limits, messages, percent };
  });

  const totalMessages = rows.reduce((sum, r) => sum + r.messages, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Uso de la plataforma</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Período: {period} — Total mensajes: {totalMessages.toLocaleString()}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left dark:border-gray-800">
              <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400">Tenant</th>
              <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400">Plan</th>
              <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400">Estado</th>
              <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400">Mensajes</th>
              <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400 min-w-[200px]">Uso</th>
              <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400">Canales</th>
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Usuarios</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => {
              const barColor =
                row.percent >= 100
                  ? 'bg-red-500'
                  : row.percent >= 80
                    ? 'bg-amber-500'
                    : 'bg-brand-600';

              return (
                <tr key={row.id}>
                  <td className="py-3 pr-4 font-medium">{row.name}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium dark:bg-gray-800">
                      {row.limits.name}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    {row.messages.toLocaleString()} / {row.limits.messagesPerMonth.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${Math.min(row.percent, 100)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs tabular-nums text-gray-500">
                        {Math.round(row.percent)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{row._count.channels}</td>
                  <td className="py-3 tabular-nums">{row._count.users}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="py-8 text-center text-gray-400">No hay tenants registrados</p>
        )}
      </div>
    </div>
  );
}
