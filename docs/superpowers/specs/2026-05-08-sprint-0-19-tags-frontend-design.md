# Sprint 0.19 Fase B — Frontend de Tags

> **Repo:** `crm-web`
> **Branch:** `feat/tags-screen`
> **Pré-requisito merged:** `crm-api` PR #46 (`fix(tags): expose response schemas in OpenAPI`, commit `f27cf54`)
> **Substitui:** `PlaceholderPage` em `/configuracoes/tags`

## 1. Objetivo

Substituir o placeholder de `/configuracoes/tags` por uma tela real
de listagem + criação + edição + soft-delete + reativação, replicando o
padrão consolidado em `/configuracoes/departamentos` (Sprint 0.18).

Hard delete (`DELETE ?hard=true`, ADMIN-only com tratamento do conflito 409
"há atribuições") fica fora desta sprint — entra em sprint dedicada com
confirmação reforçada.

## 2. Decisões alinhadas com o humano

1. Split `TagsTable` (data fetcher, `'use client'`) + `TagsTableView`
   (presentational) — mesmo molde de Departments, testável com Vitest puro.
2. Mutations (`Create` / `Update`) invalidam `tagsControllerListQueryKey()`
   após sucesso.
3. Soft-delete via `PATCH active=false` dentro de `AlertDialog`, mantendo
   um único endpoint para Desativar/Reativar (consistente com Departments).
   O backend trata `DELETE /:id` (sem `?hard`) como soft-delete equivalente,
   mas optamos pelo PATCH para unificar com a UX de Reativar.
4. Reativar via linha = `PATCH active=true` direto, sem AlertDialog
   (não-destrutivo) — mesmo padrão de Departments.
5. Criar e editar usam o **mesmo** `TagDialog` controlado por
   `mode: 'create' | 'edit'` + `tag?: TagResponseDto`.
6. Filtros: `search` (debounced via `useDeferredValue`) + Select Status
   (Ativos/Inativos, default Ativos) + Select Escopo (Todos/Contato/Ticket/
   Ambos, default Todos — "Todos" omite o param `scope`).
7. Paginação: `limit=50` e nota "Mostrando os primeiros 50…" quando
   `hasMore`. Sem botão "Carregar mais" — mantém simplicidade do Departments.
8. Strings pt-BR; identificadores em inglês.
9. Schema do form é local em pt-BR (não compõe com `createTagDtoSchema`
   gerado): mensagens custom em pt-BR (geradas pelo Kubb voltam em inglês),
   regex hex simétrica ao backend, default `#1B84FF` (color/primary/500 do
   design-system) garante valor pré-selecionado.
10. Asterisco vermelho via `<FieldLabel required>` apenas em `name`. `color`
    tem default `#1B84FF`, `scope` tem default `BOTH`, `active` tem default
    `true` — usuário nunca enfrenta campo vazio nesses três.

## 3. Componentes e rotas

### Rota

`app/(app)/configuracoes/tags/page.tsx` (Server Component) — header com
título + descrição + `<TagDialogTrigger />` + `<TagsTable />`.

### Componentes client

- `components/tags/tags-table-view.tsx` — presentational, 4 estados
  (`loading` / `error` / `ready` / empty). Colunas:
  Nome | Cor (swatch `size-4 rounded-sm` + hex em mono) | Escopo
  (Contato/Ticket/Ambos) | Status (Badge Ativo/Inativo) | Atualizado em |
  Ações (Editar | Desativar/Reativar contextual).
- `components/tags/tags-table.tsx` — fetcher + filtros (`InputGroup` no
  search com `SearchIcon`, Select Status, Select Escopo) + monta dialogs
  internos (`TagDialog` em modo edit + `DeactivateTagDialog`) + handler
  inline de Reativar (`PATCH active=true` + toast + invalidate).
- `components/tags/tag-dialog.tsx` — RHF + `zodResolver` com schema local
  em pt-BR. Color picker = `<input type="color">` + `<Input>` text
  sincronizados via `Controller`. Tratamento de 409 (`setError('name')`),
  400 por field, 5xx/network via `setError('root')`.
