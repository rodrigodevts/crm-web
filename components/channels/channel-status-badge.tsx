import type { ChannelResponseDtoStatusEnumKey } from '@/lib/generated/types/ChannelResponseDto';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const LABELS: Record<ChannelResponseDtoStatusEnumKey, string> = {
  INACTIVE: 'Inativo',
  CONNECTING: 'Conectando',
  AWAITING_QR: 'Aguardando QR',
  CONNECTED: 'Conectado',
  DISCONNECTED: 'Desconectado',
  ERROR: 'Erro',
};

// Sem token shadcn dedicado para success/warning hoje (design-system.md §Mapeamento).
// Tailwind classes hardcoded apenas para os 6 estados, dentro do baseline cinza/azul/verde/âmbar/laranja/vermelho.
const TONES: Record<ChannelResponseDtoStatusEnumKey, string> = {
  INACTIVE: 'bg-muted text-muted-foreground',
  CONNECTING: 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200',
  AWAITING_QR: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
  CONNECTED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
  DISCONNECTED: 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100',
  ERROR: 'bg-destructive/15 text-destructive dark:bg-destructive/30',
};

export interface ChannelStatusBadgeProps {
  status: ChannelResponseDtoStatusEnumKey;
  className?: string;
}

export function ChannelStatusBadge({ status, className }: ChannelStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('border-transparent font-medium', TONES[status], className)}
    >
      {LABELS[status]}
    </Badge>
  );
}
