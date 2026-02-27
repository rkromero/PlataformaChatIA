'use client';

import Link from 'next/link';
import { toggleKnowledgeEntryAction, deleteKnowledgeEntryAction } from './actions';

export function KnowledgeActions({ entryId, enabled }: { entryId: string; enabled: boolean }) {
  return (
    <div className="flex flex-shrink-0 items-center gap-0.5">
      <Link
        href={`/dashboard/knowledge/${entryId}/edit`}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 hover:bg-white/5 hover:text-brand-400"
        aria-label="Editar entrada"
        title="Editar"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      </Link>
      <button
        onClick={() => toggleKnowledgeEntryAction(entryId)}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150 ${
          enabled
            ? 'text-gray-400 hover:bg-amber-500/10 hover:text-amber-400'
            : 'text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400'
        }`}
        aria-label={enabled ? 'Pausar entrada' : 'Activar entrada'}
        title={enabled ? 'Pausar' : 'Activar'}
      >
        {enabled ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
          </svg>
        )}
      </button>
      <button
        onClick={() => {
          if (confirm('¿Eliminar esta entrada de la base de conocimiento?')) {
            deleteKnowledgeEntryAction(entryId);
          }
        }}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400"
        aria-label="Eliminar entrada"
        title="Eliminar"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </button>
    </div>
  );
}
