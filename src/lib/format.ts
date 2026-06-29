/**
 * Formats a duration in seconds as a compact clock string: `m:ss` under an hour
 * (e.g. `4:07`) and `h:mm:ss` once it passes one (e.g. `1:02:09`). Negative or
 * non-finite inputs clamp to `0:00`.
 */
export function formatDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/**
 * Formats an accumulated study time for a stat: `Xh Ym` once it passes an hour,
 * `Ym` above a minute, else `Zs`. Uses the universal h/m/s abbreviations so it
 * needs no translation.
 */
export function formatStudyTime(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${safe}s`;
}
