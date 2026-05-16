'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useChannelMessagesControllerList } from '@/lib/generated/hooks/useChannelMessagesControllerList';
import { createSocket } from '@/lib/realtime/socket';
import { mergeMessages, type MergeEvent } from '@/lib/messaging/merge-messages';
import type { MessageNewEvent, MessageRow, MessageStatusEvent } from '@/lib/messaging/types';

export type RealtimeStatus = 'loading' | 'error' | 'ready';

export interface ChannelMessagesRealtime {
  rows: MessageRow[];
  status: RealtimeStatus;
  socketDown: boolean;
  latestTicketId: string | null;
  retry: () => void;
}

// Apenas eventos incrementais do socket (seed vem do GET no render).
type SocketEvent = Extract<MergeEvent, { kind: 'new' } | { kind: 'status' }>;

export function useChannelMessagesRealtime(channelId: string): ChannelMessagesRealtime {
  const query = useChannelMessagesControllerList(
    channelId,
    { limit: 20 },
    { client: { client: apiClient } },
  );

  // Buffer de eventos de socket crus (não folded). São reaplicados sobre o
  // seed do GET no render — evita useEffect+setState (react-hooks/
  // set-state-in-effect) e mantém o fold 100% na função pura mergeMessages,
  // então `message:status` casa tanto em mensagem do seed quanto do socket.
  const [socketEvents, setSocketEvents] = useState<SocketEvent[]>([]);
  const [socketDown, setSocketDown] = useState(false);

  // Deriva a lista no render: seed (GET) → replay dos eventos de socket.
  const rows = useMemo<MessageRow[]>(() => {
    let acc = mergeMessages([], { kind: 'seed', items: query.data?.items ?? [] });
    for (const ev of socketEvents) acc = mergeMessages(acc, ev);
    return acc;
  }, [query.data, socketEvents]);

  // Mantém refetch acessível ao listener de `connect` sem recriar o socket.
  // useLayoutEffect evita react-hooks/refs (não escrever ref.current no
  // corpo do render). Sem dep array → ressincroniza a cada render.
  const refetchRef = useRef(query.refetch);
  useLayoutEffect(() => {
    refetchRef.current = query.refetch;
  });

  useEffect(() => {
    const socket = createSocket();

    const onConnect = () => {
      setSocketDown(false);
      void refetchRef.current();
    };
    const onConnectError = () => setSocketDown(true);
    const onNew = (ev: MessageNewEvent) => {
      if (ev.channelConnectionId !== channelId) return;
      setSocketEvents((cur) => [...cur, { kind: 'new', event: ev }]);
    };
    const onStatus = (ev: MessageStatusEvent) => {
      setSocketEvents((cur) => [...cur, { kind: 'status', event: ev }]);
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('message:new', onNew);
    socket.on('message:status', onStatus);

    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('message:new', onNew);
      socket.off('message:status', onStatus);
      socket.disconnect();
    };
  }, [channelId]);

  const status: RealtimeStatus = query.isLoading ? 'loading' : query.isError ? 'error' : 'ready';

  return {
    rows,
    status,
    socketDown,
    latestTicketId: rows.length > 0 ? (rows[rows.length - 1]?.ticketId ?? null) : null,
    retry: () => void refetchRef.current(),
  };
}
