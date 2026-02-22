import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SandboxChat } from './chat';

export default async function SandboxPage() {
  const session = await requireSession();

  const settings = await prisma.aiSettings.findUnique({
    where: { tenantId: session.tenantId },
    select: { model: true, systemPrompt: true },
  });

  const knowledgeCount = await prisma.knowledgeEntry.count({
    where: { tenantId: session.tenantId, enabled: true },
  });

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sandbox</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Probá tu bot sin usar WhatsApp. Usa tu configuración real de IA y base de conocimiento.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 dark:bg-gray-800">
            {settings?.model ?? 'sin modelo'}
          </span>
          {knowledgeCount > 0 && (
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              {knowledgeCount} doc{knowledgeCount !== 1 ? 's' : ''} RAG
            </span>
          )}
        </div>
      </div>

      {!settings ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Necesitás configurar tu bot primero.
            </p>
            <a href="/dashboard/ai-settings" className="mt-2 inline-block text-sm font-medium text-brand-600">
              Ir a configuración
            </a>
          </div>
        </div>
      ) : (
        <SandboxChat systemPromptPreview={settings.systemPrompt.slice(0, 120)} />
      )}
    </div>
  );
}
