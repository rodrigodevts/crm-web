# Sprint 0.20 Fase B — Frontend de Quick Replies

> **Repo:** `crm-web`
> **Branch:** `feat/quick-replies-screen`
> **Pré-requisito merged:** `crm-api` Fase A da Sprint 0.20 (QuickRepliesController exposto via `@ApiOkResponse`/`@ApiCreatedResponse`, schemas `QuickReplyResponseDto`/`QuickReplyListResponseDto` no `openapi.snapshot.json`)
> **Substitui:** `PlaceholderPage` em `/configuracoes/quick-replies`

## 1. Objetivo

Substituir o placeholder de `/configuracoes/quick-replies` por uma tela
real de listagem + criação + edição + **hard delete** (DELETE permanente),
replicando o padrão consolidado em `/configuracoes/tags` (Sprint 0.19) e
divergindo apenas no fato de que respostas rápidas não usam soft-delete
(o usuário considera o conteúdo descartável — sem necessidade de
arquivar/reativar — e a UI fica mais simples sem filtro Status, sem
botão Reativar e sem Switch "Ativa" no form). A tela estende o padrão
para suportar:

- escopo COMPANY (global) vs PERSONAL (visível só ao criador), com
  ícones distintos na coluna Escopo;
- mensagem multilinha (até 4000 chars) com contador de caracteres
  restantes via `<Textarea>`;
- mídia opcional via URL + MIME type, exibida como Badge na lista;
- gate RBAC por rota — AGENT e SUPERVISOR ganham acesso à tela (única
  parte de `/configuracoes/*` em que entram), mantendo o restante
  restrito a ADMIN e SUPER_ADMIN.

Endpoint dedicado de upload de mídia (`mediaUrl` aqui é digitado/colado)
fica fora desta sprint.

## 2. Decisões alinhadas com o humano

1. Split `QuickRepliesTable` (data fetcher, `'use client'`) +
   `QuickRepliesTableView` (presentational) — mesmo molde de Tags,
   testável com Vitest puro.
2. Mutations (`Create` / `Update` / `Delete`) invalidam
   `quickRepliesControllerListQueryKey()` após sucesso.
3. **Hard delete** via `DELETE /quick-replies/:id` dentro de
   `AlertDialog` com mensagem clara de irreversibilidade. Diverge de
   Tags/Departments (que usam soft-delete) — quick replies são
   descartáveis e não precisam ser arquivadas.
4. Sem botão "Reativar" — não há estado inativo para reativar.
5. Criar e editar usam o **mesmo** `QuickReplyDialog` controlado por
   `mode: 'create' | 'edit'` + `quickReply?: QuickReplyResponseDto`.
6. Filtros: `search` por shortcut/message (debounced via
   `useDeferredValue`) + Select Escopo (Todos/Globais/Pessoais, default
   Todos — "Todos" omite o param `scope`) + Switch "Apenas as minhas"
   (envia `mine=true` quando ON). **Sem filtro Status** (sem soft-delete
   na UX, todos os items visíveis são considerados ativos).
7. Paginação: `limit=50` e nota "Mostrando os primeiros 50…" quando
   `hasMore`. Sem botão "Carregar mais".
8. Strings pt-BR; identificadores em inglês.
9. Schema do form é local em pt-BR (não compõe com
   `createQuickReplyDtoSchema` gerado): mensagens custom; regex de
   shortcut e MIME simétricas ao backend; `superRefine` valida pareamento
   "mediaUrl ↔ mediaMimeType" (exigir um implica exigir o outro).
10. Asterisco vermelho via `<FieldLabel required>` apenas em `shortcut`
    e `message`. `scope` tem default `PERSONAL`, `mediaUrl`/`mediaMimeType`
    são opcionais — campos sem asterisco. **Sem campo `active` no form**
    — o backend default `active=true` é mantido implicitamente; quando
    o usuário quer "desativar" uma resposta, ele a apaga.
11. Backend recusa `scope` no `PATCH` (campo omitido do
    `UpdateQuickReplyDto`). Em modo edit, o Select de Escopo é
    desabilitado com helper "Para mudar o escopo, crie uma nova resposta
    e apague esta".
12. AGENT em modo create: Select de Escopo é desabilitado em PERSONAL
    com helper "Apenas administradores podem criar respostas globais."
    Defesa em profundidade: `onSubmit` força `scope='PERSONAL'` quando
    `me.role === 'AGENT'`.

## 3. Componentes e rotas

### Rota

`app/(app)/configuracoes/quick-replies/page.tsx` (Server Component) —
header com título + descrição + `<QuickReplyDialogTrigger />` +
`<QuickRepliesTable />`.

