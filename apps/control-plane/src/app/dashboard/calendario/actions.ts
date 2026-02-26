'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const CALENDAR_PATH = '/dashboard/calendario';

// ── Schemas ────────────────────────────────────────────────────

const serviceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  durationMinutes: z.coerce.number().int().min(15).max(480),
  price: z.coerce.number().nonnegative().optional().nullable(),
  color: z.string().min(1),
});

const appointmentSchema = z.object({
  serviceId: z.string().uuid(),
  professionalId: z.string().uuid(),
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  clientPhone: z.string().optional().nullable(),
  startAt: z.string().datetime({ message: 'Fecha de inicio inválida' }),
  notes: z.string().optional().nullable(),
});

const appointmentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']),
});

const calendarConfigSchema = z.object({
  timezone: z.string().min(1),
  slotBufferMinutes: z.coerce.number().int().min(0).max(120),
  minAdvanceHours: z.coerce.number().int().min(0).max(168),
  maxAdvanceDays: z.coerce.number().int().min(1).max(365),
  reminderChannel: z.string().nullable().optional(),
});

const scheduleEntrySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm requerido'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm requerido'),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
});

type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;

// ── CalendarService CRUD ───────────────────────────────────────

export async function createCalendarServiceAction(
  _prev: unknown,
  formData: FormData,
) {
  const session = await requireSession();

  const parsed = serviceSchema.safeParse({
    name: formData.get('name'),
    durationMinutes: formData.get('durationMinutes'),
    price: formData.get('price') || undefined,
    color: formData.get('color'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  await prisma.calendarService.create({
    data: {
      tenantId: session.tenantId,
      name: parsed.data.name,
      durationMinutes: parsed.data.durationMinutes,
      price: parsed.data.price != null
        ? new Prisma.Decimal(parsed.data.price)
        : null,
      color: parsed.data.color,
    },
  });

  revalidatePath(CALENDAR_PATH);
  return { success: true };
}

export async function updateCalendarServiceAction(
  _prev: unknown,
  formData: FormData,
) {
  const session = await requireSession();
  const id = formData.get('id') as string;
  if (!id) return { error: 'ID de servicio requerido' };

  const parsed = serviceSchema.safeParse({
    name: formData.get('name'),
    durationMinutes: formData.get('durationMinutes'),
    price: formData.get('price') || undefined,
    color: formData.get('color'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  await prisma.calendarService.updateMany({
    where: { id, tenantId: session.tenantId },
    data: {
      name: parsed.data.name,
      durationMinutes: parsed.data.durationMinutes,
      price: parsed.data.price != null
        ? new Prisma.Decimal(parsed.data.price)
        : null,
      color: parsed.data.color,
    },
  });

  revalidatePath(CALENDAR_PATH);
  return { success: true };
}

export async function deleteCalendarServiceAction(
  _prev: unknown,
  formData: FormData,
) {
  const session = await requireSession();
  const id = formData.get('id') as string;
  if (!id) return { error: 'ID de servicio requerido' };

  await prisma.calendarService.deleteMany({
    where: { id, tenantId: session.tenantId },
  });

  revalidatePath(CALENDAR_PATH);
  return { success: true };
}

// ── Professional Schedule ──────────────────────────────────────

export async function saveScheduleAction(
  professionalId: string,
  entries: ScheduleEntry[],
) {
  const session = await requireSession();

  const professional = await prisma.tenantUser.findFirst({
    where: { id: professionalId, tenantId: session.tenantId },
  });
  if (!professional) return { error: 'Profesional no encontrado' };

  const parsed = z.array(scheduleEntrySchema).safeParse(entries);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  await prisma.$transaction([
    prisma.calendarSchedule.deleteMany({
      where: { professionalId },
    }),
    ...parsed.data.map((entry) =>
      prisma.calendarSchedule.create({
        data: {
          professionalId,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          breakStart: entry.breakStart ?? null,
          breakEnd: entry.breakEnd ?? null,
        },
      }),
    ),
  ]);

  revalidatePath(CALENDAR_PATH);
  return { success: true };
}

// ── Professional ↔ Services link ───────────────────────────────

export async function saveProfessionalServicesAction(
  professionalId: string,
  serviceIds: string[],
) {
  const session = await requireSession();

  const professional = await prisma.tenantUser.findFirst({
    where: { id: professionalId, tenantId: session.tenantId },
  });
  if (!professional) return { error: 'Profesional no encontrado' };

  await prisma.$transaction([
    prisma.calendarProfessionalService.deleteMany({
      where: { professionalId },
    }),
    ...serviceIds.map((serviceId) =>
      prisma.calendarProfessionalService.create({
        data: { professionalId, serviceId },
      }),
    ),
  ]);

  revalidatePath(CALENDAR_PATH);
  return { success: true };
}

// ── Appointments ───────────────────────────────────────────────

export async function createAppointmentAction(
  _prev: unknown,
  formData: FormData,
) {
  const session = await requireSession();

  const rawStartAt = formData.get('startAt') as string;
  const startAtIso = rawStartAt?.includes('T') && !rawStartAt.includes('Z')
    ? `${rawStartAt}:00.000Z`
    : rawStartAt;

  const parsed = appointmentSchema.safeParse({
    serviceId: formData.get('serviceId'),
    professionalId: formData.get('professionalId'),
    clientName: formData.get('clientName'),
    clientPhone: formData.get('clientPhone') || undefined,
    startAt: startAtIso,
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  const service = await prisma.calendarService.findFirst({
    where: { id: parsed.data.serviceId, tenantId: session.tenantId },
  });
  if (!service) return { error: 'Servicio no encontrado' };

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);

  const overlap = await prisma.appointment.findFirst({
    where: {
      professionalId: parsed.data.professionalId,
      status: { not: 'cancelled' },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (overlap) {
    return { error: 'Ya existe una cita en ese horario para este profesional' };
  }

  await prisma.appointment.create({
    data: {
      tenantId: session.tenantId,
      serviceId: parsed.data.serviceId,
      professionalId: parsed.data.professionalId,
      clientName: parsed.data.clientName,
      clientPhone: parsed.data.clientPhone ?? null,
      startAt,
      endAt,
      source: 'manual',
      notes: parsed.data.notes ?? null,
    },
  });

  revalidatePath(CALENDAR_PATH);
  return { success: true };
}

export async function updateAppointmentStatusAction(
  _prev: unknown,
  formData: FormData,
) {
  const session = await requireSession();

  const parsed = appointmentStatusSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  await prisma.appointment.updateMany({
    where: { id: parsed.data.id, tenantId: session.tenantId },
    data: { status: parsed.data.status },
  });

  revalidatePath(CALENDAR_PATH);
  return { success: true };
}

// ── Calendar Config ────────────────────────────────────────────

export async function saveCalendarConfigAction(
  _prev: unknown,
  formData: FormData,
) {
  const session = await requireSession();

  const rawChannel = formData.get('reminderChannel') as string | null;

  const parsed = calendarConfigSchema.safeParse({
    timezone: formData.get('timezone'),
    slotBufferMinutes: formData.get('slotBufferMinutes'),
    minAdvanceHours: formData.get('minAdvanceHours'),
    maxAdvanceDays: formData.get('maxAdvanceDays'),
    reminderChannel: rawChannel === '' || rawChannel === 'none' ? null : rawChannel,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(', ') };
  }

  await prisma.calendarConfig.upsert({
    where: { tenantId: session.tenantId },
    create: {
      tenantId: session.tenantId,
      ...parsed.data,
    },
    update: parsed.data,
  });

  revalidatePath(CALENDAR_PATH);
  return { success: true };
}
