import { zonedLocalToUtc } from '@/lib/time/proof-due';

/** Date-only form values are civil days, while the creation RPC accepts instants. */
export const encodePromiseScheduleBoundary = (
  value: string | null,
  boundary: 'start' | 'end',
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
): string | null => {
  if (value === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const instant = zonedLocalToUtc(
    value,
    boundary === 'start' ? '00:00:00' : '23:59:59',
    timeZone
  );
  if (boundary === 'end') instant.setUTCMilliseconds(999);
  return instant.toISOString();
};
