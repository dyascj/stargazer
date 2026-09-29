import type { Launch } from '$lib/launches';

/** Launch Library names read "Vehicle | Mission"; the card leads with the mission. */
export function launchTitle(launch: Launch): { title: string; vehicle: string | undefined } {
  const split = launch.name.indexOf(' | ');
  if (split < 0) return { title: launch.name, vehicle: launch.rocket };
  return {
    title: launch.name.slice(split + 3),
    vehicle: launch.rocket ?? launch.name.slice(0, split)
  };
}

const EXACT = new Set(['Second', 'Minute', 'Hour']);
const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Time to liftoff as the card shows it. A clock to the second only when the provider
 * trusts the time that far; otherwise days, or the month, or nothing at all.
 */
export function countdown(ms: number, precision?: string): { label: string; value: string } {
  if (precision && !EXACT.has(precision)) {
    if (ms <= 0) return { label: 'Liftoff', value: 'Awaiting update' };
    if (precision === 'Day') {
      const days = Math.ceil(ms / 86_400_000);
      return { label: 'Liftoff in', value: days === 1 ? '1 day' : `${days} days` };
    }
    return { label: 'Liftoff', value: 'To be confirmed' };
  }
  const seconds = Math.floor(Math.abs(ms) / 1000);
  const days = Math.floor(seconds / 86_400);
  const clock = `${pad(Math.floor(seconds / 3600) % 24)}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
  const value = `${ms >= 0 ? 'T−' : 'T+'}${days ? `${days}d ` : ''}${clock}`;
  return { label: ms >= 0 ? 'Liftoff in' : 'Since liftoff', value };
}

/** "2026-10-01 12:00", the UTC minute of an ISO time. */
export const utc = (date: string) => new Date(date).toISOString().slice(0, 16).replace('T', ' ');

/** The launch window in UTC, or null when it is instantaneous or unknown. */
export function windowOf({ windowStart, windowEnd }: Launch): string | null {
  if (!windowStart || !windowEnd || windowStart === windowEnd) return null;
  const [start, end] = [utc(windowStart), utc(windowEnd)];
  return `${start} to ${start.slice(0, 10) === end.slice(0, 10) ? end.slice(11) : end} UTC`;
}

export function formatCoordinates({
  latitude,
  longitude
}: {
  latitude: number;
  longitude: number;
}) {
  const lat = `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}`;
  return `${lat}, ${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}`;
}
