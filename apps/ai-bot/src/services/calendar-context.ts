import { prisma } from '../lib/db.js';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { calendarToolDefs } from './calendar-tools.js';

interface CalendarContext {
  enabled: boolean;
  tools: ChatCompletionTool[];
  promptAddendum: string;
}

export async function getCalendarContext(tenantId: string): Promise<CalendarContext> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { modulesJson: true },
  });

  const modules = (tenant?.modulesJson ?? {}) as Record<string, unknown>;
  if (!modules.calendar) {
    return { enabled: false, tools: [], promptAddendum: '' };
  }

  const services = await prisma.calendarService.findMany({
    where: { tenantId, isActive: true },
    select: { name: true },
    take: 20,
  });

  const serviceNames = services.map((s) => s.name).join(', ');

  const promptAddendum = `

---
SISTEMA DE TURNOS: Este negocio tiene un sistema de turnos online.
Servicios disponibles: ${serviceNames || '(ninguno configurado)'}
Cuando el cliente quiera agendar, consultar, cancelar o reprogramar un turno,
usá las tools disponibles (list_services, check_availability, book_appointment,
cancel_appointment, reschedule_appointment, get_my_appointments).
Siempre confirmá los datos con el cliente antes de agendar.
Mostrá los horarios disponibles de forma clara y amigable.
---`;

  return {
    enabled: true,
    tools: calendarToolDefs,
    promptAddendum,
  };
}
