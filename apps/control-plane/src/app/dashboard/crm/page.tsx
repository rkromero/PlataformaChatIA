import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { agentLeadFilter, isAdmin } from '@/lib/agent-filter';
import { routeUnassignedLeads } from '@/lib/routing-engine';
import { KanbanBoard } from './kanban-board';
import { NewLeadButton } from './new-lead-button';
import { FunnelMetrics } from './funnel-metrics';

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

  if (isAdmin(session)) {
    routeUnassignedLeads(session.tenantId).catch(() => {});
  }

  const filter = agentLeadFilter(session);

  const leads = await prisma.conversationLink.findMany({
    where: { tenantId: session.tenantId, ...filter },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      contactName: true,
      phone: true,
      lastMessage: true,
      stage: true,
      notes: true,
      chatwootConversationId: true,
      source: true,
      assignedAgentId: true,
      createdAt: true,
      updatedAt: true,
      assignedAgent: { select: { id: true, name: true, email: true } },
    },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { chatwootAccountId: true },
  });

  const agents = isAdmin(session)
    ? await prisma.tenantUser.findMany({
        where: { tenantId: session.tenantId, deletedAt: null },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { email: 'asc' },
      })
    : [];

  const chatwootBaseUrl = process.env[String('CW_PLATFORM_URL')]
    || process.env[String('CHATWOOT_BASE_URL')]
    || '';

  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.stage === 'won').length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

  const wonLeadsList = leads.filter((l) => l.stage === 'won');
  const avgCycleTime = wonLeadsList.length > 0
    ? wonLeadsList.reduce((sum, l) => {
        const days = (new Date(l.updatedAt).getTime() - new Date(l.createdAt).getTime()) / 86_400_000;
        return sum + days;
      }, 0) / wonLeadsList.length
    : null;

  const now = Date.now();
  const stageMetrics = STAGES.map((stage) => {
    const stageLeads = leads.filter((l) => l.stage === stage.key);
    const avgDays = stageLeads.length > 0
      ? stageLeads.reduce((sum, l) => {
          const days = (now - new Date(l.updatedAt).getTime()) / 86_400_000;
          return sum + Math.max(days, 0);
        }, 0) / stageLeads.length
      : null;

    return {
      key: stage.key,
      label: stage.label,
      color: stage.color,
      count: stageLeads.length,
      avgDaysInStage: avgDays,
    };
  });

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {totalLeads} lead{totalLeads !== 1 ? 's' : ''} — {wonLeads} ganado{wonLeads !== 1 ? 's' : ''}
            {!isAdmin(session) && ' (asignados a vos)'}
          </p>
        </div>
        {isAdmin(session) && <NewLeadButton />}
      </div>

      <FunnelMetrics
        stages={stageMetrics}
        totalLeads={totalLeads}
        conversionRate={conversionRate}
        avgCycleTime={avgCycleTime}
      />

      <KanbanBoard
        leads={leads.map((l) => ({
          id: l.id,
          contactName: l.contactName,
          phone: l.phone,
          lastMessage: l.lastMessage,
          stage: l.stage,
          notes: l.notes,
          chatwootConversationId: l.chatwootConversationId,
          source: l.source,
          assignedAgentId: l.assignedAgentId,
          assignedAgentName: l.assignedAgent?.name || l.assignedAgent?.email || null,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        }))}
        stages={STAGES.map((s) => ({ ...s }))}
        chatwootBaseUrl={chatwootBaseUrl}
        chatwootAccountId={tenant?.chatwootAccountId ?? null}
        agents={agents}
        isAdmin={isAdmin(session)}
      />
    </div>
  );
}
