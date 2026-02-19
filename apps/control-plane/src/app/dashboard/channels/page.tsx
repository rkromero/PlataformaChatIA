import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EmptyState } from '@/components/empty-state';
import { DeleteChannelButton } from './delete-button';

export default async function ChannelsPage() {
  const session = await requireSession();

  const channels = await prisma.tenantChannel.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Channels</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Canales de comunicación conectados
          </p>
        </div>
        <Link href="/dashboard/channels/new" className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo channel
        </Link>
      </div>

      {channels.length === 0 ? (
        <EmptyState
          title="Sin channels"
          description="Conectá tu primer canal de WhatsApp"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          }
          action={
            <Link href="/dashboard/channels/new" className="btn-primary">
              Crear channel
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((ch) => (
            <div key={ch.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                    <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{ch.type}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Inbox #{ch.chatwootInboxId}
                    </p>
                  </div>
                </div>
                <DeleteChannelButton channelId={ch.id} />
              </div>
              <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                {new Date(ch.createdAt).toLocaleDateString('es-AR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
