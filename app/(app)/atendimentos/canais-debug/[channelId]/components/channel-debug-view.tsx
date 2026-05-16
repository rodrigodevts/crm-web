'use client';

import { useChannelMessagesRealtime } from '@/hooks/useChannelMessagesRealtime';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageList } from './message-list';
import { MessageComposer } from './message-composer';

export function ChannelDebugView({ channelId }: { channelId: string }) {
  const { rows, status, socketDown, latestTicketId, retry } = useChannelMessagesRealtime(channelId);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-xs">
        Canal <span className="font-mono">{channelId}</span>
      </p>

      {socketDown && (
        <div
          role="status"
          className="border-border bg-muted text-muted-foreground rounded-md border px-4 py-2 text-sm"
        >
          Conexão em tempo real indisponível — tentando reconectar.
        </div>
      )}

      {status === 'loading' && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="border-destructive/40 bg-destructive/10 rounded-md border p-6 text-center">
          <p className="text-foreground text-sm">Não foi possível carregar as mensagens.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {status === 'ready' && rows.length === 0 && (
        <div className="border-border text-muted-foreground rounded-md border p-12 text-center text-sm">
          Nenhuma mensagem ainda — aguarde um inbound.
        </div>
      )}

      {status === 'ready' && rows.length > 0 && <MessageList rows={rows} />}

      <MessageComposer ticketId={latestTicketId} />
    </div>
  );
}
