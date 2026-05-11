# Design — Sprint 1.4 Fase C: tela `/configuracoes/motivos-fechamento`

> **Status:** aprovado pelo PO em 2026-05-11.
> **Pareada com:** crm-api Sprint 0.18+ (módulo `close-reasons` já mergeado; CRUD + reorder no backend).
> **Roadmap:** §5.1 Fase 1, sprint complementar à 1.4 Fase B. Fecha o gap onde a tela de Motivos de Fechamento foi pulada nas Sprints 0.18-0.22 do `crm-web`.

---

## 1. Objetivo

Criar `/configuracoes/motivos-fechamento` para CRUD de `CloseReason` (motivos de fechamento de ticket). É pré-requisito visível para a feature "auto-fechamento por inatividade" do canal (Sprint 1.4 Fase B) — sem motivos cadastrados, o admin não consegue configurar timeout no canal. Inclui drag-and-drop para reordenar (ordem é exibida no modal de fechamento de ticket — Fase 2).

## 2. Escopo

### Inclui

- Tela `/configuracoes/motivos-fechamento` (ADMIN/SUPER_ADMIN) com tabela + toolbar.
- Toolbar: busca debounced (300ms) + filtro Ativos/Inativos.
- CRUD: criar (`POST /close-reasons`), editar (`PATCH /close-reasons/:id`), desativar (`DELETE /close-reasons/:id` — soft delete), reativar (`PATCH active=true`).
- Form fields (com efeito hoje): `name` (obrigatório, único por tenant), `message` (textarea opcional, mensagem enviada antes do fechamento), `departmentIds[]` (multi-select inline com checkboxes), `active` (toggle, edit only).
- Drag-and-drop reorder via `@dnd-kit/core` + `@dnd-kit/sortable`: handle visual + keyboard a11y, optimistic update, revert no erro, desabilitado quando filtros ativos.
- Empty state com CTA "Criar motivo" (importante: link entre essa tela e a Sprint 1.4 Fase B — admin que abre canais sem motivos cadastrados é direcionado pra cá).
- Estados explícitos: loading (skeleton), empty global, empty filtrado, erro.
- Item "Motivos de fechamento" no submenu Configurações da sidebar.

### Não inclui (cortes intencionais com TODO no código)

Fields documentados em `close-reason-form-schema.ts` como TODO. Não removidos do backend; apenas omitidos do form do MVP:

- `triggersCsat` — CSAT é Fase 4 (sem efeito hoje).
- `asksDealValue` — composer com valor de venda é Fase 2 (sem efeito hoje).
- `funnelId` — SalesFunnel é Fase 4+ (modelo não existe ainda no produto).

Quando essas fases aparecerem, basta expandir o schema local + adicionar campos no `close-reason-dialog.tsx`.

## 3. Contrato real do backend

Endpoints já gerados em `lib/generated/hooks/`:

- `useCloseReasonsControllerList(params, options)` — retorna `{ items, pagination: { nextCursor, hasMore } }`. Sort default = `sortOrder` ASC.
- `useCloseReasonsControllerFindById(id, options)` — detail com `departments[]`.
- `useCloseReasonsControllerCreate` — `mutateAsync({ data: CreateCloseReasonDto })`.
- `useCloseReasonsControllerUpdate` — `mutateAsync({ id, data: UpdateCloseReasonDto })`.
- `useCloseReasonsControllerSoftDelete` — `mutateAsync({ id })`.
- `useCloseReasonsControllerReorder` — `mutateAsync({ data: { orderedIds: string[] } })`.

**Constraints relevantes:**

- `@@unique([companyId, name])` — 409 se duplicar nome no tenant.
- `departmentIds` aceita até 50, sem duplicatas, todos UUIDs válidos.
- `name`: min 1, max 100. `message`: min 1, max 2000 (quando preenchido — pode ser `null`).
- `reorder.orderedIds`: min 1, max 500, sem duplicatas. **Lista COMPLETA** em nova ordem.

**Backend gap observado:** `useCloseReasonsControllerList` no Kubb retorna `unknown` no Task 6 do 1.4b (já tem `as` localizado no `channel-dialog.tsx`). Confirmar regeneração: agora que o crm-api está atualizado, espera-se que o tipo venha corretamente — verificar no início do plano de execução.

