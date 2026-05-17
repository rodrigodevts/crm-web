# Sprint 1.8 Fase B — Card de canal com status realtime

> Design doc. Frontend (`crm-web`). Pareada com Sprint 1.8b do `crm-api`
> (emissão `channel:status` já pronta e validada).
> Fecha `crm-api/ROADMAP.md` §6.4 item 10 ("status do canal em tempo real no
> frontend"). ROADMAP.md (crm-web) §5.1 → "Sprint 1.8 Fase B".

## Objetivo

Adicionar a camada realtime à tela `/configuracoes/canais` **já existente**
(Sprint 1.4 Fase B): o card de canal reflete o último `channel:status`
recebido, toasta transições críticas, mostra `lastError` em ERROR e sinaliza
queda/reconexão do socket. Sem nova rota, sem novo componente de design
system, sem novo endpoint REST, sem mockup Figma.

## Restrições não-negociáveis (de CLAUDE.md + prompt da sprint)

- `'use client'` só onde já está; `channel-card.tsx` permanece sem
  `'use client'`.
- Tipos do Kubb (`@/lib/generated`) para a entidade. Tipo local **só** para o
  evento `channel:status` (não está no OpenAPI), com comentário justificando,
  espelhando o schema do `crm-api`.
- Não editar `lib/generated/`.
- Multi-tenant transparente: nunca enviar `companyId` (cookie httpOnly
  autentica; backend auto-joina a sala).
- Sem `localStorage`/`sessionStorage`. Sem libs novas.
- Cores semânticas + tokens shadcn baseline; reusar `ChannelStatusBadge`
  (não duplicar o mapa de tons).
- Toasts via `sonner`; mensagens pt-BR; identificadores em inglês.
- A11y WCAG AA (light + dark): `lastError` e "Reconectando…" perceptíveis
  por leitor de tela.
- Cleanup completo do socket no unmount (`off` de todos os listeners +
  `disconnect`), igual a `useChannelMessagesRealtime`.
- Sem `any` / `as Type` sem comentário.

## Fato confirmado no brainstorm (fonte canônica read-only)

- `crm-api/.../gateways/channels.gateway.ts`: `@WebSocketGateway` **sem
  namespace** → namespace default `/`. `handleConnection` auto-joina
  `company:{companyId}:channels` a partir do `SocketPrincipal` do JWT.
- `crm-api/.../schemas/channel-status-event.schema.ts`: payload
  `{ channelConnectionId, previousStatus, currentStatus, provider,
lastError, occurredAt }`.
- Consequência: `createSocket()` (default namespace, `withCredentials`)
  recebe `channel:status` **sem nenhum ajuste**. Como o gateway de canais e
  o de mensagens compartilham o namespace default, um socket por montagem da
  tabela faz o backend auto-joinar as duas salas (`:tickets` e `:channels`).
  Único ajuste em `socket.ts`: corrigir o docstring (hoje só cita a sala
  `:tickets`). Comportamento inalterado.

## Decisões do brainstorm

1. **Transições críticas**: exatamente as 2 do escopo —
   `CONNECTED → DISCONNECTED` e `(qualquer estado) → ERROR`. Sem toast
   positivo de recuperação.
2. **Dedup**: por último estado visto, por canal. Suprime apenas alvo
   crítico consecutivo idêntico; uma nova desconexão real após recuperação
   volta a toastar (o "último estado visto" é atualizado em **todo** evento,
   não só nos toastados).
3. **Indicador de reconexão**: banner único acima da grade
   (`role="status"`, `aria-live="polite"`). Um socket por tabela → um
   indicador só.
4. **A11y**: `lastError` com `role="alert"` (assertivo — erro recém-surgido);
   reconexão com `role="status"` (polite).

## Arquitetura — abordagem escolhida

**Overlay in-memory num hook, espelhando `useChannelMessagesRealtime`.**

GET (TanStack Query, hook gerado) é o seed. O hook mantém um
`Map<channelConnectionId, { status, lastError }>` alimentado por
`channel:status`. A tabela faz o merge por id no render via função pura. No
`connect`: refetch da lista + limpa os overrides (GET é a verdade no
reconnect; o evento é a verdade entre refetches). Nunca muta o cache da query
gerada.

Alternativas descartadas: `queryClient.setQueryData` (a query é keyed por
`{search,status}` → múltiplas entradas; briga com o `invalidateQueries` das
ações do menu; mutar shape paginado gerado é frágil; não testável puramente);
Zustand store (over-engineering p/ uma tela cujo socket já vive no mount da
tabela).

## Componentes e contratos

### 1. `lib/channels/types.ts` (novo)

`ChannelStatusEvent` local espelhando
`crm-api/src/modules/channels/schemas/channel-status-event.schema.ts`, com o
**mesmo estilo de comentário-justificativa** de `lib/messaging/types.ts`
(evento não está no OpenAPI → Kubb não gera). Campos enum reusam
`ChannelResponseDtoStatusEnumKey` e `ChannelResponseDtoProviderEnumKey` de
`@/lib/generated`. Não redeclara a entidade.

```ts
export interface ChannelStatusEvent {
  channelConnectionId: string;
  previousStatus: ChannelResponseDtoStatusEnumKey;
  currentStatus: ChannelResponseDtoStatusEnumKey;
  provider: ChannelResponseDtoProviderEnumKey;
  lastError: string | null;
  occurredAt: string;
}
```

### 2. `lib/channels/channel-status.ts` (novo) — único código com teste unitário

- `decideChannelToast(event, channelName, lastSeenStatus)
→ { message: string | null; nextSeenStatus: ChannelResponseDtoStatusEnumKey }`
  - Crítico sse `previousStatus === 'CONNECTED' && currentStatus ===
'DISCONNECTED'` **ou** `currentStatus === 'ERROR'`.
  - `message` não-nulo sse crítico **e** `currentStatus !== lastSeenStatus`
    (dedup).
  - `nextSeenStatus = event.currentStatus` (sempre — rastreado em todo
    evento, não só nos toastados).
  - Mensagens pt-BR:
    - `CONNECTED → DISCONNECTED`: `Canal "{name}" desconectado.`
    - `* → ERROR`: `Canal "{name}" entrou em erro: {lastError ?? 'motivo
não informado'}.`
- `mergeChannelStatus(channel: ChannelResponseDto, override?: { status;
lastError }) → ChannelResponseDto`
  - Com override: retorna `{ ...channel, status, lastError }`.
  - Sem override: retorna o `channel` original (identidade).

Ambas funções puras, sem dependência de React/socket.

### 3. `hooks/useChannelsStatusRealtime.ts` (novo)

Client hook. Um `createSocket()` por montagem (nível tabela, **não** por
card). Segue o pattern exato de `useChannelMessagesRealtime`:

- `useState` `overrides: Map<string, { status; lastError }>` e
  `socketDown: boolean`.
- `refetch` em `useRef` ressincronizado via `useLayoutEffect` sem dep array
  (evita `react-hooks/refs` e recriar o socket).
- `useRef` `lastSeenByChannel: Map<string, ChannelResponseDtoStatusEnumKey>`
  para o dedup (passado a `decideChannelToast`).
- Listeners:
  - `channel:status`: atualiza `overrides` (set por
    `channelConnectionId`); chama `decideChannelToast`; se `message`,
    `toast.error(message)`; atualiza `lastSeenByChannel`.
  - `connect`: `setSocketDown(false)`; **limpa `overrides`**; `void
refetchRef.current()`.
  - `connect_error` e `disconnect`: `setSocketDown(true)`.
- Cleanup: `socket.off(...)` de todos + `socket.disconnect()`.
- Retorna `{ overrides, socketDown }`.

### 4. `components/channels/channels-table.tsx` (alteração cirúrgica)

Já é Client Component. Mudanças:

- Chama `useChannelsStatusRealtime(channelsQuery.refetch)`.
- `useMemo`: `effectiveItems = items.map(c => mergeChannelStatus(c,
overrides.get(c.id)))`. Passa `effectiveItems` ao `ChannelsTableView`
  (prop `items` inalterada em tipo — `ChannelResponseDto[]`).
- Renderiza o banner de reconexão acima do `<ChannelsTableView>` quando
  `socketDown`.

### 5. Banner de reconexão (inline em `channels-table.tsx`)

Faixa discreta acima da grade, só quando `socketDown`:

- `role="status"`, `aria-live="polite"`.
- `Loader2` (lucide) com `animate-spin` + texto "Reconectando…".
- Tokens neutros: `bg-muted text-muted-foreground border` (light/dark).
- Some no `connect` (que também refetcha → reconciliação).

### 6. `components/channels/channel-card.tsx` (adição mínima)

Permanece **sem** `'use client'`, sem novas props (recebe
`ChannelResponseDto` já mergeado a montante). Quando
`channel.status === 'ERROR' && channel.lastError`, renderiza sob a linha de
badges:

```tsx
<p role="alert" className="text-destructive text-xs">
  {channel.lastError}
</p>
```

`ChannelStatusBadge` reusado como está — reflete `channel.status` mergeado
automaticamente (não duplica mapa de tons).

### 7. `lib/realtime/socket.ts` (só docstring)

Corrige o comentário para citar as duas salas auto-joinadas no namespace
default (`:tickets` e `:channels`). Sem mudança de comportamento.

## Fluxo de dados

```
GET /channels (TanStack Query gerado)  ──seed──┐
                                               ▼
channel:status ──> useChannelsStatusRealtime ──> overrides Map
                                               │
                       channels-table useMemo: mergeChannelStatus(item, override)
                                               ▼
                       ChannelsTableView ──> ChannelCard
                                              ├─ ChannelStatusBadge (status mergeado)
                                              └─ lastError (role=alert) se ERROR
```

Reconciliação:

- Entre refetches: evento é a verdade (overlay vence o GET).
- No `connect` (reconexão): limpa overrides + refetch → GET volta a ser a
  verdade, preenchendo o gap perdido enquanto o socket esteve down.
- Ações do menu (Ativar/Desativar/Forçar restart): mantêm o
  `invalidateQueries` atual. Sem conflito — o `channel:status` da mesma
  transição concorda com o GET refetchado e se auto-corrige no próximo
  evento.

## Tratamento de erros / estados

- Socket down: banner "Reconectando…" persistente até `connect`; reconexão
  automática default do socket.io ligada.
- `lastError` exibido só em `ERROR`, com `role="alert"`.
- Evento para `channelConnectionId` desconhecido na lista atual: vira entrada
  no `overrides` mas não casa com nenhum item renderizado (filtro/busca
  ativa) → inócuo; some no próximo refetch.

## Testes

Único arquivo: `lib/channels/channel-status.test.ts` (Vitest, estilo de
`lib/messaging/merge-messages.test.ts`).

- `decideChannelToast`:
  - `CONNECTED → DISCONNECTED` → message crítica com nome do canal.
  - `* → ERROR` (ex.: `CONNECTING → ERROR`) → message crítica com
    `lastError` embutido.
  - `* → ERROR` com `lastError === null` → message com "motivo não
    informado".
  - Não-crítico (`CONNECTING → CONNECTED`, `INACTIVE → CONNECTING`) →
    `message === null`.
  - Dedup: mesmo alvo crítico consecutivo (mesmo `lastSeenStatus`) →
    2ª `message === null`; nova desconexão real após recuperação
    (`lastSeenStatus` mudou) → volta a toastar.
  - `nextSeenStatus` sempre = `currentStatus`.
- `mergeChannelStatus`:
  - Com override → `status`/`lastError` substituídos.
  - Sem override → objeto original (identidade).

Sem teste de socket ou de componente trivial. Validação manual cobre o
runtime.

## Validação manual (por evidência, contra `crm-api` local)

Subir `crm-api` local + `pnpm dev` no `crm-web`. Em `/configuracoes/canais`:

1. Disparar transições via menu (Ativar / Desativar / Forçar restart) e/ou
   criar canal com credenciais Gupshup inválidas
   (`CONNECTING → ERROR`).
2. Verificar: (a) badge muda em tempo real sem refresh; (b) toast em
   `CONNECTED → DISCONNECTED` e em `* → ERROR`, e **nenhum** toast em
   transição não-crítica; (c) `lastError` visível no card em `ERROR`;
   (d) parar/reiniciar o `crm-api` → banner "Reconectando…" e
   reconciliação (refetch) ao voltar.
3. `/configuracoes/design-system` continua funcionando.
4. `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` verdes
   (sem `pnpm build` — CLAUDE.md §11).

## Pós-merge (PR separado `docs/update-roadmap-1-8-fase-b`)

Marcar os 5 checkboxes da Sprint 1.8 Fase B em `ROADMAP.md` §5.1 e a nota
cross-repo / tabela §6 de que a Fase 1 frontend fechou o item 10 do
`crm-api/ROADMAP.md` §6.4.
