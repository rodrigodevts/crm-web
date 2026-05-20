const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_MS = 365 * DAY_MS;

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatTicketTime(value: Date | string | null, now: Date = new Date()): string {
  if (value === null) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const diff = now.getTime() - d.getTime();
  // Datas no futuro (clock skew ou dados ruins do backend) caem em "agora" —
  // é mais útil do que mostrar "NaN" ou um valor negativo.
  if (diff < 60_000) return 'agora';
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h`;
  if (diff < 2 * DAY_MS) return 'ontem';
  if (diff <= YEAR_MS) return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
