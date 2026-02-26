import { prisma } from '../lib/db.js';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';

// ── OpenAI tool definitions ──

export const calendarToolDefs: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_services',
      description:
        'Lista los servicios disponibles para agendar un turno (nombre, duración, precio).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description:
        'Consulta los horarios disponibles para un servicio en una fecha determinada. Devuelve slots libres.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'UUID del servicio.' },
          date: {
            type: 'string',
            description: 'Fecha en formato YYYY-MM-DD.',
          },
          professional_id: {
            type: 'string',
            description: 'UUID del profesional (opcional).',
          },
        },
        required: ['service_id', 'date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Agenda un nuevo turno para el cliente.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'UUID del servicio.' },
          professional_id: {
            type: 'string',
            description: 'UUID del profesional.',
          },
          date: { type: 'string', description: 'Fecha YYYY-MM-DD.' },
          time: { type: 'string', description: 'Hora HH:MM (24h).' },
          client_name: { type: 'string', description: 'Nombre del cliente.' },
          client_phone: {
            type: 'string',
            description: 'Teléfono del cliente (opcional).',
          },
          notes: { type: 'string', description: 'Notas adicionales (opcional).' },
        },
        required: ['service_id', 'professional_id', 'date', 'time', 'client_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_appointment',
      description: 'Cancela un turno existente del cliente.',
      parameters: {
        type: 'object',
        properties: {
          appointment_id: { type: 'string', description: 'UUID del turno a cancelar.' },
        },
        required: ['appointment_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_appointment',
      description: 'Reprograma un turno existente a una nueva fecha y hora.',
      parameters: {
        type: 'object',
        properties: {
          appointment_id: { type: 'string', description: 'UUID del turno.' },
          new_date: { type: 'string', description: 'Nueva fecha YYYY-MM-DD.' },
          new_time: { type: 'string', description: 'Nueva hora HH:MM (24h).' },
        },
        required: ['appointment_id', 'new_date', 'new_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_appointments',
      description:
        'Obtiene los próximos turnos del cliente actual (los asociados a esta conversación o teléfono).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

// ── Execution context ──

interface ToolContext {
  tenantId: string;
  conversationLinkId: string | null;
  clientPhone: string | null;
  clientName: string | null;
}

// ── Dispatcher ──

export async function executeCalendarTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  switch (name) {
    case 'list_services':
      return listServices(ctx);
    case 'check_availability':
      return checkAvailability(ctx, args);
    case 'book_appointment':
      return bookAppointment(ctx, args);
    case 'cancel_appointment':
      return cancelAppointment(ctx, args);
    case 'reschedule_appointment':
      return rescheduleAppointment(ctx, args);
    case 'get_my_appointments':
      return getMyAppointments(ctx);
    default:
      return JSON.stringify({ error: `Tool "${name}" desconocida.` });
  }
}

// ── Tool implementations ──

async function listServices(ctx: ToolContext): Promise<string> {
  const services = await prisma.calendarService.findMany({
    where: { tenantId: ctx.tenantId, isActive: true },
    select: { id: true, name: true, durationMinutes: true, price: true },
    orderBy: { name: 'asc' },
  });

  if (services.length === 0) {
    return JSON.stringify({ message: 'No hay servicios disponibles actualmente.' });
  }

  return JSON.stringify(
    services.map((s) => ({
      id: s.id,
      name: s.name,
      duration_minutes: s.durationMinutes,
      price: s.price ? Number(s.price) : null,
    })),
  );
}

async function checkAvailability(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<string> {
  const serviceId = args.service_id as string;
  const dateStr = args.date as string;
  const prefProfId = args.professional_id as string | undefined;

  const service = await prisma.calendarService.findFirst({
    where: { id: serviceId, tenantId: ctx.tenantId, isActive: true },
  });
  if (!service) return JSON.stringify({ error: 'Servicio no encontrado.' });

  const config = await prisma.calendarConfig.findUnique({
    where: { tenantId: ctx.tenantId },
  });
  const tz = config?.timezone ?? 'America/Argentina/Buenos_Aires';
  const buffer = config?.slotBufferMinutes ?? 15;

  const professionals = await prisma.calendarProfessionalService.findMany({
    where: {
      serviceId,
      ...(prefProfId ? { professionalId: prefProfId } : {}),
    },
    include: {
      professional: { select: { id: true, name: true } },
    },
  });

  if (professionals.length === 0) {
    return JSON.stringify({ error: 'No hay profesionales disponibles para este servicio.' });
  }

  const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay();
  const dayStart = new Date(dateStr + 'T00:00:00.000Z');
  const dayEnd = new Date(dateStr + 'T23:59:59.999Z');

  const result: Array<{ professional_id: string; professional_name: string; slots: string[] }> = [];

  for (const ps of professionals) {
    const profId = ps.professional.id;

    const schedule = await prisma.calendarSchedule.findUnique({
      where: { professionalId_dayOfWeek: { professionalId: profId, dayOfWeek } },
    });
    if (!schedule) continue;

    const blocked = await prisma.calendarBlockedTime.findMany({
      where: {
        professionalId: profId,
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
    });

    const existing = await prisma.appointment.findMany({
      where: {
        professionalId: profId,
        startAt: { gte: dayStart, lt: dayEnd },
        status: { notIn: ['cancelled'] },
      },
      select: { startAt: true, endAt: true },
    });

    const slots = generateSlots(
      dateStr,
      schedule.startTime,
      schedule.endTime,
      schedule.breakStart,
      schedule.breakEnd,
      service.durationMinutes,
      buffer,
      existing,
      blocked.map((b) => ({ startAt: b.startAt, endAt: b.endAt })),
    );

    if (slots.length > 0) {
      result.push({
        professional_id: profId,
        professional_name: ps.professional.name || 'Sin nombre',
        slots,
      });
    }
  }

  if (result.length === 0) {
    return JSON.stringify({
      message: `No hay horarios disponibles el ${dateStr} para "${service.name}".`,
    });
  }

  return JSON.stringify({ date: dateStr, timezone: tz, availability: result });
}

async function bookAppointment(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<string> {
  const serviceId = args.service_id as string;
  const profId = args.professional_id as string;
  const dateStr = args.date as string;
  const timeStr = args.time as string;
  const clientName = (args.client_name as string) || ctx.clientName || 'Cliente';
  const clientPhone = (args.client_phone as string) || ctx.clientPhone || null;
  const notes = (args.notes as string) || null;

  const service = await prisma.calendarService.findFirst({
    where: { id: serviceId, tenantId: ctx.tenantId, isActive: true },
  });
  if (!service) return JSON.stringify({ error: 'Servicio no encontrado.' });

  const startAt = new Date(`${dateStr}T${timeStr}:00.000Z`);
  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);

  const [overlap, blocked] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        professionalId: profId,
        status: { notIn: ['cancelled'] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    }),
    prisma.calendarBlockedTime.findFirst({
      where: {
        professionalId: profId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    }),
  ]);
  if (overlap) {
    return JSON.stringify({ error: 'Ese horario ya está ocupado. Elegí otro horario.' });
  }
  if (blocked) {
    return JSON.stringify({ error: `El profesional no está disponible en ese horario${blocked.reason ? `: ${blocked.reason}` : ''}.` });
  }

  const appointment = await prisma.appointment.create({
    data: {
      tenantId: ctx.tenantId,
      serviceId,
      professionalId: profId,
      conversationLinkId: ctx.conversationLinkId,
      clientName,
      clientPhone,
      startAt,
      endAt,
      source: 'chat_ai',
      notes,
    },
    include: {
      service: { select: { name: true } },
      professional: { select: { name: true } },
    },
  });

  return JSON.stringify({
    success: true,
    appointment_id: appointment.id,
    service: appointment.service.name,
    professional: appointment.professional.name || 'Profesional',
    date: dateStr,
    time: timeStr,
    status: appointment.status,
  });
}

async function cancelAppointment(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<string> {
  const appointmentId = args.appointment_id as string;

  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId: ctx.tenantId },
  });

  if (!appt) return JSON.stringify({ error: 'Turno no encontrado.' });
  if (appt.status === 'cancelled') {
    return JSON.stringify({ message: 'El turno ya estaba cancelado.' });
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'cancelled' },
  });

  return JSON.stringify({ success: true, message: 'Turno cancelado correctamente.' });
}

