import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasModule } from '@/lib/modules';

function getOpenAIKey(): string {
  return process.env[String('OPENAI_API_KEY')] ?? '';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_TOOL_ROUNDS = 3;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Sandbox no disponible: falta configurar OPENAI_API_KEY en el control-plane.' },
      { status: 503 },
    );
  }

  const body = await request.json();
  const message = (body.message as string)?.trim();
  const history = (body.history as ChatMessage[]) ?? [];

  if (!message) {
    return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
  }

  const [settings, knowledgeEntries, tenant] = await Promise.all([
    prisma.aiSettings.findUnique({
      where: { tenantId: session.tenantId },
    }),
    prisma.knowledgeEntry.findMany({
      where: { tenantId: session.tenantId, enabled: true },
      select: { category: true, title: true, content: true },
    }),
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { modulesJson: true },
    }),
  ]);

  if (!settings) {
    return NextResponse.json({ error: 'No hay configuración de AI. Completá el onboarding primero.' }, { status: 400 });
  }

  let systemPrompt = settings.systemPrompt;

  if (knowledgeEntries.length > 0) {
    const knowledgeContext = buildKnowledgeContext(knowledgeEntries, message);
    if (knowledgeContext) {
      systemPrompt += knowledgeContext;
    }
  }

  const calendarEnabled = hasModule(tenant?.modulesJson, 'calendar');
  let tools: Record<string, unknown>[] | undefined;

  if (calendarEnabled) {
    const services = await prisma.calendarService.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      select: { name: true },
      take: 20,
    });
    const serviceNames = services.map((s) => s.name).join(', ');

    const today = new Date().toISOString().slice(0, 10);
    const weekday = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date().getDay()];

    systemPrompt += `\n\n---\nSISTEMA DE TURNOS: Este negocio tiene un sistema de turnos online.\nFecha actual: ${today} (${weekday}).\nServicios disponibles: ${serviceNames || '(ninguno configurado)'}\nCuando el cliente quiera agendar, consultar, cancelar o reprogramar un turno, usá las tools disponibles.\nSiempre confirmá los datos con el cliente antes de agendar.\nMostrá los horarios disponibles de forma clara y amigable.\nCuando el cliente diga "el próximo lunes", "mañana", etc., calculá la fecha correcta basándote en la fecha actual.\n---`;

    tools = calendarToolDefs;
  }

  const messages: Array<Record<string, unknown>> = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  try {
    let reply = '';
    let lastAssistantText = '';
    let rounds = 0;

    while (rounds <= MAX_TOOL_ROUNDS) {
      const openaiBody: Record<string, unknown> = {
        model: settings.model,
        messages,
        max_tokens: 600,
      };
      if (tools && tools.length > 0) {
        openaiBody.tools = tools;
        openaiBody.tool_choice = 'auto';
      }

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(openaiBody),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('OpenAI error (round', rounds, '):', res.status, text);
        if (lastAssistantText) {
          return NextResponse.json({ reply: lastAssistantText });
        }
        return NextResponse.json({ error: 'Error al generar respuesta de IA' }, { status: 502 });
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;
      const toolCalls = msg?.tool_calls;

      if (msg?.content) {
        lastAssistantText = msg.content;
      }

      if (toolCalls && toolCalls.length > 0) {
        const sanitized: Record<string, unknown> = {
          role: 'assistant',
          tool_calls: toolCalls.map((tc: { id: string; type: string; function: { name: string; arguments: string } }) => ({
            id: tc.id,
            type: tc.type,
            function: { name: tc.function.name, arguments: tc.function.arguments },
          })),
        };
        if (msg.content) sanitized.content = msg.content;
        messages.push(sanitized);

        for (const tc of toolCalls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments || '{}');
          } catch {
            console.error('Failed to parse tool arguments:', tc.function.arguments);
          }
          const result = await executeCalendarTool(
            tc.function.name,
            args,
            session.tenantId,
          );
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: result,
          });
        }

        rounds++;
        continue;
      }

      reply = msg?.content ?? 'No se pudo generar una respuesta.';
      break;
    }

    if (!reply) {
      reply = lastAssistantText || 'Lo siento, no pude procesar la solicitud.';
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Sandbox OpenAI call failed:', err);
    return NextResponse.json({ error: 'Error de conexión con OpenAI' }, { status: 502 });
  }
}

// ── Calendar tool definitions ──

