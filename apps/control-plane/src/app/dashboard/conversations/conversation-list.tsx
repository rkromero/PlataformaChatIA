'use client';

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
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-800">
        <h1 className="text-lg font-semibold tracking-tight">Conversaciones</h1>
        <div className="relative mt-3">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:focus:border-brand-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800/50">
                <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-2.5 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                  </div>
                  <div className="h-3 w-44 animate-pulse rounded bg-gray-100 dark:bg-gray-800/60" />
                  <div className="h-3 w-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800/60" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-gray-400">
            {search ? 'Sin resultados' : 'Aún no hay conversaciones'}
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
                className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors dark:border-gray-800/50 ${
                  isSelected
                    ? 'bg-brand-50 dark:bg-brand-500/10'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                    isHuman
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                      : 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
                  }`}>
                    {initial}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${
                    isHuman ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{displayName}</span>
                    <span className="ml-2 flex-shrink-0 text-[10px] text-gray-400">
                      {getTimeAgo(conv.updatedAt)}
                    </span>
                  </div>
                  {conv.lastMessage && (
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                      {conv.lastMessage}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                      isHuman
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }`}>
                      {isHuman ? 'Agente' : 'Bot'}
                    </span>
                    {conv.source !== 'chatwoot' && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
                        {conv.source === 'whatsapp_qr' ? 'WhatsApp' : 'Manual'}
                      </span>
                    )}
                    {conv.phone && conv.contactName && (
                      <span className="text-[10px] text-gray-400">{conv.phone}</span>
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
