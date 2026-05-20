const HOUR_MS = 60 * 60 * 1000;
const WINDOW_HOURS = 24;

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