## 4. Arquitetura de arquivos

```
app/(app)/configuracoes/motivos-fechamento/
├── page.tsx                                  # Server Component
├── loading.tsx
└── error.tsx

components/close-reasons/
├── close-reasons-table.tsx                   # smart container (data + filtros + mutations + reorder)
├── close-reasons-table-view.tsx              # view: dnd wrapper + estados (loading/empty/error)
├── close-reasons-table-view.test.tsx
├── close-reason-row.tsx                      # 1 row: drag handle + colunas + ações inline
├── close-reason-dialog.tsx                   # smart create/edit com RHF + Zod
├── close-reason-dialog.test.tsx
├── close-reason-dialog-trigger.tsx           # botão "Novo motivo" no header
├── close-reason-form-schema.ts               # Zod local + TODO dos campos cortados
├── deactivate-close-reason-dialog.tsx        # AlertDialog confirma soft delete
└── deactivate-close-reason-dialog.test.tsx
```

**Modificações:**

- `components/app-sidebar.tsx` — adiciona item `{ href: '/configuracoes/motivos-fechamento', label: 'Motivos de fechamento' }` em `settingsSubItems` (já é filtrado por `canAccessRoute` — sem mudança em RBAC).
- `lib/route-titles.ts` — adiciona o título da rota.
- `package.json` — instala `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

## 5. UX do drag-and-drop reorder

**Layout do row:**

```
[≡] [nome................] [mensagem....] [N depto(s)] [Ativo] [⋮]
 ↑
 drag handle (GripVertical icon, cursor: grab)
```

**Interação:**

- Mouse: drag o handle → row "flutua" com sombra + opacidade no original → drop reordena local → POST reorder → toast sucesso silencioso (não polui).
- Touch: mesma coisa via PointerSensor do dnd-kit.
- Keyboard: Tab até o handle → Espaço seleciona → Setas ↑↓ movem → Espaço confirma. Vem out-of-the-box com `KeyboardSensor`.

**Constraints:**

- Drag desabilitado quando filtros ativos (search ou status). Mostra hint "Limpe os filtros para reordenar." abaixo da toolbar.
- Drag desabilitado durante mutação pendente (evita race).
- Drag desabilitado em rows desativadas? Não — reorder afeta `sortOrder` independente de `active`; admin pode querer reorganizar inativos.

**Save flow:**

1. Usuário solta a row → `setItems(newOrder)` (optimistic).
2. POST `reorder({ orderedIds: newOrder.map((r) => r.id) })`.
3. Sucesso: toast silencioso (ou nenhum — o reorder já é visualmente óbvio) + `invalidateQueries(['close-reasons', 'list'])` pra refresh.
4. Erro: `setItems(originalOrder)` revert + toast "Não foi possível reordenar."

## 6. Form: shape e validação

Schema Zod local (`close-reason-form-schema.ts`):

```ts
import { z } from 'zod';

// TODO Fase 2 (composer): adicionar `asksDealValue: z.boolean()` quando o
//   composer com valor de venda aparecer no fechamento de ticket.
// TODO Fase 4 (CSAT): adicionar `triggersCsat: z.boolean()` quando o
//   fluxo de pesquisa de satisfação for implementado.
// TODO Fase 4+ (SalesFunnel): adicionar `funnelId: z.string().uuid().nullable()`
//   quando o modelo SalesFunnel existir no produto.
// Backend (`crm-api/src/modules/close-reasons/schemas/create-close-reason.schema.ts`)
// já aceita todos os 3 campos com defaults — só precisam ser expostos no form.

export const closeReasonFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Máximo 100 caracteres'),
  message: z.string().trim().max(2000, 'Máximo 2000 caracteres').nullable(),
  departmentIds: z.array(z.string().uuid()).max(50, 'Máximo 50 departamentos').default([]),
  active: z.boolean(),
});

