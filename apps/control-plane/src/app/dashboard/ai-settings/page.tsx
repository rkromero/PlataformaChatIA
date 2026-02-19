import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AiSettingsForm } from './ai-settings-form';
import { saveAiSettingsAction } from './actions';
import { EmptyState } from '@/components/empty-state';

export default async function AiSettingsPage() {
  const session = await requireSession();

  const settings = await prisma.aiSettings.findUnique({
    where: { tenantId: session.tenantId },
  });

  if (!settings) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">AI Settings</h1>
        <EmptyState
          title="Sin configuración IA"
          description="No se encontró configuración de IA para tu tenant"
        />
      </div>
    );
  }

  const handoffRules = settings.handoffRulesJson as { keywords: string[]; handoffTag: string };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">AI Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configurá el comportamiento de la IA para tu tenant
        </p>
      </div>

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
    </div>
  );
}
