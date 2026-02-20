import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EmptyState } from '@/components/empty-state';
import { DeleteTenantButton } from './delete-button';

export default async function TenantsPage() {
  const session = await requireSession();
  if (session.role !== 'super_admin') redirect('/dashboard');

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { channels: true, conversationLinks: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administrá las empresas de tu plataforma
          </p>
        </div>
        <Link href="/dashboard/tenants/new" className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo tenant
        </Link>
      </div>

      {tenants.length === 0 ? (
        <EmptyState
          title="Sin tenants"
          description="Creá tu primer tenant para empezar"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
            </svg>
          }
          action={
            <Link href="/dashboard/tenants/new" className="btn-primary">
              Crear tenant
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-3.5 font-medium text-gray-500 dark:text-gray-400">Nombre</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 dark:text-gray-400">Estado</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 dark:text-gray-400">Plan</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 dark:text-gray-400">Chatwoot ID</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 dark:text-gray-400">Channels</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 dark:text-gray-400">Convos</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 dark:text-gray-400" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {tenants.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium">{t.name}</td>
                  <td className="px-6 py-4">
                    <span className={t.status === 'active' ? 'badge-green' : 'badge-yellow'}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge-blue">{t.plan}</span>
                  </td>
                  <td className="px-6 py-4 tabular-nums text-gray-500 dark:text-gray-400">
                    {t.chatwootAccountId ?? <span className="text-gray-400 dark:text-gray-600">—</span>}
                  </td>
                  <td className="px-6 py-4 tabular-nums">{t._count.channels}</td>
                  <td className="px-6 py-4 tabular-nums">{t._count.conversationLinks}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/tenants/${t.id}/edit`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </Link>
                      <DeleteTenantButton tenantId={t.id} tenantName={t.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