async function rescheduleAppointment(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<string> {
  const appointmentId = args.appointment_id as string;
  const newDate = args.new_date as string;
  const newTime = args.new_time as string;

  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId: ctx.tenantId },
    include: { service: true },
  });

  if (!appt) return JSON.stringify({ error: 'Turno no encontrado.' });
  if (appt.status === 'cancelled') {
    return JSON.stringify({ error: 'No se puede reprogramar un turno cancelado.' });
  }

  const newStart = new Date(`${newDate}T${newTime}:00.000Z`);
  const newEnd = new Date(newStart.getTime() + appt.service.durationMinutes * 60_000);

  const [overlap, blocked] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        professionalId: appt.professionalId,
        id: { not: appointmentId },
        status: { notIn: ['cancelled'] },
        startAt: { lt: newEnd },
        endAt: { gt: newStart },
      },
    }),
    prisma.calendarBlockedTime.findFirst({
      where: {
        professionalId: appt.professionalId,
        startAt: { lt: newEnd },
        endAt: { gt: newStart },
      },
    }),
  ]);
  if (overlap) {
    return JSON.stringify({ error: 'El nuevo horario ya está ocupado.' });
  }
  if (blocked) {
    return JSON.stringify({ error: `El profesional no está disponible en ese horario${blocked.reason ? `: ${blocked.reason}` : ''}.` });
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { startAt: newStart, endAt: newEnd, status: 'pending' },
  });

  return JSON.stringify({
    success: true,
    message: `Turno reprogramado para ${newDate} a las ${newTime}.`,
  });
}

