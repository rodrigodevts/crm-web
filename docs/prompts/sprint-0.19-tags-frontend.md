# Sprint 0.19 — Fase B (frontend): tela de Tags

> Rode este prompt **no `crm-web`** (sessão Claude Code aberta na raiz do `crm-web`).
> **Pré-requisito:** PR da Fase A no `crm-api` (`crm-api/docs/prompts/sprint-0.19-tags-backend.md`) já mergeado em `main`, com `@ApiOkResponse` / `@ApiCreatedResponse` aplicados ao `TagsController` e `openapi.snapshot.json` regenerado.
> Sem isso, a regeneração do `lib/generated` continua trazendo `unknown` nos responses de List / FindById / Update / Create e a tabela não fica tipada.

---

## Prompt

```text
Vamos fechar a Fase B da Sprint 0.19 do DigiChat: implementar a tela
real de Tags em /configuracoes/tags no crm-web, substituindo o
PlaceholderPage atual. Referência: crm-web/ROADMAP.md §4.8 (item
"Telas reais de Configurações" — Tags).

Padrão a replicar: tela de Departamentos entregue na Sprint 0.18
(crm-web PR #26) — split data/view, dialog de create/edit unificado,
ações Desativar/Reativar via PATCH active. O backend de Tags já
suporta soft-delete corretamente via DELETE /:id (sem ?hard) — então
podemos OU usar PATCH active=false (mesmo padrão de Departments,
unifica com Reativar) OU usar DELETE /:id (sem hard) que internamente
faz UPDATE active=false. Recomendação: PATCH active=false, igual
Departments — mantém um único endpoint pra consistência e o backend
trata os dois caminhos como soft-delete equivalente.

# Pré-requisito

A Fase A já está mergeada no crm-api. Antes de qualquer coisa:

1. git pull em ambos os repos.
2. Atualizar o snapshot do crm-web e regenerar:
   - pnpm generate:api (com crm-api up) OU
   - pnpm generate:api:from-snapshot (após sincronizar o snapshot do
     crm-api → crm-web/openapi.snapshot.json)
3. Verificar em lib/generated/types/TagsController*.ts que:
   - TagsControllerList200       referencia TagListResponseDto
   - TagsControllerFindById200   referencia TagResponseDto
   - TagsControllerUpdate200     referencia TagResponseDto
   - TagsControllerCreate201     referencia TagResponseDto
   Os 5 hooks de TanStack Query continuam existindo
   (useTagsControllerList/Create/FindById/Update/Delete).

Se algum response ainda for `unknown`, PARAR e reportar — significa
que a Fase A não publicou direito ou o snapshot não foi sincronizado.

# Escopo desta fase

Esta sprint entrega a fatia listagem + criação + edição +
desativação + reativação sob o mesmo molde da Sprint 0.18 de
Departments. Hard delete (DELETE ?hard=true, ADMIN-only, exclusão
definitiva) fica fora de escopo nesta sprint — entra em sprint
dedicada com confirmação reforçada e tratamento do conflito 409
"há atribuições".

# Decisões já alinhadas com o humano (NÃO re-discutir no brainstorm)

- Replicar split TagsTable (data) + TagsTableView (apresentação) —
  mesmo pattern de DepartmentsTable.
- Mutations usam invalidate na queryKey de list após sucesso (mesmo
  pattern de Departments).
- Desativar via linha = PATCH active=false direto, dentro de
  AlertDialog (mesma UX consagrada em DeactivateDepartmentDialog).
- Reativar via linha = PATCH active=true direto, sem AlertDialog
  (não-destrutivo).
- Criar/Editar usam o MESMO componente TagDialog (modal shadcn),
  modo controlado por prop (`mode: 'create' | 'edit'` + `tag?`).
- Filtros: search por nome (debounced via useDeferredValue) +
  Select "Status" com opções Ativos / Inativos (default Ativos) +
  Select "Escopo" com opções Todos / Contato / Ticket / Ambos
  (default Todos).
- Paginação: mesmo padrão de Departments — limit=50 e nota
  "Mostrando os primeiros 50…" quando hasMore. Sem botão "Carregar mais".
- Strings pt-BR; identificadores em inglês.
- Hard delete (?hard=true) FORA DE ESCOPO desta sprint.

# Contexto

Frontend tem hoje:
- /configuracoes/tags como PlaceholderPage (vai virar real).
- /configuracoes/departamentos como referência completa do layout +
  ações + dialog (split data/view, header com CTA, filtros, dialogs
  internos).
- components/departments/* como template canônico:
  - departments-table.tsx (data fetcher + filtros + dialogs internos)
  - departments-table-view.tsx (presentational, 4 estados, ações)
  - department-dialog.tsx (create/edit via RHF + zodResolver)
  - department-dialog-trigger.tsx (botão CTA do header)
  - deactivate-department-dialog.tsx (AlertDialog + PATCH active=false)
  - 3 testes RTL correspondentes
- components/ui/ inventário inclui input-group (use no search da
  listagem, igual em departments-table.tsx) e Switch corrigido
  (data-[state=…]).
- Convenções recentes a seguir (documentadas em design-system.md
  e components/CLAUDE.md):
  - Inputs com ícone usam <InputGroup> + <InputGroupAddon> —
    nunca relative+absolute manual.
  - Campos obrigatórios usam <FieldLabel required> (asterisco
    vermelho com aria-hidden).

# Particularidades de Tags vs Departments

- TagResponseDto: id, companyId, **name**, **color** (#RRGGBB hex,
  validado por regex e normalizado uppercase no backend), **scope**
  ('CONTACT' | 'TICKET' | 'BOTH', default 'BOTH'), active, createdAt,
  updatedAt. Sem workingHours, sem SLA, sem distributionMode.
- Não há Detail DTO separado — o response do GET /:id é o mesmo
  TagResponseDto da listagem (estruturalmente compatível, igual a
  Departments — passar editTarget direto pro dialog, sem detailQuery).
- Filtros do GET /tags incluem `scope` (enum opcional). Aproveitar
  para adicionar Select "Escopo" na barra de filtros (4 opções:
  Todos / Contato / Ticket / Ambos). Quando "Todos", omitir o param.

# Antes de codar

1. Ler nesta ordem:
   - crm-web/CLAUDE.md (raiz)
   - crm-web/ROADMAP.md §4.8
   - crm-web/ARCHITECTURE.md
   - crm-web/design-system.md (incluindo as duas subseções recentes:
     "Inputs com ícone, prefixo ou ação inline" e "Campos
     obrigatórios vs opcionais")
   - crm-web/WORKFLOW.md
   - crm-web/app/CLAUDE.md
   - crm-web/components/CLAUDE.md (incluindo as subseções recentes
     "Marcação de campos obrigatórios" e "Inputs com ícone, prefixo
     ou ação inline")
   - crm-web/lib/CLAUDE.md
   - crm-web/components/departments/departments-table.tsx
     (PADRÃO A REPLICAR — fetcher + filtros + dialogs)
   - crm-web/components/departments/departments-table-view.tsx
     (PADRÃO A REPLICAR — 4 estados + ações Editar/Desativar/Reativar)
   - crm-web/components/departments/departments-table-view.test.tsx
     (PADRÃO A REPLICAR — teste RTL puro da view)
   - crm-web/components/departments/department-dialog.tsx
     (PADRÃO A REPLICAR — modal RHF + zodResolver + 409/400/5xx)
   - crm-web/components/departments/department-dialog-trigger.tsx
     (botão CTA do header)
   - crm-web/components/departments/deactivate-department-dialog.tsx
     (PADRÃO A REPLICAR — AlertDialog + PATCH active=false)
   - crm-web/app/(app)/configuracoes/departamentos/page.tsx
     (PADRÃO A REPLICAR — header + sections + dialog)
   - crm-web/lib/generated/hooks/useTagsController*
   - crm-web/lib/generated/types/CreateTagDto.ts
   - crm-web/lib/generated/types/UpdateTagDto.ts
   - crm-web/lib/generated/schemas/createTagDtoSchema.ts
   - crm-web/lib/generated/schemas/updateTagDtoSchema.ts
   - crm-web/lib/api-client.ts (passing { client: { client: apiClient } })
   - crm-web/components/ui/ (inventário — confirmar que tem tudo,
     incluindo input-group, alert-dialog, switch, textarea já
     instalados na 0.18)

2. Rodar Superpowers /brainstorming antes de qualquer código.
   Pontos abertos pra fechar (decisões já alinhadas estão acima):
   - Colunas da TagsTableView: Nome | Cor (preview swatch + hex) |
     Escopo | Status | Atualizado em | Ações? Confirmar com base no
     que faz sentido pro produto.
     - "Cor" exibe um quadradinho da cor (size-4 rounded-sm) ao lado
       do hex em mono.
     - "Escopo" mostra label pt-BR (Contato/Ticket/Ambos).
     - "Status" mostra Badge Ativo/Inativo (mesmo de Departments).
     - "Atualizado em" formata updatedAt em pt-BR.
     - Ações: Editar | Desativar (active=true) ou Reativar (active=false).
   - Empty state: "Nenhuma tag {ativa|inativa} cadastrada." (contextual
     pelo filtro Status, mesmo padrão da Sprint 0.18).
   - TagDialog: form com name (required), color (color picker —
     <input type="color"> + input texto opcional pra colar hex
     manualmente), scope (Select com 3 opções, default Ambos), active
     (switch). Sem mensagens de greeting/outOfHours, sem SLA.
   - Schema do form: composição com `createTagDtoSchema` e
     `updateTagDtoSchema` gerados pelo Kubb. Mensagens custom em
     pt-BR (mesmo pattern de DepartmentDialog, schema local mínimo
     justificável — color tem regex hex obrigatória; o Zod gerado
     valida mas a mensagem default é em inglês).
   - Erros do backend a tratar:
     - 409 NAME_TAKEN (P2002 unique constraint) → erro inline no
       campo name.
     - 400 VALIDATION → mensagens por campo (name, color, scope, active).
     - 5xx / network → toast genérico via setError('root').
     Confirmar exatamente quais codes o backend devolve lendo o módulo
     tags do crm-api antes de inventar (especialmente o handler
     `mapConflict` em tags.application.service.ts).
   - Acessibilidade: label visível em todo input, aria-invalid nos
     campos com erro, role="alert" nas mensagens, foco gerenciado no
     modal e no AlertDialog. Asterisco vermelho via
     <FieldLabel required> em campos obrigatórios (só `name` aqui;
     color tem default razoável? — checar; scope tem default 'BOTH').
   - Filtro search debounced via useDeferredValue (sem libs novas).
   - RBAC: /configuracoes/tags já está coberto pelo gate de
     /configuracoes/* (ADMIN/SUPER_ADMIN). Sem ajuste.

3. Após alinhamento, /write-plan e quebrar em steps com TDD:
   - Step 1: components/tags/tags-table-view.tsx
     ('use client' não obrigatório — view pura) + teste RTL cobrindo
     loading/error/ready/empty + linha completa + Editar +
     Desativar (active=true) + Reativar (active=false).
   - Step 2: components/tags/tags-table.tsx ('use client', fetcher
     fino chamando useTagsControllerList + handler de Reativar inline
     + InputGroup no search).
   - Step 3: components/tags/tag-dialog.tsx ('use client', RHF +
     zodResolver + create OU update conforme mode + invalidate +
     toast + tratamento de erros + asterisco em required) + teste RTL.
   - Step 4: components/tags/tag-dialog-trigger.tsx (botão "Nova tag"
     pra colocar no header).
   - Step 5: components/tags/deactivate-tag-dialog.tsx (AlertDialog
     encapsulado, useTagsControllerUpdate com data: { active: false })
     + teste RTL.
   - Step 6: app/(app)/configuracoes/tags/page.tsx (Server Component
     que renderiza header + TagsTable; trigger client no header).
   - Step 7: Verificação manual end-to-end contra crm-api local
     (criar com cor, editar, desativar, reativar, filtrar por search,
     filtrar por Status, filtrar por Escopo).
   - Step 8: Marcar Tags como entregue em ROADMAP.md §4.8 (item
     "Telas reais de Configurações").
   - Step 9: Spec da fase em docs/superpowers/specs/<data>-sprint-0-19-tags-frontend-design.md

# Regras não-negociáveis (CLAUDE.md crm-web)

- Branch dedicada (feat/tags-screen) a partir de origin/main
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
  input-group, alert-dialog, switch, textarea, select já existem
  desde a 0.18 — não reinstalar nem perguntar.
- Marcação de required: <FieldLabel required> nos campos obrigatórios
  (asterisco vermelho via prop), conforme convenção em design-system.md.
- Inputs com ícone: <InputGroup> + <InputGroupAddon>, conforme
  convenção em design-system.md.
- pnpm build NÃO entra no gate local (limitação documentada em
  CLAUDE.md §11). Verificação local =
  pnpm format:check && pnpm lint && pnpm typecheck && pnpm test.
- Ao iterar feedback de UX após primeiro deploy, NÃO fazer git push
  após cada commit local — esperar usuário sinalizar que a rodada de
  feedback está completa (regra do projeto, ver memória).

# Critério de pronto (Fase B)

- /configuracoes/tags renderiza header (título + CTA "Nova tag") +
  tabela tipada + empty state real (contextual pelo filtro Status).
- TagsTableView com 4 estados (loading/error/ready/empty) e linha
  completa (incluindo swatch da cor).
- TagDialog cria e edita usando os hooks gerados; pós-sucesso fecha
  modal, toast e invalidate da list. <FieldLabel required> aplicado
  no campo name (e em qualquer outro obrigatório que aparecer no
  brainstorm).
- DeactivateTagDialog desativa via PATCH active=false; pós-sucesso
  toast + invalidate.
- Botão "Reativar" na linha de items inativos chama PATCH active=true
  direto + toast + invalidate (sem AlertDialog).
- Search com <InputGroup> + SearchIcon, debounced + Select Status +
  Select Escopo alimentam a query.
- Mensagens de erro em pt-BR pros casos 409 / 400 / 5xx / network.
- Testes RTL: tags-table-view (4 estados + linha + ações),
  tag-dialog (create + edit + erro 409 + validação),
  deactivate-tag-dialog (confirmação + sucesso + erro).
- pnpm format:check && pnpm lint && pnpm typecheck && pnpm test verdes.
- pnpm generate:api:from-snapshot && git diff --exit-code lib/generated
  zero diff.
- ROADMAP §4.8 atualizado registrando Tags como entregue.
- Spec da fase em docs/superpowers/specs/<data>-sprint-0-19-tags-frontend-design.md
- PR aberto referenciando o PR mergeado da Fase A no crm-api.

Pode começar pela leitura dos docs e em seguida abrir o brainstorm.
```
