# Design — Sprint 1.4 Fase B: tela `/configuracoes/canais`

> **Status:** aprovado pelo PO em 2026-05-11.
> **Pareada com:** crm-api PR #56 (módulo `channels` — CRUD + state machine + reveal-credentials).
> **Roadmap:** §5.1 Fase 1, primeira sprint frontend da Fase 1.

---

## 1. Objetivo

Substituir o placeholder de `/configuracoes/canais` por uma tela funcional de CRUD de canais Gupshup, com mascaramento de credenciais, fluxo dedicado de revelação ADMIN-only, ações inline (ativar/desativar/restart/excluir) e tratamento dos 409 de delete bloqueado por tickets ativos.

Realtime de status (`channel:status` via Socket.IO) **não** entra nesta sprint — fica para Sprint 1.8 Fase B. Aqui, o badge de status é pintado pelo enum vindo do GET, sem atualização ao vivo.

## 2. Escopo

### Inclui
- Lista de canais em cards (não tabela) — nome, telefone, status, provider, departamento padrão, dropdown de ações.
- Toolbar com busca debounced (300ms) e filtro de status.
- Contador "X de Y canais conectados" no header.
- Estados explícitos: loading (3 skeletons), empty global, empty filtrado, erro com retry.
- `ChannelDialog` (create + edit unificado) com schema Zod local que reforça regra timeout/closeReason em ambos os modos.
- Fluxo "Revelar credenciais" (ADMIN-only) que popula apiKey + appId no mesmo clique.
- Ações inline com confirmação: activate, deactivate, restart, soft delete.
- AlertDialog único de delete com troca de conteúdo no 409 (mostra counts de tickets abertos/pendentes).
- RBAC: AGENT/SUPERVISOR sem item na sidebar, bloqueados via `proxy.ts` no acesso direto à rota.
- Snapshot OpenAPI atualizada + `lib/generated` regenerado para incluir hooks de channels.

### Não inclui
- Realtime via socket.io-client (Sprint 1.8 Fase B).
- Toast em transições críticas de status (Sprint 1.8 Fase B).
- `lastError` em estado ERROR (Sprint 1.8 Fase B — vem do realtime).
- Capability flags (`requiresQrAuth`, `supportsTemplates`, etc.) condicionalizando campos — só Gupshup no MVP, sem condicionalização necessária.
- Showcase no `/configuracoes/design-system` — nada aqui é primitivo novo, só composição.
- Campo `defaultChatFlowId` no form. Backend aceita opcional/nullable, mas `ChatFlow` é entidade da Fase 3a (ainda não existe no schema). UI **não envia** esse campo no payload; o backend default `null` cobre.

## 3. Achados do contrato real vs prompt inicial

