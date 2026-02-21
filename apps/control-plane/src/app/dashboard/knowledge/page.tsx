import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EmptyState } from '@/components/empty-state';
import { KnowledgeActions } from './knowledge-actions';

const CATEGORY_LABELS: Record<string, string> = {
  faq: 'Preguntas frecuentes',
  products: 'Productos / Servicios',
  pricing: 'Precios',
  hours: 'Horarios',
  policies: 'Políticas',
  general: 'General',
};

export default async function KnowledgePage() {
  const session = await requireSession();

  const entries = await prisma.knowledgeEntry.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
  });

  const enabledCount = entries.filter((e) => e.enabled).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Base de conocimiento</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Información que tu bot usa para responder — {enabledCount} entradas activas
          </p>
        </div>
        <Link href="/dashboard/knowledge/new" className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar
        </Link>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="Sin información cargada"
          description="Agregá preguntas frecuentes, precios, horarios y más para que tu bot pueda responder con datos reales de tu negocio."
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
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`card transition-opacity ${!entry.enabled ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                      {CATEGORY_LABELS[entry.category] ?? entry.category}
                    </span>
                    {!entry.enabled && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800">
                        Desactivada
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1.5 font-medium">{entry.title}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {entry.content}
                  </p>
                </div>
                <KnowledgeActions entryId={entry.id} enabled={entry.enabled} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
