import { prisma } from '../lib/db.js';
import { logger } from '../lib/logger.js';

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const GRACE_PERIOD_MS = 30 * 60 * 1000;
let isDetecting = false;

export function startNoShowDetector() {
  logger.info('No-show detector started');
  setInterval(() => {
    if (isDetecting) return;
    isDetecting = true;
    detectNoShows()
      .catch((err) => logger.error({ err }, 'Error in no-show detector'))
      .finally(() => { isDetecting = false; });
  }, CHECK_INTERVAL_MS);

  setTimeout(() => {
    if (isDetecting) return;
    isDetecting = true;
    detectNoShows()
      .catch((err) => logger.error({ err }, 'Error in initial no-show detection'))
      .finally(() => { isDetecting = false; });
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
