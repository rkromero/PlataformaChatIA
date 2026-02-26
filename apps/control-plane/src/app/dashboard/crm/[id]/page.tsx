import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { agentLeadFilter, isAdmin } from '@/lib/agent-filter';
import { notFound } from 'next/navigation';
import { LeadProfile } from './lead-profile';

const STAGE_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  won: 'Ganado',
  lost: 'Perdido',
};

export default async function LeadProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const filter = agentLeadFilter(session);

  const lead = await prisma.conversationLink.findFirst({
    where: { id, tenantId: session.tenantId, ...filter },
    include: {
      assignedAgent: { select: { id: true, name: true, email: true } },
      tasks: { orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }] },
    },
  });

  if (!lead) notFound();

  const messages = await prisma.message.findMany({
    where: { conversationLinkId: id },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });

  const agents = isAdmin(session)
    ? await prisma.tenantUser.findMany({
        where: { tenantId: session.tenantId, deletedAt: null },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      })
    : [];

  return (
    <LeadProfile
      lead={{
        id: lead.id,
        contactName: lead.contactName,
        phone: lead.phone,
        stage: lead.stage,
        notes: lead.notes,
        tags: lead.tags,
        source: lead.source,
        handoffActive: lead.handoffActive,
        assignedAgentId: lead.assignedAgentId,
        assignedAgentName: lead.assignedAgent?.name || lead.assignedAgent?.email || null,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        chatwootConversationId: lead.chatwootConversationId,
      }}
      tasks={lead.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate?.toISOString() ?? null,
        completed: t.completed,
        completedAt: t.completedAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      }))}
      messages={messages.reverse().map((m) => ({
        id: m.id,
        direction: m.direction,
        content: m.content,
        senderName: m.senderName,
        timestamp: m.timestamp.toISOString(),
      }))}
      stageLabels={STAGE_LABELS}
      agents={agents}
      isAdmin={isAdmin(session)}
    />
  );
}
