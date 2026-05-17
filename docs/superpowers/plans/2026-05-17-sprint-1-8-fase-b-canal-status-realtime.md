# Sprint 1.8 Fase B — Card de canal com status realtime — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar camada realtime à tela `/configuracoes/canais` existente: o card reflete o último `channel:status`, toasta transições críticas, mostra `lastError` em ERROR e sinaliza queda/reconexão do socket.

**Architecture:** Overlay in-memory num hook espelhando `useChannelMessagesRealtime`. GET (TanStack Query gerado) é o seed; o hook mantém um `Map<channelConnectionId, override>` alimentado por `channel:status`; a tabela faz merge por id via função pura. No `connect`: refetch + limpa overrides (GET = verdade no reconnect; evento = verdade entre refetches). Único código testado: as 2 funções puras.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript estrito, socket.io-client, TanStack Query 5 (hooks Kubb gerados), sonner, lucide-react, Vitest 4 + @testing-library.

**Spec:** `docs/superpowers/specs/2026-05-17-sprint-1-8-fase-b-canal-status-realtime-design.md`

**Branch:** `feat/sprint-1-8-fase-b-canal-status-realtime` (já criada de `origin/main`).

---

## File Structure

- **Create** `lib/channels/types.ts` — tipo local do evento `channel:status` + tipo do override (não está no OpenAPI; Kubb não gera).
- **Create** `lib/channels/channel-status.ts` — funções puras `decideChannelToast` e `mergeChannelStatus` (único código com teste unitário).
- **Create** `lib/channels/channel-status.test.ts` — testes Vitest das duas funções puras.
- **Create** `hooks/useChannelsStatusRealtime.ts` — client hook: socket por montagem da tabela, overrides + socketDown, toast com dedup, refetch no connect, cleanup completo.
- **Modify** `components/channels/channels-table.tsx` — chama o hook, merge dos itens, banner de reconexão.
- **Modify** `components/channels/channel-card.tsx` — exibe `lastError` acessível quando `status === 'ERROR'`.
- **Modify** `lib/realtime/socket.ts` — corrige docstring (cita as 2 salas auto-joinadas). Sem mudança de comportamento.

---

## Task 1: Tipo local do evento `channel:status`

**Files:**

- Create: `lib/channels/types.ts`

- [ ] **Step 1: Criar o arquivo de tipos**

```ts
import type {
  ChannelResponseDtoProviderEnumKey,
  ChannelResponseDtoStatusEnumKey,
} from '@/lib/generated/types/ChannelResponseDto';

/**
 * Evento Socket.IO `channel:status`. NÃO está no OpenAPI do crm-api (o
 * schema Zod vive só no gateway, sem decorator `@Api*`), então o Kubb não o
 * gera. Tipo mínimo local espelhando
 * `crm-api/src/modules/channels/schemas/channel-status-event.schema.ts`.
 * Os campos enum reusam os tipos gerados (não redeclaramos a entidade) —
 * mesma justificativa de `lib/messaging/types.ts`.
 */
export interface ChannelStatusEvent {
  channelConnectionId: string;
  previousStatus: ChannelResponseDtoStatusEnumKey;
  currentStatus: ChannelResponseDtoStatusEnumKey;
  provider: ChannelResponseDtoProviderEnumKey;
  lastError: string | null;
  occurredAt: string;
}

/** Override realtime aplicado in-memory sobre o item do GET. */
export interface ChannelStatusOverride {
  status: ChannelResponseDtoStatusEnumKey;
  lastError: string | null;
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `pnpm typecheck`
Expected: PASS (sem erros novos).

- [ ] **Step 3: Commit**

```bash
git add lib/channels/types.ts
git commit -m "feat(channels): tipo local do evento channel:status (não gerado pelo Kubb)"
```

---

## Task 2: Funções puras `decideChannelToast` e `mergeChannelStatus` (TDD)

**Files:**

- Create: `lib/channels/channel-status.ts`
- Test: `lib/channels/channel-status.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, expect, it } from 'vitest';
import { decideChannelToast, mergeChannelStatus } from './channel-status';
import type { ChannelStatusEvent } from './types';
import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';

const ev = (
  over: Partial<ChannelStatusEvent> & {
    previousStatus: ChannelStatusEvent['previousStatus'];
    currentStatus: ChannelStatusEvent['currentStatus'];
  },
): ChannelStatusEvent => ({
  channelConnectionId: 'c1',
  provider: 'GUPSHUP',
  lastError: null,
  occurredAt: '2026-05-17T10:00:00.000Z',
  ...over,
});

