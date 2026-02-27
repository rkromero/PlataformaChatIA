import { EmptyState } from '@/components/empty-state';
import Link from 'next/link';
import type { ConversationItem } from './chat-view';

interface Props {
  conversations: ConversationItem[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  loading,
  search,
  onSearchChange,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] p-4">
        <h1 className="text-lg font-semibold tracking-tight text-gray-100">Conversaciones</h1>
        <div className="relative mt-3">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-gray-100 placeholder-gray-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-white/[0.04] px-4 py-3">
                <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-white/5" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-28 animate-pulse rounded bg-white/5" />
                    <div className="h-2.5 w-8 animate-pulse rounded bg-white/5" />
                  </div>
                  <div className="h-3 w-44 animate-pulse rounded bg-white/[0.03]" />
                  <div className="h-3 w-12 animate-pulse rounded bg-white/[0.03]" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              }
              title={search ? 'Sin resultados' : 'Aún no hay conversaciones'}
              description={search ? 'Probá con otro término de búsqueda.' : 'Tus chats de WhatsApp aparecerán acá. ¡Probá tu bot en el Sandbox para empezar!'}
              action={
                !search && (
                  <Link href="/dashboard/sandbox" className="btn-primary py-2 text-xs">
                    Ir al Sandbox
                  </Link>
                )
              }
            />
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = conv.id === selectedId;
            const displayName = conv.contactName || conv.phone || (conv.source !== 'chatwoot' ? 'WhatsApp' : `#${conv.chatwootConversationId}`);
            const initial = (conv.contactName?.[0] || conv.phone?.[0] || '#').toUpperCase();
            const isHuman = conv.status === 'human';

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`flex w-full items-start gap-3 border-b border-white/[0.04] px-4 py-3 text-left transition-colors ${isSelected
                    ? 'bg-brand-500/10'
                    : 'hover:bg-white/[0.03]'
                  }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${isHuman
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-brand-500/15 text-brand-400'
                    }`}>
                    {initial}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-0 ${isHuman ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-gray-100">{displayName}</span>
                    <span className="ml-2 flex-shrink-0 text-[10px] text-gray-500">
                      {getTimeAgo(conv.updatedAt)}
                    </span>
                  </div>
                  {conv.lastMessage && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {conv.lastMessage}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${isHuman
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                      {isHuman ? 'Agente' : 'Bot'}
                    </span>
                    {conv.source !== 'chatwoot' && (
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-green-400">
                        {conv.source === 'whatsapp_qr' ? 'WhatsApp' : 'Manual'}
                      </span>
                    )}
                    {conv.phone && conv.contactName && (
                      <span className="text-[10px] text-gray-500">{conv.phone}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}
