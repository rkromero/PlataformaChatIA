'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteLeadAction } from './actions';
import type { Lead } from './kanban-board';

interface LeadCardProps {
  lead: Lead;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  isAdmin: boolean;
}

export function LeadCard({
  lead,
  isDragging,
  onDragStart,
  onDragEnd,
  isAdmin,
}: LeadCardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const displayName = lead.contactName || lead.phone ||
    (lead.source === 'chatwoot' ? `Conv #${lead.chatwootConversationId}` : 'Contacto');
  const initial = (lead.contactName?.[0] || lead.phone?.[0] || '#').toUpperCase();

  function handleDelete() {
    if (!confirm('¿Eliminar este lead?')) return;
    startTransition(() => {
      deleteLeadAction(lead.id);
    });
  }

  function handleCardClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, select, input, textarea')) return;
    router.push(`/dashboard/crm/${lead.id}`);
  }

  const timeAgo = getTimeAgo(lead.updatedAt);
  const assignedInitials = getInitials(lead.assignedAgentName);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={handleCardClick}
      className={`cursor-pointer rounded-lg border border-white/[0.06] bg-surface-2 p-3 shadow-sm transition-all ${
        isDragging ? 'rotate-2 opacity-50 shadow-lg' : 'hover:border-brand-600 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-5 min-w-5 items-center justify-center rounded-md bg-white/5 px-1 text-[10px] font-semibold uppercase text-gray-400">
            {assignedInitials}
          </div>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-400">
            {initial}
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="rounded-md p-1.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
            title="Eliminar lead"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-2 min-w-0">
        <p className="truncate text-sm font-medium text-gray-100">
          {displayName}
        </p>
        {lead.phone && lead.contactName && (
          <p className="truncate text-xs text-gray-400">{lead.phone}</p>
        )}
      </div>

      {lead.lastMessage && (
        <p className="mt-2 line-clamp-2 text-xs text-gray-400">
          {lead.lastMessage}
        </p>
      )}

      <p className="mt-2 text-[10px] text-gray-400">{timeAgo}</p>

      <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/dashboard/crm/${lead.id}`)}
            className="btn-secondary h-8 flex-1 justify-center text-xs"
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string | null): string {
  if (!name) return '--';
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '--';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-AR');
}