### Componentes client

- `components/quick-replies/quick-replies-table-view.tsx` —
  presentational, 4 estados (`loading` / `error` / `ready` / empty).
  Colunas: Atalho (`<code className="font-mono">/{shortcut}</code>`)
  | Mensagem (truncada com `title` no mouseover) | Escopo (Badge
  outline com `<BuildingIcon>` para Global / `<UserIcon>` para Pessoal)
  | Mídia (Badge outline com `<PaperclipIcon>` + mimetype, ou "—")
  | Atualizado em (pt-BR `dateStyle:short timeStyle:short`)
  | Ações (Editar | Apagar destrutivo, ou "Apenas leitura" quando
  `canEditItem(item) === false`).
- `components/quick-replies/quick-replies-table.tsx` — fetcher +
  filtros (`InputGroup` no search com `SearchIcon`, Select Escopo,
  `Switch` "Apenas as minhas"). Calcula `canEditItem` a partir de
  `useCurrentUser()`: AGENT só edita/apaga `scope === 'PERSONAL'`
  (PERSONAL alheio não aparece na lista — backend filtra), demais
  roles editam/apagam tudo. Monta dialogs internos (`QuickReplyDialog`
  em modo edit + `DeleteQuickReplyDialog`).
- `components/quick-replies/quick-reply-dialog.tsx` — RHF +
  `zodResolver` com schema local em pt-BR. Form fields: shortcut
  (Input), message (Textarea com contador "X caracteres restantes"
  alimentado por `useWatch({ control, name: 'message' })` para ficar
  memoization-safe sob o React Compiler), mediaUrl (Input type="url"),
  mediaMimeType (Input com placeholder "image/jpeg"), scope (Select com
  restrição por role e por mode). Tratamento de erros: 409 →
  `setError('shortcut')`; 400 com `errors[]` → `setError` por field
  (filtro pelas keys de `DEFAULT_VALUES`); 403 → `setError('root',
'Apenas administradores podem criar respostas globais.')`; 5xx ou
  network → `setError('root', …)` com mensagem genérica em pt-BR.
- `components/quick-replies/quick-reply-dialog-trigger.tsx` — botão
  "Nova resposta rápida" isolado para o header da page (Server
  Component permanece).
- `components/quick-replies/delete-quick-reply-dialog.tsx` —
  `AlertDialog` encapsulando `useQuickRepliesControllerDelete()` (DELETE
  permanente) + invalidate da queryKey de list após sucesso.

### Testes (Vitest + RTL)

- `quick-replies-table-view.test.tsx` (13 casos) — 4 estados;
  emptyMessage customizada; atalho com prefixo "/"; badge Global vs
  Pessoal; mensagem truncada com `title`; mídia com mimetype; traço
  quando sem mídia; Editar; Apagar; ocultar ações + render "Apenas
  leitura" quando `canEditItem` retorna false.
- `quick-reply-dialog.test.tsx` (10 casos) — create com sucesso
  (payload contém `scope='PERSONAL'` por default e omite `active`);
  409 inline em `shortcut`; validações `min(1)` de shortcut e mensagem;
  regex de shortcut rejeitando espaços; pareamento mediaUrl ↔
  mediaMimeType (ambos os sentidos); edit pré-preenche e PATCH **não
  inclui** scope; scope desabilitado em edit com helper; AGENT em
  create vê scope fixo em PERSONAL com helper específico; 403 mostra
  erro de root com mensagem de admin.
- `delete-quick-reply-dialog.test.tsx` (3 casos) — confirmação +
  DELETE; cancelar não chama o backend; toast de erro em falha.

## 4. RBAC por rota (gate dependente de pathname)

A camada anterior gate-ava `/configuracoes/*` inteiro pra ADMIN/SUPER_ADMIN
via `canAccessAdminAreas` no layout. Para abrir somente
`/configuracoes/quick-replies` a AGENT/SUPERVISOR sem afrouxar o resto, a
sprint adota gate por rota:

- `lib/rbac.ts`: AGENT e SUPERVISOR ganham `/configuracoes/quick-replies`
  como prefixo permitido. ADMIN/SUPER_ADMIN seguem com `/configuracoes`
  (cobre todas as subpastas).
- `proxy.ts`: forwarda o `pathname` da request via header `x-pathname`
  pra Server Components — Next 16 não expõe pathname via `headers()`
  por padrão.
- `app/(app)/configuracoes/layout.tsx`: lê `x-pathname` e usa
  `canAccessRoute(role, pathname)` em vez de `canAccessAdminAreas`. AGENT
  navegando para `/configuracoes/usuarios` continua sendo redirecionado
  para `/atendimentos`.
