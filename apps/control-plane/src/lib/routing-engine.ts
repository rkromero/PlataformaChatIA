import { prisma } from './db';

interface LeadData {
  phone?: string | null;
  source?: string | null;
  contactName?: string | null;
}

/**
 * Evaluates routing rules for a tenant and returns the agent ID to assign.
 * Rules are evaluated in priority order (lowest number = highest priority).
 * Returns null if no rule matches.
 */
export async function routeLead(
  tenantId: string,
  lead: LeadData,
): Promise<string | null> {
  const rules = await prisma.routingRule.findMany({
    where: { tenantId, isActive: true },
    orderBy: { priority: 'asc' },
  });

  for (const rule of rules) {
    const conditions = rule.conditionsJson as Record<string, unknown>;

    switch (rule.type) {
      case 'fixed': {
        if (matchesFixedConditions(lead, conditions) && rule.assignedAgentId) {
          return rule.assignedAgentId;
        }
        break;
      }

      case 'geo': {
        if (matchesGeoConditions(lead, conditions) && rule.assignedAgentId) {
          return rule.assignedAgentId;
        }
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

function matchesFixedConditions(
  lead: LeadData,
  conditions: Record<string, unknown>,
): boolean {
  if (conditions.source && lead.source !== conditions.source) return false;
  if (conditions.keyword && lead.contactName) {
    const kw = (conditions.keyword as string).toLowerCase();
    if (!lead.contactName.toLowerCase().includes(kw)) return false;
  }
  return true;
}

function matchesGeoConditions(
  lead: LeadData,
  conditions: Record<string, unknown>,
): boolean {
  if (!lead.phone) return false;

  const prefixes = (conditions.phone_prefixes as string[]) ?? [];
  if (prefixes.length === 0) return true;

  const cleanPhone = lead.phone.replace(/[^0-9+]/g, '');
  return prefixes.some((prefix) => cleanPhone.startsWith(prefix));
}

/**
 * Routes all unassigned leads for a tenant.
 * Called lazily when admin views CRM.
 */
export async function routeUnassignedLeads(tenantId: string): Promise<number> {
  const hasRules = await prisma.routingRule.count({
    where: { tenantId, isActive: true },
  });
  if (hasRules === 0) return 0;

  const unassigned = await prisma.conversationLink.findMany({
    where: { tenantId, assignedAgentId: null, deletedAt: null },
    select: { id: true, phone: true, source: true, contactName: true },
  });

  let routed = 0;
  for (const lead of unassigned) {
    const agentId = await routeLead(tenantId, lead);
    if (agentId) {
      await prisma.conversationLink.update({
        where: { id: lead.id },
        data: { assignedAgentId: agentId },
      });
      routed++;
    }
  }

  return routed;
}
