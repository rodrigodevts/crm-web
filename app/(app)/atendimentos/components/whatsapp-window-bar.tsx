'use client';

import { whatsappWindowState, type WhatsappWindowState } from '@/lib/whatsapp-window';

interface WhatsappWindowBarProps {
  lastInboundAt: string | null;
  inWhatsappWindow: boolean;
}

const COLOR_BY_STATE: Record<
  Exclude<WhatsappWindowState, 'hidden'>,
  { bg: string; width: string }
> = {
  safe: { bg: 'bg-emerald-500', width: '100%' },
  warning: { bg: 'bg-amber-500', width: '40%' },
  urgent: { bg: 'bg-rose-500 motion-safe:animate-pulse', width: '15%' },
};

const LABEL_BY_STATE: Record<Exclude<WhatsappWindowState, 'hidden'>, string> = {
  safe: 'Janela do WhatsApp: tempo confortável',
  warning: 'Janela do WhatsApp: menos de 6 horas',
  urgent: 'Janela do WhatsApp: menos de 1 hora',
};

export function WhatsappWindowBar({ lastInboundAt, inWhatsappWindow }: WhatsappWindowBarProps) {
  const state = whatsappWindowState(lastInboundAt, inWhatsappWindow);
  if (state === 'hidden') return null;
  const { bg, width } = COLOR_BY_STATE[state];
  return (
    <div
      role="presentation"
      aria-label={LABEL_BY_STATE[state]}
      className="bg-border h-1 w-full overflow-hidden rounded-full"
    >
      <div className={`h-full ${bg}`} style={{ width }} />
    </div>
  );
}