function channel(over: Partial<ChannelResponseDto> & { id: string }): ChannelResponseDto {
  return {
    name: 'Canal A',
    provider: 'GUPSHUP',
    status: 'CONNECTED',
    phoneNumber: null,
    externalId: null,
    config: null,
    lastError: null,
    lastConnectedAt: null,
    defaultDepartmentId: null,
    defaultChatFlowId: null,
    inactivityTimeoutMinutes: null,
    inactivityCloseReasonId: null,
    createdAt: '2026-05-17T10:00:00.000Z',
    updatedAt: '2026-05-17T10:00:00.000Z',
    ...over,
    // cast: helper monta um ChannelResponseDto parcial p/ teste; spread +
    // Partial não inferem o tipo gerado completo
  } as ChannelResponseDto;
}

describe('decideChannelToast', () => {
  it('toasta CONNECTED → DISCONNECTED com o nome do canal', () => {
    const r = decideChannelToast(
      ev({ previousStatus: 'CONNECTED', currentStatus: 'DISCONNECTED' }),
      'Canal A',
      undefined,
    );
    expect(r.message).toBe('Canal "Canal A" desconectado.');
    expect(r.nextSeenStatus).toBe('DISCONNECTED');
  });

  it('toasta * → ERROR com lastError embutido', () => {
    const r = decideChannelToast(
      ev({
        previousStatus: 'CONNECTING',
        currentStatus: 'ERROR',
        lastError: 'credenciais inválidas',
      }),
      'Canal A',
      'CONNECTING',
    );
    expect(r.message).toBe('Canal "Canal A" entrou em erro: credenciais inválidas.');
    expect(r.nextSeenStatus).toBe('ERROR');
  });

  it('* → ERROR sem lastError usa "motivo não informado"', () => {
    const r = decideChannelToast(
      ev({ previousStatus: 'CONNECTING', currentStatus: 'ERROR', lastError: null }),
      'Canal A',
      'CONNECTING',
    );
    expect(r.message).toBe('Canal "Canal A" entrou em erro: motivo não informado.');
  });

  it('não toasta transições não-críticas', () => {
    expect(
      decideChannelToast(
        ev({ previousStatus: 'CONNECTING', currentStatus: 'CONNECTED' }),
        'Canal A',
        'CONNECTING',
      ).message,
    ).toBeNull();
    expect(
      decideChannelToast(
        ev({ previousStatus: 'INACTIVE', currentStatus: 'CONNECTING' }),
        'Canal A',
        'INACTIVE',
      ).message,
    ).toBeNull();
  });

  it('dedup: alvo crítico consecutivo idêntico não re-toasta', () => {
    const r = decideChannelToast(
      ev({ previousStatus: 'ERROR', currentStatus: 'ERROR', lastError: 'x' }),
      'Canal A',
      'ERROR',
    );
    expect(r.message).toBeNull();
    expect(r.nextSeenStatus).toBe('ERROR');
  });

  it('nova desconexão real após recuperação volta a toastar', () => {
    const r = decideChannelToast(
      ev({ previousStatus: 'CONNECTED', currentStatus: 'DISCONNECTED' }),
      'Canal A',
      'CONNECTED',
    );
    expect(r.message).toBe('Canal "Canal A" desconectado.');
  });
});

