import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasModule } from '@/lib/modules';
import { redirect } from 'next/navigation';
import { ServiceList } from './service-list';
import { ServiceForm } from './service-form';
import { ProfessionalConfig } from './professional-config';
import { CalendarConfigForm } from './calendar-config-form';
import { BlockedTimes } from './blocked-times';

export default async function CalendarioServiciosPage() {
  const session = await requireSession();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { modulesJson: true },
  });
  if (!hasModule(tenant?.modulesJson, 'calendar')) redirect('/dashboard');

  const [services, professionals, config, channels, blockedTimes] = await Promise.all([
    prisma.calendarService.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.tenantUser.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        calendarProfessionalServices: { select: { serviceId: true } },
        calendarSchedules: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.calendarConfig.findUnique({
      where: { tenantId: session.tenantId },
    }),
    prisma.tenantChannel.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
      select: { id: true, type: true },
    }),
    prisma.calendarBlockedTime.findMany({
      where: {
        professional: { tenantId: session.tenantId },
        endAt: { gte: new Date() },
      },
      include: { professional: { select: { name: true, email: true } } },
      orderBy: { startAt: 'asc' },
    }),
  ]);

  const channelLabels: Record<string, string> = {
    whatsapp: 'WhatsApp (Chatwoot)',
    whatsapp_qr: 'WhatsApp QR (Baileys)',
    webchat: 'Webchat',
  };

  const availableChannels = channels.map((ch) => ({
    value: ch.type,
    label: channelLabels[ch.type] ?? ch.type,
  }));

  const professionalsData = professionals.map((p) => ({
    id: p.id,
    label: p.name || p.email,
    serviceIds: p.calendarProfessionalServices.map((ps) => ps.serviceId),
    schedules: p.calendarSchedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      breakStart: s.breakStart,
      breakEnd: s.breakEnd,
    })),
  }));

  const blockedTimesData = blockedTimes.map((bt) => ({
    id: bt.id,
    professionalName: bt.professional.name || bt.professional.email,
    startAt: bt.startAt.toISOString(),
    endAt: bt.endAt.toISOString(),
    reason: bt.reason,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Configuración del Calendario</h1>
        <p className="mt-1 text-sm text-gray-400">
          Servicios, profesionales, horarios y ajustes generales.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Servicios</h2>
          <ServiceForm />
          <ServiceList
            services={services.map((s) => ({
              id: s.id,
              name: s.name,
              durationMinutes: s.durationMinutes,
              price: s.price ? Number(s.price) : null,
              color: s.color,
              isActive: s.isActive,
            }))}
          />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Profesionales y Horarios</h2>
          <ProfessionalConfig
            professionals={professionalsData}
            services={services.map((s) => ({ id: s.id, name: s.name }))}
          />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Bloqueos de horario</h2>
          <p className="mb-3 text-sm text-gray-400">
            Bloqueá horarios por vacaciones, feriados o ausencias de un profesional.
          </p>
          <BlockedTimes
            professionals={professionalsData.map((p) => ({ id: p.id, label: p.label }))}
            blockedTimes={blockedTimesData}
          />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Ajustes generales</h2>
          <CalendarConfigForm
            config={config ? {
              timezone: config.timezone,
              slotBufferMinutes: config.slotBufferMinutes,
              minAdvanceHours: config.minAdvanceHours,
              maxAdvanceDays: config.maxAdvanceDays,
              reminderChannel: config.reminderChannel,
              reminderMinutes1: config.reminderMinutes1,
              reminderMinutes2: config.reminderMinutes2,
            } : undefined}
            availableChannels={availableChannels}
          />
        </section>
      </div>
    </div>
  );
}