Antes do design, validei o crm-api `main` (PR #56 mergeado) e encontrei divergências em relação ao prompt inicial. Decisões consolidadas:

| Item | Contrato real | Decisão de UI |
|---|---|---|
| Credenciais Gupshup | `config: { apiKey, appId, appName, sourcePhone }` (aninhado) | Form trata estrutura aninhada; submit envia `config` como objeto |
| `phoneNumber` regex | `^\d+$` — apenas dígitos, sem `+` | Input com helper "Apenas dígitos. Ex.: `5511999998888`"; submit strip de `+`/espaços por segurança |
| Mascaramento | Apenas `apiKey` e `appId` (não `appName` nem `sourcePhone`) | "Revelar" popula só apiKey + appId; appName/sourcePhone editáveis sempre |
| Telefone no payload | `phoneNumber` (top-level) **E** `config.sourcePhone` (cifrado) | UI mostra **um único** input "Telefone do canal"; frontend duplica o valor nos dois campos do payload |
| `provider` no schema Zod | `z.literal('GUPSHUP')` — BAILEYS rejeitado | Select com opção BAILEYS visível mas `disabled` com tooltip "Disponível na Fase 7" |
| `inactivityCloseReasonId` required when timeout > 0 | `superRefine` só no `CreateChannelSchema`; UpdateSchema não valida | Form local replica a regra para create e edit |
| 409 do delete | `ConflictException({ message, details: { openTicketsCount, pendingTicketsCount } })` | Dialog parse `error.response?.data?.details` |
| Snapshot OpenAPI | `openapi.snapshot.json` do crm-web não tem `/channels` ainda | Step 0 do plano: subir crm-api local, baixar `/api/v1/openapi.json`, atualizar snapshot, regenerar `lib/generated` |

## 4. Arquitetura de arquivos

```
app/(app)/configuracoes/canais/
├── page.tsx                          # Server Component, exporta metadata, renderiza <ChannelsList/>
├── loading.tsx                       # 3 skeletons de card
├── error.tsx                         # mensagem + botão "Tentar novamente" via reset()
└── components/
    ├── channels-list.tsx             # 'use client' — toolbar + grid + estados (loading/empty/filtered-empty/error)
    ├── channel-card.tsx              # card visual; status badge + nome + telefone + provider + depto + menu
    ├── channel-actions-menu.tsx      # DropdownMenu + AlertDialogs encadeados (activate/deactivate/restart/delete)
    ├── channel-status-badge.tsx      # Badge tipado por ChannelStatus
    ├── channel-dialog.tsx            # create + edit unificado; inclui fluxo de reveal e schema Zod local
    └── delete-channel-dialog.tsx     # AlertDialog único com 2 estados (confirmação / bloqueado por tickets)
```

**Decisões finas:**
- Hook de reveal vive inline dentro de `channel-dialog.tsx`. Sem reuso real fora do dialog → YAGNI.
- `channel-actions-menu.tsx` extraído do card porque 5 itens × AlertDialogs de confirmação tornam o card poluído.
- Sem barrel `index.ts` na pasta `components/` (padrão das outras telas de Configurações).

## 5. UX detalhada — 3 pontos críticos

### 5.1 Revelar credenciais

Em modo edit, `apiKey` e `appId` começam mascarados como `••••<last4>` (vindos do GET). Três estados visuais por par:

- **`masked`** — inputs `readOnly`, valor `••••<last4>`. Botão único "Revelar credenciais" logo acima do par. AGENT/SUPERVISOR nem veem o botão.
- **`revealing`** — botão vira spinner + label "Revelando…", inputs continuam `readOnly`. Mutation `useChannelsControllerReveal`.
- **`revealed`** — sucesso: inputs ficam editáveis, populados com `apiKey` e `appId` decifrados. Botão some. Toast: **"Credenciais reveladas — esta ação foi registrada em auditoria."**

Justificativa para **um único botão revelando ambos**: o endpoint `POST /channels/:id/reveal-credentials` é único e devolve as duas credenciais juntas. Dois botões fariam dois POSTs idênticos (dois AuditLogs redundantes) ou um botão real + um derivado de cache (UX confusa). PO confirmou.

Submit do form em edit:
- Se par está `masked` → campos não enviados no PATCH (não estão em `dirtyFields`).
- Se par está `revealed` → campos enviados **só se efetivamente alterados** após reveal.
- Reveal sem alteração ≠ dirty: revelar e fechar sem mudar nada não dispara PATCH.

### 5.2 Delete com 409

AlertDialog único com troca de conteúdo:

**Estado 1 — Confirmação** (default ao abrir):
- Título: "Excluir canal `<nome>`?"
- Descrição: "Tickets já fechados são preservados. Esta ação é reversível pelo admin."
- Ações: "Cancelar" / "Excluir" (destrutivo)

**Estado 2 — Bloqueado** (após receber 409 do DELETE):
- Título: "Não é possível excluir"
- Descrição: mensagem do backend (ex.: "Canal possui 4 atendimentos ativos. Conclua-os antes de excluir.")
- Breakdown listado:
  - `{openTicketsCount} atendimento(s) aberto(s)` (oculta linha se count = 0)
  - `{pendingTicketsCount} atendimento(s) pendente(s)` (oculta linha se count = 0)
- Pluralização: 1 → "1 atendimento aberto"; N → "N atendimentos abertos".
- Ação única: "Entendi"

Modal não fecha entre estados — só troca de conteúdo. Reduz cliques e mantém contexto.

### 5.3 Auto-fechamento (timeout/closeReason)

Card `<PreferenceSection>` dedicado dentro do dialog, intitulado "Auto-fechamento por inatividade":

- Input numérico `inactivityTimeoutMinutes` (opcional). Helper: "Em branco = desabilitado."
- Se vazio/0 → Select `inactivityCloseReasonId` **escondido** e zerado no submit (envia `null` para ambos).
- Se > 0 → Select revelado, label com asterisco vermelho (`<FieldLabel required>`). Zod local: timeout > 0 ⇒ closeReason obrigatório.
- Helper informativo abaixo: "Tickets em modo bot não são fechados por este timeout." (espelha RF-CAN-10 do audit; admin sabe o que está configurando).

## 6. Form: shape e validação

Schema Zod local (`channelFormSchema`), derivado mas estendido em relação ao Zod gerado pelo Kubb (porque o crm-web precisa enforcement extra que o backend só faz no create):

```ts
// pseudo-código
z.object({
  name: z.string().trim().min(2).max(100),
  provider: z.literal('GUPSHUP'),
  phoneNumber: z.string().regex(/^\d+$/),
  config: z.object({
    apiKey: z.string().min(1),
    appId: z.string().min(1),
    appName: z.string().min(1),
    // sourcePhone NÃO é input separado; preenchido pelo frontend = phoneNumber
  }),
  defaultDepartmentId: z.string().uuid().nullable(),
  inactivityTimeoutMinutes: z.number().int().positive().max(43200).nullable(),
  inactivityCloseReasonId: z.string().uuid().nullable(),
}).superRefine((data, ctx) => {
  if (data.inactivityTimeoutMinutes && !data.inactivityCloseReasonId) {
    ctx.addIssue({ path: ['inactivityCloseReasonId'], message: 'Obrigatório quando há timeout' });
  }
});
```

Submit:
- **Create**: `useChannelsControllerCreate({ ...form, config: { ...form.config, sourcePhone: form.phoneNumber } })`.
- **Edit**: `useChannelsControllerUpdate({ id, body: pick(form, dirtyFields) })`. Se `phoneNumber` é dirty, `config.sourcePhone` também é incluído no PATCH (mesmo que `config.*` não esteja dirty).
- Erro 409 em create por `(companyId, name)` duplicado → mostra erro no campo `name`: "Já existe um canal com este nome nesta empresa."
- Erro 409 por `(companyId, phoneNumber)` duplicado → mostra erro no campo `phoneNumber`: "Já existe um canal com este número."
- Erro 400 com mensagem do backend → toast genérico com a mensagem.

## 7. Estados de UI

| Estado | Condição | Conteúdo |
|---|---|---|
| Loading | `isLoading` de `useChannelsControllerList` | Grid de 3 skeletons de card |
| Empty global | `items.length === 0 && !hasFilters` | EmptyState com ícone + "Nenhum canal cadastrado." + botão "Novo canal" replicado |
| Empty filtrado | `items.length === 0 && hasFilters` | EmptyState com mensagem "Nenhum canal corresponde aos filtros." + botão "Limpar filtros" |
| Erro | `isError` | `error.tsx` com mensagem amigável + botão "Tentar novamente" (reset) |
| Sucesso | `items.length > 0` | Grid responsivo de cards |

## 8. RBAC e segurança

- **`lib/rbac.ts`**: não precisa mudar. `canAccessRoute('AGENT'|'SUPERVISOR', '/configuracoes/canais')` já retorna `false` via prefix match — só `quick-replies` e `preferencias` estão na whitelist. Já protegido.
- **`proxy.ts`**: confirmar que o gate por `x-pathname` cobre. Já cobre todas as outras telas de Configurações restritas; nenhuma mudança esperada.
- **Sidebar**: o item "Canais" do submenu Configurações precisa ter o mesmo gating por role que Departamentos/Usuários. Validar e ajustar se faltar.
- **Botão "Revelar credenciais"** (inline): renderiza só se `role === 'ADMIN' || role === 'SUPER_ADMIN'`. Replicar pattern usado no `/configuracoes/usuarios`.

## 9. Testes (Vitest + RTL)

Foco em comportamento, não pixel:

1. **`channel-dialog.test.tsx`**
   - Renderiza em modo `create` vs `edit`.
   - Validação Zod: `inactivityTimeoutMinutes > 0` sem closeReason exibe erro no campo.
   - Validação Zod: `phoneNumber` com caracteres não-numéricos exibe erro.
   - Em edit, submit envia apenas campos dirty.
   - Botão "Revelar credenciais" não aparece quando `role !== 'ADMIN'`.

2. **`channel-dialog.reveal.test.tsx`**
   - Clica "Revelar" → mutation chamada com `id` correto.
   - Inputs `apiKey` e `appId` ficam editáveis e populados com valores mockados.
   - Toast de auditoria é disparado.
   - Botão "Revelar" some após sucesso.

3. **`delete-channel-dialog.test.tsx`**
   - Estado 1 → confirma → mutation chamada.
   - Mutation retorna 409 com counts → dialog troca conteúdo.
   - Pluralização: counts = 1 ("1 atendimento aberto") vs N ("3 atendimentos abertos").
   - Apenas botão "Entendi" no estado bloqueado.

4. **`channels-list.test.tsx`**
   - Empty global vs empty filtrado renderizam mensagens diferentes.

**Fora do escopo**: layout do card, cores do badge, strings exatas de toast.

## 10. Snapshot OpenAPI — pré-requisito

Esta sprint depende de `lib/generated` ter os hooks/types/schemas de channels (`useChannelsController*`, `ChannelResponseDto`, `CreateChannelSchema`, etc.). O snapshot atual do crm-web (e do crm-api) não contém `/channels` — PR #56 do crm-api não regenerou o snapshot.

Etapa 0 do plano:
1. Subir `crm-api` local (`pnpm start:dev` com Postgres + Redis via docker compose já configurados).
2. `curl http://localhost:3000/api/v1/openapi.json > crm-web/openapi.snapshot.json`.
3. `pnpm generate:api:from-snapshot`.
4. Confirmar que `useChannelsControllerList`, `useChannelsControllerCreate`, etc., apareceram em `lib/generated/hooks/`.
5. Commit `openapi.snapshot.json` + `lib/generated/` juntos (CI checa diff zero).

Se subir o crm-api local falhar (Postgres não rodando, migration faltando), pauso e peço orientação antes de tentar workarounds.

## 11. Branch e PR

- Worktree em `feat/sprint-1-4b-canais-ui`, criada a partir de `origin/main` atualizado.
- Commits cirúrgicos por step do plano.
- Push só após PO sinalizar OK (memory `feedback_no_push_until_validated`).
- PR principal: `feat(channels): tela /configuracoes/canais (Sprint 1.4 Fase B)`.
- Após merge, PR docs separado em `docs/update-roadmap-1-4b` marcando os 8 checkboxes da §5.1 do `ROADMAP.md`.

## 12. Critério de aceite (verificação por evidência)

Antes de declarar pronto:

- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` verdes localmente.
- `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` → zero diff.
- `pnpm build` fica para CI (limitação conhecida §11 do `CLAUDE.md`).
- Fluxo manual com crm-api rodando:
  - Login ADMIN → vê "Canais" na sidebar → acessa rota.
  - Criar canal Gupshup com timeout = 30 e closeReason válido → aparece na lista.
  - Tentar criar outro com mesmo `phoneNumber` → erro pt-BR no campo.
  - Editar canal: `apiKey` e `appId` mascarados → "Revelar credenciais" preenche valores reais → toast de auditoria.
  - Tentar editar `provider` → backend devolve 400 → frontend mostra erro.
  - Activate / Deactivate / Restart → toasts disparam.
  - Excluir canal com ticket OPEN no crm-api de teste → 409 → dialog troca conteúdo com counts.
  - Logout, login AGENT → não vê "Canais" na sidebar; tentar acessar rota direta → redirect 403.
