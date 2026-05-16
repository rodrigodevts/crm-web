# Sprint 1.6 Fase B — Tela debug de mensagens recebidas (validação ponta-a-ponta da Fase 1)

> **Status:** design aprovado (2026-05-16)
> **Branch:** `feat/sprint-1-6-fase-b-mensagens-debug`
> **Pareada com:** crm-api Sprint 1.6 (outbound + status) + Sprint 1.8c (auth handshake Socket.IO + auto-join + GET mínimo de mensagens, PR #79)
> **ROADMAP:** `crm-web/ROADMAP.md` §5.1 — Sprint 1.6 Fase B

---

## 1. Objetivo e não-objetivos

**Objetivo:** entregar uma tela **descartável** de validação que fecha o checklist ponta-a-ponta da Fase 1 (`crm-api/ROADMAP.md` §6.4, cenários 4–7 e 11): lista as últimas N mensagens de um canal, recebe `message:new`/`message:status` em tempo real, e permite enviar texto via composer mínimo.

**Não-objetivos (anti-escopo explícito):**

- Não é a tela final de Atendimentos (Fase 2, UI Izing-like) — será **substituída/descartada**.
- Sem polish visual, sem componentes reutilizáveis novos, sem tocar o showcase `/configuracoes/design-system`.
- Sem reconexão rica (indicador "reconectando", backoff custom) — fica para Sprint 1.8 Fase B; aqui só banner discreto em `connect_error` + reconexão default do socket.io.
- Sem paginação/scroll infinito (GET é "últimas N", sem cursor — Fase 2).
- Composer aceita só `type=TEXT` (contrato do backend na Sprint 1.6).

## 2. Contratos do backend (confirmados na fonte do crm-api)

REST:

- `GET /api/v1/channels/:id/messages?limit=N` (1–50, default 20) → `{ items: ChannelMessageResponse[] }`, **ordem cronológica ascendente**. `ChannelMessageResponse`: `id, ticketId, channelConnectionId, externalId|null, direction (INBOUND|OUTBOUND), type, status (PENDING|SENT|DELIVERED|READ|FAILED), content (unknown|null), sentByUserId|null, sentByBot, isSystemMessage, createdAt (ISO)`.
- `POST /api/v1/tickets/:id/messages` body discriminated union `{ type:"TEXT", text: string 1..4096 }` → **202** `MessageResponse`.

Socket.IO (namespace/path default, `withCredentials:true`, sala `company:{companyId}:tickets` **auto-joinada pelo backend** a partir do JWT do cookie httpOnly no handshake — cliente nunca envia `companyId`):

- `message:new` → `MessageNewEvent { messageId, ticketId, contactId, channelConnectionId, direction, type, content, createdAt, ticketStatus, ticketCreated, sentByUserId|null }`.
- `message:status` → `MessageStatusEvent { messageId, ticketId, status, externalId|null, lastError|null, occurredAt }`.

Os schemas `ChannelMessageResponse`, `MessageNewEvent` e `MessageStatusEvent` **estão expostos no `openapi.json`** do crm-api (verificado: 41 paths, ambos `/messages` presentes). Portanto Kubb gera os tipos — **não** declarar tipo local de evento.

## 3. Regen Kubb (pré-requisito, primeiro passo da implementação)

`crm-web/openapi.snapshot.json` está stale (sem `/messages`). crm-api rodando local em `:3000`. Passo:

1. `curl -s http://localhost:3000/api/v1/openapi.json -o openapi.snapshot.json` (sobrescreve o snapshot do crm-web).
2. `pnpm generate:api:from-snapshot` (regenera `lib/generated/` a partir do snapshot — garante CI zero-diff, regra CLAUDE.md §15).
3. Confirmar nomes exatos dos hooks/tipos gerados (padrão observado: `useChannelsControllerList` → provável `useChannelMessagesControllerList` / `useTicketsMessagesControllerSend`; **confirmar pós-regen, não assumir**).
4. Commitar `lib/generated/` + `openapi.snapshot.json` no mesmo PR.

## 4. Arquitetura

```
app/(app)/atendimentos/canais-debug/[channelId]/
  page.tsx                      Server Component — shell (metadata, lê params, monta header)
  components/
    channel-debug-view.tsx      'use client' — orquestra hook + estados
    message-list.tsx            lista + linha inline (cronológico asc)
    message-composer.tsx        textarea + enviar (RHF + zodResolver do schema gerado)
hooks/
  useChannelMessagesRealtime.ts 'use client' — seed (GET) + socket + merge + reconnect refetch
lib/realtime/
  socket.ts                     factory fino do socket.io-client (sem singleton global)
lib/messaging/
  merge-messages.ts             função PURA testável
  merge-messages.test.ts        único teste unitário da sprint
```

Observação: o route group autenticado real é `app/(app)/...` (o `app/CLAUDE.md` descreve `(dashboard)`, mas está desatualizado — a estrutura existente no repo é `(app)`; seguir o que existe). O Server Component só monta shell e passa `channelId` ao Client; todo socket/estado vive no Client Component.

## 5. Função pura `mergeMessages` (núcleo testável)

`mergeMessages(current: MessageRow[], event): MessageRow[]`, com `event` ∈:

- `{ kind:'seed', items: ChannelMessageResponse[] }`
- `{ kind:'new', msg }` (derivado de `message:new`)
- `{ kind:'status', patch }` (derivado de `message:status`)

Regras:

- **Identidade:** `id` (GET) ≡ `messageId` (eventos).
- **`seed` / `new`:** upsert por `id` (re-seed no reconnect mescla, não duplica → fecha cenário 11 mesmo com queda no meio do álbum).
- **`status`:** patcha `status` / `externalId` / `lastError` da mensagem existente. Se `messageId` não está na lista → **ignora** (debug; sem buffer de eventos órfãos — tradeoff documentado).
- **Ordenação:** sempre `createdAt` ascendente, desempate estável por `id` (tolera eventos fora de ordem).

`MessageRow` = forma derivada de `ChannelMessageResponse` (mesmos campos + `lastError?` que só vem de `message:status`). Tipos base de `@/lib/generated`; o campo extra de UI documentado inline.

## 6. Hook `useChannelMessagesRealtime(channelId)`

- Seed inicial via hook Kubb do GET (limit 20).
- Socket via `lib/realtime/socket.ts`: `io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000', { withCredentials:true })`. Namespace/path default. `companyId` nunca enviado.
- Evento **`connect`** (montagem **e** reconexões automáticas do socket.io): **refetch do GET + `mergeMessages(..., {kind:'seed'})`** — fecha gaps de eventos perdidos durante queda (decisão aprovada).
- `message:new`: filtra `channelConnectionId === channelId` → `merge('new')`.
- `message:status`: `merge('status')`.
- `connect_error`: `socketDown=true` → banner discreto. Reconexão default do socket.io ligada.
- Cleanup: `socket.off` + `socket.disconnect()` no unmount.
- Expõe `{ rows, status:'loading'|'error'|'ready', socketDown, latestTicketId }` onde `latestTicketId = rows[rows.length-1]?.ticketId`.

## 7. UI e estados

- **Lista** (`message-list.tsx`): por linha — `createdAt` formatado (pt-BR), badge IN/OUT por `direction`, `ticketId` curto (8 chars), conteúdo defensivo (`content` objeto com `text` string → mostra o texto; caso contrário `JSON.stringify` legível — cobre tipos não-TEXT), badge de `status`; em `FAILED` mostra `lastError` quando presente.
- **Composer** (`message-composer.tsx`): alvo = `latestTicketId` (ticketId da mensagem mais recente — decisão aprovada), exibido "Respondendo ticket {short}". Desabilitado com hint quando a lista está vazia ("sem inbound ainda → sem ticket"). Validação `text` 1..4096 via `zodResolver` do schema gerado (branch TEXT da discriminated union). Pós-202: nada otimista — o `message:new` OUTBOUND chega pelo socket e entra via merge/de-dup. Erro de envio → toast `sonner`.
- **Estados explícitos:** `loading` (skeleton/placeholder do fetch inicial), `empty` ("nenhuma mensagem ainda — aguarde um inbound"), `error` (fetch falhou + retry), banner `socket-down` ("conexão em tempo real indisponível").
- Tokens shadcn baseline (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-destructive`). pt-BR. Light + dark. a11y: `<label>` no textarea, foco visível, Enter envia / Shift+Enter quebra linha, navegação por teclado.

## 8. Entrada opcional (fora do escopo mínimo)

Link "Debug mensagens" no card de canal em `/configuracoes/canais` (ADMIN). Só se sobrar tempo; não bloqueia a sprint.

## 9. Restrições não-negociáveis

Multi-tenant transparente (sem `companyId` em request nem socket); sem `localStorage`/`sessionStorage`; cores semânticas/tokens; tipos de `@/lib/generated` (não redeclarar entidade de mensagem); sem libs novas (`socket.io-client` já existe); pt-BR visível / identificadores em inglês; WCAG AA; light+dark; sem `any`/`as Type` sem comentário justificando; `lib/generated/` regenerado e comitado junto (CI zero-diff).

## 10. Testes e verificação

- **Único unit:** `lib/messaging/merge-messages.test.ts` — seed+new+status, de-dup por `id`, patch de status, ordenação com evento fora de ordem, status órfão ignorado. **Sem testar UI.**
- **Gate local:** `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` verdes + `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` zero-diff. `pnpm build` fica para CI (CLAUDE.md §11).
- **Manual contra crm-api local** (cada cenário documentado no PR — Gupshup real ou replay de fixture do webhook-recorder):
  - cenário 4: inbound → mensagem INBOUND aparece na lista em tempo real
  - cenário 5: ticket criado (ticketId visível na linha)
  - cenário 6: fora de horário sem bot → `outOfHoursMessage` aparece como OUTBOUND
  - cenário 7: enviar pelo composer → OUTBOUND aparece, status transita (PENDING→SENT→DELIVERED/READ via `message:status`)
  - cenário 11: 4 fotos rápidas (álbum) → 4 mensagens em ordem, sem duplicação (de-dup por id)

## 11. Ao finalizar

Marcar os checkboxes da Sprint 1.6 Fase B em `crm-web/ROADMAP.md` §5.1. PR via `gh` CLI (sem push direto em `main`; sem push pro remote sem confirmação do humano). O commit de sync do ROADMAP (já bundlado nesta branch via cherry-pick) viaja neste PR.

## 12. Ordem de implementação (resumo — detalhe vai no plano)

1. Regen API (snapshot + `generate:api:from-snapshot` + commit `lib/generated`).
2. Shell da rota (Server Component + metadata).
3. `mergeMessages` puro + teste (TDD).
4. `lib/realtime/socket.ts` factory.
5. Hook `useChannelMessagesRealtime` (seed + socket + reconnect refetch).
6. Fetch + lista (`message-list.tsx`, `channel-debug-view.tsx`).
7. Composer (`message-composer.tsx`).
8. Estados/polish mínimo + a11y.
9. Verificação por evidência + validação manual §6.4.
10. Atualizar ROADMAP §5.1.
