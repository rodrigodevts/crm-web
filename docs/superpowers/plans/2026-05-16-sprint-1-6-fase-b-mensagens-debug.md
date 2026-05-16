# Sprint 1.6 Fase B — Tela debug de mensagens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tela descartável `/atendimentos/canais-debug/[channelId]` que lista as últimas N mensagens de um canal, recebe `message:new`/`message:status` em tempo real e envia texto via composer mínimo, para fechar o checklist §6.4 (cenários 4–7, 11) da Fase 1.

**Architecture:** Server Component só monta shell + lê `params`; Client Component orquestra um hook (`useChannelMessagesRealtime`) que faz seed via hook Kubb do GET, abre um socket por mount, e mescla eventos com uma função pura testável (`mergeMessages`). Reconexão = refetch do GET no evento `connect` + merge/de-dup por id.

**Tech Stack:** Next.js 16 (App Router, RSC), React 19, TanStack Query 5 (hooks Kubb), socket.io-client ^4.8.3, React Hook Form + Zod (schema gerado), sonner, Vitest 4, Tailwind 4 (tokens shadcn baseline).

**Spec:** `docs/superpowers/specs/2026-05-16-sprint-1-6-fase-b-mensagens-debug-design.md`

**Convenção de nomes Kubb (observada no repo, determinística a partir do `operationId`):** `Controller_method` → `controllerMethod`; hook `useControllerMethod`; tipos em `lib/generated/types/ControllerMethod.ts`. operationIds confirmados no `openapi.json` do crm-api: `ChannelMessagesController_list` e `TicketsMessagesController_send`.

---

### Task 1: Regen API (snapshot + Kubb) e confirmação de contratos gerados

**Pré-condição:** crm-api rodando local em `http://localhost:3000` (já está — confirmado no brainstorming).

**Files:**

- Modify: `openapi.snapshot.json` (sobrescrito pelo dump live)
- Modify: `lib/generated/**` (regenerado por Kubb)

- [ ] **Step 1: Confirmar crm-api up e endpoints presentes**

Run:

```bash
curl -s -m 8 http://localhost:3000/api/v1/openapi.json | python3 -c "import sys,json;d=json.load(sys.stdin);p=d['paths'];print(sorted(k for k in p if 'messages' in k))"
```

Expected: `['/api/v1/channels/{id}/messages', '/api/v1/tickets/{id}/messages']`

Se vier vazio ou erro de conexão: PARAR e avisar o humano (crm-api precisa estar no ar).

- [ ] **Step 2: Sobrescrever o snapshot a partir do OpenAPI live**

Run:

```bash
curl -s http://localhost:3000/api/v1/openapi.json -o openapi.snapshot.json
python3 -c "import json;d=json.load(open('openapi.snapshot.json'));print('paths',len(d['paths']))"
```

Expected: `paths 41` (ou mais; o que importa é conter os 2 `/messages`).

- [ ] **Step 3: Regenerar `lib/generated` a partir do snapshot**

Run:

```bash
pnpm generate:api:from-snapshot
```

Expected: termina sem erro; `node scripts/patch-generated-barrel.mjs` roda no fim.

- [ ] **Step 4: Confirmar artefatos gerados e suas assinaturas exatas**

Run:

```bash
ls lib/generated/hooks | grep -iE 'ChannelMessages|TicketsMessages'
ls lib/generated/types | grep -iE 'ChannelMessages|TicketsMessages|CreateMessage|MessageResponse'
ls lib/generated/schemas | grep -iE 'createMessageBodyDto|CreateMessage'
grep -n 'export function useChannelMessagesControllerList' -A1 lib/generated/hooks/useChannelMessagesControllerList.ts
grep -n 'export function useTicketsMessagesControllerSend' -A1 lib/generated/hooks/useTicketsMessagesControllerSend.ts
grep -n 'mutationFn: async' -A1 lib/generated/hooks/useTicketsMessagesControllerSend.ts
```

Expected (confirmar — nomes são determinísticos):