describe('mergeChannelStatus', () => {
  it('com override substitui status e lastError', () => {
    const base = channel({ id: 'c1', status: 'CONNECTED', lastError: null });
    const merged = mergeChannelStatus(base, { status: 'ERROR', lastError: 'falhou' });
    expect(merged.status).toBe('ERROR');
    expect(merged.lastError).toBe('falhou');
  });

  it('sem override retorna o canal original (identidade)', () => {
    const base = channel({ id: 'c1' });
    expect(mergeChannelStatus(base, undefined)).toBe(base);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `pnpm test -- channel-status`
Expected: FAIL (`Cannot find module './channel-status'` / funções não definidas).

- [ ] **Step 3: Implementar o módulo puro**

```ts
import type {
  ChannelResponseDto,
  ChannelResponseDtoStatusEnumKey,
} from '@/lib/generated/types/ChannelResponseDto';
import type { ChannelStatusEvent, ChannelStatusOverride } from './types';

export interface ChannelToastDecision {
  message: string | null;
  nextSeenStatus: ChannelResponseDtoStatusEnumKey;
}

function isCriticalTransition(
  previousStatus: ChannelResponseDtoStatusEnumKey,
  currentStatus: ChannelResponseDtoStatusEnumKey,
): boolean {
  if (currentStatus === 'ERROR') return true;
  return previousStatus === 'CONNECTED' && currentStatus === 'DISCONNECTED';
}

function buildMessage(event: ChannelStatusEvent, channelName: string): string {
  if (event.currentStatus === 'ERROR') {
    return `Canal "${channelName}" entrou em erro: ${event.lastError ?? 'motivo não informado'}.`;
  }
  return `Canal "${channelName}" desconectado.`;
}

/**
 * Decide se um `channel:status` deve gerar toast (transição crítica) e qual a
 * mensagem pt-BR. Crítico sse `CONNECTED → DISCONNECTED` ou `* → ERROR`.
 * Dedup por último estado visto, por canal: só toasta se o `currentStatus`
 * difere do `lastSeenStatus`. `nextSeenStatus` é sempre `currentStatus`
 * (rastreado em todo evento, não só nos toastados). Função pura.
 */
export function decideChannelToast(
  event: ChannelStatusEvent,
  channelName: string,
  lastSeenStatus: ChannelResponseDtoStatusEnumKey | undefined,
): ChannelToastDecision {
  const critical = isCriticalTransition(event.previousStatus, event.currentStatus);
  const isRepeat = lastSeenStatus === event.currentStatus;
  const message = critical && !isRepeat ? buildMessage(event, channelName) : null;
  return { message, nextSeenStatus: event.currentStatus };
}

/**
 * Aplica o override realtime sobre o item do GET. Sem override → identidade
 * (mesma referência). Função pura.
 */
export function mergeChannelStatus(
  channel: ChannelResponseDto,
  override: ChannelStatusOverride | undefined,
): ChannelResponseDto {
  if (!override) return channel;
  return { ...channel, status: override.status, lastError: override.lastError };
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `pnpm test -- channel-status`
Expected: PASS (todos os casos verdes).

- [ ] **Step 5: Commit**

```bash
git add lib/channels/channel-status.ts lib/channels/channel-status.test.ts
git commit -m "feat(channels): funções puras decideChannelToast + mergeChannelStatus (TDD)"
```

---

## Task 3: Hook `useChannelsStatusRealtime`

**Files:**

- Create: `hooks/useChannelsStatusRealtime.ts`

- [ ] **Step 1: Implementar o hook**

Espelha `hooks/useChannelMessagesRealtime.ts` (refetch em ref via `useLayoutEffect`, cleanup completo de listeners + `disconnect`).

```ts
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
```

- [ ] **Step 2: Verificar typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS. Se `pnpm lint` reclamar de `react-hooks/exhaustive-deps` no `useEffect([])`, confirmar que é o mesmo padrão aceito em `useChannelMessagesRealtime` (refs + import estável `createSocket`); não adicionar deps que recriariam o socket.

- [ ] **Step 3: Commit**

```bash
git add hooks/useChannelsStatusRealtime.ts
git commit -m "feat(channels): hook useChannelsStatusRealtime (overrides + dedup + reconexão)"
```

---

## Task 4: Fiar o hook na tabela + banner de reconexão

**Files:**

- Modify: `components/channels/channels-table.tsx`

- [ ] **Step 1: Adicionar imports**

Logo após a linha `import { toast } from 'sonner';` (topo do bloco de imports), adicionar:

```ts
import { Loader2Icon } from 'lucide-react';
import { useChannelsStatusRealtime } from '@/hooks/useChannelsStatusRealtime';
import { mergeChannelStatus } from '@/lib/channels/channel-status';
```

- [ ] **Step 2: Derivar nomes, chamar o hook e mesclar os itens**

Em `components/channels/channels-table.tsx`, logo após o bloco `departmentsById` (o `useMemo` que termina em `}, [departmentsQuery.data]);`), inserir:

```ts
const channelNameById = useMemo(() => {
  const out = new Map<string, string>();
  for (const c of items) out.set(c.id, c.name);
  return out;
}, [items]);

const { overrides, socketDown } = useChannelsStatusRealtime(channelsQuery.refetch, channelNameById);

const effectiveItems = useMemo(
  () => items.map((c) => mergeChannelStatus(c, overrides.get(c.id))),
  [items, overrides],
);
```

- [ ] **Step 3: Renderizar o banner de reconexão**

Em `components/channels/channels-table.tsx`, localizar o fechamento do bloco de filtros (a `</div>` que fecha o `<div className="flex flex-wrap items-center gap-3">`). Imediatamente após esse `</div>` e antes de `<ChannelsTableView`, inserir:

```tsx
{
  socketDown && (
    <div
      role="status"
      aria-live="polite"
      className="border-border bg-muted text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
    >
      <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
      Reconectando…
    </div>
  );
}
```

- [ ] **Step 4: Passar os itens mesclados para a view**

Em `components/channels/channels-table.tsx`, no JSX do `<ChannelsTableView`, trocar a prop:

De:

```tsx
items = { items };
```

Para:

```tsx
items = { effectiveItems };
```

(Não alterar `connectedCount`/`totalCount` — continuam vindo de `channelsQuery.data`.)

- [ ] **Step 5: Verificar typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/channels/channels-table.tsx
git commit -m "feat(channels): fia realtime de status na tabela + banner de reconexão"
```

---

## Task 5: Exibir `lastError` acessível no card em ERROR

**Files:**

- Modify: `components/channels/channel-card.tsx`

- [ ] **Step 1: Adicionar o bloco de erro acessível**

Em `components/channels/channel-card.tsx`, localizar o `<div className="flex flex-wrap items-center gap-2">` que contém `<ChannelStatusBadge ... />` e o `<Badge ...>{channel.provider}</Badge>`. Imediatamente após o `</div>` que fecha esse bloco (e antes do `<p className="text-muted-foreground text-xs">Departamento padrão:`), inserir:

```tsx
{
  channel.status === 'ERROR' && channel.lastError && (
    <p role="alert" className="text-destructive text-xs">
      {channel.lastError}
    </p>
  );
}
```

O componente permanece **sem** `'use client'` e sem novas props (recebe `ChannelResponseDto` já mesclado pela tabela). `ChannelStatusBadge` continua reusado como está.

- [ ] **Step 2: Verificar typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/channels/channel-card.tsx
git commit -m "feat(channels): mostra lastError acessível no card em estado ERROR"
```

---

## Task 6: Corrigir docstring de `socket.ts`

**Files:**

- Modify: `lib/realtime/socket.ts`

- [ ] **Step 1: Substituir o comentário (apenas docstring; comportamento inalterado)**

Em `lib/realtime/socket.ts`, substituir o bloco de comentário das linhas 5–11 por:

```ts
/**
 * Cria um socket novo (sem singleton; escopo da tela que o monta).
 * Namespace/path default. `withCredentials: true` envia o cookie httpOnly
 * `access_token` no handshake — o backend autentica e, a partir do JWT,
 * auto-joina as salas das gateways do namespace default:
 * `company:{companyId}:tickets` (mensagens) e
 * `company:{companyId}:channels` (status de canal). O cliente NUNCA envia
 * companyId. Reconexão default do socket.io ligada.
 */
```

- [ ] **Step 2: Verificar typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/realtime/socket.ts
git commit -m "docs(realtime): socket.ts cita as 2 salas auto-joinadas (tickets + channels)"
```

---

## Task 7: Verificação final (por evidência)

**Files:** nenhum (gate de qualidade).

- [ ] **Step 1: Drift de tipos gerados (não deve mudar — não tocamos no backend)**

Run: `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated`
Expected: zero diff (exit 0). Se houver diff, **não** commitar `lib/generated` mexido — investigar (esta sprint não altera contrato).

- [ ] **Step 2: Gate de verificação local completo**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`
Expected: tudo PASS. (`pnpm build` fica fora — CLAUDE.md §11.)

- [ ] **Step 3: Validação manual contra crm-api local**

Subir `crm-api` local + `pnpm dev` no `crm-web`. Em `/configuracoes/canais`:

- Disparar transições via menu (Ativar / Desativar / Forçar restart) e/ou criar canal com credenciais Gupshup inválidas (`CONNECTING → ERROR`).
- Confirmar: (a) badge muda em tempo real sem refresh; (b) toast em `CONNECTED → DISCONNECTED` e em `* → ERROR`, e **nenhum** toast em transição não-crítica; (c) `lastError` visível no card em `ERROR`; (d) parar/reiniciar o `crm-api` → banner "Reconectando…" e refetch (reconciliação) ao voltar.
- `/configuracoes/design-system` continua funcionando.
- Verificar light + dark mode no badge realtime, banner e `lastError`.

- [ ] **Step 4: Abrir PR (após confirmação do humano — branch protection em `main`)**

> NÃO fazer `git push` sem confirmação explícita do humano (CLAUDE.md §4.11/§4.14 + memória `feedback_no_push_until_validated`).

Após o humano confirmar:

```bash
git push -u origin feat/sprint-1-8-fase-b-canal-status-realtime
gh pr create --base main --title "feat(channels): Sprint 1.8 Fase B — card de canal com status realtime" --body "Fecha crm-api/ROADMAP.md §6.4 item 10. Spec/plan em docs/superpowers/."
```

- [ ] **Step 5: Pós-merge — ROADMAP em PR separado**

Após o merge do PR acima, em branch separada `docs/update-roadmap-1-8-fase-b` (criada de `origin/main` atualizado): marcar os 5 checkboxes da Sprint 1.8 Fase B em `ROADMAP.md` §5.1 e atualizar a nota cross-repo / tabela §6 (Fase 1 frontend fechou o item 10 do `crm-api/ROADMAP.md` §6.4). Commitar; abrir PR só após confirmação do humano.

---

## Notas de execução

- TDD aplica-se **apenas** à Task 2 (funções puras). Tasks 3–6 são integração/UI — verificadas por typecheck/lint e validação manual (sem teste de socket ou componente trivial, por decisão da sprint).
- Nenhuma dependência nova. Nenhuma edição em `lib/generated/`.
- Multi-tenant transparente: nada envia `companyId` (cookie httpOnly + auto-join no backend).
