import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { KnowledgeActions } from '../knowledge/knowledge-actions';
import { KnowledgeUploadForm } from '../knowledge/upload-form';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  faq: {
    label: 'FAQ',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    icon: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z',
  },
  products: {
    label: 'Productos',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z',
  },
  pricing: {
    label: 'Precios',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    icon: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  hours: {
    label: 'Horarios',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  policies: {
    label: 'Políticas',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    icon: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z',
  },
  general: {
    label: 'General',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
  },
};

interface Entry {
  id: string;
  category: string;
  title: string;
  content: string;
  enabled: boolean;
}

export function KnowledgeSection({ entries }: { entries: Entry[] }) {
  const enabledCount = entries.filter((e) => e.enabled).length;
  const totalChars = entries.reduce((sum, e) => sum + e.content.length, 0);

  return (
    <div>
      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Entradas</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-brand-600 dark:text-brand-400">{entries.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Activas</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{enabledCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Caracteres</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{totalChars.toLocaleString()}</p>
        </div>
      </div>

      {/* Import */}
      <KnowledgeUploadForm />

      {/* Add manual button */}
      <div className="mb-4 flex justify-end">
        <Link href="/dashboard/knowledge/new" className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar manual
        </Link>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <EmptyState
          title="Sin información cargada"
          description="Escaneá tu sitio web, subí un archivo o agregá entradas manualmente para que tu bot responda con datos reales."
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          }
          action={
            <Link href="/dashboard/knowledge/new" className="btn-primary">
              Agregar primera entrada
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const cfg = CATEGORY_CONFIG[entry.category] ?? CATEGORY_CONFIG.general;
            return (
              <div
                key={entry.id}
                className={`group rounded-xl border border-gray-200 bg-white px-5 py-4 transition-all duration-150 hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 ${
                  !entry.enabled ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                        </svg>
                        {cfg.label}
                      </span>
                      {!entry.enabled && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800">
                          Pausada
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-gray-400">
                        {entry.content.length.toLocaleString()} chars
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">{entry.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{entry.content}</p>
                  </div>
                  <div className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <KnowledgeActions entryId={entry.id} enabled={entry.enabled} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