- hooks: `useChannelMessagesControllerList.ts`, `useTicketsMessagesControllerSend.ts`
- types: `ChannelMessagesControllerList.ts`, `TicketsMessagesControllerSend.ts`
- schema zod do body: `createMessageBodyDtoSchema.ts`
- `useChannelMessagesControllerList(id, params, options)` — path param `id`, query `params` (`{ limit }`), depois `options`. (Padrão: findById = `(id, options)`; list com query = `(params, options)`; path+query = `(id, params, options)`.)
- `useTicketsMessagesControllerSend` é mutation; `mutationFn: async ({ id, data }) => ticketsMessagesControllerSend(id, data, config)` (padrão de `useChannelsControllerActivate`, que tem `{ id }`, + body como em `useChannelsControllerCreate`, que tem `{ data }`).

**Se algum nome/assinatura divergir do esperado:** anotar o nome real e usá-lo nas Tasks seguintes (o restante do código não muda, só o identificador importado/assinatura de chamada).

- [ ] **Step 5: Verificar zero-diff de CI**

Run:

```bash
pnpm generate:api:from-snapshot && git diff --exit-code lib/generated
```

Expected: exit 0 (sem diff — idempotente).

- [ ] **Step 6: Commit**

```bash
git add openapi.snapshot.json lib/generated
git commit -m "chore(generated): regen OpenAPI com endpoints de mensagens (Sprint 1.6 Fase B)"
```

---

### Task 2: Tipos locais — `MessageRow` + eventos de socket

**Files:**

- Create: `lib/messaging/types.ts`

- [ ] **Step 1: Criar `lib/messaging/types.ts`**

```ts
import type { ChannelMessagesControllerListQueryResponse } from '@/lib/generated/types/ChannelMessagesControllerList';

/**
 * Item de `GET /api/v1/channels/:id/messages`. Derivado estruturalmente do
 * tipo gerado pelo Kubb (não redeclaramos a entidade — regra CLAUDE.md §3).
 */
export type ChannelMessage = ChannelMessagesControllerListQueryResponse['items'][number];

/**
 * Linha exibida na tela debug. Igual ao item do GET + `lastError`, que só
 * existe no evento `message:status` (o GET não traz esse campo).
 */
export type MessageRow = ChannelMessage & { lastError: string | null };

/**
 * Eventos Socket.IO `message:new` / `message:status`. NÃO estão no OpenAPI do
 * crm-api (os schemas Zod vivem só no gateway, sem decorator `@Api*`), então
 * o Kubb não os gera. Tipos mínimos locais espelhando
 * `crm-api/src/modules/messaging/schemas/message-new-event.schema.ts` e
 * `message-status-event.schema.ts`. Os campos enum reusam os tipos gerados.
 */
export interface MessageNewEvent {
  messageId: string;
  ticketId: string;
  contactId: string;
  channelConnectionId: string;
  direction: ChannelMessage['direction'];
  type: ChannelMessage['type'];
  content: unknown;
  createdAt: string;
  ticketStatus: string;
  ticketCreated: boolean;
  sentByUserId: string | null;
}

export interface MessageStatusEvent {
  messageId: string;
  ticketId: string;
  status: ChannelMessage['status'];
  externalId: string | null;
  lastError: string | null;
  occurredAt: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (se `ChannelMessagesControllerListQueryResponse` não existir com esse nome, ajustar o import para o nome real anotado na Task 1 Step 4).

- [ ] **Step 3: Commit**

```bash
git add lib/messaging/types.ts
git commit -m "feat(messaging): tipos locais MessageRow + eventos socket (debug)"
```

---

### Task 3: Função pura `mergeMessages` (TDD — único unit da sprint)

**Files:**

- Create: `lib/messaging/merge-messages.ts`
- Test: `lib/messaging/merge-messages.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

