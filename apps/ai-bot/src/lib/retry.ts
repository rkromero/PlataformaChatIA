import { logger } from './logger.js';

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; label?: string } = {},
): Promise<T> {
  const { retries = 3, label = 'operation' } = opts;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
        logger.warn({ attempt, label, delay }, `${label} failed, retrying...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}
