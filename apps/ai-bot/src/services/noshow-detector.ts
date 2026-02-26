import { prisma } from '../lib/db.js';
import { logger } from '../lib/logger.js';

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes
const GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes after endAt

export function startNoShowDetector() {
  logger.info('No-show detector started');
  setInterval(() => {
    detectNoShows().catch((err) =>
      logger.error({ err }, 'Error in no-show detector'),
    );
  }, CHECK_INTERVAL_MS);

  setTimeout(() => {
    detectNoShows().catch((err) =>
      logger.error({ err }, 'Error in initial no-show detection'),
    );
  }, 30_000);
}

async function detectNoShows() {
  const cutoff = new Date(Date.now() - GRACE_PERIOD_MS);

  const result = await prisma.appointment.updateMany({
    where: {
      status: 'confirmed',
      endAt: { lt: cutoff },
    },
    data: { status: 'no_show' },
  });

  if (result.count > 0) {
    logger.info({ count: result.count }, 'Appointments marked as no-show');
  }
}
