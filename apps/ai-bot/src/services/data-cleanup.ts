import { prisma } from '../lib/db.js';
import { logger } from '../lib/logger.js';

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // daily
const MESSAGE_RETENTION_DAYS = 90;
const BATCH_SIZE = 1000;

let isRunning = false;

export function startDataCleanup() {
  logger.info('Data cleanup scheduler started');

  setInterval(() => {
    if (isRunning) return;
    isRunning = true;
    runCleanup()
      .catch((err) => logger.error({ err }, 'Error in data cleanup'))
      .finally(() => { isRunning = false; });
  }, CHECK_INTERVAL_MS);

  setTimeout(() => {
    if (isRunning) return;
    isRunning = true;
    runCleanup()
      .catch((err) => logger.error({ err }, 'Error in initial data cleanup'))
      .finally(() => { isRunning = false; });
  }, 60_000);
}

async function runCleanup() {
  await archiveOldMessages();
  await cleanupOrphanedBaileysAuth();
}

async function archiveOldMessages() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MESSAGE_RETENTION_DAYS);

  const result = await prisma.message.deleteMany({
    where: {
      timestamp: { lt: cutoff },
      conversationLink: {
        source: 'whatsapp_qr',
      },
    },
  });

  if (result.count > 0) {
    logger.info({ count: result.count, cutoffDays: MESSAGE_RETENTION_DAYS }, 'Archived old WhatsApp QR messages');
  }
}

async function cleanupOrphanedBaileysAuth() {
  const activeTenants = await prisma.tenantChannel.findMany({
    where: { type: 'whatsapp_qr' },
    select: { tenantId: true },
  });
  const activeIds = new Set(activeTenants.map((t) => t.tenantId));

  const allAuth = await prisma.baileysAuth.findMany({
    select: { tenantId: true },
    distinct: ['tenantId'],
  });

  const orphanedTenants = allAuth
    .map((a) => a.tenantId)
    .filter((id) => !activeIds.has(id));

  if (orphanedTenants.length > 0) {
    const result = await prisma.baileysAuth.deleteMany({
      where: { tenantId: { in: orphanedTenants } },
    });
    logger.info({ count: result.count, tenants: orphanedTenants.length }, 'Cleaned up orphaned Baileys auth data');
  }
}
