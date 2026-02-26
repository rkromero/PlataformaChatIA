import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasModule } from '@/lib/modules';
import { redirect } from 'next/navigation';

export default async function ReportesPage() {
  const session = await requireSession();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { modulesJson: true },
  });
  if (!hasModule(tenant?.modulesJson, 'calendar')) redirect('/dashboard');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [thisMonth, lastMonth, byService, byProfessional, bySource] = await Promise.all([
    prisma.appointment.groupBy({
      by: ['status'],
      where: {
        tenantId: session.tenantId,
        startAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _count: true,
    }),
    prisma.appointment.groupBy({
      by: ['status'],
      where: {
        tenantId: session.tenantId,
        startAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _count: true,
    }),
    prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        tenantId: session.tenantId,
        startAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'cancelled' },
      },
      _count: true,
      orderBy: { _count: { serviceId: 'desc' } },
    }),
    prisma.appointment.groupBy({
      by: ['professionalId'],
      where: {
        tenantId: session.tenantId,
        startAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'cancelled' },
      },
      _count: true,
      orderBy: { _count: { professionalId: 'desc' } },
    }),
    prisma.appointment.groupBy({
      by: ['source'],
      where: {
        tenantId: session.tenantId,
        startAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _count: true,
    }),
  ]);

  const services = await prisma.calendarService.findMany({
    where: { tenantId: session.tenantId },
    select: { id: true, name: true, color: true },
  });
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  const professionals = await prisma.tenantUser.findMany({
    where: { tenantId: session.tenantId },
    select: { id: true, name: true, email: true },
  });
  const profMap = new Map(professionals.map((p) => [p.id, p]));

  const count = (data: typeof thisMonth, status: string) =>
    data.find((d) => d.status === status)?._count ?? 0;
  const total = (data: typeof thisMonth) => data.reduce((sum, d) => sum + d._count, 0);

  const thisTotal = total(thisMonth);
  const lastTotal = total(lastMonth);
  const thisCompleted = count(thisMonth, 'completed');
  const thisNoShow = count(thisMonth, 'no_show');
  const thisCancelled = count(thisMonth, 'cancelled');
  const thisPending = count(thisMonth, 'pending');
  const thisConfirmed = count(thisMonth, 'confirmed');
  const completionRate = thisTotal > 0 ? Math.round((thisCompleted / thisTotal) * 100) : 0;
  const noShowRate = thisTotal > 0 ? Math.round((thisNoShow / thisTotal) * 100) : 0;
  const growthPct = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0;

  const sourceLabels: Record<string, string> = {
    chat_ai: 'Bot IA',
    manual: 'Manual',
    web: 'Web',
  };

  const monthName = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reportes de Turnos</h1>
          <p className="mt-1 text-sm capitalize text-gray-500 dark:text-gray-400">{monthName}</p>
        </div>
        <Link href="/dashboard/calendario" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          ← Volver al calendario
        </Link>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total del mes</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{thisTotal}</p>
          {growthPct !== 0 && (
            <p className={`text-xs ${growthPct > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {growthPct > 0 ? '+' : ''}{growthPct}% vs mes anterior
            </p>
          )}
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Completados</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{thisCompleted}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tasa completados</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{completionRate}%</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">No asistió</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-600 dark:text-gray-400">{thisNoShow}</p>
          <p className="text-xs text-gray-500">{noShowRate}%</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Cancelados</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">{thisCancelled}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Pendientes/Conf.</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">{thisPending + thisConfirmed}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* By Service */}
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold">Por servicio</h3>
          {byService.length === 0 ? (
            <p className="text-xs text-gray-500">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {byService.map((item) => {
                const svc = serviceMap.get(item.serviceId);
                const pct = thisTotal > 0 ? Math.round((item._count / thisTotal) * 100) : 0;
                return (
                  <div key={item.serviceId} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: svc?.color ?? '#6366f1' }} />
                    <span className="flex-1 truncate text-sm">{svc?.name ?? 'Desconocido'}</span>
                    <span className="text-sm font-semibold tabular-nums">{item._count}</span>
                    <span className="text-xs text-gray-500">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Professional */}
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold">Por profesional</h3>
          {byProfessional.length === 0 ? (
            <p className="text-xs text-gray-500">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {byProfessional.map((item) => {
                const prof = profMap.get(item.professionalId);
                return (
                  <div key={item.professionalId} className="flex items-center justify-between">
                    <span className="truncate text-sm">{prof?.name || prof?.email || 'Desconocido'}</span>
                    <span className="text-sm font-semibold tabular-nums">{item._count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Source */}
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold">Por origen</h3>
          {bySource.length === 0 ? (
            <p className="text-xs text-gray-500">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {bySource.map((item) => (
                <div key={item.source} className="flex items-center justify-between">
                  <span className="text-sm">{sourceLabels[item.source] ?? item.source}</span>
                  <span className="text-sm font-semibold tabular-nums">{item._count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
