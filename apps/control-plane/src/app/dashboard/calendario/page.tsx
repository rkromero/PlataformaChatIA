import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasModule } from '@/lib/modules';
import { redirect } from 'next/navigation';
import { AppointmentList } from './appointment-list';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  confirmed: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
  completed: { label: 'Completado', color: 'bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' },
  no_show: { label: 'No asistió', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
};

export default async function CalendarioPage() {
  const session = await requireSession();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { modulesJson: true },
  });
  if (!hasModule(tenant?.modulesJson, 'calendar')) redirect('/dashboard');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [todayAppointments, weekAppointments, services, professionals] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        tenantId: session.tenantId,
        startAt: { gte: today, lt: tomorrow },
        status: { not: 'cancelled' },
      },
      include: {
        service: { select: { name: true, color: true, durationMinutes: true } },
        professional: { select: { name: true, email: true } },
      },
      orderBy: { startAt: 'asc' },
    }),
    prisma.appointment.findMany({
      where: {
        tenantId: session.tenantId,
        startAt: { gte: today, lt: weekEnd },
        status: { not: 'cancelled' },
      },
      include: {
        service: { select: { name: true, color: true, durationMinutes: true } },
        professional: { select: { name: true, email: true } },
      },
      orderBy: { startAt: 'asc' },
    }),
    prisma.calendarService.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.tenantUser.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const confirmedToday = todayAppointments.filter((a) => a.status === 'confirmed').length;
  const pendingToday = todayAppointments.filter((a) => a.status === 'pending').length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendario de Turnos</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {todayAppointments.length} turno{todayAppointments.length !== 1 ? 's' : ''} hoy —{' '}
            {weekAppointments.length} esta semana
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/calendario/reportes" className="btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
            Reportes
          </Link>
          <Link href="/dashboard/calendario/agenda" className="btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            Agenda
          </Link>
          <Link href="/dashboard/calendario/servicios" className="btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Configurar
          </Link>
          <Link href="/dashboard/calendario/nuevo" className="btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo turno
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Turnos hoy</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-brand-600 dark:text-brand-400">
            {todayAppointments.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Confirmados</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {confirmedToday}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendientes</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {pendingToday}
          </p>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="card text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Para empezar, creá al menos un servicio.
          </p>
          <Link href="/dashboard/calendario/servicios" className="btn-primary mt-3 inline-flex">
            Configurar servicios
          </Link>
        </div>
      ) : (
        <AppointmentList
          appointments={weekAppointments.map((a) => ({
            id: a.id,
            clientName: a.clientName,
            clientPhone: a.clientPhone,
            startAt: a.startAt.toISOString(),
            endAt: a.endAt.toISOString(),
            status: a.status,
            notes: a.notes,
            serviceName: a.service.name,
            serviceColor: a.service.color,
            professionalName: a.professional.name || a.professional.email,
          }))}
          statusLabels={STATUS_LABELS}
        />
      )}
    </div>
  );
}
