import type { SessionPayload } from './auth';

const ADMIN_ROLES = new Set(['super_admin', 'owner', 'admin']);

export function isAdmin(session: SessionPayload): boolean {
  return ADMIN_ROLES.has(session.role);
}

export function isAgent(session: SessionPayload): boolean {
  return session.role === 'agent';
}

/**
 * Returns a Prisma `where` clause addition for agent-scoped queries.
 * Admins see everything; agents see only their assigned leads.
 */
export function agentLeadFilter(session: SessionPayload): Record<string, unknown> {
  if (isAdmin(session)) return {};
  return { assignedAgentId: session.userId };
}
