import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/agent-filter';
import { redirect } from 'next/navigation';
import { RuleList } from './rule-list';

export default async function RoutingPage() {
  const session = await requireSession();
  if (!isAdmin(session)) redirect('/dashboard');

  const [rules, agents] = await Promise.all([
    prisma.routingRule.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { priority: 'asc' },
      include: { assignedAgent: { select: { id: true, name: true, email: true } } },
    }),
    prisma.tenantUser.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
        select: { id: true, name: true, email: true, role: true },
      orderBy: { email: 'asc' },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reglas de asignación</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configurá cómo se asignan los leads automáticamente a los agentes
        </p>
      </div>

      <RuleList
        rules={rules.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          conditionsJson: r.conditionsJson as Record<string, unknown>,
          assignedAgentId: r.assignedAgentId,
          assignedAgentName: r.assignedAgent?.name || r.assignedAgent?.email || null,
          priority: r.priority,
          isActive: r.isActive,
        }))}
        agents={agents}
      />
    </div>
  );
}
