import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPhoneDigits } from '@/components/ui/masked-phone-input';
import { ChannelKindIcon } from './channel-kind-icon';
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
  return formatPhoneDigits(phoneNumber);
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
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start gap-3">
          <ChannelKindIcon provider={channel.provider} className="mt-0.5 size-8 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col">
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
          <Badge variant="outline" className="font-mono text-xs">
            {channel.provider}
          </Badge>
        </div>

        <p className="text-muted-foreground text-xs">
          Departamento padrão: {departmentName ?? 'Não definido'}
        </p>
      </CardContent>
    </Card>
  );
}
