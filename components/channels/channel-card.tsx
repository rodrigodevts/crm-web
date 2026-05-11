import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChannelStatusBadge } from './channel-status-badge';
import { ChannelActionsMenu } from './channel-actions-menu';

export interface ChannelCardProps {
  channel: ChannelResponseDto;
  departmentName: string | null;
  onEdit: (channel: ChannelResponseDto) => void;
  onActivate: (channel: ChannelResponseDto) => void;
  onDeactivate: (channel: ChannelResponseDto) => void;
  onRestart: (channel: ChannelResponseDto) => void;
  onDelete: (channel: ChannelResponseDto) => void;
}

function formatPhone(phoneNumber: string | null): string {
  if (!phoneNumber) return '—';
  return `+${phoneNumber}`;
}

export function ChannelCard({
  channel,
  departmentName,
  onEdit,
  onActivate,
  onDeactivate,
  onRestart,
  onDelete,
}: ChannelCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-foreground truncate text-base font-semibold">{channel.name}</p>
            <p className="text-muted-foreground text-sm">{formatPhone(channel.phoneNumber)}</p>
          </div>
          <ChannelActionsMenu
            channel={channel}
            onEdit={onEdit}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
            onRestart={onRestart}
            onDelete={onDelete}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ChannelStatusBadge status={channel.status} />
          <Badge variant="outline">{channel.provider}</Badge>
        </div>

        <p className="text-muted-foreground text-xs">
          Departamento padrão: {departmentName ?? 'Não definido'}
        </p>
      </CardContent>
    </Card>
  );
}