export type CloseReasonFormValues = z.infer<typeof closeReasonFormSchema>;
```

**Submit:**

- **Create**: envia `name`, `message`, `departmentIds`. `active` não é enviado (backend default `true`).
- **Edit**: envia apenas campos dirty (pattern do projeto).
- **Erro 409** por `name` duplicado: `setError('name', { message: data.message })`.
- **Erro 400** com mensagem do backend: toast.

## 7. Tabela: colunas e estados

| Coluna        | Conteúdo            | Notas                                                                    |
| ------------- | ------------------- | ------------------------------------------------------------------------ |
| (drag)        | `<GripVertical>`    | 24px, cursor: grab                                                       |
| Nome          | `name`              | truncar 1 linha + tooltip                                                |
| Mensagem      | `message ?? '—'`    | truncar 1 linha + tooltip                                                |
| Departamentos | resumo              | 0 = "Todos" (sem restrição); 1-3 = nomes inline; >3 = "X, Y, Z e mais N" |
| Status        | badge Ativo/Inativo |                                                                          |
| Ações         | dropdown            | Editar / Desativar (ou Reativar inline se inativo)                       |

**Empty states:**

- Sem motivos + sem filtro: card "Nenhum motivo de fechamento cadastrado." + texto "Crie motivos para usar no auto-fechamento de canais e no encerramento manual de tickets." + botão "Criar motivo".
- Sem motivos + filtros ativos: "Nenhum motivo corresponde aos filtros." + "Limpar filtros".
- Erro de fetch: alerta + "Tentar novamente" (via `error.tsx`).

## 8. RBAC

- `lib/rbac.ts` — sem mudança. `/configuracoes/motivos-fechamento` cai no prefix `/configuracoes` que é ADMIN/SUPER_ADMIN only. AGENT/SUPERVISOR redirecionados pra `/atendimentos` pelo `app/(app)/configuracoes/layout.tsx`.
- Sidebar — `getVisibleSettingsSubItems(role)` já filtra pelo `canAccessRoute`; basta adicionar o item.

## 9. Testes (Vitest + RTL)

Foco em comportamento, não pixel:

1. **`close-reasons-table-view.test.tsx`** (4 testes)
   - Estado loading mostra skeletons.
   - Estado ready com items mostra lista.
   - Empty global vs empty filtrado renderizam textos diferentes.
   - Estado error mostra alerta.

2. **`close-reason-dialog.test.tsx`** (5 testes)
   - Create: submit envia `{ name, message, departmentIds }` na shape correta.
   - Edit: submit envia apenas campos dirty.
   - Validação Zod: `name` vazio bloqueia submit.
   - 409 `name` duplicado: `setError('name', data.message)`.
   - Multi-select de departamentos: checkbox toggle adiciona/remove do array.

3. **`close-reasons-table.test.tsx`** (2 testes — reorder)
   - Drag de uma row reordena lista local + chama `reorder({ orderedIds: ... })`.
   - 500/409 do reorder reverte ordem local + toast.

4. **`deactivate-close-reason-dialog.test.tsx`** (2 testes)
   - Confirma dispara mutation com `{ id }`.
   - Cancelar não chama mutation.

**Fora do escopo:** layout de cards, cores, strings exatas de toast.

## 10. Branch e PR

- Continua em `feat/sprint-1-4b-canais-ui` (mesma worktree de 1.4b).
- Justificativa: feature de auto-fechamento por inatividade do canal (1.4b) só é utilizável end-to-end com motivos cadastrados (1.4c). Mantém a sprint coesa em um único PR.
- PR final cobrirá "canais + motivos de fechamento" (~24 commits). Se PO preferir dividir em 2 PRs antes do push, faço o split.

## 11. Critério de aceite

- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` verdes.
- `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` zero diff.
- Fluxo manual (login ADMIN):
  - Sidebar mostra "Motivos de fechamento" sub Configurações.
  - Cria motivo "Atendido" sem departments → aparece na lista.
  - Edita motivo: adiciona 2 departments → submit envia só `{ departmentIds }`.
  - Cria motivo duplicado mesmo `name` → erro inline pt-BR no campo.
  - Drag de motivo da posição 3 pra 1 → lista re-ordenada + persistido (refresh mantém ordem nova).
  - Aplica filtro de busca → drag fica desabilitado com hint "Limpe os filtros para reordenar."
  - Desativa motivo → some da lista quando filtro=Ativos; aparece em Inativos com botão "Reativar".
  - Volta pra `/configuracoes/canais` → cria canal com timeout=30 → Select de Close Reason agora popula com os motivos criados.
- Login AGENT → não vê "Motivos de fechamento" na sidebar; rota direta redireciona pra `/atendimentos`.
