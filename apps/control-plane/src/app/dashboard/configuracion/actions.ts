'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth';
import { isAdmin } from '@/lib/agent-filter';
import { prisma } from '@/lib/db';

export async function setLeadScoringEnabledAction(enabled: boolean) {
  const session = await requireSession();
  if (!isAdmin(session)) {
    return { error: 'No autorizado' };
  }

  await prisma.aiSettings.upsert({
    where: { tenantId: session.tenantId },
    update: { leadScoringEnabled: enabled },
    create: {
      tenantId: session.tenantId,
      enabled: true,
      model: 'gpt-4.1-mini',
      systemPrompt: 'Eres un asistente de atención al cliente. Responde de forma breve y útil en español.',
      handoffRulesJson: {
        keywords: ['humano', 'asesor', 'agente', 'persona'],
        handoffTag: 'human_handoff',
      },
      leadScoringEnabled: enabled,
    },
  });

  revalidatePath('/dashboard/configuracion');
  revalidatePath('/dashboard/crm');
  return { success: true };
}
