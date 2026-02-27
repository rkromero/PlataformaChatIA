import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AiSettingsForm } from './ai-settings-form';
import { saveAiSettingsAction } from './actions';
import { EmptyState } from '@/components/empty-state';
import { KnowledgeSection } from './knowledge-section';

export default async function AiSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const activeTab = params.tab === 'knowledge' ? 'knowledge' : 'settings';

  const [settings, entries] = await Promise.all([
    prisma.aiSettings.findUnique({ where: { tenantId: session.tenantId } }),
    prisma.knowledgeEntry.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
      orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    }),
  ]);

  if (!settings) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-100">Mi Bot</h1>
        <EmptyState
          title="Sin configuración IA"
          description="No se encontró configuración de IA para tu tenant"
        />
      </div>
    );
  }

  const handoffRules = settings.handoffRulesJson as { keywords: string[]; handoffTag: string };
  const enabledCount = entries.filter((e) => e.enabled).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
              <svg className="h-5 w-5 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-100">Mi Bot</h1>
              <p className="mt-0.5 text-sm text-gray-400">
                Configurá el comportamiento de tu bot y su base de conocimiento
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${settings.enabled ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20' : 'bg-white/5 text-gray-400 ring-1 ring-inset ring-white/10'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${settings.enabled ? 'bg-emerald-500' : 'bg-gray-500'}`} />
            {settings.enabled ? 'Activo' : 'Pausado'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-white/[0.06]">
        <nav className="-mb-px flex gap-6">
          <Link
            href="/dashboard/ai-settings"
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors duration-150 ${
              activeTab === 'settings'
                ? 'border-brand-400 text-brand-400'
                : 'border-transparent text-gray-500 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            Configuración
          </Link>
          <Link
            href="/dashboard/ai-settings?tab=knowledge"
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors duration-150 ${
              activeTab === 'knowledge'
                ? 'border-brand-400 text-brand-400'
                : 'border-transparent text-gray-500 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            Conocimiento
            {entries.length > 0 && (
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-brand-400">
                {enabledCount}/{entries.length}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {activeTab === 'settings' ? (
        <AiSettingsForm
          action={saveAiSettingsAction}
          settings={{
            enabled: settings.enabled,
            model: settings.model,
            systemPrompt: settings.systemPrompt,
            handoffKeywords: handoffRules.keywords.join(', '),
            handoffTag: handoffRules.handoffTag,
            removeOpeningSigns: settings.removeOpeningSigns,
            splitLongMessages: settings.splitLongMessages,
            messageWindowSeconds: settings.messageWindowSeconds,
          }}
        />
      ) : (
        <KnowledgeSection entries={entries} />
      )}
    </div>
  );
}
