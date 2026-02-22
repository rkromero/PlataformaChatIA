import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { KanbanBoard } from './kanban-board';
import { NewLeadButton } from './new-lead-button';

const STAGES = [
  { key: 'new', label: 'Nuevos', color: 'bg-blue-500' },
  { key: 'contacted', label: 'Contactados', color: 'bg-amber-500' },
  { key: 'qualified', label: 'Calificados', color: 'bg-purple-500' },
  { key: 'proposal', label: 'Propuesta', color: 'bg-indigo-500' },
  { key: 'won', label: 'Ganados', color: 'bg-emerald-500' },
  { key: 'lost', label: 'Perdidos', color: 'bg-gray-400' },
] as const;

export default async function CrmPage() {
  const session = await requireSession();

  const leads = await prisma.conversationLink.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      contactName: true,
      phone: true,
      lastMessage: true,
      stage: true,
      notes: true,
      chatwootConversationId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { chatwootAccountId: true },
  });

  const chatwootBaseUrl = process.env[String('CW_PLATFORM_URL')]
    || process.env[String('CHATWOOT_BASE_URL')]
    || '';

  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.stage === 'won').length;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {totalLeads} lead{totalLeads !== 1 ? 's' : ''} — {wonLeads} ganado{wonLeads !== 1 ? 's' : ''}
          </p>
        </div>
        <NewLeadButton />
      </div>

      <KanbanBoard
        leads={leads.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        }))}
        stages={STAGES.map((s) => ({ ...s }))}
        chatwootBaseUrl={chatwootBaseUrl}
        chatwootAccountId={tenant?.chatwootAccountId ?? null}
      />
    </div>
  );
}
