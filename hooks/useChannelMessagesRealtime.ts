'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useChannelMessagesControllerList } from '@/lib/generated/hooks/useChannelMessagesControllerList';
import { createSocket } from '@/lib/realtime/socket';
import { mergeMessages } from '@/lib/messaging/merge-messages';
import type { MessageNewEvent, MessageRow, MessageStatusEvent } from '@/lib/messaging/types';

export type RealtimeStatus = 'loading' | 'error' | 'ready';

export interface ChannelMessagesRealtime {
  rows: MessageRow[];
  status: RealtimeStatus;
  socketDown: boolean;
  latestTicketId: string | null;
  retry: () => void;
}

export function useChannelMessagesRealtime(channelId: string): ChannelMessagesRealtime {
  const query = useChannelMessagesControllerList(
    channelId,
    { limit: 20 },
    { client: { client: apiClient } },
  );

  // Socket-sourced rows, maintained incrementally via mergeMessages.
  // These are applied on top of the server seed at render time (useMemo)
  // to avoid useEffect+setState (react-hooks/set-state-in-effect).
  const [socketRows, setSocketRows] = useState<MessageRow[]>([]);
  const [socketDown, setSocketDown] = useState(false);

  // Merge server seed + socket overlay at render time.
  // Padrão "derivar durante render" (React docs) evita useEffect+setState.
  //
  // Step 1: seed from GET data.
  // Step 2: for each socket row, upsert it into the seeded list.
  //   - If already seeded → apply a 'status' merge (socket fields win).
  //   - If socket-only (not yet in seed, e.g. optimistic) → apply 'new' merge.
  //   Both paths use the pure mergeMessages function without any casts.
  const rows = useMemo<MessageRow[]>(() => {
    const serverItems = query.data?.items ?? [];
    const seeded = mergeMessages([], { kind: 'seed', items: serverItems });
    const seededIds = new Set<string>(seeded.map((r) => r.id));

    let merged = seeded;
    for (const sr of socketRows) {
      if (seededIds.has(sr.id)) {
        // Row exists in seed — apply socket status/lastError/externalId on top.
        merged = mergeMessages(merged, {
          kind: 'status',
          event: {
            messageId: sr.id,
            ticketId: sr.ticketId,
            status: sr.status,
            externalId: sr.externalId,
            lastError: sr.lastError,
            occurredAt: sr.createdAt,
          },
        });
      } else {
        // Socket-only row not yet confirmed by GET — reconstruct a MessageNewEvent
        // from the MessageRow fields that are available. This path is hit when
        // a 'message:new' socket event arrives before the next GET refetch returns.
        const newEv: MessageNewEvent = {
          messageId: sr.id,
          ticketId: sr.ticketId,
          contactId: '', // not carried in MessageRow; empty is safe for display
          channelConnectionId: sr.channelConnectionId,
          direction: sr.direction,
          type: sr.type,
          content: sr.content,
          createdAt: sr.createdAt,
          ticketStatus: '', // not carried in MessageRow; debug screen ignores it
          ticketCreated: false, // same
          sentByUserId: sr.sentByUserId,
        };
        merged = mergeMessages(merged, { kind: 'new', event: newEv });
      }
    }
    return merged;
  }, [query.data, socketRows]);

  // Keep refetch accessible from the socket listener without recreating the
  // socket. useLayoutEffect avoids react-hooks/refs (cannot write ref.current
  // during render body). No dep array → runs after every render, keeping the
  // ref in sync with the latest query.refetch reference.
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
      setSocketRows((cur) => mergeMessages(cur, { kind: 'new', event: ev }));
    };
    const onStatus = (ev: MessageStatusEvent) => {
      setSocketRows((cur) => mergeMessages(cur, { kind: 'status', event: ev }));
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
