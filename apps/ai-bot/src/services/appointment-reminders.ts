import { prisma } from '../lib/db.js';
import { logger } from '../lib/logger.js';
import { sendMessage as sendBaileysMessage } from './baileys-manager.js';
import { sendMessage as sendChatwootMessage } from './chatwoot.js';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
let isProcessing = false;

export function startReminderLoop() {
  logger.info('Appointment reminder loop started');
  setInterval(() => {
    if (isProcessing) return;
    isProcessing = true;
    processReminders()
      .catch((err) => logger.error({ err }, 'Error in reminder loop'))
      .finally(() => { isProcessing = false; });
  }, CHECK_INTERVAL_MS);

  setTimeout(() => {
    if (isProcessing) return;
    isProcessing = true;
    processReminders()
      .catch((err) => logger.error({ err }, 'Error in initial reminder run'))
      .finally(() => { isProcessing = false; });
  }, 10_000);
}

async function processReminders() {
  const configs = await prisma.calendarConfig.findMany({
    where: { reminderChannel: { not: null } },
    take: 100,
    select: {
      tenantId: true,
      reminderChannel: true,
      reminderMinutes1: true,
      reminderMinutes2: true,
    },
  });

  for (const config of configs) {
    await Promise.all([
      processReminder1(config),
      config.reminderMinutes2 != null ? processReminder2(config) : null,
    ]);
  }
}

interface ReminderConfig {
  tenantId: string;
  reminderChannel: string | null;
  reminderMinutes1: number;
  reminderMinutes2: number | null;
}

async function processReminder1(config: ReminderConfig) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + config.reminderMinutes1 * 60_000);

  const appointments = await findAppointments(config.tenantId, now, windowEnd, 'reminderSentAt');
  if (appointments.length === 0) return;

  const label = formatMinutes(config.reminderMinutes1);
  logger.info({ count: appointments.length, tenantId: config.tenantId, advance: label }, 'Processing reminder 1');

  for (const appt of appointments) {
    const sent = await sendReminder(appt, config.reminderChannel!, label);
    if (sent) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSentAt: new Date() },
      });
    }
  }
}

async function processReminder2(config: ReminderConfig) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + config.reminderMinutes2! * 60_000);

  const appointments = await findAppointments(config.tenantId, now, windowEnd, 'reminder2SentAt');
  if (appointments.length === 0) return;

  const label = formatMinutes(config.reminderMinutes2!);
  logger.info({ count: appointments.length, tenantId: config.tenantId, advance: label }, 'Processing reminder 2');

  for (const appt of appointments) {
    const sent = await sendReminder(appt, config.reminderChannel!, label);
    if (sent) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminder2SentAt: new Date() },
      });
    }
  }
}

async function findAppointments(
  tenantId: string,
  now: Date,
  windowEnd: Date,
  sentField: 'reminderSentAt' | 'reminder2SentAt',
) {
  return prisma.appointment.findMany({
    where: {
      tenantId,
      status: { in: ['pending', 'confirmed'] },
      startAt: { gt: now, lte: windowEnd },
      [sentField]: null,
    },
    take: 200,
    include: {
      service: { select: { name: true } },
      professional: { select: { name: true } },
      tenant: {
        select: {
          id: true,
          name: true,
          chatwootAccountId: true,
        },
      },
      conversationLink: {
        select: {
          id: true,
          wahaChatId: true,
          chatwootConversationId: true,
          source: true,
        },
      },
    },
  });
}

type AppointmentWithRelations = Awaited<ReturnType<typeof findAppointments>>[number];

async function sendReminder(
  appt: AppointmentWithRelations,
  channel: string,
  advanceLabel: string,
): Promise<boolean> {
  try {
    const timeStr = appt.startAt.toISOString().slice(11, 16);
    const dateStr = appt.startAt.toISOString().slice(0, 10);
    const profName = appt.professional.name || 'tu profesional';

    const message = [
      `📅 *Recordatorio de turno*`,
      ``,
      `Hola ${appt.clientName}, te recordamos tu turno en ${advanceLabel}:`,
      `• Servicio: ${appt.service.name}`,
      `• Profesional: ${profName}`,
      `• Fecha: ${dateStr}`,
      `• Hora: ${timeStr}`,
      ``,
      `Si necesitás cancelar o reprogramar, avisanos por este medio.`,
      `¡Te esperamos! — ${appt.tenant.name}`,
    ].join('\n');

    if (channel === 'whatsapp_qr') {
      return await trySendViaBaileys(appt, message);
    } else if (channel === 'whatsapp') {
      return await trySendViaChatwoot(appt, message);
    }
    return false;
  } catch (err) {
    logger.error({ err, appointmentId: appt.id }, 'Error sending reminder');
    return false;
  }
}

async function trySendViaBaileys(appt: AppointmentWithRelations, message: string): Promise<boolean> {
  const chatId =
    appt.conversationLink?.wahaChatId ??
    (appt.clientPhone
      ? appt.clientPhone.includes('@') ? appt.clientPhone : `${appt.clientPhone}@s.whatsapp.net`
      : null);

  if (!chatId) return false;

  try {
    await sendBaileysMessage(appt.tenant.id, chatId, message);
    return true;
  } catch (err) {
    logger.warn({ err, appointmentId: appt.id }, 'Failed to send reminder via Baileys');
    return false;
  }
}

async function trySendViaChatwoot(appt: AppointmentWithRelations, message: string): Promise<boolean> {
  if (!appt.conversationLink?.chatwootConversationId || !appt.tenant.chatwootAccountId) return false;

  try {
    await sendChatwootMessage(
      appt.tenant.chatwootAccountId,
      appt.conversationLink.chatwootConversationId,
      message,
    );
    return true;
  } catch (err) {
    logger.warn({ err, appointmentId: appt.id }, 'Failed to send reminder via Chatwoot');
    return false;
  }
}

function formatMinutes(mins: number): string {
  if (mins >= 1440) return `${Math.round(mins / 1440)} día${mins >= 2880 ? 's' : ''}`;
  if (mins >= 60) return `${Math.round(mins / 60)} hora${mins >= 120 ? 's' : ''}`;
  return `${mins} minutos`;
}
