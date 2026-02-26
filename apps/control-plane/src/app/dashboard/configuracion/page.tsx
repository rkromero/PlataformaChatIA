import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/agent-filter';
import { getPlanLimits, getCurrentPeriod, PLAN_LIMITS, isTrialExpired, getTrialDaysLeft } from '@chat-platform/shared/plans';
import { SettingsShell } from './settings-shell';
import type { AccountData, PlanUsageData, RoutingData } from './types';

function formatDate(value: Date | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export default async function ConfiguracionPage() {
  const session = await requireSession();
  const canManage = isAdmin(session);

  const [tenant, owner, rules, agents, usageRecord, channelCount, userCount] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        name: true,
        status: true,
        plan: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
        trialEndsAt: true,
        aiSettings: {
          select: { enabled: true, model: true, updatedAt: true },
        },
      },
    }),
    prisma.tenantUser.findFirst({
      where: { tenantId: session.tenantId, role: 'owner', deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { name: true, email: true },
    }),
    canManage
      ? prisma.routingRule.findMany({
          where: { tenantId: session.tenantId },
          orderBy: { priority: 'asc' },
          include: { assignedAgent: { select: { id: true, name: true, email: true } } },
        })
      : Promise.resolve([]),
    canManage
      ? prisma.tenantUser.findMany({
          where: { tenantId: session.tenantId, deletedAt: null },
          select: { id: true, name: true, email: true, role: true },
          orderBy: { email: 'asc' },
        })
      : Promise.resolve([]),
    prisma.usageRecord.findUnique({
      where: { tenantId_period: { tenantId: session.tenantId, period: getCurrentPeriod() } },
    }),
    prisma.tenantChannel.count({ where: { tenantId: session.tenantId } }),
    prisma.tenantUser.count({ where: { tenantId: session.tenantId } }),
  ]);

  const limits = getPlanLimits(tenant?.plan ?? 'trial');
  const messagesUsed = usageRecord?.messages ?? 0;
  const isTrial = tenant?.plan === 'trial';
  const expired = isTrial && isTrialExpired(tenant?.trialEndsAt ?? null);
  const daysLeft = isTrial ? getTrialDaysLeft(tenant?.trialEndsAt ?? null) : 0;

  const accountData: AccountData = {
    tenantId: tenant?.id || session.tenantId,
    tenantName: tenant?.name?.trim() || 'ChatPlatform',
    plan: tenant?.plan || 'N/D',
    status: tenant?.status || 'N/D',
    onboardingCompleted: tenant?.onboardingCompleted ?? false,
    aiEnabled: tenant?.aiSettings?.enabled ?? false,
    aiModel: tenant?.aiSettings?.model || null,
    trialEndsAt: formatDate(tenant?.trialEndsAt),
    lastUpdated: formatDate(tenant?.aiSettings?.updatedAt || tenant?.updatedAt),
    ownerName: owner?.name?.trim() || owner?.email || 'No definido',
    ownerEmail: owner?.email || 'Sin email',
    sessionEmail: session.email,
    sessionRole: session.role,
  };

  const planData: PlanUsageData = {
    currentPlan: tenant?.plan ?? 'trial',
    planName: limits.name,
    isTrial,
    isTrialExpired: expired,
    trialDaysLeft: daysLeft,
    messagesUsed,
    messagesLimit: limits.messagesPerMonth,
    messagesPercent: Math.min((messagesUsed / limits.messagesPerMonth) * 100, 100),
    channelCount,
    channelLimit: limits.maxChannels,
    userCount,
    userLimit: limits.maxUsers,
    plans: PLAN_LIMITS,
  };

  const routingData: RoutingData = {
    rules: rules.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      conditionsJson: r.conditionsJson as Record<string, unknown>,
      assignedAgentId: r.assignedAgentId,
      assignedAgentName: ('assignedAgent' in r && r.assignedAgent)
        ? (r.assignedAgent.name || r.assignedAgent.email || null)
        : null,
      priority: r.priority,
      isActive: r.isActive,
    })),
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name ?? '',
      email: a.email,
      role: a.role,
    })),
  };

  return (
    <SettingsShell
      accountData={accountData}
      planData={planData}
      routingData={routingData}
    />
  );
}
