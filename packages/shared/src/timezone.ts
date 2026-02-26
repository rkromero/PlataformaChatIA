/**
 * Convert a local date+time string to a UTC Date object using a specific timezone.
 *
 * Example: localToUtc('2026-03-04', '09:00', 'America/Argentina/Buenos_Aires')
 *  → Date representing 2026-03-04T12:00:00.000Z (because Argentina is UTC-3)
 */
export function localToUtc(dateStr: string, timeStr: string, timezone: string): Date {
  const guess = new Date(`${dateStr}T${timeStr}:00.000Z`);

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = fmt.formatToParts(guess);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';

  const localIso = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}.000Z`;
  const localAsUtc = new Date(localIso);

  const offsetMs = guess.getTime() - localAsUtc.getTime();
  return new Date(guess.getTime() + offsetMs);
}

/**
 * Convert a datetime-local input value (e.g. "2026-03-04T09:00") to a UTC Date,
 * treating the input as local time in the given timezone.
 */
export function datetimeLocalToUtc(datetimeLocal: string, timezone: string): Date {
  const [datePart, timePart] = datetimeLocal.split('T');
  const time = timePart?.slice(0, 5) ?? '00:00';
  return localToUtc(datePart, time, timezone);
}

/**
 * Format a UTC Date to a local time string (HH:MM) in the given timezone.
 */
export function utcToLocalTime(date: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = fmt.formatToParts(date);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${h}:${m}`;
}

/**
 * Format a UTC Date to a localized display string in the given timezone.
 */
export function utcToLocalDisplay(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
