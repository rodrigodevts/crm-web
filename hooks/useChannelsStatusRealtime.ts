'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { createSocket } from '@/lib/realtime/socket';
import { decideChannelToast } from '@/lib/channels/channel-status';
import type { ChannelStatusEvent, ChannelStatusOverride } from '@/lib/channels/types';
import type { ChannelResponseDtoStatusEnumKey } from '@/lib/generated/types/ChannelResponseDto';

export interface ChannelsStatusRealtime {
  overrides: ReadonlyMap<string, ChannelStatusOverride>;
  socketDown: boolean;
}

/**
 * Realtime de status dos canais. Um socket por montagem (nível tabela, não
 * por card). Escuta `channel:status`, mantém overrides in-memory por
 * channelConnectionId, toasta transições críticas (com dedup) e sinaliza
 * queda do socket. No `connect`: limpa overrides + refetch (GET = verdade no
 * reconnect; evento = verdade entre refetches).
 *
 * @param refetch refetch da query de canais (chamado no connect)
 * @param channelNameById nome por id, para a mensagem do toast
 */
export function useChannelsStatusRealtime(
  refetch: () => unknown,
  channelNameById: ReadonlyMap<string, string>,
): ChannelsStatusRealtime {
  const [overrides, setOverrides] = useState<Map<string, ChannelStatusOverride>>(new Map());
  const [socketDown, setSocketDown] = useState(false);

  // refetch + nomes acessíveis aos listeners sem recriar o socket.
  // useLayoutEffect evita react-hooks/refs; sem dep array ressincroniza a
  // cada render. Mesmo pattern de useChannelMessagesRealtime.
  const refetchRef = useRef(refetch);
  const nameByIdRef = useRef(channelNameById);
  useLayoutEffect(() => {
    refetchRef.current = refetch;
    nameByIdRef.current = channelNameById;
  });

  // Último estado visto por canal, p/ o dedup do toast. Ref (não dispara
  // render; só alimenta a função pura decideChannelToast).
  const lastSeenRef = useRef<Map<string, ChannelResponseDtoStatusEnumKey>>(new Map());

  useEffect(() => {
    const socket = createSocket();

    const onConnect = () => {
      setSocketDown(false);
      setOverrides(new Map());
      lastSeenRef.current = new Map();
      void refetchRef.current();
    };
    const onDown = () => setSocketDown(true);
    const onStatus = (event: ChannelStatusEvent) => {
      setOverrides((cur) => {
        const next = new Map(cur);
        next.set(event.channelConnectionId, {
          status: event.currentStatus,
          lastError: event.lastError,
        });
        return next;
      });
      const name = nameByIdRef.current.get(event.channelConnectionId) ?? 'canal';
      const decision = decideChannelToast(
        event,
        name,
        lastSeenRef.current.get(event.channelConnectionId),
      );
      lastSeenRef.current.set(event.channelConnectionId, decision.nextSeenStatus);
      if (decision.message) toast.error(decision.message);
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onDown);
    socket.on('disconnect', onDown);
    socket.on('channel:status', onStatus);

    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onDown);
      socket.off('disconnect', onDown);
      socket.off('channel:status', onStatus);
      socket.disconnect();
    };
  }, []);

  return { overrides, socketDown };
}