const calendarToolDefs = [
  {
    type: 'function',
    function: {
      name: 'list_services',
      description: 'Lista los servicios disponibles para agendar un turno.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Consulta horarios disponibles para un servicio en una fecha. Podés usar service_id o service_name.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'UUID del servicio (si lo tenés).' },
          service_name: { type: 'string', description: 'Nombre del servicio (alternativa a service_id).' },
          date: { type: 'string', description: 'Fecha YYYY-MM-DD.' },
          professional_id: { type: 'string', description: 'UUID del profesional (opcional).' },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Agenda un nuevo turno. Podés usar service_name en vez de service_id, y professional_name en vez de professional_id. Si no indicás profesional, se asigna automáticamente.',
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'UUID del servicio (si lo tenés).' },
          service_name: { type: 'string', description: 'Nombre del servicio (alternativa a service_id).' },
          professional_id: { type: 'string', description: 'UUID del profesional (si lo tenés).' },
          professional_name: { type: 'string', description: 'Nombre del profesional (alternativa a professional_id).' },
          date: { type: 'string', description: 'Fecha YYYY-MM-DD.' },
          time: { type: 'string', description: 'Hora HH:MM (24h).' },
          client_name: { type: 'string', description: 'Nombre del cliente.' },
          client_phone: { type: 'string', description: 'Teléfono (opcional).' },
          notes: { type: 'string', description: 'Notas (opcional).' },
        },
        required: ['date', 'time', 'client_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_appointment',
      description: 'Cancela un turno existente. Podés usar appointment_id o client_name para buscarlo.',
      parameters: {
        type: 'object',
        properties: {
          appointment_id: { type: 'string', description: 'UUID del turno (si lo tenés).' },
          client_name: { type: 'string', description: 'Nombre del cliente para buscar su turno (alternativa).' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_appointment',
      description: 'Reprograma un turno existente. Podés usar appointment_id o client_name para buscarlo.',
      parameters: {
        type: 'object',
        properties: {
          appointment_id: { type: 'string', description: 'UUID del turno (si lo tenés).' },
          client_name: { type: 'string', description: 'Nombre del cliente para buscar su turno (alternativa).' },
          new_date: { type: 'string', description: 'Nueva fecha YYYY-MM-DD.' },
          new_time: { type: 'string', description: 'Nueva hora HH:MM (24h).' },
        },
        required: ['new_date', 'new_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_appointments',
      description: 'Obtiene los próximos turnos agendados.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

// ── Calendar tool execution ──

async function executeCalendarTool(
  name: string,
  args: Record<string, unknown>,
  tenantId: string,
): Promise<string> {
  switch (name) {
    case 'list_services':
      return listServices(tenantId);
    case 'check_availability':
      return checkAvailability(tenantId, args);
    case 'book_appointment':
      return bookAppointment(tenantId, args);
    case 'cancel_appointment':
      return cancelAppointment(tenantId, args);
    case 'reschedule_appointment':
      return rescheduleAppointment(tenantId, args);
    case 'get_my_appointments':
      return getAppointments(tenantId);
    default:
      return JSON.stringify({ error: `Tool "${name}" desconocida.` });
  }
}

async function resolveService(tenantId: string, args: Record<string, unknown>) {
  const serviceId = args.service_id as string | undefined;
  const serviceName = args.service_name as string | undefined;

  if (serviceId) {
    const svc = await prisma.calendarService.findFirst({ where: { id: serviceId, tenantId, isActive: true } });
    if (svc) return svc;
  }

  if (serviceName) {
    const svc = await prisma.calendarService.findFirst({
      where: { tenantId, isActive: true, name: { contains: serviceName, mode: 'insensitive' } },
    });
    if (svc) return svc;
  }

  if (!serviceId && !serviceName) {
    const all = await prisma.calendarService.findMany({ where: { tenantId, isActive: true }, take: 1 });
    return all[0] ?? null;
  }

  return null;
}

async function resolveProfessional(tenantId: string, serviceId: string, args: Record<string, unknown>) {
  const profId = args.professional_id as string | undefined;
  const profName = args.professional_name as string | undefined;

  if (profId) {
    const ps = await prisma.calendarProfessionalService.findFirst({
      where: { serviceId, professionalId: profId },
      include: { professional: { select: { id: true, name: true } } },
    });
    if (ps) return ps.professional;
  }

  if (profName) {
    const ps = await prisma.calendarProfessionalService.findFirst({
      where: { serviceId, professional: { name: { contains: profName, mode: 'insensitive' } } },
      include: { professional: { select: { id: true, name: true } } },
    });
    if (ps) return ps.professional;
  }

  const first = await prisma.calendarProfessionalService.findFirst({
    where: { serviceId },
    include: { professional: { select: { id: true, name: true } } },
  });
  return first?.professional ?? null;
}

async function listServices(tenantId: string): Promise<string> {
  const services = await prisma.calendarService.findMany({
    where: { tenantId, isActive: true },
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
  tenantId: string,
  args: Record<string, unknown>,
): Promise<string> {
  const dateStr = args.date as string;
  const prefProfId = args.professional_id as string | undefined;

  const service = await resolveService(tenantId, args);
  if (!service) return JSON.stringify({ error: 'Servicio no encontrado. Usá list_services para ver los disponibles.' });

  const config = await prisma.calendarConfig.findUnique({ where: { tenantId } });
  const buffer = config?.slotBufferMinutes ?? 15;

  const professionals = await prisma.calendarProfessionalService.findMany({
    where: { serviceId: service.id, ...(prefProfId ? { professionalId: prefProfId } : {}) },
    include: { professional: { select: { id: true, name: true } } },
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

    const [blocked, existing] = await Promise.all([
      prisma.calendarBlockedTime.findMany({
        where: { professionalId: profId, startAt: { lt: dayEnd }, endAt: { gt: dayStart } },
      }),
      prisma.appointment.findMany({
        where: { professionalId: profId, startAt: { gte: dayStart, lt: dayEnd }, status: { notIn: ['cancelled'] } },
        select: { startAt: true, endAt: true },
      }),
    ]);

    console.log('[Sandbox check_availability]', { profId, dateStr, blockedCount: blocked.length, existingCount: existing.length, blocked: blocked.map(b => ({ start: b.startAt.toISOString(), end: b.endAt.toISOString(), reason: b.reason })) });

    const slots = generateSlots(
      dateStr, schedule.startTime, schedule.endTime,
      schedule.breakStart, schedule.breakEnd,
      service.durationMinutes, buffer,
      existing, blocked.map((b) => ({ startAt: b.startAt, endAt: b.endAt })),
    );

    if (slots.length > 0) {
      result.push({
        professional_id: profId,
        professional_name: ps.professional.name || 'Profesional',
        slots,
      });
    }
  }

  if (result.length === 0) {
    return JSON.stringify({ message: `No hay horarios disponibles el ${dateStr} para "${service.name}".` });
  }
  return JSON.stringify({ date: dateStr, availability: result });
}

async function bookAppointment(
  tenantId: string,
  args: Record<string, unknown>,
): Promise<string> {
  const dateStr = args.date as string;
  const timeStr = args.time as string;
  const clientName = (args.client_name as string) || 'Cliente Sandbox';
  const notes = (args.notes as string) || null;

  const service = await resolveService(tenantId, args);
  if (!service) return JSON.stringify({ error: 'Servicio no encontrado. Usá list_services para ver los disponibles.' });

  const professional = await resolveProfessional(tenantId, service.id, args);
  if (!professional) return JSON.stringify({ error: 'No hay profesionales asignados a este servicio.' });

  const startAt = new Date(`${dateStr}T${timeStr}:00.000Z`);
  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);

  const [overlap, blocked] = await Promise.all([
    prisma.appointment.findFirst({
      where: { professionalId: professional.id, status: { notIn: ['cancelled'] }, startAt: { lt: endAt }, endAt: { gt: startAt } },
    }),
    prisma.calendarBlockedTime.findFirst({
      where: { professionalId: professional.id, startAt: { lt: endAt }, endAt: { gt: startAt } },
    }),
  ]);
  if (overlap) return JSON.stringify({ error: 'Ese horario ya está ocupado.' });
  if (blocked) return JSON.stringify({ error: `El profesional no está disponible${blocked.reason ? `: ${blocked.reason}` : ''}.` });

  const appointment = await prisma.appointment.create({
    data: { tenantId, serviceId: service.id, professionalId: professional.id, clientName, startAt, endAt, source: 'chat_ai', notes },
    include: { service: { select: { name: true } }, professional: { select: { name: true } } },
  });

  return JSON.stringify({
    success: true,
    appointment_id: appointment.id,
    service: appointment.service.name,
    professional: appointment.professional.name || 'Profesional',
    date: dateStr,
    time: timeStr,
  });
}

async function resolveAppointment(tenantId: string, args: Record<string, unknown>) {
  const appointmentId = args.appointment_id as string | undefined;
  const clientName = args.client_name as string | undefined;

  if (appointmentId) {
    const a = await prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId, status: { notIn: ['cancelled', 'completed'] } },
      include: { service: true },
    });
    if (a) return a;
  }

  if (clientName) {
    const a = await prisma.appointment.findFirst({
      where: {
        tenantId,
        clientName: { contains: clientName, mode: 'insensitive' },
        status: { notIn: ['cancelled', 'completed'] },
        startAt: { gte: new Date() },
      },
      include: { service: true },
      orderBy: { startAt: 'asc' },
    });
    if (a) return a;
  }

  return null;
}

async function cancelAppointment(
  tenantId: string,
  args: Record<string, unknown>,
): Promise<string> {
  const appointment = await resolveAppointment(tenantId, args);
  if (!appointment) return JSON.stringify({ error: 'Turno no encontrado o ya cancelado.' });

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: 'cancelled' },
  });

  return JSON.stringify({ success: true, message: 'Turno cancelado correctamente.' });
}

async function rescheduleAppointment(
  tenantId: string,
  args: Record<string, unknown>,
): Promise<string> {
  const newDate = args.new_date as string;
  const newTime = args.new_time as string;

  const appointment = await resolveAppointment(tenantId, args);
  if (!appointment) return JSON.stringify({ error: 'Turno no encontrado o ya cancelado.' });

  const newStart = new Date(`${newDate}T${newTime}:00.000Z`);
  const newEnd = new Date(newStart.getTime() + appointment.service.durationMinutes * 60_000);

  const [overlap, blocked] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        professionalId: appointment.professionalId,
        id: { not: appointment.id },
        status: { notIn: ['cancelled'] },
        startAt: { lt: newEnd },
        endAt: { gt: newStart },
      },
    }),
    prisma.calendarBlockedTime.findFirst({
      where: { professionalId: appointment.professionalId, startAt: { lt: newEnd }, endAt: { gt: newStart } },
    }),
  ]);
  if (overlap) return JSON.stringify({ error: 'El nuevo horario ya está ocupado.' });
  if (blocked) return JSON.stringify({ error: `El profesional no está disponible${blocked.reason ? `: ${blocked.reason}` : ''}.` });

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { startAt: newStart, endAt: newEnd },
  });

  return JSON.stringify({ success: true, new_date: newDate, new_time: newTime });
}

