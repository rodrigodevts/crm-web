const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const WINDOW_HOURS = 24;
const WINDOW_MS = WINDOW_HOURS * HOUR_MS;

export type WhatsappWindowState = 'hidden' | 'safe' | 'warning' | 'urgent';

export function whatsappWindowState(
  lastInboundAt: string | null,
  inWhatsappWindow: boolean,
  now: Date = new Date(),
): WhatsappWindowState {
  if (!inWhatsappWindow || lastInboundAt === null) return 'hidden';
  const parsed = new Date(lastInboundAt);
  if (Number.isNaN(parsed.getTime())) return 'hidden';
  const elapsedHours = (now.getTime() - parsed.getTime()) / HOUR_MS;
  const remainingHours = WINDOW_HOURS - elapsedHours;
  if (remainingHours <= 0) return 'hidden';
  if (remainingHours < 1) return 'urgent';
  if (remainingHours <= 6) return 'warning';
  return 'safe';
}

/**
 * Formato HH'h':MM do tempo restante na janela 24h (ex.: "23h:30", "00h:45").
 * Retorna null quando a janela está hidden (expirada ou nunca aberta).
 */
export function whatsappWindowRemainingLabel(
  lastInboundAt: string | null,
  inWhatsappWindow: boolean,
  now: Date = new Date(),
): string | null {
  const state = whatsappWindowState(lastInboundAt, inWhatsappWindow, now);
  if (state === 'hidden') return null;
  const parsed = new Date(lastInboundAt as string); // safe — state !== 'hidden' garante string válida
  const remainingMs = WINDOW_MS - (now.getTime() - parsed.getTime());
  const hours = Math.floor(remainingMs / HOUR_MS);
  const minutes = Math.floor((remainingMs % HOUR_MS) / MINUTE_MS);
  return `${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}`;
}