- `components/tags/tag-dialog-trigger.tsx` — botão "Nova tag" isolado para
  o header da page (Server Component permanece).
- `components/tags/deactivate-tag-dialog.tsx` — `AlertDialog` encapsulando
  `useTagsControllerUpdate({ data: { active: false } })` + invalidate.

### Testes (Vitest + RTL)

- `tags-table-view.test.tsx` (11 casos) — 4 estados; emptyMessage
  customizada; linha completa (nome, swatch, hex, escopo, status,
  atualizado em); labels pt-BR para os 3 escopos; badge Inativo;
  Editar/Desativar/Reativar; ocultar Desativar em item inativo.
- `tag-dialog.test.tsx` (5 casos) — create com sucesso e payload
  (name/color/scope/active); 409 inline em `name`; validação `min(1)` de
  `name`; validação regex hex (rejeita "banana"); modo edit pré-preenche
  e envia PATCH.
- `deactivate-tag-dialog.test.tsx` (3 casos) — confirma desativação via
  PATCH `active=false`; cancelar não chama backend; toast de erro em 5xx.

## 4. Erros do backend tratados

Confirmados em
[`crm-api/src/modules/tags/services/tags.application.service.ts`](../../../../crm-api/src/modules/tags/services/tags.application.service.ts):

- **409** `{ message: "Já existe uma tag com este nome" }` (Prisma P2002 em
  `companyId+name`) → `setError('name', { message })` inline.
- **400** `{ message, errors: [{ field, message, code }] }` (re-parse defense
  de `UpdateTagSchema`) → mapear cada `errors[i]` para `setError(field)`.
- **5xx** → `setError('root', { message: 'Erro no servidor…' })`.
- **Network/sem status** → `setError('root', { message: 'Sem conexão…' })`.

## 5. Acessibilidade

- `<Label htmlFor>` em todo input (search com `sr-only` ao lado do
  `InputGroupAddon`).
- `aria-label` nos botões de ação na linha (`Editar tag {name}`,
  `Desativar tag {name}`, `Reativar tag {name}`).
- `aria-invalid` nos campos com erro; `role="alert"` na mensagem.
- Asterisco do required usa `aria-hidden` (renderizado via `<FieldLabel
required>` em `components/ui/field.tsx`) — não polui screen reader.
- Color swatch com `role="img"` e `aria-label="Cor #HEX"` para descrever
  o estado visual a quem usa screen reader.

## 6. Particularidades vs Departments

- **Sem Detail DTO separado:** `GET /tags/:id` devolve o mesmo
  `TagResponseDto` da listagem, igual a Departments — passamos `editTarget`
  direto pro dialog sem detailQuery.
- **Color picker dual:** `<input type="color">` (nativo) + `<Input>` text
  para colar/editar hex manualmente. Sincronizados via `Controller`. Picker
  recebe valor "safe" (`DEFAULT_COLOR` se input ainda não bate regex) pra
  evitar warning do React. Normalização pra uppercase no submit (e no
  `onBlur` quando o regex passa).
- **Filtro Escopo:** novidade que Departments não tem. 4 opções; "Todos"
  omite o param.

## 7. Verificação

- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` ✅
  (124/124 testes verdes, 19 dos quais são desta sprint).
- `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated`
  zero diff a partir do estado da branch.
- Verificação manual end-to-end no browser depende de auth — fica para
  rodada de QA pós-PR (criar/editar/desativar/reativar/filtrar por
  search/Status/Escopo).
- `pnpm build` permanece fora do gate local (limitação documentada em
  `CLAUDE.md` §11) — CI valida.

## 8. Hard delete (fora de escopo desta sprint)

Quando entrar em sprint dedicada precisará tratar:

- `DELETE /:id?hard=true` é ADMIN-only (já protegido no backend).
- Conflito 409 "Não é possível excluir definitivamente: há N atribuição(ões)"
  precisa de UI explicando que o usuário deve remover atribuições primeiro.
- AlertDialog reforçado com input "digite o nome da tag para confirmar"
  (padrão GitHub-style) — irreversível.
