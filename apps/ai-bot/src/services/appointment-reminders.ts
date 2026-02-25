import { prisma } from '../lib/db.js';
import { logger } from '../lib/logger.js';
import { sendMessage as sendBaileysMessage } from './baileys-manager.js';
import { sendMessage as sendChatwootMessage } from './chatwoot.js';

const REMINDER_ADVANCE_MS = 60 * 60 * 1000; // 1 hour before
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

export function startReminderLoop() {
  logger.info('Appointment reminder loop started');
  setInterval(() => {
    processReminders().catch((err) =>
      logger.error({ err }, 'Error in reminder loop'),
    );
  }, CHECK_INTERVAL_MS);

  setTimeout(() => {
    processReminders().catch((err) =>
      logger.error({ err }, 'Error in initial reminder run'),
    );
  }, 10_000);
}

async function processReminders() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_ADVANCE_MS);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: { in: ['pending', 'confirmed'] },
      startAt: { gt: now, lte: windowEnd },
      reminderSentAt: null,
    },
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

  if (appointments.length === 0) return;

  logger.info({ count: appointments.length }, 'Processing appointment reminders');

  for (const appt of appointments) {
    try {
      const timeStr = appt.startAt.toISOString().slice(11, 16);
      const dateStr = appt.startAt.toISOString().slice(0, 10);
      const profName = appt.professional.name || 'tu profesional';

      const message = [
        `📅 *Recordatorio de turno*`,
        ``,
        `Hola ${appt.clientName}, te recordamos tu turno:`,
        `• Servicio: ${appt.service.name}`,
        `• Profesional: ${profName}`,
        `• Fecha: ${dateStr}`,
        `• Hora: ${timeStr}`,
        ``,
        `Si necesitás cancelar o reprogramar, avisanos por este medio.`,
        `¡Te esperamos! — ${appt.tenant.name}`,
      ].join('\n');

      let sent = false;

      if (appt.conversationLink?.wahaChatId) {
        try {
          await sendBaileysMessage(
            appt.tenant.id,
            appt.conversationLink.wahaChatId,
            message,
          );
          sent = true;
        } catch (err) {
          logger.warn(
            { err, appointmentId: appt.id },
            'Failed to send reminder via Baileys, trying Chatwoot',
          );
        }
      }

      if (
        !sent &&
        appt.conversationLink?.chatwootConversationId &&
        appt.tenant.chatwootAccountId
      ) {
        try {
          await sendChatwootMessage(
            appt.tenant.chatwootAccountId,
            appt.conversationLink.chatwootConversationId,
            message,
          );
          sent = true;
        } catch (err) {
          logger.warn(
            { err, appointmentId: appt.id },
            'Failed to send reminder via Chatwoot',
          );
        }
      }

      if (!sent && appt.clientPhone) {
        const chatId = appt.clientPhone.includes('@')
          ? appt.clientPhone
          : `${appt.clientPhone}@s.whatsapp.net`;
        try {
          await sendBaileysMessage(appt.tenant.id, chatId, message);
          sent = true;
        } catch (err) {
          logger.warn(
            { err, appointmentId: appt.id, phone: appt.clientPhone },
            'Failed to send reminder via phone fallback',
          );
        }
      }

      if (sent) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminderSentAt: new Date() },
        });
        logger.info({ appointmentId: appt.id }, 'Reminder sent');
      } else {
        logger.warn({ appointmentId: appt.id }, 'Could not send reminder via any channel');
      }
    } catch (err) {
      logger.error({ err, appointmentId: appt.id }, 'Error processing reminder');
    }
  }
}
