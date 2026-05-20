'use client';

import { EllipsisVertical, User } from 'lucide-react';
import type { TicketsListResponseDto } from '@/lib/generated/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/initials';
import { formatBrPhone, maskBrPhone } from '@/lib/format-br-phone';
import { formatTicketTime } from '@/lib/format-ticket-time';
import { contrastTextColor } from '@/lib/contrast-color';
import { TicketSnippet } from './ticket-snippet';
import { WhatsappWindowBar } from './whatsapp-window-bar';

type TicketListItem = TicketsListResponseDto['items'][number];

const BORDER_BY_STATUS = {
  PENDING: 'bg-amber-500',
  OPEN: 'bg-primary',
  CLOSED: 'bg-muted-foreground/40',
} as const satisfies Record<TicketListItem['status'], string>;

interface TicketCardProps {
  ticket: TicketListItem;
  hidePhoneFromAgents: boolean;
  assignedUserName?: string;
  departmentName?: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function getDisplayName(contact: TicketListItem['contact'], hidePhoneFromAgents: boolean): string {
  if (contact.name) return contact.name;
  return hidePhoneFromAgents
    ? maskBrPhone(contact.phoneNumber)
    : formatBrPhone(contact.phoneNumber);
}

export function TicketCard({
  ticket,
  hidePhoneFromAgents,
  assignedUserName,
  departmentName,
  isSelected,
  onSelect,
}: TicketCardProps) {
  const displayName = getDisplayName(ticket.contact, hidePhoneFromAgents);
  const initials = ticket.contact.name ? getInitials(ticket.contact.name) : null;
  const visibleTags = ticket.tags.slice(0, 3);
  const remainingTags = ticket.tags.length - visibleTags.length;

  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={() => onSelect(ticket.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(ticket.id);
        }
      }}
      className={cn(
        'border-border hover:bg-muted/50 focus-visible:ring-ring relative flex cursor-pointer items-start gap-3 border-b p-4 transition-colors focus:outline-none focus-visible:ring-2',
        isSelected && 'bg-muted',
      )}
      aria-label={`Atendimento ${ticket.protocol} de ${displayName}`}
    >
      <div
        className={cn('absolute top-0 bottom-0 left-0 w-[3px]', BORDER_BY_STATUS[ticket.status])}
        aria-hidden
      />

      <Avatar className="size-12 shrink-0">
        <AvatarFallback>
          {initials ?? <User className="text-muted-foreground size-5" aria-hidden />}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <span className="text-foreground truncate text-sm font-semibold">{displayName}</span>
          <span className="text-muted-foreground shrink-0 text-xs">
            {formatTicketTime(ticket.lastMessageAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-mono text-xs">#{ticket.protocol}</span>
          {ticket.unreadCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground h-5 px-1.5 text-xs">
              {ticket.unreadCount}
            </Badge>
          )}
        </div>

        <TicketSnippet lastMessage={ticket.lastMessage} />

        {(departmentName || assignedUserName || visibleTags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {departmentName && (
              <Badge variant="secondary" className="text-xs">
                {departmentName}
              </Badge>
            )}
            {assignedUserName && (
              <Badge variant="secondary" className="text-xs">
                {assignedUserName}
              </Badge>
            )}
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: tag.color,
                  color: contrastTextColor(tag.color) === 'white' ? '#fff' : '#000',
                }}
              >
                {tag.name}
              </span>
            ))}
            {remainingTags > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingTags}
              </Badge>
            )}
          </div>
        )}

        <WhatsappWindowBar
          lastInboundAt={ticket.lastInboundAt}
          inWhatsappWindow={ticket.inWhatsappWindow}
        />
      </div>

      {/* Slot do menu ⋮ — FE-2.1a só reserva o espaço */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        disabled
        aria-label="Ações do atendimento (em breve)"
        onClick={(e) => e.stopPropagation()}
      >
        <EllipsisVertical className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
