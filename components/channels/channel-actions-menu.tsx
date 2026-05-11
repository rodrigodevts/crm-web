'use client';

import { useState } from 'react';
import { MoreVerticalIcon } from 'lucide-react';
import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface ChannelActionsMenuProps {
  channel: ChannelResponseDto;
  onEdit: (channel: ChannelResponseDto) => void;
  onActivate: (channel: ChannelResponseDto) => void;
  onDeactivate: (channel: ChannelResponseDto) => void;
  onRestart: (channel: ChannelResponseDto) => void;
  onDelete: (channel: ChannelResponseDto) => void;
}

type Pending = 'activate' | 'deactivate' | 'restart' | null;

const CONFIRMATIONS: Record<
  Exclude<Pending, null>,
  { title: string; description: string; cta: string }
> = {
  activate: {
    title: 'Ativar canal?',
    description: 'A conexão com o provedor será inicializada.',
    cta: 'Ativar',
  },
  deactivate: {
    title: 'Desativar canal?',
    description:
      'Tickets em andamento não serão fechados, mas novas mensagens deixarão de ser recebidas.',
    cta: 'Desativar',
  },
  restart: {
    title: 'Forçar restart do canal?',
    description: 'Limpa o cache do adapter e reinicializa a conexão.',
    cta: 'Reiniciar',
  },
};

export function ChannelActionsMenu({
  channel,
  onEdit,
  onActivate,
  onDeactivate,
  onRestart,
  onDelete,
}: ChannelActionsMenuProps) {
  const [pending, setPending] = useState<Pending>(null);

  const canActivate =
    channel.status === 'INACTIVE' ||
    channel.status === 'DISCONNECTED' ||
    channel.status === 'ERROR';
  const canDeactivate = channel.status !== 'INACTIVE';

  function confirm() {
    if (pending === 'activate') onActivate(channel);
    if (pending === 'deactivate') onDeactivate(channel);
    if (pending === 'restart') onRestart(channel);
    setPending(null);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Ações do canal ${channel.name}`}>
            <MoreVerticalIcon className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(channel)}>Editar</DropdownMenuItem>
          <DropdownMenuItem disabled={!canActivate} onSelect={() => setPending('activate')}>
            Ativar
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canDeactivate} onSelect={() => setPending('deactivate')}>
            Desativar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPending('restart')}>Forçar restart</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(channel)}>
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          {pending && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{CONFIRMATIONS[pending].title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {CONFIRMATIONS[pending].description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirm}>
                  {CONFIRMATIONS[pending].cta}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
