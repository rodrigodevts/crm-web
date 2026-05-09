# Sprint 0.21 — Fase B (frontend): CRUD completo da tela `/configuracoes/usuarios`

> Rode este prompt **no `crm-web`** (sessão Claude Code aberta na raiz do `crm-web`).
> **Pré-requisito:** PR da Fase A no `crm-api` (`crm-api/docs/prompts/sprint-0.21-users-crud-backend.md`) já mergeado em `main`, com `UserResponseDto.active` exposto, filtro `active=false` retornando apenas inativos e `UpdateUserDto.active` aceito como caminho de reativação.
> Sem isso, o frontend não consegue diferenciar ativo de inativo nem reativar um usuário.

---

## Prompt

```text
Vamos fechar a Fase B da Sprint 0.21 do DigiChat: completar o CRUD da
tela /configuracoes/usuarios — hoje só lista e convida; falta editar
nome/email/role/departments, desativar via DELETE soft, reativar via
PATCH active=true e force logout. Referência: crm-web/ROADMAP.md §4.8
("Sprint 0.21 — Usuários CRUD edit/delete + role change").

Padrão a replicar: tela de Tags entregue na Sprint 0.19 (PR #27) e
Quick Replies entregue na Sprint 0.20 (PR #28) — split data/view,
dialog de create/edit unificado (aqui só edit, porque create é via
convite), ações Desativar/Reativar via PATCH active. Diferenças
principais:

- Não existe "Criar Usuário" no botão do header — usuários nascem
  via fluxo de convite (Sprint 0.16). O botão `<InviteUserDialog />`
  já existe e fica.
- Existem regras de proteção que limitam quais ações ficam visíveis em
  qual linha (você não pode editar/desativar o próprio usuário; SUPER_ADMIN
  é intocável; último ADMIN não pode ser rebaixado/desativado — backend
  retorna 409 mas a UI também esconde o botão quando consegue antecipar
  isso).
- Ação extra "Forçar logout" — endpoint dedicado
  `POST /users/:id/force-logout` (já existe no backend, sem mudança
  na Fase A). Confirmação via AlertDialog destrutivo, mesmo molde de
  DeactivateTagDialog/DeleteQuickReplyDialog.

# Pré-requisito

A Fase A já está mergeada no crm-api. Antes de qualquer coisa:

1. git pull em ambos os repos.
2. Sincronizar o snapshot do crm-api → crm-web/openapi.snapshot.json e
   regenerar:
   - pnpm generate:api (com crm-api up) OU
   - pnpm generate:api:from-snapshot
3. Verificar em lib/generated/types/UserResponseDto.ts que o campo
   `active: boolean` existe. Verificar em
   lib/generated/types/UpdateUserDto.ts que o campo
   `active?: boolean` existe.

Se algum desses não estiver tipado, PARAR e reportar — a Fase A não
publicou direito ou o snapshot não foi sincronizado.

# Escopo desta fase

- Adicionar coluna **Status** (Badge Ativo/Inativo) e coluna **Ações**
  no UsersTableView.
- **UserDialog** (modo edit) com form: nome, email, role
  (ADMIN/SUPERVISOR/AGENT) e departments[] (multi-select via
  checkboxes — `<Checkbox>` shadcn já instalado). Sem campo password
  nesta sprint (entra em sprint dedicada de "Reset de senha pelo admin"
  no ROADMAP §5.5).
- **DeactivateUserDialog** (AlertDialog destrutivo) — DELETE
  /users/:id (soft via deletedAt no backend).
- **ForceLogoutUserDialog** (AlertDialog destrutivo) — POST
  /users/:id/force-logout.
- **Reativar inline** em users inativos — PATCH /users/:id com
  `{ active: true }`, sem AlertDialog (não-destrutivo), igual a Tags.
- **Filtro Status** (Ativos/Inativos, default Ativos) — Select novo
  na barra de filtros do UsersTable.
- **Filtro busca** (`<InputGroup>` com `SearchIcon`, debounced via
  `useDeferredValue`) — alimenta o param `search` da listagem (já
  suportado no backend; `name` ou `email`).
- **Filtro role** (Todos/Admin/Supervisor/Atendente) — Select.

Hard delete (DELETE definitivo do banco), edição da própria conta
(`/me`), troca de senha pelo admin e reset de senha por email **ficam
fora desta sprint**.

# Decisões já alinhadas com o humano (NÃO re-discutir no brainstorm)

- Replicar split UsersTable (data) + UsersTableView (apresentação) — já
  é o pattern atual; ampliar para suportar ações.
- Mutations usam invalidate na queryKey de list após sucesso (mesmo
  pattern de Tags/Departments).
- Desativar via linha = DELETE direto, dentro de AlertDialog (UX
  consagrada). Mensagem deixa claro que o usuário deixa de fazer login,
  mas histórico é preservado.
- Reativar via linha = PATCH active=true direto, sem AlertDialog
  (não-destrutivo).
- Editar usa um UserDialog dedicado (modo edit apenas), modo controlado
  por prop (`mode: 'edit'` + `user: UserResponseDto`). Sem modo create
  porque create vive no fluxo de convite.
- Force logout via linha = POST /users/:id/force-logout dentro de
  AlertDialog destrutivo. Mensagem: "O usuário será desconectado de
  todas as sessões. Ele continuará ativo e poderá fazer login de novo."
- Filtros: search (debounced) + Select Role (Todos/Admin/Supervisor/
  Atendente, default Todos) + Select Status (Ativos/Inativos, default
  Ativos).
- Paginação: limit=50 e nota "Mostrando os primeiros 50…" quando
  hasMore. Sem botão "Carregar mais".
- Strings pt-BR; identificadores em inglês.
- Tela permanece ADMIN-only (rota cobre o gate em `(app)/configuracoes/
  layout.tsx`). Não mexer no rbac.

# Particularidades de Users vs Tags/Quick Replies

- **Sem dialog de create** — usuários entram via convite. Header da
  página continua mostrando `<InviteUserDialog />` (não mexer).
- **Departments** é array de objetos (`{ id, name }`). UI:
  multi-select via lista de `<Checkbox>` em scrolável, alimentada por
  `useDepartmentsControllerList({ active: true, limit: 100 })`. Loading
  state com Skeleton. Empty state ("Nenhum departamento ativo") raro —
  pode mostrar inline se aparecer. Se a empresa tiver muitos
  departamentos, scrollable container limita altura (~240px) com
  scroll interno.
- **Role** vai como `<Select>` shadcn (single-select). Opções:
  Administrador (ADMIN), Supervisor (SUPERVISOR), Atendente (AGENT).
  Não oferecer SUPER_ADMIN (backend rejeita PATCH com role=SUPER_ADMIN
  via Zod enum).
- **Linhas com ações ocultas:**
  - **Self:** linha do próprio user logado (comparar `user.id ===
    me.id`) NÃO mostra Editar/Desativar/Force logout. Em vez disso,
    mostra "Você" como label sutil. Razão: edições do próprio user
    vão pelo `/me` (NavUser → painel de perfil, fora desta sprint).
  - **SUPER_ADMIN:** linha de role=SUPER_ADMIN não mostra
    Editar/Desativar/Force logout (backend rejeita com 403; a UI
    antecipa). Mostra label "Conta da plataforma".
  - **Último ADMIN inferido:** se a lista (filtrada por active=true)
    tem só 1 ADMIN, esconder Desativar do botão dele (backend rejeitaria
    com 409, mas evitamos render). Editar continua disponível (mudar
    role pra ADMIN→SUPERVISOR também cai em 409 do backend; o dialog
    apenas mostra o erro inline). Não precisa de helper extra na linha.
- **Status no response:** Fase A expõe `user.active` direto. Badge
  "Ativo" (default) ou "Inativo" (outline + cor neutra), igual a Tags.
- **Force logout:** ícone `LogOut` (lucide). Botão `text-destructive`
  como DELETE pra deixar visualmente claro que é destrutivo de sessão.
- **Última atividade:** já tem coluna `lastSeenAt`. Se o user fez
  force-logout recentemente, vai mostrar a última conexão antes do
  logout. Sem mudança aqui.
- **`useCurrentUser()`** já é usado pelo app-sidebar — disponível em
  qualquer Client Component. Pegar `me.id` pra calcular self.
- **`useDepartmentsControllerList`**: invalidate na queryKey só faz
  sentido se o usuário criar/editar departments em paralelo, mas o
  modal de UserDialog é momentâneo — refetch ao abrir resolve.

# Antes de codar

1. Ler nesta ordem:
   - crm-web/CLAUDE.md (raiz)
   - crm-web/ROADMAP.md §4.8 (Sprint 0.21 contexto)
   - crm-web/ARCHITECTURE.md
   - crm-web/design-system.md (incluindo "Inputs com ícone…" e
     "Campos obrigatórios vs opcionais")
   - crm-web/WORKFLOW.md
   - crm-web/app/CLAUDE.md
   - crm-web/components/CLAUDE.md
   - crm-web/lib/CLAUDE.md
   - crm-web/components/users/users-table.tsx (estado atual — só lista)
   - crm-web/components/users/users-table-view.tsx (estado atual — só 5
     colunas, sem ações)
   - crm-web/components/users/users-table.test.tsx
   - crm-web/components/users/users-table-view.test.tsx
   - crm-web/components/users/invite-user-dialog.tsx (referência: form
     com role select, padrão de erros 409/400/5xx)
   - crm-web/components/tags/tags-table.tsx
     (PADRÃO A REPLICAR — fetcher + filtros + dialogs)
   - crm-web/components/tags/tags-table-view.tsx
     (PADRÃO A REPLICAR — 4 estados + ações contextuais)
   - crm-web/components/tags/tag-dialog.tsx
     (PADRÃO A REPLICAR — modal RHF + zodResolver + 409/400/5xx)
   - crm-web/components/tags/deactivate-tag-dialog.tsx
   - crm-web/components/quick-replies/delete-quick-reply-dialog.tsx
     (PADRÃO A REPLICAR — AlertDialog destrutivo simples)
   - crm-web/app/(app)/configuracoes/usuarios/page.tsx (estado atual)
   - crm-web/lib/generated/hooks/useUsersController*
   - crm-web/lib/generated/hooks/useDepartmentsControllerList
   - crm-web/lib/generated/types/UserResponseDto.ts
   - crm-web/lib/generated/types/UpdateUserDto.ts
   - crm-web/lib/generated/types/UserListResponseDto.ts
   - crm-web/lib/generated/schemas/updateUserDtoSchema.ts
   - crm-web/lib/api-client.ts
   - crm-web/contexts/current-user-context.tsx (`useCurrentUser`)

2. Rodar Superpowers /brainstorming antes de qualquer código.
   Pontos abertos pra fechar:
   - Colunas finais da UsersTableView: Nome (+ badge "Você" / "Conta da
     plataforma" quando aplicável) | E-mail | Perfil | Departamentos |
     Última atividade | Status | Ações? Confirmar.
   - Empty state com filtro Status: "Nenhum usuário {ativo|inativo}
     encontrado." (mesmo molde de Tags).
   - UserDialog (modo edit only): form com `name` (required), `email`
     (required, lowercase), `role` (required), `departmentIds` (multi
     via checkboxes, opcional), botões Cancelar/Salvar alterações.
     `<FieldLabel required>` em name, email e role.
   - Schema do form: schema local mínimo em pt-BR (mensagens custom)
     compostas com regras simétricas ao backend (min 2 chars no nome,
     formato email, role enum). Não compor com `updateUserDtoSchema`
     gerado — a tradução de mensagens fica mais limpa local.
   - Erros do backend a tratar (mesmas estruturas das outras sprints):
     - 409 email duplicado → setError('email').
     - 409 último ADMIN (no PATCH role=SUPERVISOR/AGENT, ou no DELETE,
       ou no PATCH active=false) → setError('root') no edit; toast no
       Deactivate.
     - 400 VALIDATION → setError por field.
     - 403 (tentou mexer em SUPER_ADMIN) → setError('root') com
       "Você não tem permissão para alterar esta conta."
     - 5xx / network → setError('root', genérico em pt-BR).
     Confirmar lendo o módulo do crm-api antes de inventar.
   - Acessibilidade: label visível em todo input, aria-invalid,
     role="alert", foco gerenciado no modal. Asterisco vermelho via
     <FieldLabel required> em name/email/role.
   - Filtro search debounced via useDeferredValue (sem libs novas).
   - Multi-select de departments: scrollable area com ~240px max
     height, lista de `<Checkbox>` + label vinda do
     `useDepartmentsControllerList`. Quando carregando, Skeleton; quando
     vazio, mensagem "Nenhum departamento ativo cadastrado".
   - "Você" / "Conta da plataforma" como labels secundários inline:
     `<Badge variant="secondary" className="text-xs">` com texto curto.
   - DeactivateUserDialog: mensagem clara — "Ele deixa de fazer login,
     mas histórico (tickets, mensagens, atribuições) é preservado. Você
     pode reativá-lo depois pelo filtro 'Inativos'."
   - ForceLogoutUserDialog: mensagem clara — "Encerra todas as sessões
     ativas deste usuário. Ele permanece com a conta ativa e poderá
     fazer login de novo."

3. Após alinhamento, /write-plan e quebrar em steps com TDD:
   - Step 1: refatorar components/users/users-table-view.tsx (+ teste
     RTL existente) pra novas colunas Status + Ações + props
     `canEditItem(item)`, `canDeactivateItem(item)`, `canForceLogout(item)`
     (separadas — self/SUPER_ADMIN escondem todas; último ADMIN ativo só
     esconde Deactivate). Tests cobrem 4 estados, linha completa, badge
     Você/Conta da plataforma, ações ocultas/visíveis por gate.
   - Step 2: components/users/users-table.tsx ('use client'). Adicionar
     filtros search/role/status, calcular `me`, `lastActiveAdminId`
     (memo derivado da lista). Handler de Reativar inline (PATCH
     active=true + toast + invalidate). Estados de target pra
     edit/deactivate/forceLogout.
   - Step 3: components/users/user-dialog.tsx ('use client', RHF +
     zodResolver). Form como descrito. Multi-select de departments via
     checkboxes. Tratamento de erros. Reset ao reabrir. Asterisco em
     required. Teste RTL: edit success, 409 email, 409 último admin,
     validação min(2) nome, formato email, role enum, scope dos checkboxes.
   - Step 4: components/users/deactivate-user-dialog.tsx (AlertDialog +
     DELETE) + teste RTL (3 casos: confirma, cancela, falha 409).
   - Step 5: components/users/force-logout-user-dialog.tsx (AlertDialog +
     POST force-logout) + teste RTL (3 casos: confirma, cancela, falha).
   - Step 6: ajustar app/(app)/configuracoes/usuarios/page.tsx só se
     necessário (provavelmente nada — UsersTable já vive aqui).
   - Step 7: Verificação manual end-to-end contra crm-api local
     (editar nome/role/depts, desativar, reativar via filtro Inativos,
     force logout em outra sessão, regras de proteção de self e
     SUPER_ADMIN, último ADMIN bloqueado pelo backend com 409 inline,
     filtros de busca/role/status combinando, paginação se houver
     hasMore).
   - Step 8: marcar Sprint 0.21 Fase B como entregue em ROADMAP.md §4.8.
   - Step 9: Spec da fase em
     docs/superpowers/specs/<data>-sprint-0-21-users-crud-frontend-design.md.

# Regras não-negociáveis (CLAUDE.md crm-web)

- Branch dedicada (feat/users-crud-screen) a partir de origin/main
  atualizado.
- main protegida — PR obrigatório.
- Sem --no-verify, sem push --force.
- TypeScript strict; sem any/as Type sem comentário justificando.
- Tipos e schemas Zod do form vêm de lib/generated. Se algum tipo
  ainda for `unknown` após pnpm generate:api:from-snapshot, é gap
  da Fase A — PARAR e reportar.
- Schema local SÓ pra mensagens custom em pt-BR (compose com generated)
  ou pra campos exclusivos de UI; jamais redefinir o shape do DTO.
- Strings visíveis em pt-BR; identificadores em inglês.
- Default Server Component; 'use client' só em table fetcher, dialogs
  e qualquer componente com hook de estado.
- Não editar lib/generated/ à mão.
- Reuso > criação: replicar componentes shadcn/ui já instalados.
  alert-dialog, switch, checkbox, select, input-group já existem desde
  sprints anteriores — não reinstalar nem perguntar.
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

- /configuracoes/usuarios renderiza header (título + InviteUserDialog
  inalterado) + tabela tipada com 7 colunas (Nome | E-mail | Perfil |
  Departamentos | Última atividade | Status | Ações) + empty state
  contextual pelo filtro Status.
- UsersTableView com 4 estados (loading/error/ready/empty) e linha
  completa, com badge "Você" / "Conta da plataforma" quando aplicável,
  e ações ocultas conforme gates (self / SUPER_ADMIN / último ADMIN).
- UserDialog edita nome/email/role/departments usando os hooks
  gerados; pós-sucesso fecha modal, toast e invalidate da list.
  <FieldLabel required> em name, email e role. Multi-select de
  departments via lista de `<Checkbox>`.
- DeactivateUserDialog desativa via DELETE (soft, deletedAt no backend);
  pós-sucesso toast + invalidate. Mensagem deixa claro o que muda e o
  que é preservado.
- ForceLogoutUserDialog encerra todas as sessões via
  POST /users/:id/force-logout; pós-sucesso toast (sem invalidate da
  list — não muda lastSeenAt imediatamente; refresh natural cobre).
- Botão "Reativar" na linha de items inativos chama PATCH active=true
  direto + toast + invalidate (sem AlertDialog).
- Search com <InputGroup> + SearchIcon, debounced + Select Role +
  Select Status alimentam a query.
- Mensagens de erro em pt-BR pros casos 409 / 400 / 403 / 5xx /
  network. 409 email duplicado mapeia pro field; 409 último ADMIN
  mapeia pro root no edit e toast no deactivate.
- Tela permanece ADMIN-only — sem mexer no rbac.ts nem no proxy.ts.
- Testes RTL:
  - users-table-view: 4 estados + linha + ações contextual por gate
    (self, SUPER_ADMIN, último ADMIN, normal) + badge Status.
  - user-dialog: edit + erro 409 (email) + erro 409 (último admin
    no root) + validação (nome min, email formato, role enum) +
    multi-select de departments populado.
  - deactivate-user-dialog: confirmação + sucesso + erro 409 + cancelar.
  - force-logout-user-dialog: confirmação + sucesso + erro + cancelar.
- pnpm format:check && pnpm lint && pnpm typecheck && pnpm test verdes.
- pnpm generate:api:from-snapshot && git diff --exit-code lib/generated
  zero diff.
- ROADMAP §4.8 atualizado registrando Sprint 0.21 como entregue.
- Spec da fase em
  docs/superpowers/specs/<data>-sprint-0-21-users-crud-frontend-design.md.
- PR aberto referenciando o PR mergeado da Fase A no crm-api.

Pode começar pela leitura dos docs e em seguida abrir o brainstorm.
```
