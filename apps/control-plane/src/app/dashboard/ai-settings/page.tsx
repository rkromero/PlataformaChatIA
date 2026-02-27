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

  const settings = await prisma.aiSettings.findUnique({
    where: { tenantId: session.tenantId },
  });

  if (!settings) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Mi Bot</h1>
        <EmptyState
          title="Sin configuración IA"
          description="No se encontró configuración de IA para tu tenant"
        />
      </div>
    );
  }

  const handoffRules = settings.handoffRulesJson as { keywords: string[]; handoffTag: string };

  const entries = await prisma.knowledgeEntry.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
    take: 500,
  });
  const enabledCount = entries.filter((e) => e.enabled).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mi Bot</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configurá el comportamiento de tu bot y su base de conocimiento
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900">
        <Link
          href="/dashboard/ai-settings"
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
            activeTab === 'settings'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
          </svg>
          Configuración IA
        </Link>
        <Link
          href="/dashboard/ai-settings?tab=knowledge"
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
            activeTab === 'knowledge'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          Conocimiento
          {entries.length > 0 && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              {enabledCount}
            </span>
          )}
        </Link>
      </div>

      {/* Tab content */}
      {activeTab === 'settings' ? (
        <AiSettingsForm
          action={saveAiSettingsAction}
          settings={{
            enabled: settings.enabled,
            model: settings.model,
            systemPrompt: settings.systemPrompt,
            handoffKeywords: handoffRules.keywords.join(', '),
            handoffTag: handoffRules.handoffTag,
          }}
        />
      ) : (
        <KnowledgeSection entries={entries} />
      )}
    </div>
  );
}