async function getMyAppointments(ctx: ToolContext): Promise<string> {
  const now = new Date();

  const where: Record<string, unknown> = {
    tenantId: ctx.tenantId,
    startAt: { gte: now },
    status: { notIn: ['cancelled', 'completed', 'no_show'] },
  };

  if (ctx.conversationLinkId) {
    where.conversationLinkId = ctx.conversationLinkId;
  } else if (ctx.clientPhone) {
    where.clientPhone = ctx.clientPhone;
  } else {
    return JSON.stringify({ message: 'No puedo identificar tus turnos sin un teléfono asociado.' });
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      service: { select: { name: true } },
      professional: { select: { name: true } },
    },
    orderBy: { startAt: 'asc' },
    take: 10,
  });

  if (appointments.length === 0) {
    return JSON.stringify({ message: 'No tenés turnos próximos agendados.' });
  }

  return JSON.stringify(
    appointments.map((a) => ({
      appointment_id: a.id,
      service: a.service.name,
      professional: a.professional.name || 'Profesional',
      date: a.startAt.toISOString().slice(0, 10),
      time: a.startAt.toISOString().slice(11, 16),
      status: a.status,
    })),
  );
}

// ── Slot generation helper ──

function generateSlots(
  dateStr: string,
  startTime: string,
  endTime: string,
  breakStart: string | null,
  breakEnd: string | null,
  durationMin: number,
  bufferMin: number,
  booked: Array<{ startAt: Date; endAt: Date }>,
  blocked: Array<{ startAt: Date; endAt: Date }>,
): string[] {
  const slots: string[] = [];
  const step = durationMin + bufferMin;

  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const dayStartMin = toMin(startTime);
  const dayEndMin = toMin(endTime);
  const breakStartMin = breakStart ? toMin(breakStart) : null;
  const breakEndMin = breakEnd ? toMin(breakEnd) : null;

  for (let m = dayStartMin; m + durationMin <= dayEndMin; m += step) {
    if (breakStartMin !== null && breakEndMin !== null) {
      if (m < breakEndMin && m + durationMin > breakStartMin) continue;
    }

    const slotStart = new Date(`${dateStr}T${pad(m)}:00.000Z`);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60_000);

    const isBooked = booked.some((b) => b.startAt < slotEnd && b.endAt > slotStart);
    if (isBooked) continue;

    const isBlocked = blocked.some((b) => b.startAt < slotEnd && b.endAt > slotStart);
    if (isBlocked) continue;

    slots.push(pad(m));
  }

  return slots;
}

function pad(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
