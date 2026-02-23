import { logger } from '../lib/logger.js';

const DEBOUNCE_MS = 4_000;

interface PendingBatch {
  texts: string[];
  timer: ReturnType<typeof setTimeout>;
}

const pending = new Map<string, PendingBatch>();

/**
 * Buffers incoming messages per conversation key.
 * Waits DEBOUNCE_MS after the last message, then calls onReady with combined text.
 */
export function bufferMessage(
  key: string,
  text: string,
  onReady: (combinedText: string) => void,
): void {
  const existing = pending.get(key);

  if (existing) {
    existing.texts.push(text);
    clearTimeout(existing.timer);
    existing.timer = setTimeout(() => {
      pending.delete(key);
      const combined = existing.texts.join('\n');
      logger.debug({ key, count: existing.texts.length }, 'Buffer flushed, processing combined message');
      onReady(combined);
    }, DEBOUNCE_MS);
  } else {
    const batch: PendingBatch = {
      texts: [text],
      timer: setTimeout(() => {
        pending.delete(key);
        onReady(batch.texts.join('\n'));
      }, DEBOUNCE_MS),
    };
    pending.set(key, batch);
  }
}

export function getBufferSize(): number {
  return pending.size;
}