async function getAppointments(tenantId: string): Promise<string> {
  const appointments = await prisma.appointment.findMany({
    where: { tenantId, startAt: { gte: new Date() }, status: { notIn: ['cancelled', 'completed', 'no_show'] } },
    include: { service: { select: { name: true } }, professional: { select: { name: true } } },
    orderBy: { startAt: 'asc' },
    take: 10,
  });
  if (appointments.length === 0) {
    return JSON.stringify({ message: 'No hay turnos próximos agendados.' });
  }
  return JSON.stringify(
    appointments.map((a) => ({
      appointment_id: a.id,
      service: a.service.name,
      professional: a.professional.name || 'Profesional',
      date: a.startAt.toISOString().slice(0, 10),
      time: a.startAt.toISOString().slice(11, 16),
      status: a.status,
      client: a.clientName,
    })),
  );
}

// ── Helpers ──

function generateSlots(
  dateStr: string, startTime: string, endTime: string,
  breakStart: string | null, breakEnd: string | null,
  durationMin: number, bufferMin: number,
  booked: Array<{ startAt: Date; endAt: Date }>,
  blocked: Array<{ startAt: Date; endAt: Date }>,
): string[] {
  const slots: string[] = [];
  const step = durationMin + bufferMin;
  const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

  const dayStartMin = toMin(startTime);
  const dayEndMin = toMin(endTime);
  const breakStartMin = breakStart ? toMin(breakStart) : null;
  const breakEndMin = breakEnd ? toMin(breakEnd) : null;

  for (let m = dayStartMin; m + durationMin <= dayEndMin; m += step) {
    if (breakStartMin !== null && breakEndMin !== null && m < breakEndMin && m + durationMin > breakStartMin) continue;
    const slotStart = new Date(`${dateStr}T${pad(m)}:00.000Z`);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60_000);
    if (booked.some((b) => b.startAt < slotEnd && b.endAt > slotStart)) continue;
    if (blocked.some((b) => b.startAt < slotEnd && b.endAt > slotStart)) continue;
    slots.push(pad(m));
  }
  return slots;
}

function pad(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildKnowledgeContext(
  entries: Array<{ category: string; title: string; content: string }>,
  query: string,
): string {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return '';

  const scored = entries.map((entry) => {
    const entryTokens = tokenize(`${entry.title} ${entry.content}`);
    const matches = queryTokens.filter((t) => entryTokens.includes(t)).length;
    return { entry, score: matches };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5).filter((s) => s.score > 0);

  if (top.length === 0) {
    const fallback = entries.slice(0, 3);
    if (fallback.length === 0) return '';
    return formatContext(fallback);
  }

  return formatContext(top.map((s) => s.entry));
}

function formatContext(entries: Array<{ category: string; title: string; content: string }>): string {
  const lines = entries.map((e) => `[${e.category}] ${e.title}: ${e.content}`);
  return `\n\n--- Base de conocimiento ---\n${lines.join('\n')}\n--- Fin ---`;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\W+/)
    .filter((t) => t.length > 2);
}