`lib/messaging/merge-messages.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mergeMessages } from './merge-messages';
import type { ChannelMessage, MessageNewEvent, MessageStatusEvent } from './types';

function msg(over: Partial<ChannelMessage> & { id: string; createdAt: string }): ChannelMessage {
  return {
    ticketId: 't1',
    channelConnectionId: 'c1',
    externalId: null,
    direction: 'INBOUND',
    type: 'TEXT',
    status: 'DELIVERED',
    content: { text: 'oi' },
    sentByUserId: null,
    sentByBot: false,
    isSystemMessage: false,
    ...over,
  } as ChannelMessage;
}

const newEv = (
  over: Partial<MessageNewEvent> & { messageId: string; createdAt: string },
): MessageNewEvent => ({
  ticketId: 't1',
  contactId: 'k1',
  channelConnectionId: 'c1',
  direction: 'OUTBOUND',
  type: 'TEXT',
  content: { text: 'enviada' },
  ticketStatus: 'OPEN',
  ticketCreated: false,
  sentByUserId: 'u1',
  ...over,
});

const statusEv = (
  over: Partial<MessageStatusEvent> & { messageId: string },
): MessageStatusEvent => ({
  ticketId: 't1',
  status: 'SENT',
  externalId: 'gs-1',
  lastError: null,
  occurredAt: '2026-05-16T10:00:05.000Z',
  ...over,
});

describe('mergeMessages', () => {
  it('seed: ordena cronológico ascendente, desempate por id', () => {
    const out = mergeMessages([], {
      kind: 'seed',
      items: [
        msg({ id: 'b', createdAt: '2026-05-16T10:00:00.000Z' }),
        msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' }),
        msg({ id: 'c', createdAt: '2026-05-16T09:00:00.000Z' }),
      ],
    });
    expect(out.map((r) => r.id)).toEqual(['c', 'a', 'b']);
    expect(out[0]?.lastError).toBe(null);
  });

  it('new: anexa mensagem nova ausente da lista', () => {
    const seed = mergeMessages([], {
      kind: 'seed',
      items: [msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' })],
    });
    const out = mergeMessages(seed, {
      kind: 'new',
      event: newEv({ messageId: 'x', createdAt: '2026-05-16T10:01:00.000Z' }),
    });
    expect(out.map((r) => r.id)).toEqual(['a', 'x']);
    expect(out[1]?.direction).toBe('OUTBOUND');
    expect(out[1]?.status).toBe('PENDING');
  });

  it('new + seed: de-dup por id (cenário 11 — álbum/reconnect não duplica)', () => {
    let s = mergeMessages([], {
      kind: 'new',
      event: newEv({
        messageId: 'p1',
        direction: 'INBOUND',
        createdAt: '2026-05-16T10:00:01.000Z',
      }),
    });
    s = mergeMessages(s, {
      kind: 'new',
      event: newEv({
        messageId: 'p2',
        direction: 'INBOUND',
        createdAt: '2026-05-16T10:00:02.000Z',
      }),
    });
    // re-seed (refetch no reconnect) inclui as mesmas mensagens
    s = mergeMessages(s, {
      kind: 'seed',
      items: [
        msg({ id: 'p1', direction: 'INBOUND', createdAt: '2026-05-16T10:00:01.000Z' }),
        msg({ id: 'p2', direction: 'INBOUND', createdAt: '2026-05-16T10:00:02.000Z' }),
      ],
    });
    expect(s.map((r) => r.id)).toEqual(['p1', 'p2']);
  });

  it('status: patcha status/externalId/lastError da mensagem existente', () => {
    const seed = mergeMessages([], {
      kind: 'seed',
      items: [msg({ id: 'a', status: 'PENDING', createdAt: '2026-05-16T10:00:00.000Z' })],
    });
    const out = mergeMessages(seed, {
      kind: 'status',
      event: statusEv({ messageId: 'a', status: 'SENT', externalId: 'gs-9' }),
    });
    expect(out[0]?.status).toBe('SENT');
    expect(out[0]?.externalId).toBe('gs-9');
  });

  it('status FAILED: guarda lastError', () => {
    const seed = mergeMessages([], {
      kind: 'seed',
      items: [msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' })],
    });
    const out = mergeMessages(seed, {
      kind: 'status',
      event: statusEv({
        messageId: 'a',
        status: 'FAILED',
        externalId: null,
        lastError: 'Número inválido',
      }),
    });
    expect(out[0]?.status).toBe('FAILED');
    expect(out[0]?.lastError).toBe('Número inválido');
  });

  it('status órfão (messageId fora da lista): ignora, lista inalterada', () => {
    const seed = mergeMessages([], {
      kind: 'seed',
      items: [msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' })],
    });
    const out = mergeMessages(seed, { kind: 'status', event: statusEv({ messageId: 'zzz' }) });
    expect(out).toEqual(seed);
  });

  it('re-seed preserva lastError já recebido por status anterior', () => {
    let s = mergeMessages([], {
      kind: 'seed',
      items: [msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' })],
    });
    s = mergeMessages(s, {
      kind: 'status',
      event: statusEv({ messageId: 'a', status: 'FAILED', externalId: null, lastError: 'erro X' }),
    });
    s = mergeMessages(s, {
      kind: 'seed',
      items: [msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' })],
    });
    expect(s[0]?.lastError).toBe('erro X');
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `pnpm vitest run lib/messaging/merge-messages.test.ts`
Expected: FAIL — `mergeMessages` não existe / sem export.

- [ ] **Step 3: Implementar `lib/messaging/merge-messages.ts`**

```ts
import type { ChannelMessage, MessageNewEvent, MessageRow, MessageStatusEvent } from './types';

