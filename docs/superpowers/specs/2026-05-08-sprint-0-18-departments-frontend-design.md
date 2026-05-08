# Sprint 0.18 Fase B — Frontend de Departamentos

> **Repo:** `crm-web`
> **Branch:** `feat/departments-screen`
> **Pré-requisito merged:** `crm-api` PR #43 (`fix(departments): expose response schemas in OpenAPI`, commit `361173c`)
> **Substitui:** `PlaceholderPage` em `/configuracoes/departamentos`

## 1. Objetivo

Substituir o placeholder de `/configuracoes/departamentos` por uma tela real
de listagem + criação + edição + soft-delete, replicando o padrão consolidado
em `/configuracoes/usuarios` (Sprint 0.16/0.17).

## 2. Decisões alinhadas com o humano

1. Split `DepartmentsTable` (data fetcher, `'use client'`) + `DepartmentsTableView`
   (presentational) — testável com vitest sem mock de TanStack Query.
2. Mutations (`Create` / `Update` / `SoftDelete`) invalidam `departmentsControllerListQueryKey()`
   após sucesso (mesmo pattern do `InvitationsTable`).
3. Soft delete confirma via `AlertDialog` + toast + invalidate.
4. Criar e editar usam o **mesmo** `DepartmentDialog` controlado por
   `mode: 'create' | 'edit'` + `department?: DepartmentResponseDto`.
5. `workingHours` **fora de escopo** desta sprint — exibido como aviso read-only
   "Editor de horário será adicionado em sprint futura". Em update, o campo
   simplesmente não é enviado (`UpdateDepartmentDto` é strict-partial).
6. SLA entra como dois inputs `type=number` opcionais
   (`slaResponseMinutes` / `slaResolutionMinutes`).
7. `distributionMode` como `Select` com 4 opções e default `MANUAL`.
8. Filtro: `search` debounced via `useDeferredValue` + switch
   "Mostrar inativos" (quando ON envia `active=false`, conforme literalidade
   do prompt — "Mostrar inativos" deixa explícito que filtra **só** inativos).
9. Paginação: sem precedente local; usa `limit=50` e exibe nota
   "Mostrando os primeiros 50. Use a busca para refinar." quando
   `pagination.hasMore`. Sem botão "Carregar mais" — mantém simplicidade.
10. Strings pt-BR; identificadores em inglês.

## 3. Componentes e rotas

### Rota

`app/(app)/configuracoes/departamentos/page.tsx` (Server Component) —
header com `<DepartmentDialogTrigger mode="create" />` + `<DepartmentsTable />`.

### Componentes client

- `components/departments/departments-table-view.tsx` — presentational,
  4 estados (`loading` / `error` / `ready` / empty). Colunas:
  Nome | Distribuição | SLA | Ativo | Atualizado em | Ações.
- `components/departments/departments-table.tsx` — fetcher + filtros +
  monta dialogs internos (`DepartmentDialog` em modo edit + `DeleteDepartmentDialog`).
- `components/departments/department-dialog.tsx` — RHF + zodResolver
  (`createDepartmentDtoSchema` ou `updateDepartmentDtoSchema` via composição).
- `components/departments/department-dialog-trigger.tsx` — botão "Novo departamento"
  isolado pra ser plugado no header (Server Component) sem precisar tornar a
  page inteira client.
- `components/departments/delete-department-dialog.tsx` — `AlertDialog`
  encapsulando `useDepartmentsControllerSoftDelete`.

### Testes

- `departments-table-view.test.tsx` — estados loading/error/ready/empty
  - linha completa (todos os 6 valores formatados).
- `department-dialog.test.tsx` — create OK, edit OK, 409 NAME_TAKEN inline
  no campo `name`, validação RHF (name obrigatório).
- `delete-department-dialog.test.tsx` — confirma soft-delete + toast.
  Cancelar não chama o backend.

## 4. Hooks Kubb usados (lib/generated)

| Endpoint                         | Hook                                 |
| -------------------------------- | ------------------------------------ |
| `GET /api/v1/departments`        | `useDepartmentsControllerList`       |
| `POST /api/v1/departments`       | `useDepartmentsControllerCreate`     |
| `PATCH /api/v1/departments/:id`  | `useDepartmentsControllerUpdate`     |
| `DELETE /api/v1/departments/:id` | `useDepartmentsControllerSoftDelete` |

## 5. Wire shape de erros do backend (Departments)

Conferido em `crm-api/src/modules/departments/services/departments.application.service.ts`
e `crm-api/src/common/filters/all-exceptions.filter.ts`:

- **409 Conflict** (nome duplicado) — body
  `{ statusCode: 409, error: 'Conflict', message: 'Já existe um departamento com este nome', path, timestamp, requestId? }`.
  Sem campo `code` top-level — o frontend distingue por **statusCode** e
  exibe `message` direto no campo `name`.
- **400 Bad Request** (validação Zod) — body inclui
  `{ message: 'Validação falhou', errors: [{ field, message, code }] }`.
  Frontend mapeia `errors[*].field` → `setError(field, { message })` no RHF
  (fallback genérico se `field` não casar).
- **5xx / network** — toast genérico "Erro no servidor" / "Sem conexão".

## 6. RBAC

Sem ajuste necessário. `lib/rbac.ts` permite `/configuracoes/*` para
`ADMIN`/`SUPER_ADMIN` e bloqueia para `SUPERVISOR`/`AGENT` — herdado
da Sprint 0.17 (PR #23).

## 7. Critério de pronto

- [ ] `/configuracoes/departamentos` renderiza header + tabela tipada + empty state.
- [ ] CRUD ponta a ponta funcionando contra `crm-api` local.
- [ ] Search debounced + switch "Mostrar inativos" alimentam a query.
- [ ] Erros 409 / 400 / 5xx / network tratados em pt-BR.
- [ ] Testes RTL passando (table-view, dialog, delete-dialog).
- [ ] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` verdes.
- [ ] `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` zero diff.
- [ ] `ROADMAP.md §4.8` com `[x]` no item Departamentos.
- [ ] PR aberto referenciando `crm-api` PR #43.
