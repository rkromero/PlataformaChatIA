import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlanLimits, getCurrentPeriod } from '@chat-platform/shared/plans';
import { AnalyticsChart } from './chart';

function toDayStart(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function toDayEnd(date: Date) {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateParam(value: string, fallback: Date) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
  const defaultFrom = formatDateInput(thirtyDaysAgo);
  const defaultTo = formatDateInput(today);

  const period = getCurrentPeriod();
  const fromParam = typeof params.from === 'string' ? params.from : defaultFrom;
  const toParam = typeof params.to === 'string' ? params.to : defaultTo;
  const slaMinutesParam = typeof params.slaMinutes === 'string' ? Number(params.slaMinutes) : 5;
  const slaMinutes = Number.isFinite(slaMinutesParam)
    ? Math.min(Math.max(Math.floor(slaMinutesParam), 1), 120)
    : 5;
  const parsedStart = toDayStart(parseDateParam(fromParam, thirtyDaysAgo));
  const parsedEnd = toDayEnd(parseDateParam(toParam, today));
  const rangeStart = parsedStart <= parsedEnd ? parsedStart : toDayStart(parsedEnd);
  const rangeEnd = parsedStart <= parsedEnd ? parsedEnd : toDayEnd(parsedStart);
  const selectedFrom = formatDateInput(rangeStart);
  const selectedTo = formatDateInput(rangeEnd);

  const [dailyData, monthlyUsage, tenant, conversationCount] = await Promise.all([
    prisma.dailyUsage.findMany({
      where: { tenantId: session.tenantId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
      select: { date: true, messages: true },
    }),
    prisma.usageRecord.findUnique({
      where: { tenantId_period: { tenantId: session.tenantId, period } },
    }),
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { plan: true },
    }),
    prisma.conversationLink.count({
      where: { tenantId: session.tenantId },
    }),
  ]);

  const days: { date: string; messages: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const found = dailyData.find(
      (r) => (r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date)) === dateStr,
    );
    days.push({ date: dateStr, messages: found?.messages ?? 0 });
  }

  const totalMessages = days.reduce((sum, d) => sum + d.messages, 0);
  const avgPerDay = Math.round(totalMessages / 30);
  const peakDay = days.reduce((max, d) => (d.messages > max.messages ? d : max), days[0]);

  const limits = getPlanLimits(tenant?.plan ?? 'starter');
  const monthMessages = monthlyUsage?.messages ?? 0;

  const agents = await prisma.tenantUser.findMany({
    where: { tenantId: session.tenantId, deletedAt: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  const agentIds = agents.map((agent) => agent.id);
  const leadsAssigned = agentIds.length
    ? await prisma.conversationLink.findMany({
        where: {
          tenantId: session.tenantId,
          assignedAgentId: { in: agentIds },
          deletedAt: null,
          createdAt: { lte: rangeEnd },
        },
        select: {
          id: true,
          assignedAgentId: true,
          stage: true,
          updatedAt: true,
        },
      })
    : [];

  const assignedLeadIds = leadsAssigned.map((lead) => lead.id);
  const messagesInRange = assignedLeadIds.length
    ? await prisma.message.findMany({
        where: {
          tenantId: session.tenantId,
          conversationLinkId: { in: assignedLeadIds },
          timestamp: { gte: rangeStart, lte: rangeEnd },
        },
        select: {
          conversationLinkId: true,
          timestamp: true,
          direction: true,
          agentUserId: true,
        },
        orderBy: { timestamp: 'asc' },
      })
    : [];

  const closedLeadsInRange = leadsAssigned.filter(
    (lead) =>
      (lead.stage === 'won' || lead.stage === 'lost') &&
      lead.updatedAt >= rangeStart &&
      lead.updatedAt <= rangeEnd,
  );
  const closedLeadIds = closedLeadsInRange.map((lead) => lead.id);

  const firstIncomingByClosedLead = closedLeadIds.length
    ? await prisma.message.groupBy({
        by: ['conversationLinkId'],
        where: {
          tenantId: session.tenantId,
          conversationLinkId: { in: closedLeadIds },
          direction: 'incoming',
        },
        _min: { timestamp: true },
      })
    : [];

  const firstIncomingMap = new Map(
    firstIncomingByClosedLead.map((item) => [item.conversationLinkId, item._min.timestamp]),
  );

  const totalDays = Math.max(
    1,
    Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  const metricsByAgent = new Map<
    string,
    {
      firstResponseMinutes: number[];
      slaTotal: number;
      slaMet: number;
      won: number;
      lost: number;
      sentMessages: number;
      followUpEligibleLeads: Set<string>;
      followUpLeads: Set<string>;
      resolutionHours: number[];
    }
  >();

  for (const agent of agents) {
    metricsByAgent.set(agent.id, {
      firstResponseMinutes: [],
      slaTotal: 0,
      slaMet: 0,
      won: 0,
      lost: 0,
      sentMessages: 0,
      followUpEligibleLeads: new Set<string>(),
      followUpLeads: new Set<string>(),
      resolutionHours: [],
    });
  }

  const leadsByAgent = new Map<string, string[]>();
  for (const lead of leadsAssigned) {
    if (!lead.assignedAgentId) continue;
    if (!leadsByAgent.has(lead.assignedAgentId)) leadsByAgent.set(lead.assignedAgentId, []);
    leadsByAgent.get(lead.assignedAgentId)!.push(lead.id);
  }

  const messagesByLead = new Map<
    string,
    Array<{ timestamp: Date; direction: string; agentUserId: string | null }>
  >();
  for (const message of messagesInRange) {
    if (!messagesByLead.has(message.conversationLinkId)) messagesByLead.set(message.conversationLinkId, []);
    messagesByLead.get(message.conversationLinkId)!.push({
      timestamp: message.timestamp,
      direction: message.direction,
      agentUserId: message.agentUserId,
    });
    if (message.direction === 'outgoing' && message.agentUserId) {
      const agentMetrics = metricsByAgent.get(message.agentUserId);
      if (agentMetrics) agentMetrics.sentMessages += 1;
    }
  }

  for (const lead of closedLeadsInRange) {
    const agentId = lead.assignedAgentId;
    if (!agentId) continue;
    const agentMetrics = metricsByAgent.get(agentId);
    if (!agentMetrics) continue;
    if (lead.stage === 'won') agentMetrics.won += 1;
    if (lead.stage === 'lost') agentMetrics.lost += 1;

    const firstIncoming = firstIncomingMap.get(lead.id);
    if (firstIncoming) {
      const resolutionHours = (lead.updatedAt.getTime() - firstIncoming.getTime()) / (1000 * 60 * 60);
      if (resolutionHours >= 0) agentMetrics.resolutionHours.push(resolutionHours);
    }
  }

  for (const [agentId, leadIds] of leadsByAgent.entries()) {
    const agentMetrics = metricsByAgent.get(agentId);
    if (!agentMetrics) continue;

    for (const leadId of leadIds) {
      const leadMessages = messagesByLead.get(leadId) ?? [];
      const firstIncoming = leadMessages.find((message) => message.direction === 'incoming');
      if (firstIncoming) {
        agentMetrics.slaTotal += 1;
        const firstOutgoing = leadMessages.find(
          (message) =>
            message.direction === 'outgoing' &&
            message.agentUserId === agentId &&
            message.timestamp >= firstIncoming.timestamp,
        );
        if (firstOutgoing) {
          const responseMinutes =
            (firstOutgoing.timestamp.getTime() - firstIncoming.timestamp.getTime()) / (1000 * 60);
          if (responseMinutes >= 0) {
            agentMetrics.firstResponseMinutes.push(responseMinutes);
            if (responseMinutes <= slaMinutes) {
              agentMetrics.slaMet += 1;
            }
          }
        }
      }

      const outgoingByAgent = leadMessages.filter(
        (message) => message.direction === 'outgoing' && message.agentUserId === agentId,
      );
      if (outgoingByAgent.length > 0) {
        agentMetrics.followUpEligibleLeads.add(leadId);
        if (outgoingByAgent.length >= 2) {
          agentMetrics.followUpLeads.add(leadId);
        }
      }
    }
  }

  const agentRows = agents.map((agent) => {
    const metrics = metricsByAgent.get(agent.id)!;
    const closed = metrics.won + metrics.lost;
    const winRate = closed > 0 ? (metrics.won / closed) * 100 : 0;
    const slaRate = metrics.slaTotal > 0 ? (metrics.slaMet / metrics.slaTotal) * 100 : 0;
    const followUpRate =
      metrics.followUpEligibleLeads.size > 0
        ? (metrics.followUpLeads.size / metrics.followUpEligibleLeads.size) * 100
        : 0;

    return {
      id: agent.id,
      name: agent.name || agent.email,
      avgResponseMinutes: average(metrics.firstResponseMinutes),
      slaRate,
      winRate,
      avgResolutionHours: average(metrics.resolutionHours),
      messagesPerDay: metrics.sentMessages / totalDays,
      followUpRate,
      sentMessages: metrics.sentMessages,
    };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-gray-400">
          Rendimiento de tu bot en los últimos 30 días
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="card">
          <p className="text-sm font-medium text-gray-400">Mensajes (30 días)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{totalMessages.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-400">Promedio por día</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{avgPerDay}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-400">Día pico</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{peakDay.messages}</p>
          <p className="text-xs text-gray-400">{peakDay.date}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-400">Total conversaciones</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{conversationCount}</p>
        </div>
      </div>

      {/* Monthly progress */}
      <div className="card mb-8">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-400">Uso mensual ({period})</p>
          <span className="text-sm tabular-nums text-gray-500">
            {monthMessages.toLocaleString()} / {limits.messagesPerMonth.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full transition-all ${
              monthMessages >= limits.messagesPerMonth
                ? 'bg-red-500'
                : monthMessages >= limits.messagesPerMonth * 0.8
                  ? 'bg-amber-500'
                  : 'bg-brand-500'
            }`}
            style={{ width: `${Math.min((monthMessages / limits.messagesPerMonth) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="mb-2 text-sm font-medium text-gray-400">Mensajes por semana</h2>
        <AnalyticsChart data={days} />
      </div>

      <div className="mt-8 card">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-100">Agentes</h2>
            <p className="text-sm text-gray-400">
              Métricas por agente con rango de fechas y SLA configurable
            </p>
          </div>
          <form className="flex flex-wrap items-end gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Desde</label>
              <input name="from" type="date" defaultValue={selectedFrom} className="input h-9 py-1.5 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Hasta</label>
              <input name="to" type="date" defaultValue={selectedTo} className="input h-9 py-1.5 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">SLA (min)</label>
              <input
                name="slaMinutes"
                type="number"
                min={1}
                max={120}
                defaultValue={slaMinutes}
                className="input h-9 w-24 py-1.5 text-xs"
              />
            </div>
            <button type="submit" className="btn-primary h-9 px-3 py-1.5 text-xs">
              Aplicar
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-3 py-2">Agente</th>
                <th className="px-3 py-2">Resp. prom. (min)</th>
                <th className="px-3 py-2">SLA primera resp.</th>
                <th className="px-3 py-2">% Leads ganados</th>
                <th className="px-3 py-2">Resolución prom. (hs)</th>
                <th className="px-3 py-2">Mensajes/día</th>
                <th className="px-3 py-2">Tasa seguimiento</th>
              </tr>
            </thead>
            <tbody>
              {agentRows.map((row) => (
                <tr key={row.id} className="border-b border-white/[0.06]">
                  <td className="px-3 py-2 font-medium text-gray-100">{row.name}</td>
                  <td className="px-3 py-2 text-gray-300">{row.avgResponseMinutes.toFixed(1)}</td>
                  <td className="px-3 py-2 text-gray-300">{row.slaRate.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-gray-300">{row.winRate.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-gray-300">{row.avgResolutionHours.toFixed(1)}</td>
                  <td className="px-3 py-2 text-gray-300">
                    {row.messagesPerDay.toFixed(1)}
                    <span className="ml-1 text-xs text-gray-500">({row.sentMessages} total)</span>
                  </td>
                  <td className="px-3 py-2 text-gray-300">{row.followUpRate.toFixed(1)}%</td>
                </tr>
              ))}
              {agentRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">
                    No hay agentes activos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
