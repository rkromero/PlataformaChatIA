import { prisma } from '../lib/db.js';

/**
 * Evaluates routing rules for a tenant and returns the agent ID to assign.
 * Simplified version for the ai-bot — mirrors control-plane routing-engine logic.
 */
export async function routeNewLead(
  tenantId: string,
  phone: string | null,
  contactName: string | null,
): Promise<string | null> {
  const rules = await prisma.routingRule.findMany({
    where: { tenantId, isActive: true },
    orderBy: { priority: 'asc' },
  });

  for (const rule of rules) {
    const conditions = rule.conditionsJson as Record<string, unknown>;

    switch (rule.type) {
      case 'fixed': {
        if (!rule.assignedAgentId) break;
        const src = conditions.source as string | undefined;
        if (src && src !== 'whatsapp_qr') break;
        return rule.assignedAgentId;
      }

      case 'geo': {
        if (!rule.assignedAgentId || !phone) break;
        const prefixes = (conditions.phone_prefixes as string[]) ?? [];
        if (prefixes.length === 0) return rule.assignedAgentId;
        const clean = phone.replace(/[^0-9+]/g, '');
        if (prefixes.some((p) => clean.startsWith(p))) return rule.assignedAgentId;
        break;
      }

      case 'round_robin': {
        const agentIds = (conditions.agent_ids as string[]) ?? [];
        if (agentIds.length === 0) break;
        const nextIndex = rule.roundRobinIndex % agentIds.length;
        const agentId = agentIds[nextIndex];

        await prisma.routingRule.update({
          where: { id: rule.id },
          data: { roundRobinIndex: rule.roundRobinIndex + 1 },
        });

        return agentId;
      }
    }
  }

  return null;
}
