import { logger } from '../lib/logger.js';

const DEFAULT_DEBOUNCE_MS = 4_000;

interface PendingBatch {
  texts: string[];
  timer: ReturnType<typeof setTimeout>;
}

const pending = new Map<string, PendingBatch>();

export function bufferMessage(
  key: string,
  text: string,
  onReady: (combinedText: string) => void,
  debounceMs = DEFAULT_DEBOUNCE_MS,
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
    }, debounceMs);
  } else {
    const batch: PendingBatch = {
      texts: [text],
      timer: setTimeout(() => {
        pending.delete(key);
        onReady(batch.texts.join('\n'));
      }, debounceMs),
    };
    pending.set(key, batch);
  }
}

export function getBufferSize(): number {
  return pending.size;
}
