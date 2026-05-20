'use client';

import {
  whatsappWindowRemainingLabel,
  whatsappWindowState,
  type WhatsappWindowState,
} from '@/lib/whatsapp-window';
import { cn } from '@/lib/utils';

interface WhatsappWindowBarProps {
  lastInboundAt: string | null;
  inWhatsappWindow: boolean;
}

type VisibleState = Exclude<WhatsappWindowState, 'hidden'>;

const COLOR_BY_STATE: Record<VisibleState, { bg: string; width: string }> = {
  safe: { bg: 'bg-emerald-500', width: '100%' },
  warning: { bg: 'bg-amber-500', width: '40%' },
  urgent: { bg: 'bg-rose-500 motion-safe:animate-pulse', width: '15%' },
};

const LABEL_TEXT_COLOR: Record<VisibleState, string> = {
  safe: 'text-muted-foreground',
  warning: 'text-amber-600 dark:text-amber-500',
  urgent: 'text-destructive',
};

const ARIA_BY_STATE: Record<VisibleState, string> = {
  safe: 'Janela do WhatsApp: tempo confortável',
  warning: 'Janela do WhatsApp: menos de 6 horas',
  urgent: 'Janela do WhatsApp: menos de 1 hora',
};

export function WhatsappWindowBar({ lastInboundAt, inWhatsappWindow }: WhatsappWindowBarProps) {
  const state = whatsappWindowState(lastInboundAt, inWhatsappWindow);
  if (state === 'hidden') return null;
  const { bg, width } = COLOR_BY_STATE[state];
  const label = whatsappWindowRemainingLabel(lastInboundAt, inWhatsappWindow);
  return (
    <div className="flex items-center gap-2" role="presentation" aria-label={ARIA_BY_STATE[state]}>
      <div className="bg-border h-1 flex-1 overflow-hidden rounded-full">
        <div className={cn('h-full', bg)} style={{ width }} />
      </div>
      {label && (
        <span className={cn('shrink-0 font-mono text-xs', LABEL_TEXT_COLOR[state])}>{label}</span>
      )}
    </div>
  );
}