export type MergeEvent =
  | { kind: 'seed'; items: ChannelMessage[] }
  | { kind: 'new'; event: MessageNewEvent }
  | { kind: 'status'; event: MessageStatusEvent };

function rowFromChannelMessage(m: ChannelMessage, prevLastError: string | null): MessageRow {
  return { ...m, lastError: prevLastError };
}

function rowFromNewEvent(ev: MessageNewEvent): MessageRow {
  return {
    id: ev.messageId,
    ticketId: ev.ticketId,
    channelConnectionId: ev.channelConnectionId,
    externalId: null,
    direction: ev.direction,
    type: ev.type,
    // Convenção da tela debug: sem `status` no payload de `message:new`.
    // OUTBOUND nasce PENDING; INBOUND já chegou ao sistema → DELIVERED.
    // O `message:status` (OUTBOUND) e o refetch no reconnect corrigem.
    status: ev.direction === 'OUTBOUND' ? 'PENDING' : 'DELIVERED',
    content: ev.content ?? null,
    sentByUserId: ev.sentByUserId,
    sentByBot: false,
    isSystemMessage: false,
    createdAt: ev.createdAt,
    lastError: null,
  } as MessageRow;
}

function sortRows(rows: MessageRow[]): MessageRow[] {
  return [...rows].sort((a, b) => {
    const ta = Date.parse(a.createdAt);
    const tb = Date.parse(b.createdAt);
    if (ta !== tb) return ta - tb;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

export function mergeMessages(current: MessageRow[], event: MergeEvent): MessageRow[] {
  const byId = new Map<string, MessageRow>(current.map((r) => [r.id, r]));

  if (event.kind === 'seed') {
    for (const item of event.items) {
      const prev = byId.get(item.id);
      byId.set(item.id, rowFromChannelMessage(item, prev?.lastError ?? null));
    }
    return sortRows([...byId.values()]);
  }

  if (event.kind === 'new') {
    if (!byId.has(event.event.messageId)) {
      byId.set(event.event.messageId, rowFromNewEvent(event.event));
    }
    return sortRows([...byId.values()]);
  }

  // kind === 'status'
  const target = byId.get(event.event.messageId);
  if (!target) return current; // status órfão: ignora (debug; sem buffer)
  byId.set(event.event.messageId, {
    ...target,
    status: event.event.status,
    externalId: event.event.externalId,
    lastError: event.event.lastError,
  });
  return sortRows([...byId.values()]);
}
```

> Nota sobre os dois `as MessageRow`: `ChannelMessage` é o tipo gerado pelo Kubb; o spread `{...m, lastError}` e o objeto construído em `rowFromNewEvent` são estruturalmente compatíveis, mas o cast explícito documenta a fronteira gerado→UI e evita ruído de inferência de enums. Justificado por comentário inline (regra CLAUDE.md §4.1).

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `pnpm vitest run lib/messaging/merge-messages.test.ts`
Expected: PASS (7 testes).

- [ ] **Step 5: Lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/messaging/merge-messages.ts lib/messaging/merge-messages.test.ts
git commit -m "feat(messaging): mergeMessages puro + testes (seed/new/status, de-dup)"
```

---

### Task 4: Factory do socket

**Files:**

- Create: `lib/realtime/socket.ts`

- [ ] **Step 1: Criar `lib/realtime/socket.ts`**

```ts
import { io, type Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Cria um socket novo para a tela debug. Sem singleton global (escopo da
 * tela). Namespace/path default. `withCredentials: true` envia o cookie
 * httpOnly `access_token` no handshake — o backend autentica e auto-joina
 * a sala `company:{companyId}:tickets` a partir do JWT. O cliente NUNCA
 * envia companyId. Reconexão default do socket.io ligada.
 */
export function createSocket(): Socket {
  return io(API_URL, { withCredentials: true });
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/realtime/socket.ts
git commit -m "feat(realtime): factory fino do socket.io-client (escopo debug)"
```

---

### Task 5: Hook `useChannelMessagesRealtime`

**Files:**

- Create: `hooks/useChannelMessagesRealtime.ts`

- [ ] **Step 1: Criar `hooks/useChannelMessagesRealtime.ts`**

```ts
'use client';

import { useEffect, useRef, useState } from 'react';
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

  const [rows, setRows] = useState<MessageRow[]>([]);
  const [socketDown, setSocketDown] = useState(false);

  // refetch sempre acessível pelo listener de `connect` sem recriar o socket
  const refetchRef = useRef(query.refetch);
  refetchRef.current = query.refetch;

  // seed + re-seed (refetch no reconnect dispara nova query.data)
  useEffect(() => {
    const items = query.data?.items;
    if (items) {
      setRows((cur) => mergeMessages(cur, { kind: 'seed', items }));
    }
  }, [query.data]);

  useEffect(() => {
    const socket = createSocket();

    const onConnect = () => {
      setSocketDown(false);
      void refetchRef.current();
    };
    const onConnectError = () => setSocketDown(true);
    const onNew = (ev: MessageNewEvent) => {
      if (ev.channelConnectionId !== channelId) return;
      setRows((cur) => mergeMessages(cur, { kind: 'new', event: ev }));
    };
    const onStatus = (ev: MessageStatusEvent) => {
      setRows((cur) => mergeMessages(cur, { kind: 'status', event: ev }));
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
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS. Se a assinatura real de `useChannelMessagesControllerList` for `(id, options)` sem `params` separado (divergência da Task 1 Step 4), passar `{ limit: 20 }` conforme o shape gerado (ex.: `useChannelMessagesControllerList(channelId, { client: { client: apiClient }, query: {} })` com `params` dentro) — ajustar só a chamada.

- [ ] **Step 3: Commit**

```bash
git add hooks/useChannelMessagesRealtime.ts
git commit -m "feat(messaging): hook useChannelMessagesRealtime (seed + socket + reconnect refetch)"
```

---

### Task 6: Shell da rota (Server Component)

**Files:**

- Create: `app/(app)/atendimentos/canais-debug/[channelId]/page.tsx`

- [ ] **Step 1: Criar `page.tsx`**

```tsx
import type { Metadata } from 'next';
import { ChannelDebugView } from './components/channel-debug-view';

export const metadata: Metadata = { title: 'Debug de mensagens — DigiChat' };

export default async function Page({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold">Debug de mensagens</h1>
        <p className="text-muted-foreground text-sm">
          Validação ponta-a-ponta da Fase 1. Tela descartável (substituída na Fase 2).
        </p>
      </header>
      <ChannelDebugView channelId={channelId} />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: FAIL — `./components/channel-debug-view` ainda não existe (esperado; criado na Task 7). Não commitar ainda.

---

### Task 7: Client orquestrador `channel-debug-view.tsx` (estados + banner)

**Files:**

- Create: `app/(app)/atendimentos/canais-debug/[channelId]/components/channel-debug-view.tsx`

- [ ] **Step 1: Criar `channel-debug-view.tsx`**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: FAIL — `./message-list` e `./message-composer` ainda não existem (Tasks 8 e 9). Não commitar ainda.

---

### Task 8: `message-list.tsx`

**Files:**

- Create: `app/(app)/atendimentos/canais-debug/[channelId]/components/message-list.tsx`

- [ ] **Step 1: Criar `message-list.tsx`**

```tsx
'use client';

import type { MessageRow } from '@/lib/messaging/types';

function renderContent(content: unknown): string {
  if (content == null) return '—';
  if (
    typeof content === 'object' &&
    content !== null &&
    'text' in content &&
    // content é `unknown` (JSON do backend); narrowing manual + cast comentado
    typeof (content as { text: unknown }).text === 'string'
  ) {
    return (content as { text: string }).text;
  }
  return JSON.stringify(content);
}

const DATE_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function DirectionBadge({ direction }: { direction: MessageRow['direction'] }) {
  const isIn = direction === 'INBOUND';
  return (
    <span
      className={
        isIn
          ? 'bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs font-medium'
          : 'bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium'
      }
    >
      {isIn ? 'IN' : 'OUT'}
    </span>
  );
}

function StatusBadge({ status }: { status: MessageRow['status'] }) {
  const failed = status === 'FAILED';
  return (
    <span
      className={failed ? 'text-destructive text-xs font-medium' : 'text-muted-foreground text-xs'}
    >
      {status}
    </span>
  );
}

export function MessageList({ rows }: { rows: MessageRow[] }) {
  return (
    <ul className="border-border divide-border divide-y rounded-md border">
      {rows.map((m) => (
        <li key={m.id} className="flex flex-col gap-1 px-4 py-3">
          <div className="flex items-center gap-2">
            <DirectionBadge direction={m.direction} />
            <span className="text-muted-foreground text-xs">
              {DATE_FMT.format(new Date(m.createdAt))}
            </span>
            <span className="text-muted-foreground text-xs">
              ticket <span className="font-mono">{m.ticketId.slice(0, 8)}</span>
            </span>
            <span className="ml-auto">
              <StatusBadge status={m.status} />
            </span>
          </div>
          <p className="text-foreground text-sm break-words whitespace-pre-wrap">
            {renderContent(m.content)}
          </p>
          {m.status === 'FAILED' && m.lastError && (
            <p className="text-destructive text-xs">{m.lastError}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: ainda FAIL no `page.tsx`/`channel-debug-view` por causa do `message-composer` faltante (Task 9). O erro restante deve ser só sobre `./message-composer`.

- [ ] **Step 3: Commit parcial (lista + view + page juntos após Task 9)** — não commitar isolado; ver Task 9 Step 4.

---

### Task 9: `message-composer.tsx`

**Files:**

- Create: `app/(app)/atendimentos/canais-debug/[channelId]/components/message-composer.tsx`

- [ ] **Step 1: Criar `message-composer.tsx`**

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useTicketsMessagesControllerSend } from '@/lib/generated/hooks/useTicketsMessagesControllerSend';
import { createMessageBodyDtoSchema } from '@/lib/generated/schemas/createMessageBodyDtoSchema';
import type { TicketsMessagesControllerSendMutationRequest } from '@/lib/generated/types/TicketsMessagesControllerSend';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type FormValues = TicketsMessagesControllerSendMutationRequest;

export function MessageComposer({ ticketId }: { ticketId: string | null }) {
  const send = useTicketsMessagesControllerSend({ client: { client: apiClient } });

  const form = useForm<FormValues>({
    resolver: zodResolver(createMessageBodyDtoSchema),
    defaultValues: { type: 'TEXT', text: '' } as FormValues,
  });

  const disabled = ticketId == null;

  const onSubmit = form.handleSubmit((values) => {
    if (ticketId == null) return;
    send.mutate(
      { id: ticketId, data: values },
      {
        onSuccess: () => form.reset({ type: 'TEXT', text: '' } as FormValues),
        onError: () => toast.error('Falha ao enviar a mensagem.'),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="border-border flex flex-col gap-2 rounded-md border p-4">
      <Label htmlFor="debug-composer-text">
        {disabled
          ? 'Sem mensagens ainda — não há ticket para responder.'
          : `Respondendo ticket ${ticketId.slice(0, 8)}`}
      </Label>
      <Textarea
        id="debug-composer-text"
        rows={3}
        placeholder="Escreva uma mensagem de texto…"
        disabled={disabled || send.isPending}
        {...form.register('text')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void onSubmit();
          }
        }}
      />
      {form.formState.errors.text && (
        <p className="text-destructive text-xs">{form.formState.errors.text.message}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={disabled || send.isPending}>
          {send.isPending ? 'Enviando…' : 'Enviar'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Garantir que o primitivo `Textarea` existe**

Run: `ls components/ui/textarea.tsx`
Expected: arquivo existe. Se NÃO existir:

```bash
pnpm dlx shadcn@latest add textarea
```

(adiciona `components/ui/textarea.tsx` — primitivo shadcn, permitido sem aprovação por ser primitivo do catálogo, não componente de domínio novo).

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS (todas as peças existem agora). Se nomes gerados divergirem (Task 1 Step 4): ajustar imports/forma de `mutate` (ex.: variáveis `{ id, data }` conforme `mutationFn` real).

- [ ] **Step 4: Commit (rota completa)**

```bash
git add "app/(app)/atendimentos/canais-debug" components/ui/textarea.tsx
git commit -m "feat(atendimentos): tela debug de mensagens (rota + view + lista + composer)"
```

(Inclui `page.tsx` da Task 6 e `channel-debug-view.tsx` da Task 7, que só compilam com a rota inteira.)

---

### Task 10: Verificação por evidência + validação manual §6.4

- [ ] **Step 1: Gate local completo**

Run:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

Expected: tudo PASS. (`pnpm build` NÃO entra — CLAUDE.md §11; fica pra CI.)

- [ ] **Step 2: Zero-diff de tipos gerados (regra CI §15)**

Run:

```bash
pnpm generate:api:from-snapshot && git diff --exit-code lib/generated
```

Expected: exit 0.

- [ ] **Step 3: Validação manual contra crm-api local**

Subir crm-web (`pnpm dev` → :3001), logar, abrir `/atendimentos/canais-debug/<channelId real>`. Exercitar e anotar evidência de cada cenário (`crm-api/ROADMAP.md` §6.4) para o corpo do PR:

- **4:** inbound (Gupshup real ou replay do webhook-recorder) → linha INBOUND aparece em tempo real
- **5:** ticketId visível na linha
- **6:** fora de horário sem bot → `outOfHoursMessage` aparece como OUTBOUND
- **7:** enviar pelo composer → OUTBOUND aparece; status transita PENDING→SENT→DELIVERED/READ via `message:status`
- **11:** 4 fotos rápidas (álbum) → 4 mensagens em ordem, sem duplicação

Se algum cenário falhar: usar superpowers:systematic-debugging antes de qualquer correção.

---

### Task 11: Atualizar ROADMAP §5.1 e abrir PR

**Files:**

- Modify: `ROADMAP.md` (§5.1 — Sprint 1.6 Fase B)

- [ ] **Step 1: Marcar os checkboxes da Sprint 1.6 Fase B**

Em `ROADMAP.md` §5.1, trocar os 6 `- [ ]` do bloco "Sprint 1.6 Fase B — Tela básica de mensagens recebidas (validação)" por `- [x]`. Não alterar outros blocos.

- [ ] **Step 2: Commit**

```bash
git add ROADMAP.md
git commit -m "docs(roadmap): marca Sprint 1.6 Fase B como entregue"
```

- [ ] **Step 3: Abrir PR (sem push direto em main; confirmar com o humano antes do push)**

Confirmar com o humano que pode dar push. Depois:

```bash
git push -u origin feat/sprint-1-6-fase-b-mensagens-debug
gh pr create --base main --title "feat(atendimentos): Sprint 1.6 Fase B — tela debug de mensagens + realtime" --body "<corpo com evidências §6.4 cenários 4–7 e 11; inclui sync de ROADMAP bundlado>"
```

Expected: PR criado. CI roda build + zero-diff.

---

## Self-Review (preenchido na escrita do plano)

**Spec coverage:** regen (T1) · tipos gerados/local socket (T2) · mergeMessages puro + único unit (T3) · socket factory (T4) · hook seed+socket+reconnect refetch (T5) · shell RSC (T6) · estados loading/empty/error/socket-down (T7) · lista + render defensivo de content + IN/OUT + status + lastError (T8) · composer alvo=latestTicketId + Zod gerado + sonner + a11y/Enter (T9) · verificação por evidência + §6.4 (T10) · ROADMAP §5.1 + PR (T11). Entrada opcional em `/configuracoes/canais` deliberadamente fora (spec §8 — não bloqueante). Multi-tenant/sem storage/tokens/light-dark cobertos pelas convenções aplicadas no código de cada task.

**Placeholder scan:** sem TBD/TODO; todo passo tem código/comando completo. Incertezas de nomes gerados resolvidas por convenção determinística observável + verificação explícita na T1 Step 4 com regra de adaptação (não é placeholder — o código está completo).

**Type consistency:** `MessageRow`/`ChannelMessage`/`MessageNewEvent`/`MessageStatusEvent` definidos na T2 e usados consistentemente em T3/T5/T8/T9. `MergeEvent` discriminado (`seed|new|status`) idêntico entre `merge-messages.ts` (T3) e chamadas no hook (T5). `useChannelMessagesRealtime` retorna `{ rows, status, socketDown, latestTicketId, retry }`, consumido igual na T7.
