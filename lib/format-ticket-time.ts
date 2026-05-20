const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_MS = 365 * DAY_MS;

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatTicketTime(value: Date | string | null, now: Date = new Date()): string {
  if (value === null) return '';
  const d = value instanceof Date ? value : new Date(value);
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'agora';
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h`;
  if (diff < 2 * DAY_MS) return 'ontem';
  if (diff <= YEAR_MS) return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