- `components/app-sidebar.tsx`: `settingsSubItems` é filtrado por
  `canAccessRoute(role, item.href)` e o grupo "Configurações" só aparece
  quando há ao menos um sub-item visível. Para AGENT/SUPERVISOR, o
  grupo passa a aparecer com **só** o item Quick Replies; para
  ADMIN/SUPER_ADMIN, todos os 8 sub-itens aparecem.
- `lib/rbac.test.ts`: cobre os novos casos
  (`AGENT → /configuracoes/quick-replies` true; `SUPERVISOR → /configuracoes/quick-replies`
  true; demais `/configuracoes/*` permanecem false para AGENT/SUPERVISOR).

## 5. Verificação local

```
pnpm format:check   # ✓
pnpm lint           # ✓
pnpm typecheck      # ✓
pnpm test           # 158/158
pnpm generate:api:from-snapshot   # zero diff em lib/generated
```

`pnpm build` continua fora do gate local (limitação documentada em
`CLAUDE.md` §11). CI valida o build a cada PR.

## 6. Critério de pronto cumprido

- [x] `/configuracoes/quick-replies` renderiza header (título + CTA "Nova
      resposta rápida") + tabela tipada + empty state.
- [x] AGENT acessa a rota e cria/edita/apaga apenas suas PERSONAL.
      COMPANY aparecem read-only com badge "Global" e sem botões.
- [x] SUPERVISOR/ADMIN cria/edita/apaga COMPANY livremente; vê suas
      PERSONAL + todas COMPANY (PERSONAL alheio é filtrado pelo backend).
- [x] `QuickRepliesTableView` com 4 estados e linha completa.
- [x] `QuickReplyDialog` cria e edita; pós-sucesso fecha modal, toast e
      invalidate. `<FieldLabel required>` em shortcut e message. Scope
      bloqueado em edit (com helper) e em create-AGENT (helper específico).
- [x] `DeleteQuickReplyDialog` apaga via DELETE permanente; pós-sucesso
      toast + invalidate. Diálogo deixa explícito que a ação é
      irreversível.
- [x] Search com `<InputGroup>` + `<SearchIcon>` debounced + Select
      Escopo + Switch "Apenas as minhas" alimentam a query.
- [x] Mensagens de erro em pt-BR pros casos 409 / 400 / 403 / 5xx /
      network.
- [x] RBAC do gate de `/configuracoes/quick-replies` aceita AGENT e
      SUPERVISOR além de ADMIN/SUPER_ADMIN; sidebar mostra o grupo
      "Configurações" com só o sub-item visível para esses roles.
- [x] Testes RTL: 13 + 10 + 3 = 26 novos casos para Quick Replies, mais
      ajuste do `rbac.test.ts` cobrindo o novo prefixo permitido.
- [x] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`
      verdes.
- [x] `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated`
      zero diff.
- [x] ROADMAP §4.8 atualizado registrando Quick Replies como entregue.
- [x] Esta spec.

## 7. Decisões tomadas que não estavam no prompt original

- **`useWatch` em vez de `watch`** no `QuickReplyDialog` para alimentar
  o contador de caracteres restantes da Mensagem, eliminando o aviso
  "Compilation Skipped: Use of incompatible library" emitido pela regra
  `react-hooks/incompatible-library` do React Compiler. Não há diferença
  funcional.
- **`useCurrentUser()` (do contexto já existente em
  `contexts/current-user-context.tsx`) em vez de criar um novo wrapper
  `hooks/use-me.ts`.** A página `(app)/layout.tsx` já injeta o
  `CurrentUserProvider` com `UserResponseDto` resolvido server-side, e
  o `app-sidebar.tsx` já usa esse mesmo contexto — adicionar uma camada
  paralela seria duplicação.
- **Forwarding de `x-pathname` no `proxy.ts`** em vez de mover o gate
  admin para cada page individual. Mantém o ponto único de enforcement
  no `configuracoes/layout.tsx` e isola a complexidade da diferenciação
  por rota num único helper (`canAccessRoute(role, pathname)`).
- **Tipo `TagScope` extraído estruturalmente** em `tags-table-view.tsx`
  (`type TagScope = TagListItem['scope']`) para sobreviver a renames
  futuros do Kubb. A regeneração desta sprint trocou `ItemsScopeEnumKey`
  para `ItemsScopeEnum2Key` por colisão com o novo `items.scope` de
  `QuickReplyListResponseDto`; a referência estrutural elimina o
  acoplamento ao nome exportado.
