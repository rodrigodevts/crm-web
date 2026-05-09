# Sprint 0.20 — Fase B (frontend): tela de Quick Replies

> Rode este prompt **no `crm-web`** (sessão Claude Code aberta na raiz do `crm-web`).
> **Pré-requisito:** PR da Fase A no `crm-api` (`crm-api/docs/prompts/sprint-0.20-quick-replies-backend.md`) já mergeado em `main`, com `QuickRepliesController` exposto via `@ApiOkResponse`/`@ApiCreatedResponse` e `openapi.snapshot.json` regenerado contendo os schemas `QuickReplyResponseDto`/`QuickReplyListResponseDto`.
> Sem isso, a regeneração do `lib/generated` traz `unknown` nos responses e a tabela não fica tipada.

---

## Prompt

```text
Vamos fechar a Fase B da Sprint 0.20 do DigiChat: implementar a tela
real de Quick Replies em /configuracoes/quick-replies no crm-web,
substituindo o PlaceholderPage atual. Referência: crm-web/ROADMAP.md
§4.8 (item "Telas reais de Configurações" — Quick Replies).

Padrão a replicar: tela de Tags entregue na Sprint 0.19 (crm-web PR #27)
e Departamentos da Sprint 0.18 (crm-web PR #26) — split data/view, dialog
de create/edit unificado, ações Desativar/Reativar via PATCH active.
A diferença principal é a permissão diferenciada (escopo COMPANY/PERSONAL)
e o filtro extra "Mine".

# Pré-requisito

A Fase A já está mergeada no crm-api. Antes de qualquer coisa:

1. git pull em ambos os repos.
2. Sincronizar o snapshot do crm-api → crm-web/openapi.snapshot.json e
   regenerar:
   - pnpm generate:api (com crm-api up) OU
   - pnpm generate:api:from-snapshot
3. Verificar em lib/generated/types/QuickRepliesController*.ts que:
   - QuickRepliesControllerList200       referencia QuickReplyListResponseDto
   - QuickRepliesControllerFindById200   referencia QuickReplyResponseDto
   - QuickRepliesControllerUpdate200     referencia QuickReplyResponseDto
   - QuickRepliesControllerCreate201     referencia QuickReplyResponseDto
   E que existem 5 hooks de TanStack Query
   (useQuickRepliesController{List/Create/FindById/Update/Delete}).

Se algum response ainda for `unknown`, PARAR e reportar — a Fase A não
publicou direito ou o snapshot não foi sincronizado.

# Escopo desta fase

Listagem + criação + edição + soft-delete (PATCH active=false) +
reativação (PATCH active=true) sob o mesmo molde da Sprint 0.19 de Tags.
Hard delete (sprint dedicada futura) e endpoint de upload de mídia
(`mediaUrl` é digitado/colado nesta sprint) ficam fora.

# Decisões já alinhadas com o humano (NÃO re-discutir no brainstorm)

- Replicar split QuickRepliesTable (data) + QuickRepliesTableView
  (apresentação) — mesmo pattern de TagsTable.
- Mutations usam invalidate na queryKey de list após sucesso (mesmo
  pattern de Tags/Departments).
- Desativar via linha = PATCH active=false direto, dentro de
  AlertDialog (mesma UX consagrada em DeactivateTagDialog).
- Reativar via linha = PATCH active=true direto, sem AlertDialog
  (não-destrutivo).
- Criar/Editar usam o MESMO componente QuickReplyDialog (modal shadcn),
  modo controlado por prop (`mode: 'create' | 'edit'` + `quickReply?`).
- Filtros: search por shortcut/message (debounced via useDeferredValue) +
  Select "Status" (Ativos/Inativos, default Ativos) + Select "Escopo"
  (Todos / Globais / Pessoais, default Todos) + Switch/Toggle "Apenas as
  minhas" (envia `mine=true` quando ON; default OFF).
- Paginação: mesmo padrão de Tags — limit=50 e nota
  "Mostrando os primeiros 50…" quando hasMore. Sem botão "Carregar mais".
- Strings pt-BR; identificadores em inglês.
- Hard delete e upload de mídia FORA DE ESCOPO desta sprint.
- O backend recusa PATCH com `scope` no body (campo omitido do
  UpdateQuickReplyDto). Frontend desabilita o Select de Escopo no modo
  edit + tooltip "Para mudar o escopo, crie uma nova e desative esta".

# Contexto

Frontend tem hoje:
- /configuracoes/quick-replies como PlaceholderPage (vai virar real).
- /configuracoes/tags como referência completa (Sprint 0.19).
- /configuracoes/departamentos como referência adicional.
- components/tags/* como template canônico:
  - tags-table.tsx (data fetcher + filtros + dialogs internos)
  - tags-table-view.tsx (presentational, 4 estados, ações)
  - tag-dialog.tsx (create/edit via RHF + zodResolver)
  - tag-dialog-trigger.tsx (botão CTA do header)
  - deactivate-tag-dialog.tsx (AlertDialog + PATCH active=false)
  - 3 testes RTL correspondentes
- components/ui/ inventário inclui input-group, alert-dialog, switch,
  textarea, select — todos já usados em sprints anteriores.
- Convenções em design-system.md e components/CLAUDE.md:
  - Inputs com ícone usam <InputGroup> + <InputGroupAddon>.
  - Campos obrigatórios usam <FieldLabel required>.

# Particularidades de Quick Replies vs Tags

- **QuickReplyResponseDto** tem campos diferentes:
  id, companyId, **shortcut**, **message**, **mediaUrl** (nullable),
  **mediaMimeType** (nullable), **scope** ('COMPANY' | 'PERSONAL'),
  **ownerUserId** (nullable), active, createdAt, updatedAt. Sem cor,
  sem horário.
- **Mensagem é multilinha** (até 4000 chars). Form usa <Textarea> com
  contador de caracteres restantes (visualização útil dado o limite).
- **Atalho** valida regex `^[a-zA-Z0-9_-]+$` no client (mensagem custom
  pt-BR pra não depender da mensagem em inglês do schema gerado).
  Apresentação na tabela com prefixo "/" pra deixar claro como invocar
  no composer (mas armazena sem o "/").
- **Escopo** muda permissão e visibilidade:
  - Linha "Pessoal" mostra ícone de pessoa pequeno (LucideUser size-3).
  - Linha "Global" mostra ícone de prédio/empresa (LucideBuilding size-3).
- **Mídia anexa** (mvp simples nesta sprint): se `mediaUrl` está
  preenchida, mostra um <Badge variant="outline" className="text-xs">
  com o ícone de paperclip + sufixo do mimetype (ex: "image/jpeg").
  Form aceita URL + mimetype como campos texto separados (sem upload —
  upload entra em sprint dedicada).
- **Permissões no front** (RBAC) — gate na UI (backend é fonte da
  verdade, mas evitamos render de ações que vão dar 403):
  - AGENT só vê (e edita) suas próprias PERSONAL na lista. COMPANY
    aparecem read-only (sem botões Editar/Desativar).
  - SUPERVISOR/ADMIN editam tudo o que aparece na lista (PERSONAL alheio
    *não* aparece na lista — backend já filtra).
  - O dialog de criar começa com scope=PERSONAL pra todos. AGENT NÃO
    pode mudar pra COMPANY (Select de Escopo bloqueado em PERSONAL com
    helper text). SUPERVISOR/ADMIN podem alternar livremente.
  - Usar o `useMe()` (hook customizado já existente em
    `hooks/use-me.ts` — confirmar; senão criar) pra puxar
    role + userId. Comparar `quickReply.ownerUserId === me.id`.
- **Filtros do GET /quick-replies** incluem `mine` (QueryBool). UI:
  Switch "Apenas as minhas" próximo aos selects. Quando ON, envia
  `mine=true`; OFF, omite o param.

# Antes de codar

1. Ler nesta ordem:
   - crm-web/CLAUDE.md (raiz)
   - crm-web/ROADMAP.md §4.8
   - crm-web/ARCHITECTURE.md
   - crm-web/design-system.md (incluindo "Inputs com ícone…" e
     "Campos obrigatórios vs opcionais")
   - crm-web/WORKFLOW.md
   - crm-web/app/CLAUDE.md
   - crm-web/components/CLAUDE.md
   - crm-web/lib/CLAUDE.md
   - crm-web/components/tags/tags-table.tsx
     (PADRÃO A REPLICAR — fetcher + filtros + dialogs)
   - crm-web/components/tags/tags-table-view.tsx
     (PADRÃO A REPLICAR — 4 estados + ações)
   - crm-web/components/tags/tags-table-view.test.tsx
     (PADRÃO A REPLICAR — teste RTL puro da view)
   - crm-web/components/tags/tag-dialog.tsx
     (PADRÃO A REPLICAR — modal RHF + zodResolver + 409/400/5xx)
   - crm-web/components/tags/tag-dialog-trigger.tsx
   - crm-web/components/tags/deactivate-tag-dialog.tsx
   - crm-web/app/(app)/configuracoes/tags/page.tsx
   - crm-web/lib/generated/hooks/useQuickRepliesController*
   - crm-web/lib/generated/types/CreateQuickReplyDto.ts
   - crm-web/lib/generated/types/UpdateQuickReplyDto.ts
   - crm-web/lib/generated/types/QuickReplyResponseDto.ts
   - crm-web/lib/generated/types/QuickReplyListResponseDto.ts
   - crm-web/lib/generated/schemas/createQuickReplyDtoSchema.ts
   - crm-web/lib/generated/schemas/updateQuickReplyDtoSchema.ts
   - crm-web/lib/api-client.ts
   - crm-web/hooks/ (procurar `useMe` ou hook equivalente que retorna
     o currentUser; se não existir, usar useGetMe gerado e criar um
     wrapper local)

2. Rodar Superpowers /brainstorming antes de qualquer código.
   Pontos abertos pra fechar:
   - Colunas da QuickRepliesTableView: Atalho (com prefixo "/" visual,
     fonte mono) | Mensagem (truncada com tooltip do conteúdo completo) |
     Escopo (Badge "Global"/"Pessoal" com ícone) | Mídia (Badge com
     paperclip + mimetype, ou "—") | Status (Badge Ativo/Inativo) |
     Atualizado em | Ações? Confirmar.
   - Empty state: "Nenhuma resposta rápida {ativa|inativa} encontrada."
     (contextual pelo filtro Status, mesmo padrão da Sprint 0.19).
   - QuickReplyDialog: form com shortcut (required), message (required,
     Textarea multiline com contador de caracteres), mediaUrl (opcional,
     URL), mediaMimeType (opcional, regex `^[a-z]+/[a-z0-9.\-+]+$`),
     scope (Select COMPANY/PERSONAL com restrição por role; bloqueado
     em modo edit), active (Switch).
   - Schema do form: schema local mínimo em pt-BR (mensagens custom)
     + .refine pra "mediaUrl exige mediaMimeType" e vice-versa.
   - Erros do backend a tratar (mesmas estruturas das outras sprints):
     - 409 atalho duplicado no mesmo escopo+owner → setError('shortcut').
     - 400 VALIDATION → setError por field.
     - 403 (AGENT tentando criar/editar COMPANY) → setError('root') com
       mensagem "Apenas administradores podem criar respostas globais."
     - 5xx / network → toast genérico via setError('root').
     Confirmar lendo o módulo do crm-api antes de inventar.
   - Acessibilidade: label visível em todo input, aria-invalid,
     role="alert", foco gerenciado no modal. Asterisco vermelho via
     <FieldLabel required> em campos obrigatórios (shortcut, message;
     scope tem default PERSONAL → não marca; active tem default true →
     não marca).
   - Filtro search debounced via useDeferredValue (sem libs novas).
   - RBAC: /configuracoes/quick-replies já está coberto pelo gate de
     /configuracoes/* (ADMIN/SUPER_ADMIN/SUPERVISOR/AGENT — confirmar
     que AGENT também acessa, diferente das outras telas que são
     ADMIN-only). Se o gate atual barra AGENT, ajustar o RBAC dessa
     rota — Quick Replies é a primeira tela de configurações que
     AGENT precisa abrir (pra criar suas pessoais).
   - useMe ou hook equivalente: confirmar que existe; senão criar
     wrapper sobre useGetMe gerado.

3. Após alinhamento, /write-plan e quebrar em steps com TDD:
   - Step 1: components/quick-replies/quick-replies-table-view.tsx
     (view pura) + teste RTL cobrindo loading/error/ready/empty + linha
     completa + Editar (com gate por permissão) + Desativar (active=true)
     + Reativar (active=false) + ocultar ações em COMPANY pra AGENT.
   - Step 2: components/quick-replies/quick-replies-table.tsx
     ('use client', fetcher chamando useQuickRepliesControllerList +
     handler de Reativar inline + InputGroup no search + Select Escopo +
     Switch "Apenas as minhas" + uso de useMe pra calcular permissões).
   - Step 3: components/quick-replies/quick-reply-dialog.tsx
     ('use client', RHF + zodResolver + create OU update conforme mode
     + invalidate + toast + tratamento de erros + asterisco em required
     + scope bloqueado em edit + scope restrito por role) + teste RTL.
   - Step 4: components/quick-replies/quick-reply-dialog-trigger.tsx
     (botão "Nova resposta rápida" pro header).
   - Step 5: components/quick-replies/deactivate-quick-reply-dialog.tsx
     (AlertDialog + PATCH active=false) + teste RTL.
   - Step 6: app/(app)/configuracoes/quick-replies/page.tsx (Server
     Component que renderiza header + QuickRepliesTable; trigger client
     no header).
   - Step 7: ajustar RBAC do gate de /configuracoes/quick-replies se
     AGENT estiver bloqueado (rota deve aceitar AGENT — diferente do
     resto de /configuracoes/*).
   - Step 8: Verificação manual end-to-end contra crm-api local
     (criar PERSONAL como AGENT, ver que COMPANY aparece read-only,
     SUPERVISOR/ADMIN edita tudo, filtros funcionam, mediaUrl preenchida
     mostra Badge na lista, atalho duplicado retorna 409 inline).
   - Step 9: Marcar Quick Replies como entregue em ROADMAP.md §4.8.
   - Step 10: Spec da fase em
     docs/superpowers/specs/<data>-sprint-0-20-quick-replies-frontend-design.md.

# Regras não-negociáveis (CLAUDE.md crm-web)

- Branch dedicada (feat/quick-replies-screen) a partir de origin/main
  atualizado.
- main protegida — PR obrigatório.
- Sem --no-verify, sem push --force.
- TypeScript strict; sem any/as Type sem comentário justificando.
- Tipos e schemas Zod do form vêm de lib/generated. Se algum response
  ainda for `unknown` após pnpm generate:api:from-snapshot, é gap
  da Fase A — PARAR e reportar.
- Schema local SÓ pra mensagens custom em pt-BR (compose com generated)
  ou pra campos exclusivos de UI; jamais redefinir o shape do DTO.
- Strings visíveis em pt-BR; identificadores em inglês.
- Default Server Component; 'use client' só em table fetcher, dialogs
  e qualquer componente com hook de estado.
- Não editar lib/generated/ à mão.
- Reuso > criação: replicar componentes shadcn/ui já instalados.
  input-group, alert-dialog, switch, textarea, select já existem desde
  a 0.18 — não reinstalar nem perguntar.
- Marcação de required: <FieldLabel required> nos campos obrigatórios
  (asterisco vermelho via prop), conforme convenção em design-system.md.
- Inputs com ícone: <InputGroup> + <InputGroupAddon>, conforme
  convenção em design-system.md.
- pnpm build NÃO entra no gate local (limitação documentada em
  CLAUDE.md §11). Verificação local =
  pnpm format:check && pnpm lint && pnpm typecheck && pnpm test.
- Ao iterar feedback de UX após primeiro deploy, NÃO fazer git push
  após cada commit local — esperar usuário sinalizar que a rodada de
  feedback está completa (regra do projeto).

# Critério de pronto (Fase B)

- /configuracoes/quick-replies renderiza header (título + CTA "Nova
  resposta rápida") + tabela tipada + empty state real (contextual pelo
  filtro Status).
- AGENT consegue acessar a rota e cria/edita/desativa/reativa apenas
  suas PERSONAL. COMPANY aparecem read-only com badge "Global" e sem
  botões.
- SUPERVISOR/ADMIN consegue criar/editar COMPANY livremente; vê suas
  PERSONAL + todas COMPANY (PERSONAL alheio NÃO aparece — confirmado
  pelo backend, é só passar adiante o que vier).
- QuickRepliesTableView com 4 estados (loading/error/ready/empty) e
  linha completa (atalho com "/", mensagem truncada, escopo com ícone,
  mídia com Badge, status, atualizado em).
- QuickReplyDialog cria e edita usando os hooks gerados; pós-sucesso
  fecha modal, toast e invalidate da list. <FieldLabel required> em
  shortcut e message. Scope bloqueado em modo edit (com helper text).
- DeactivateQuickReplyDialog desativa via PATCH active=false; pós-sucesso
  toast + invalidate.
- Botão "Reativar" na linha de items inativos chama PATCH active=true
  direto + toast + invalidate (sem AlertDialog).
- Search com <InputGroup> + SearchIcon, debounced + Select Status +
  Select Escopo + Switch "Apenas as minhas" alimentam a query.
- Mensagens de erro em pt-BR pros casos 409 / 400 / 403 / 5xx / network.
- RBAC do gate de /configuracoes/quick-replies aceita AGENT além de
  ADMIN/SUPER_ADMIN/SUPERVISOR.
- Testes RTL: quick-replies-table-view (4 estados + linha + ações
  contextual por permissão), quick-reply-dialog (create + edit + erro
  409 + validação + scope bloqueado em edit + scope restrito a PERSONAL
  pra AGENT), deactivate-quick-reply-dialog (confirmação + sucesso + erro).
- pnpm format:check && pnpm lint && pnpm typecheck && pnpm test verdes.
- pnpm generate:api:from-snapshot && git diff --exit-code lib/generated
  zero diff.
- ROADMAP §4.8 atualizado registrando Quick Replies como entregue.
- Spec da fase em
  docs/superpowers/specs/<data>-sprint-0-20-quick-replies-frontend-design.md.
- PR aberto referenciando o PR mergeado da Fase A no crm-api.

Pode começar pela leitura dos docs e em seguida abrir o brainstorm.
```
