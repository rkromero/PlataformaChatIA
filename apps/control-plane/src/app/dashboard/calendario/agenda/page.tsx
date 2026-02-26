import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasModule } from '@/lib/modules';
import { redirect } from 'next/navigation';

function getLocalHour(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', hourCycle: 'h23',
  }).formatToParts(date);
  return Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
}

function formatTimeInTz(date: Date, tz: string): string {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: tz });
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-200 dark:bg-amber-500/30 border-amber-400',
  confirmed: 'bg-emerald-200 dark:bg-emerald-500/30 border-emerald-400',
  completed: 'bg-brand-200 dark:bg-brand-500/30 border-brand-400',
  no_show: 'bg-gray-200 dark:bg-gray-700 border-gray-400',
};

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const [tenant, calendarConfig] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { modulesJson: true },
    }),
    prisma.calendarConfig.findUnique({
      where: { tenantId: session.tenantId },
      select: { timezone: true },
    }),
  ]);
  if (!hasModule(tenant?.modulesJson, 'calendar')) redirect('/dashboard');
  const tz = calendarConfig?.timezone ?? 'America/Argentina/Buenos_Aires';

  const baseDate = params.week ? new Date(params.week) : new Date();
  const monday = getMonday(baseDate);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);

  const prevMonday = new Date(monday);
  prevMonday.setDate(prevMonday.getDate() - 7);
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: session.tenantId,
      startAt: { gte: monday, lt: sunday },
      status: { not: 'cancelled' },
    },
    include: {
      service: { select: { name: true, color: true } },
      professional: { select: { name: true, email: true } },
    },
    orderBy: { startAt: 'asc' },
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  const appointmentsByDay = days.map((day) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    return appointments.filter((a) => a.startAt >= dayStart && a.startAt <= dayEnd);
  });

  let minHour = 8;
  let maxHour = 20;
  for (const appt of appointments) {
    const h = getLocalHour(appt.startAt, tz);
    if (h < minHour) minHour = h;
    if (h > maxHour) maxHour = h;
  }
  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda semanal</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formatDate(monday)} — {formatDate(new Date(sunday.getTime() - 86400000))}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/calendario/agenda?week=${prevMonday.toISOString().slice(0, 10)}`}
            className="btn-primary"
          >
            ← Anterior
          </Link>
          <Link href="/dashboard/calendario/agenda" className="btn-primary">
            Hoy
          </Link>
          <Link
            href={`/dashboard/calendario/agenda?week=${nextMonday.toISOString().slice(0, 10)}`}
            className="btn-primary"
          >
            Siguiente →
          </Link>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="grid min-w-[800px]" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          {/* Header */}
          <div className="border-b border-gray-200 p-2 dark:border-gray-700" />
          {days.map((day, i) => {
            const isToday = new Date().toDateString() === day.toDateString();
            return (
              <div
                key={i}
                className={`border-b border-l border-gray-200 p-2 text-center text-xs font-semibold dark:border-gray-700 ${
                  isToday ? 'bg-brand-50 dark:bg-brand-500/10' : ''
                }`}
              >
                <span className="block">{DAY_NAMES[i]}</span>
                <span className={`text-lg ${isToday ? 'text-brand-600 dark:text-brand-400' : ''}`}>
                  {day.getDate()}
                </span>
              </div>
            );
          })}

          {/* Hour rows */}
          {hours.map((hour) => (
            <>
              <div
                key={`h-${hour}`}
                className="border-b border-gray-100 p-1 text-right text-[10px] text-gray-400 dark:border-gray-800"
              >
                {String(hour).padStart(2, '0')}:00
              </div>
              {days.map((_, dayIdx) => {
                const dayAppts = appointmentsByDay[dayIdx].filter((a) => {
                  const h = getLocalHour(a.startAt, tz);
                  return h === hour;
                });

                return (
                  <div
                    key={`${hour}-${dayIdx}`}
                    className="relative min-h-[48px] border-b border-l border-gray-100 dark:border-gray-800"
                  >
                    {dayAppts.map((appt) => {
                      const statusClass = STATUS_COLORS[appt.status] ?? STATUS_COLORS.pending;
                      return (
                        <div
                          key={appt.id}
                          className={`m-0.5 rounded border-l-2 p-1 text-[10px] leading-tight ${statusClass}`}
                          style={{ borderLeftColor: appt.service.color }}
                          title={`${appt.clientName} - ${appt.service.name} (${appt.professional.name || appt.professional.email})`}
                        >
                          <span className="font-semibold">
                            {formatTimeInTz(appt.startAt, tz)}
                          </span>
                          <br />
                          <span className="truncate">{appt.clientName}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link href="/dashboard/calendario" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          ← Volver a lista
        </Link>
      </div>
    </div>
  );
}
