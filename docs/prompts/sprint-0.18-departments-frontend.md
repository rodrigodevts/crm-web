# Sprint 0.18 — Fase B (frontend): tela de Departamentos

> Rode este prompt **no `crm-web`** (sessão Claude Code aberta na raiz do `crm-web`).
> **Pré-requisito:** PR da Fase A no `crm-api` (`crm-api/docs/prompts/sprint-0.18-departments-backend.md`) já mergeado em `main`, com `@ApiOkResponse` / `@ApiCreatedResponse` aplicados ao `DepartmentsController` e `openapi.snapshot.json` regenerado.
> Sem isso, a regeneração do `lib/generated` continua trazendo `unknown` nos responses de List / FindById / Update e a tabela não fica tipada.

---

## Prompt

```text
Vamos fechar a Fase B da Sprint 0.18 do DigiChat: implementar a tela
real de Departamentos em /configuracoes/departamentos no crm-web,
substituindo o PlaceholderPage atual. Referência: crm-web/ROADMAP.md
§4.8 (item "Telas reais de Configurações" — Departamentos).

Padrão a replicar: UsersTable / UsersTableView entregues na Sprint 0.16
(crm-web PR #21) e o restante do app shell consolidado em /configuracoes/usuarios.

# Pré-requisito

A Fase A já está mergeada no crm-api. Antes de qualquer coisa:

1. git pull em ambos os repos.
2. Atualizar o snapshot do crm-web e regenerar:
   - pnpm generate:api (com crm-api up) OU
   - pnpm generate:api:from-snapshot (após sincronizar o snapshot)
3. Verificar em lib/generated/types/DepartmentsController*.ts que:
   - DepartmentsControllerList200       referencia DepartmentListResponseDto
   - DepartmentsControllerFindById200   referencia DepartmentDetailResponseDto
   - DepartmentsControllerUpdate200     referencia DepartmentResponseDto
   - DepartmentsControllerCreate201     referencia DepartmentResponseDto
   Os 5 hooks de TanStack Query continuam existindo
   (useDepartmentsControllerList/Create/FindById/Update/SoftDelete).

Se algum response ainda for `unknown`, PARAR e reportar — significa que a
Fase A não publicou direito ou o snapshot não foi sincronizado.

# Escopo desta fase

Esta sprint entrega a fatia listagem + criação + edição + soft-delete
sob o mesmo molde do /configuracoes/usuarios. Configuração de horário
de funcionamento (workingHours) e SLA são campos avançados — entram
nesta sprint só como inputs no form (com validação delegada ao schema
gerado), sem editor visual sofisticado de calendário. Refinamento
visual de workingHours fica pra Fase 4 do ROADMAP.

# Decisões já alinhadas com o humano (NÃO re-discutir no brainstorm)

- Replicar split UsersTable (data) + UsersTableView (apresentação) —
  permite testar a view com vitest sem mockar TanStack Query.
- Mutations usam invalidate na queryKey de list após sucesso (mesmo
  pattern do InvitationsTable após revoke/resend).
- Soft delete confirma via AlertDialog. Após sucesso: toast + invalidate.
- Criar/Editar usam o MESMO componente DepartmentDialog (modal shadcn),
  modo controlado por prop (`mode: 'create' | 'edit'` + `department?`).
- workingHours e SLA são opcionais no form — entram como inputs simples
  com placeholder/explicação. Sem editor de calendário visual nesta sprint.
- distributionMode: Select com 4 opções (MANUAL / RANDOM / BALANCED /
  SEQUENTIAL), default MANUAL. Labels em pt-BR.
- Filtro: search por nome (debounced 300ms). Toggle "incluir inativos"
  envia active=false na query (omitir defaulta active=true no backend).
- Paginação: cursor-based usando `pagination.nextCursor` da resposta.
  Botão "Carregar mais" no fim da lista (mesmo pattern simples do que
  já vier sendo usado, ou render simples sem paginação infinita se não
  houver precedente — confirmar leitura antes).
- Strings pt-BR; identificadores em inglês (regra geral do projeto).

# Contexto

Frontend tem hoje:
- /configuracoes/departamentos como PlaceholderPage (vai virar real).
- /configuracoes/usuarios como referência do layout (header + seções +
  dialog + table + segunda table).
- components/users/users-table.tsx (data fetcher fino) +
  components/users/users-table-view.tsx (presentational, com state
  loading/error/ready/empty).
- components/users/users-table-view.test.tsx como template de teste RTL
  cobrindo os 4 estados + variações.
- components/users/invite-user-dialog.tsx como referência de modal +
  RHF + zodResolver + tratamento de erro inline.
- components/ui/ tem dialog, alert-dialog, select, input, label,
  switch, button, table, skeleton, sonner (toast). Não adicionar
  shadcn novo sem pedir.

# Antes de codar

1. Ler nesta ordem:
   - crm-web/CLAUDE.md (raiz)
   - crm-web/ROADMAP.md §4.8
   - crm-web/ARCHITECTURE.md
   - crm-web/design-system.md
   - crm-web/WORKFLOW.md
   - crm-web/app/CLAUDE.md
   - crm-web/components/CLAUDE.md
   - crm-web/lib/CLAUDE.md
   - crm-web/components/users/users-table.tsx
     (PADRÃO A REPLICAR — split data/view)
   - crm-web/components/users/users-table-view.tsx
     (PADRÃO A REPLICAR — estados loading/error/ready/empty)
   - crm-web/components/users/users-table-view.test.tsx
     (PADRÃO A REPLICAR — teste RTL puro da view)
   - crm-web/components/users/invitations-table.tsx +
     invitations-table-view.tsx (referência de table com ações por linha
     e mutations com invalidate)
   - crm-web/components/users/invite-user-dialog.tsx
     (PADRÃO A REPLICAR — modal RHF + zodResolver + erros inline)
   - crm-web/app/(app)/configuracoes/usuarios/page.tsx
     (PADRÃO A REPLICAR — header + sections + dialog)
   - crm-web/lib/generated/hooks/useDepartmentsController*
   - crm-web/lib/generated/types/CreateDepartmentDto.ts
   - crm-web/lib/generated/types/UpdateDepartmentDto.ts
   - crm-web/lib/generated/schemas/createDepartmentDtoSchema.ts
   - crm-web/lib/generated/schemas/updateDepartmentDtoSchema.ts
   - crm-web/lib/api-client.ts (passing { client: { client: apiClient } } nos hooks)
   - crm-web/components/ui/ (inventário — confirmar que tem tudo)

2. Rodar Superpowers /brainstorming antes de qualquer código.
   Pontos abertos pra fechar (decisões já alinhadas estão acima):
   - Colunas da DepartmentsTableView: Nome | Distribuição | SLA |
     Ativo | Atualizado em | Ações? Confirmar com base no que faz
     sentido pro produto e no espaço visual.
     - "Distribuição" exibe label em pt-BR do distributionMode.
     - "SLA" mostra "Resposta: Xmin · Resolução: Ymin" ou "—".
     - "Ativo" mostra Badge.
     - "Atualizado em" formata updatedAt em pt-BR.
     - Ações por linha: Editar | Desativar (soft delete).
   - Empty state: mensagem "Nenhum departamento cadastrado." com CTA
     "Criar departamento" abrindo o dialog em modo create.
   - DepartmentDialog: form com name (required), distributionMode (select),
     active (switch), greetingMessage / outOfHoursMessage (textarea),
     slaResponseMinutes / slaResolutionMinutes (input number opcional).
     workingHours: ENTRADA SIMPLIFICADA nesta sprint — discutir se entra
     como editor mínimo (lista de janelas por dia da semana) ou se fica
     fora do escopo (não-editável aqui, só preserva valor existente em
     edit). Recomendação: fora do escopo nesta sprint — exibir aviso
     read-only "Editor de horário será adicionado em sprint futura".
   - Schema do form: composição com `createDepartmentDtoSchema` e
     `updateDepartmentDtoSchema` gerados pelo Kubb. Mensagens custom em
     pt-BR via `.refine` ou map de erros (mesmo pattern do
     accept-invite-form). Sem schema duplicado.
   - Erros do backend a tratar:
     - 409 NAME_TAKEN (se o backend usa esse code) → erro inline no campo name.
     - 400 VALIDATION → mensagens por campo.
     - 5xx / network → toast genérico.
     Confirmar exatamente quais codes o backend devolve lendo o módulo
     departments do crm-api antes de inventar.
   - Soft delete: AlertDialog com confirmação. Texto pt-BR:
     "Desativar departamento <nome>? Ele deixa de aparecer nas listas
     ativas. A ação pode ser desfeita reativando." Botão destructive
     com loading state. Após sucesso: toast + invalidate da queryKey
     de list.
   - Acessibilidade: label visível em todo input, aria-invalid nos
     campos com erro, role="alert" nas mensagens, foco gerenciado no
     modal e no AlertDialog.
   - Filtro search debounced 300ms — usar useDeferredValue ou
     useDebouncedCallback (sem adicionar lib nova; useDeferredValue é
     do React, sem dependência extra).
   - RBAC: a sprint 0.17 já restringiu navMain por role. Confirmar que
     /configuracoes/departamentos está coberto — se não estiver, ajustar
     no mesmo PR (escopo pequeno).

3. Após alinhamento, /write-plan e quebrar em steps com TDD:
   - Step 1: components/departments/departments-table-view.tsx
     ('use client' não obrigatório — view pura) + teste RTL cobrindo
     loading/error/ready/empty + render de uma linha completa.
   - Step 2: components/departments/departments-table.tsx ('use client',
     fetcher fino chamando useDepartmentsControllerList).
   - Step 3: components/departments/department-dialog.tsx ('use client',
     RHF + zodResolver + create OU update conforme mode + invalidate +
     toast + tratamento de erros) + teste RTL.
   - Step 4: components/departments/delete-department-dialog.tsx
     (AlertDialog encapsulado, useDepartmentsControllerSoftDelete) +
     teste RTL.
   - Step 5: app/(app)/configuracoes/departamentos/page.tsx
     (Server Component que renderiza header + DepartmentsTable; o
     dialog é montado client-side pelo próprio fetcher / via slot).
   - Step 6: Verificação manual end-to-end contra crm-api local
     (criar, editar, desativar, filtrar por search, alternar incluir
     inativos).
   - Step 7: Marcar [x] em ROADMAP.md §4.8 (item de Departamentos
     dentro de "Telas reais de Configurações").

# Regras não-negociáveis (CLAUDE.md crm-web)

- Branch dedicada (feat/departments-screen) a partir de origin/main
  atualizado.
- main protegida — PR obrigatório.
- Sem --no-verify, sem push --force.
- TypeScript strict; sem any/as Type sem comentário justificando.
- Tipos e schemas Zod do form vêm de lib/generated. Se algum response
  ainda for `unknown` após pnpm generate:api:from-snapshot, é gap da
  Fase A — PARAR e reportar.
- Schema local SÓ pra mensagens custom em pt-BR (compose com generated)
  ou pra campos exclusivos de UI; jamais redefinir o shape do DTO.
- Strings visíveis em pt-BR; identificadores em inglês.
- Default Server Component; 'use client' só em table fetcher, dialogs
  e qualquer componente com hook de estado.
- Não editar lib/generated/ à mão.
- Reuso > criação: replicar componentes shadcn/ui já instalados, não
  criar novos. Se faltar algo, perguntar antes.
- pnpm build NÃO entra no gate local (limitação documentada em
  CLAUDE.md §11). Verificação local =
  pnpm format:check && pnpm lint && pnpm typecheck && pnpm test.

# Critério de pronto (Fase B)

- /configuracoes/departamentos renderiza header (título +
  CTA "Novo departamento") + tabela tipada + empty state real.
- DepartmentsTableView com 4 estados (loading/error/ready/empty)
  e linha completa.
- DepartmentDialog cria e edita usando os hooks gerados; pós-sucesso
  fecha modal, toast e invalidate da list.
- DeleteDepartmentDialog desativa via SoftDelete; pós-sucesso toast +
  invalidate.
- Search debounced + toggle "incluir inativos" alimentam a query.
- Mensagens de erro em pt-BR pros casos 409 / 400 / 5xx / network.
- Testes RTL: departments-table-view (4 estados + linha),
  department-dialog (create + edit + erro 409 + validação),
  delete-department-dialog (confirmação + sucesso + erro).
- pnpm format:check && pnpm lint && pnpm typecheck && pnpm test verdes.
- pnpm generate:api:from-snapshot && git diff --exit-code lib/generated
  zero diff.
- ROADMAP §4.8 com [x] no item de Departamentos dentro de "Telas reais
  de Configurações".
- Spec da fase em docs/superpowers/specs/<data>-sprint-0-18-departments-frontend-design.md
- PR aberto referenciando o PR mergeado da Fase A no crm-api.

Pode começar pela leitura dos docs e em seguida abrir o brainstorm.
```
