import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasModule } from '@/lib/modules';
import { redirect } from 'next/navigation';
import { NewAppointmentForm } from './new-appointment-form';

export default async function NuevoTurnoPage() {
  const session = await requireSession();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { modulesJson: true },
  });
  if (!hasModule(tenant?.modulesJson, 'calendar')) redirect('/dashboard');

  const [services, professionals] = await Promise.all([
    prisma.calendarService.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, durationMinutes: true },
    }),
    prisma.tenantUser.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        calendarProfessionalServices: { select: { serviceId: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  const professionalsWithServices = professionals
    .filter((p) => p.calendarProfessionalServices.length > 0)
    .map((p) => ({
      id: p.id,
      label: p.name || p.email,
      serviceIds: p.calendarProfessionalServices.map((ps) => ps.serviceId),
    }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo turno</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Agendá un turno manualmente.
        </p>
      </div>

      {services.length === 0 ? (
        <div className="card text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Primero configurá servicios y asignalos a profesionales.
          </p>
        </div>
      ) : (
        <NewAppointmentForm
          services={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes }))}
          professionals={professionalsWithServices}
        />
      )}
    </div>
  );
}
