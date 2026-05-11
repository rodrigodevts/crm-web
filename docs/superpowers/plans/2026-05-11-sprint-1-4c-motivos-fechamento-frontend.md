# Sprint 1.4 Fase C — Tela `/configuracoes/motivos-fechamento` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a tela `/configuracoes/motivos-fechamento` com CRUD completo + drag-and-drop reorder, fechando o gap onde a UI de Motivos de Fechamento foi pulada nas Sprints 0.18-0.22 e desbloqueando o uso end-to-end da feature de auto-fechamento por inatividade do canal (Sprint 1.4 Fase B).

**Architecture:** Smart/View split idêntico a `components/tags/`. Tabela com toolbar (busca + filtro Ativos/Inativos), rows arrastáveis via `@dnd-kit/sortable` (handle visual + keyboard a11y, optimistic update, revert no erro). Dialog único create/edit com schema Zod local (3 fields com TODO documentado pra fases futuras). Mesma worktree que 1.4b — features são complementares e devem mergear juntas pra que auto-close seja utilizável.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, shadcn/ui, TanStack Query 5 via hooks Kubb, React Hook Form + Zod, sonner, @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities, Vitest + RTL.

---

## Spec coberto

[`docs/superpowers/specs/2026-05-11-sprint-1-4c-motivos-fechamento-design.md`](../specs/2026-05-11-sprint-1-4c-motivos-fechamento-design.md) — design aprovado em 2026-05-11.

## Pré-requisitos

- Estar no worktree `crm-web-sprint-1-4b/` (branch `feat/sprint-1-4b-canais-ui` — continua na mesma).
- `pnpm install` rodado (lefthook configurado).
- Sprint 1.4 Fase B já implementada (Tasks 0–10 do plano anterior).

---

## Task 0a: Fix crm-api — anotações OpenAPI de close-reasons

> **Por que essa task existe**: `close-reasons.controller.ts` usa `@ZodSerializerDto(...)` mas **não** declara `@ApiOkResponse({ type: ... })` / `@ApiCreatedResponse({ type: ... })`. Isso faz com que o Kubb no crm-web gere `CloseReasonsControllerList200 = unknown` / `CloseReasonsControllerFindById200 = unknown`. Departments + Tags têm essas anotações corretamente; só close-reasons ficou sem. CLAUDE.md §7.2 rule do crm-web ("Inventar tipo local porque o backend não expôs. Reporte como gap, não faça shim") obriga a fixar o backend.
>
> **Subagente deste task vai pedir autorização do PO** antes de fazer push do branch do crm-api (memory `feedback_no_push_until_validated`).

**Files:**

- Modify: `../crm-api/src/modules/close-reasons/controllers/close-reasons.controller.ts`

- [ ] **Step 1: Branch fix no crm-api a partir do main atualizado**

```bash
cd ../crm-api && git checkout main && git pull origin main --ff-only && git checkout -b fix/close-reasons-openapi-response-types
```

Expected: branch criada a partir do `main` mais recente (já tem `1eba7cd` do bootstrap fix mergeado).

- [ ] **Step 2: Adicionar decorators ao controller**

Editar `src/modules/close-reasons/controllers/close-reasons.controller.ts`:

1. No `import` de `@nestjs/swagger`, expandir pra incluir `ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse`:

```ts
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
```

2. Adicionar `@ApiCreatedResponse({ type: CloseReasonDetailResponseDto })` antes de `@ZodSerializerDto(CloseReasonDetailResponseDto)` no método `create`.

3. Adicionar `@ApiOkResponse({ type: CloseReasonListResponseDto })` antes de `@ZodSerializerDto(CloseReasonListResponseDto)` no método `list`.

4. Adicionar `@ApiNoContentResponse()` antes do `@HttpCode(204)` em `reorder`.

5. Adicionar `@ApiOkResponse({ type: CloseReasonDetailResponseDto })` antes de `@ZodSerializerDto(CloseReasonDetailResponseDto)` no método `findById`.

6. Adicionar `@ApiOkResponse({ type: CloseReasonDetailResponseDto })` antes de `@ZodSerializerDto(CloseReasonDetailResponseDto)` no método `update`.

7. Adicionar `@ApiNoContentResponse()` antes do `@HttpCode(204)` em `softDelete`.

Versão final do arquivo (substituir tudo):

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentCompany } from '@/common/decorators/current-company.decorator';
import { CreateCloseReasonDto } from '../schemas/create-close-reason.schema';
import { UpdateCloseReasonDto } from '../schemas/update-close-reason.schema';
import { ListCloseReasonsQueryDto } from '../schemas/list-close-reasons.schema';
import { ReorderCloseReasonsDto } from '../schemas/reorder-close-reasons.schema';
import { CloseReasonListResponseDto } from '../schemas/close-reason-response.schema';
import { CloseReasonDetailResponseDto } from '../schemas/close-reason-detail-response.schema';
import { CloseReasonsApplicationService } from '../services/close-reasons.application.service';

@ApiTags('close-reasons')
@Controller('close-reasons')
export class CloseReasonsController {
  constructor(private readonly app: CloseReasonsApplicationService) {}

  @Post()
  @Roles('ADMIN')
  @ApiCreatedResponse({ type: CloseReasonDetailResponseDto })
  @ZodSerializerDto(CloseReasonDetailResponseDto)
  async create(@Body() body: CreateCloseReasonDto, @CurrentCompany() companyId: string) {
    return this.app.create(body, companyId);
  }

  @Get()
  @ApiOkResponse({ type: CloseReasonListResponseDto })
  @ZodSerializerDto(CloseReasonListResponseDto)
  async list(@Query() query: ListCloseReasonsQueryDto, @CurrentCompany() companyId: string) {
    return this.app.list(companyId, query);
  }

  @Post('reorder')
  @Roles('ADMIN')
  @HttpCode(204)
  @ApiNoContentResponse()
  async reorder(
    @Body() body: ReorderCloseReasonsDto,
    @CurrentCompany() companyId: string,
  ): Promise<void> {
    await this.app.reorder(body, companyId);
  }

  @Get(':id')
  @ApiOkResponse({ type: CloseReasonDetailResponseDto })
  @ZodSerializerDto(CloseReasonDetailResponseDto)
  async findById(@Param('id', ParseUUIDPipe) id: string, @CurrentCompany() companyId: string) {
    return this.app.findById(id, companyId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOkResponse({ type: CloseReasonDetailResponseDto })
  @ZodSerializerDto(CloseReasonDetailResponseDto)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCloseReasonDto,
    @CurrentCompany() companyId: string,
  ) {
    return this.app.update(id, companyId, body);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(204)
  @ApiNoContentResponse()
  async softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCompany() companyId: string,
  ): Promise<void> {
    await this.app.softDelete(id, companyId);
  }
}
```

- [ ] **Step 3: Rodar suite de testes do crm-api**

```bash
cd ../crm-api && pnpm test && pnpm test:e2e
```

Expected: todos verdes (não modificamos lógica, só decorators de doc). O teste `test/e2e/openapi-bootstrap.e2e-spec.ts` continua passando (close-reasons já estavam no doc; só não tinham tipos linkados).

- [ ] **Step 4: Validar via curl que tipos aparecem no OpenAPI agora**

```bash
cd ../crm-api && pnpm start:dev &
# aguardar API listening
until curl -s http://localhost:3000/health > /dev/null; do sleep 2; done
curl -s http://localhost:3000/api/v1/openapi.json | grep -A 2 '"CloseReasonsController_list"' | head -10
pkill -f 'pnpm start:dev'
```

Expected: linha com `"$ref": "#/components/schemas/CloseReasonListResponseDto"` aparece nos responses do operationId `CloseReasonsController_list`.

- [ ] **Step 5: Commit no crm-api**

```bash
cd ../crm-api && git add src/modules/close-reasons/controllers/close-reasons.controller.ts && git commit -m "fix(close-reasons): adiciona Api*Response decorators pra OpenAPI gerar tipos corretos

@ZodSerializerDto sozinho não enriquece o doc OpenAPI — sem o
@ApiOkResponse({ type: ... }) pareado, o Kubb no crm-web gera o tipo
como 'unknown'. Adiciona Api*Response em todos os 6 endpoints,
alinhando close-reasons com o pattern já estabelecido em departments
e tags.

Sem mudança de comportamento — apenas metadata de doc."
```

- [ ] **Step 6: PARAR e pedir autorização do PO antes do push**

Reportar como **NEEDS_CONTEXT** com a mensagem:

> "Task 0a do crm-api pronto e commitado localmente em `fix/close-reasons-openapi-response-types`. Diff: 1 arquivo, ~6 decorators adicionados, sem mudança de comportamento. Tests verdes. Autorização pra fazer `git push -u origin fix/close-reasons-openapi-response-types && gh pr create ...`? Aguardando aprovação antes de avançar pro Task 0b (regenerar snapshot no crm-web)."

---

## Task 0b: Regenerar snapshot OpenAPI no crm-web + remover stale cast

> **Pré-requisito:** Task 0a mergeada em `main` do crm-api (autorização do PO).

**Files:**

- Modify: `openapi.snapshot.json`
- Modify: `lib/generated/**` (regenerado)
- Modify: `components/channels/channel-dialog.tsx` (remove `as` cast stale)

- [ ] **Step 1: Sincronizar crm-api main local**

```bash
cd ../crm-api && git checkout main && git pull origin main --ff-only && git log --oneline -1
```

Expected: HEAD inclui o commit do Task 0a.

- [ ] **Step 2: Subir crm-api e atualizar snapshot**

```bash
cd ../crm-api && pnpm start:dev
```

Em outro shell, no worktree `crm-web-sprint-1-4b`:

```bash
until curl -s http://localhost:3000/health > /dev/null; do sleep 2; done
curl -s http://localhost:3000/api/v1/openapi.json | node -e "process.stdin.pipe(require('fs').createWriteStream('openapi.snapshot.json'))"
pnpm generate:api:from-snapshot
```

Após terminar: `pkill -f 'pnpm start:dev'`.

- [ ] **Step 3: Validar que `CloseReasonsControllerList200` agora é tipado**

```bash
grep 'CloseReasonsControllerList200' lib/generated/types/CloseReasonsControllerList.ts | head -3
```

Expected: linha com `export type CloseReasonsControllerList200 = CloseReasonListResponseDto` (não mais `unknown`).

E `CloseReasonListResponseDto.ts` deve agora existir em `lib/generated/types/`:

```bash
ls lib/generated/types/CloseReasonListResponseDto.ts lib/generated/types/CloseReasonResponseDto.ts lib/generated/types/CloseReasonDetailResponseDto.ts
```

Expected: 3 arquivos listados (nenhum "No such file").

- [ ] **Step 4: Remover o `as` cast stale em channel-dialog.tsx**

Abrir `components/channels/channel-dialog.tsx`, localizar o bloco:

```tsx
// O endpoint /close-reasons retorna `unknown` no OpenAPI (gap do backend — schema
// ainda não definido). Tipamos localmente o shape mínimo que consumimos aqui.
// TODO: remover quando o backend expuser CloseReasonListResponseDto.
const closeReasons = useCloseReasonsControllerList(undefined, {
  client: { client: apiClient },
}) as { data?: { items?: ReadonlyArray<{ id: string; name: string }> } };
```

Substituir por:

```tsx
const closeReasons = useCloseReasonsControllerList(undefined, {
  client: { client: apiClient },
});
```

(remove o comentário e o cast — o tipo agora vem corretamente).

- [ ] **Step 5: Typecheck + tests de regressão**

```bash
pnpm typecheck && pnpm test components/channels/
```

Expected: 0 errors typecheck, 23/23 tests dos channels passam (mock dos hooks no `channel-dialog.test.tsx` continua compatível — só removemos o cast).

- [ ] **Step 6: Commit**

```bash
git add openapi.snapshot.json lib/generated components/channels/channel-dialog.tsx
git commit -m "chore(sprint-1-4c): sincroniza OpenAPI snapshot com close-reasons tipado + remove stale cast"
```

---

## Task 1: Instalar deps de drag-and-drop

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Instalar `@dnd-kit`**

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: 3 packages adicionados, lockfile atualizado. Versões esperadas (no commit): `@dnd-kit/core@6+`, `@dnd-kit/sortable@8+`, `@dnd-kit/utilities@3+`.

- [ ] **Step 2: Confirmar versões no package.json**

```bash
grep '@dnd-kit' package.json
```

Expected: 3 linhas em `dependencies`.

- [ ] **Step 3: Verificar tipos**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(sprint-1-4c): adiciona @dnd-kit/core+sortable+utilities pra reorder de motivos"
```

---

## Task 2: `close-reason-form-schema.ts` (sem teste — schema puro)

**Files:**

- Create: `components/close-reasons/close-reason-form-schema.ts`

- [ ] **Step 1: Criar schema**

```ts
// components/close-reasons/close-reason-form-schema.ts
import { z } from 'zod';

// TODO Fase 2 (composer): adicionar `asksDealValue: z.boolean()` quando o
//   composer com valor de venda aparecer no fechamento de ticket.
// TODO Fase 4 (CSAT): adicionar `triggersCsat: z.boolean()` quando o fluxo
//   de pesquisa de satisfação for implementado.
// TODO Fase 4+ (SalesFunnel): adicionar `funnelId: z.string().uuid().nullable()`
//   quando o modelo SalesFunnel existir no produto.
// Backend (crm-api/src/modules/close-reasons/schemas/create-close-reason.schema.ts)
// já aceita os 3 campos com defaults — só falta expor no form.

export const closeReasonFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Máximo 100 caracteres'),
  message: z.string().trim().max(2000, 'Máximo 2000 caracteres').nullable(),
  departmentIds: z.array(z.string().uuid()).max(50, 'Máximo 50 departamentos').default([]),
  active: z.boolean(),
});

export type CloseReasonFormValues = z.infer<typeof closeReasonFormSchema>;
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit (junta com Task 3 que vai usar este schema — não commitar sozinho)**

Não commitar agora — schema é dependência da Task 3.

---

## Task 3: `DeactivateCloseReasonDialog` + teste (TDD)

AlertDialog confirma soft delete. Espelha `DeactivateDepartmentDialog`.

**Files:**

- Create: `components/close-reasons/deactivate-close-reason-dialog.tsx`
- Create: `components/close-reasons/deactivate-close-reason-dialog.test.tsx`

- [ ] **Step 1: Teste primeiro**

```tsx
// components/close-reasons/deactivate-close-reason-dialog.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DeactivateCloseReasonDialog } from './deactivate-close-reason-dialog';

const reason = { id: 'r1', name: 'Atendido' } as const;

describe('DeactivateCloseReasonDialog', () => {
  it('mostra título com o nome do motivo e dispara onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DeactivateCloseReasonDialog
        reason={reason}
        open
        submitting={false}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('heading', { name: /desativar motivo "atendido"/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^desativar$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancelar não chama onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <DeactivateCloseReasonDialog
        reason={reason}
        open
        submitting={false}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Rodar — DEVE FALHAR**

```bash
pnpm test components/close-reasons/deactivate-close-reason-dialog.test.tsx
```

Expected: FAIL — `Cannot find module './deactivate-close-reason-dialog'`.

- [ ] **Step 3: Implementar**

```tsx
// components/close-reasons/deactivate-close-reason-dialog.tsx
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface DeactivateCloseReasonDialogProps {
  reason: { id: string; name: string };
  open: boolean;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeactivateCloseReasonDialog({
  reason,
  open,
  submitting,
  onConfirm,
  onClose,
}: DeactivateCloseReasonDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Desativar motivo "${reason.name}"?`}</AlertDialogTitle>
          <AlertDialogDescription>
            O motivo deixa de aparecer no fechamento de tickets e no auto-fechamento de canais.
            Tickets já fechados com este motivo continuam preservados. Você pode reativá-lo a
            qualquer momento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={submitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Desativar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 4: Rodar — DEVE PASSAR**

```bash
pnpm test components/close-reasons/deactivate-close-reason-dialog.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit (junto com schema da Task 2)**

```bash
git add components/close-reasons/close-reason-form-schema.ts components/close-reasons/deactivate-close-reason-dialog.tsx components/close-reasons/deactivate-close-reason-dialog.test.tsx
git commit -m "feat(close-reasons): adiciona schema Zod local + DeactivateCloseReasonDialog"
```

---

## Task 4: `CloseReasonDialog` + teste (TDD)

Dialog único create/edit. RHF + zodResolver. Multi-select de departments por checkbox inline.

**Files:**

- Create: `components/close-reasons/close-reason-dialog.tsx`
- Create: `components/close-reasons/close-reason-dialog.test.tsx`

- [ ] **Step 1: Teste primeiro**

```tsx
// components/close-reasons/close-reason-dialog.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const createMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock('@/lib/generated/hooks/useCloseReasonsControllerCreate', () => ({
  useCloseReasonsControllerCreate: () => ({ mutateAsync: createMutate, isPending: false }),
  closeReasonsControllerCreateMutationKey: () => ['close-reasons', 'create'],
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerUpdate', () => ({
  useCloseReasonsControllerUpdate: () => ({ mutateAsync: updateMutate, isPending: false }),
  closeReasonsControllerUpdateMutationKey: () => ['close-reasons', 'update'],
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerList', () => ({
  closeReasonsControllerListQueryKey: () => ['close-reasons', 'list'],
}));
vi.mock('@/lib/generated/hooks/useDepartmentsControllerList', () => ({
  useDepartmentsControllerList: () => ({
    data: {
      items: [
        { id: '00000000-0000-4000-8000-000000000001', name: 'Suporte', active: true },
        { id: '00000000-0000-4000-8000-000000000002', name: 'Vendas', active: true },
      ],
      pagination: { hasMore: false, nextCursor: null },
    },
    isLoading: false,
  }),
  departmentsControllerListQueryKey: () => ['departments', 'list'],
}));

import { CloseReasonDialog } from './close-reason-dialog';

const existing = {
  id: 'r1',
  companyId: 'c1',
  name: 'Atendido',
  message: 'Obrigado pelo contato!',
  active: true,
  sortOrder: 0,
  triggersCsat: false,
  asksDealValue: false,
  funnelId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  departments: [{ id: '00000000-0000-4000-8000-000000000001', name: 'Suporte' }],
};

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  createMutate.mockReset();
  updateMutate.mockReset();
});

describe('CloseReasonDialog', () => {
  it('create: submit envia { name, message, departmentIds }', async () => {
    const user = userEvent.setup();
    createMutate.mockResolvedValue({ id: 'new' });
    renderWithProviders(<CloseReasonDialog mode="create" reason={null} open onClose={vi.fn()} />);
    await user.type(screen.getByLabelText(/nome/i), 'Sem retorno');
    await user.type(screen.getByLabelText(/mensagem/i), 'Caso resolvido por inatividade.');
    await user.click(screen.getByRole('checkbox', { name: /suporte/i }));
    await user.click(screen.getByRole('button', { name: /criar motivo/i }));
    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    const arg = createMutate.mock.calls[0][0];
    expect(arg.data).toMatchObject({
      name: 'Sem retorno',
      message: 'Caso resolvido por inatividade.',
      departmentIds: ['00000000-0000-4000-8000-000000000001'],
    });
  });

  it('edit: submit envia apenas dirty fields', async () => {
    const user = userEvent.setup();
    updateMutate.mockResolvedValue({});
    renderWithProviders(<CloseReasonDialog mode="edit" reason={existing} open onClose={vi.fn()} />);
    const name = screen.getByLabelText(/nome/i);
    await user.clear(name);
    await user.type(name, 'Atendimento concluído');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const arg = updateMutate.mock.calls[0][0];
    expect(arg.id).toBe('r1');
    expect(arg.data).toEqual({ name: 'Atendimento concluído' });
  });

  it('Zod: name vazio bloqueia submit e exibe erro', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CloseReasonDialog mode="create" reason={null} open onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /criar motivo/i }));
    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it('409 (nome duplicado) mapeia pra erro inline no campo name', async () => {
    const user = userEvent.setup();
    createMutate.mockRejectedValue({
      response: { status: 409, data: { message: 'Já existe motivo com este nome.' } },
    });
    renderWithProviders(<CloseReasonDialog mode="create" reason={null} open onClose={vi.fn()} />);
    await user.type(screen.getByLabelText(/nome/i), 'Atendido');
    await user.click(screen.getByRole('button', { name: /criar motivo/i }));
    expect(await screen.findByText(/já existe motivo com este nome/i)).toBeInTheDocument();
  });

  it('multi-select de departamentos: toggle adiciona e remove do array submetido', async () => {
    const user = userEvent.setup();
    createMutate.mockResolvedValue({ id: 'new' });
    renderWithProviders(<CloseReasonDialog mode="create" reason={null} open onClose={vi.fn()} />);
    await user.type(screen.getByLabelText(/nome/i), 'Test');
    const suporte = screen.getByRole('checkbox', { name: /suporte/i });
    const vendas = screen.getByRole('checkbox', { name: /vendas/i });
    await user.click(suporte);
    await user.click(vendas);
    await user.click(suporte); // toggle off
    await user.click(screen.getByRole('button', { name: /criar motivo/i }));
    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    const arg = createMutate.mock.calls[0][0];
    expect(arg.data.departmentIds).toEqual(['00000000-0000-4000-8000-000000000002']);
  });
});
```

- [ ] **Step 2: Rodar — DEVE FALHAR**

```bash
pnpm test components/close-reasons/close-reason-dialog.test.tsx
```

Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar CloseReasonDialog**

```tsx
// components/close-reasons/close-reason-dialog.tsx
'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import {
  useCloseReasonsControllerCreate,
  closeReasonsControllerCreateMutationKey,
} from '@/lib/generated/hooks/useCloseReasonsControllerCreate';
import {
  useCloseReasonsControllerUpdate,
  closeReasonsControllerUpdateMutationKey,
} from '@/lib/generated/hooks/useCloseReasonsControllerUpdate';
import { closeReasonsControllerListQueryKey } from '@/lib/generated/hooks/useCloseReasonsControllerList';
import { useDepartmentsControllerList } from '@/lib/generated/hooks/useDepartmentsControllerList';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { closeReasonFormSchema, type CloseReasonFormValues } from './close-reason-form-schema';

// Shape mínimo do CloseReason que o dialog consome (matcheia o
// CloseReasonDetailResponseDto do backend após Task 0).
export interface CloseReasonForDialog {
  id: string;
  name: string;
  message: string | null;
  active: boolean;
  departments: ReadonlyArray<{ id: string; name: string }>;
}

export interface CloseReasonDialogProps {
  mode: 'create' | 'edit';
  reason: CloseReasonForDialog | null;
  open: boolean;
  onClose: () => void;
}

const EMPTY_VALUES: CloseReasonFormValues = {
  name: '',
  message: null,
  departmentIds: [],
  active: true,
};

function toFormValues(reason: CloseReasonForDialog | null): CloseReasonFormValues {
  if (!reason) return EMPTY_VALUES;
  return {
    name: reason.name,
    message: reason.message,
    departmentIds: reason.departments.map((d) => d.id),
    active: reason.active,
  };
}

type AxiosErrorShape = {
  response?: { status?: number; data?: { message?: string } };
};

export function CloseReasonDialog({ mode, reason, open, onClose }: CloseReasonDialogProps) {
  const queryClient = useQueryClient();

  const departments = useDepartmentsControllerList(
    { limit: 100, active: true },
    { client: { client: apiClient } },
  );

  const createMutation = useCloseReasonsControllerCreate({
    client: { client: apiClient },
    mutation: { mutationKey: closeReasonsControllerCreateMutationKey() },
  });
  const updateMutation = useCloseReasonsControllerUpdate({
    client: { client: apiClient },
    mutation: { mutationKey: closeReasonsControllerUpdateMutationKey() },
  });

  const form = useForm<CloseReasonFormValues>({
    resolver: zodResolver(closeReasonFormSchema),
    defaultValues: toFormValues(reason),
  });

  useEffect(() => {
    form.reset(toFormValues(reason));
  }, [reason, form]);

  function invalidate() {
    void queryClient.invalidateQueries({
      queryKey: closeReasonsControllerListQueryKey(),
      exact: false,
    });
  }

  function mapError(err: unknown): void {
    const e = err as AxiosErrorShape;
    const status = e?.response?.status;
    const msg = e?.response?.data?.message;
    if (status === 409 && typeof msg === 'string') {
      form.setError('name', { message: msg });
      return;
    }
    if (typeof msg === 'string') {
      toast.error(msg);
      return;
    }
    toast.error('Não foi possível salvar o motivo. Tente novamente.');
  }

  async function onSubmit(values: CloseReasonFormValues) {
    if (mode === 'create') {
      try {
        await createMutation.mutateAsync({
          data: {
            name: values.name,
            message: values.message,
            departmentIds: values.departmentIds,
          },
        });
        toast.success('Motivo criado.');
        invalidate();
        onClose();
      } catch (err) {
        mapError(err);
      }
      return;
    }

    if (!reason) return;
    const dirty = form.formState.dirtyFields as Partial<Record<keyof CloseReasonFormValues, true>>;
    const data: Record<string, unknown> = {};
    if (dirty.name) data.name = values.name;
    if (dirty.message) data.message = values.message;
    if (dirty.departmentIds) data.departmentIds = values.departmentIds;
    if (dirty.active) data.active = values.active;

    if (Object.keys(data).length === 0) {
      onClose();
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: reason.id, data });
      toast.success('Motivo atualizado.');
      invalidate();
      onClose();
    } catch (err) {
      mapError(err);
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending;
  const departmentItems = departments.data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Novo motivo' : 'Editar motivo'}</DialogTitle>
          <DialogDescription>
            Motivos de fechamento aparecem ao encerrar tickets e podem ser usados no auto-fechamento
            de canais.
          </DialogDescription>
        </DialogHeader>

        <form
          id="close-reason-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <Field>
            <FieldLabel htmlFor="cr-name" required>
              Nome
            </FieldLabel>
            <Input
              id="cr-name"
              {...form.register('name')}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <FieldError>{form.formState.errors.name.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="cr-message">Mensagem automática</FieldLabel>
            <Controller
              control={form.control}
              name="message"
              render={({ field }) => (
                <Textarea
                  id="cr-message"
                  rows={3}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v.length === 0 ? null : v);
                  }}
                  onBlur={field.onBlur}
                  aria-invalid={!!form.formState.errors.message}
                />
              )}
            />
            <FieldDescription>
              Enviada ao contato antes do fechamento automático por inatividade. Opcional.
            </FieldDescription>
            {form.formState.errors.message && (
              <FieldError>{form.formState.errors.message.message}</FieldError>
            )}
          </Field>

          <fieldset className="border-border flex flex-col gap-2 rounded-md border p-4">
            <legend className="text-foreground px-1 text-sm font-medium">Departamentos</legend>
            <p className="text-muted-foreground text-xs">
              Se nenhum for selecionado, o motivo aparece para todos os departamentos.
            </p>
            <Controller
              control={form.control}
              name="departmentIds"
              render={({ field }) => (
                <div className="mt-2 flex flex-col gap-2">
                  {departmentItems.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhum departamento ativo.</p>
                  ) : (
                    departmentItems.map((d) => {
                      const checked = field.value.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          htmlFor={`cr-dept-${d.id}`}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={`cr-dept-${d.id}`}
                            checked={checked}
                            onCheckedChange={(c) => {
                              if (c === true) field.onChange([...field.value, d.id]);
                              else field.onChange(field.value.filter((id) => id !== d.id));
                            }}
                          />
                          <span className="text-foreground text-sm">{d.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            />
          </fieldset>

          {mode === 'edit' && (
            <Field>
              <Controller
                control={form.control}
                name="active"
                render={({ field }) => (
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(c) => field.onChange(c === true)}
                    />
                    <Label className="cursor-pointer">Motivo ativo</Label>
                  </label>
                )}
              />
              <FieldDescription>Motivos inativos não aparecem em selects.</FieldDescription>
            </Field>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="close-reason-form" disabled={submitting}>
            {submitting ? 'Salvando…' : mode === 'create' ? 'Criar motivo' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Rodar — DEVE PASSAR**

```bash
pnpm test components/close-reasons/close-reason-dialog.test.tsx
```

Expected: PASS (5 tests).

> **Common pitfall**: se o shadcn `Checkbox` não atender `getByRole('checkbox', { name: ... })`, é porque o label não está conectado via `htmlFor`. Confirme que cada `<label htmlFor>` aponta pro `id` do `<Checkbox>`. Não relaxe o teste.

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add components/close-reasons/close-reason-dialog.tsx components/close-reasons/close-reason-dialog.test.tsx
git commit -m "feat(close-reasons): adiciona CloseReasonDialog (create/edit + multi-select departments)"
```

---

## Task 5: `CloseReasonDialogTrigger` (sem teste — wrapper simples)

Botão "Novo motivo" que mantém o próprio state de `open` e renderiza o dialog em modo create. Espelha `TagDialogTrigger`.

**Files:**

- Create: `components/close-reasons/close-reason-dialog-trigger.tsx`

- [ ] **Step 1: Implementar**

```tsx
// components/close-reasons/close-reason-dialog-trigger.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CloseReasonDialog } from './close-reason-dialog';

export function CloseReasonDialogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        Novo motivo
      </Button>
      <CloseReasonDialog mode="create" reason={null} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Não commitar isolado — depende da Task 6 (row) pra typecheck do trigger ser útil**

Continuar pra Task 6.

---

## Task 6: `CloseReasonRow` (sem teste — visual)

Uma row da tabela: drag handle + colunas + dropdown de ações. Usa `useSortable` do `@dnd-kit/sortable`.

**Files:**

- Create: `components/close-reasons/close-reason-row.tsx`

- [ ] **Step 1: Implementar**

```tsx
// components/close-reasons/close-reason-row.tsx
'use client';

import { GripVerticalIcon, MoreVerticalIcon } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { CloseReasonForDialog } from './close-reason-dialog';

export interface CloseReasonListItem extends CloseReasonForDialog {
  sortOrder: number;
}

export interface CloseReasonRowProps {
  reason: CloseReasonListItem;
  dragDisabled: boolean;
  onEdit: (r: CloseReasonListItem) => void;
  onDeactivate: (r: CloseReasonListItem) => void;
  onReactivate: (r: CloseReasonListItem) => void;
}

function summarizeDepartments(departments: ReadonlyArray<{ id: string; name: string }>): string {
  if (departments.length === 0) return 'Todos';
  if (departments.length <= 3) return departments.map((d) => d.name).join(', ');
  const first = departments
    .slice(0, 2)
    .map((d) => d.name)
    .join(', ');
  return `${first} e mais ${departments.length - 2}`;
}

export function CloseReasonRow({
  reason,
  dragDisabled,
  onEdit,
  onDeactivate,
  onReactivate,
}: CloseReasonRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: reason.id,
    disabled: dragDisabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} data-testid={`close-reason-row-${reason.id}`}>
      <TableCell className="w-10 align-middle">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reordenar ${reason.name}`}
          disabled={dragDisabled}
          className={cn(
            'text-muted-foreground inline-flex size-8 items-center justify-center rounded-md',
            'hover:bg-muted hover:text-foreground',
            'disabled:cursor-not-allowed disabled:opacity-40',
            !dragDisabled && 'cursor-grab active:cursor-grabbing',
          )}
        >
          <GripVerticalIcon className="size-4" aria-hidden="true" />
        </button>
      </TableCell>
      <TableCell className="font-medium">{reason.name}</TableCell>
      <TableCell className="text-muted-foreground max-w-[20rem] truncate">
        {reason.message ?? '—'}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {summarizeDepartments(reason.departments)}
      </TableCell>
      <TableCell>
        <Badge variant={reason.active ? 'default' : 'outline'}>
          {reason.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Ações do motivo ${reason.name}`}>
              <MoreVerticalIcon className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(reason)}>Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            {reason.active ? (
              <DropdownMenuItem variant="destructive" onSelect={() => onDeactivate(reason)}>
                Desativar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onReactivate(reason)}>Reativar</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit (junta Tasks 5 + 6)**

```bash
git add components/close-reasons/close-reason-dialog-trigger.tsx components/close-reasons/close-reason-row.tsx
git commit -m "feat(close-reasons): adiciona CloseReasonDialogTrigger e CloseReasonRow (drag handle)"
```

---

## Task 7: `CloseReasonsTableView` + teste (TDD)

Wrapper visual: estados loading/empty/error + container do `DndContext` + lista de rows. Recebe items + callbacks; sem mutations.

**Files:**

- Create: `components/close-reasons/close-reasons-table-view.tsx`
- Create: `components/close-reasons/close-reasons-table-view.test.tsx`

- [ ] **Step 1: Teste primeiro**

```tsx
// components/close-reasons/close-reasons-table-view.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CloseReasonsTableView } from './close-reasons-table-view';

const noop = vi.fn();

describe('CloseReasonsTableView', () => {
  it('estado loading mostra skeletons', () => {
    render(
      <CloseReasonsTableView
        state="loading"
        items={[]}
        dragDisabled
        onEdit={noop}
        onDeactivate={noop}
        onReactivate={noop}
        onReorder={noop}
        onClearFilters={noop}
        hasFilters={false}
      />,
    );
    expect(screen.getAllByTestId('close-reason-skeleton').length).toBeGreaterThanOrEqual(3);
  });

  it('empty global mostra mensagem e CTA', () => {
    render(
      <CloseReasonsTableView
        state="ready"
        items={[]}
        dragDisabled
        onEdit={noop}
        onDeactivate={noop}
        onReactivate={noop}
        onReorder={noop}
        onClearFilters={noop}
        hasFilters={false}
      />,
    );
    expect(screen.getByText(/nenhum motivo de fechamento cadastrado/i)).toBeInTheDocument();
  });

  it('empty filtrado mostra mensagem diferente e botão Limpar filtros', () => {
    render(
      <CloseReasonsTableView
        state="ready"
        items={[]}
        dragDisabled
        onEdit={noop}
        onDeactivate={noop}
        onReactivate={noop}
        onReorder={noop}
        onClearFilters={noop}
        hasFilters
      />,
    );
    expect(screen.getByText(/nenhum motivo corresponde aos filtros/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
  });

  it('estado error mostra alerta', () => {
    render(
      <CloseReasonsTableView
        state="error"
        items={[]}
        dragDisabled
        onEdit={noop}
        onDeactivate={noop}
        onReactivate={noop}
        onReorder={noop}
        onClearFilters={noop}
        hasFilters={false}
      />,
    );
    expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar — DEVE FALHAR**

```bash
pnpm test components/close-reasons/close-reasons-table-view.test.tsx
```

Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

```tsx
// components/close-reasons/close-reasons-table-view.tsx
'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CloseReasonRow, type CloseReasonListItem } from './close-reason-row';

export type CloseReasonsTableState = 'loading' | 'ready' | 'error';

export interface CloseReasonsTableViewProps {
  state: CloseReasonsTableState;
  items: ReadonlyArray<CloseReasonListItem>;
  dragDisabled: boolean;
  hasFilters: boolean;
  onEdit: (r: CloseReasonListItem) => void;
  onDeactivate: (r: CloseReasonListItem) => void;
  onReactivate: (r: CloseReasonListItem) => void;
  onReorder: (orderedIds: string[]) => void;
  onClearFilters: () => void;
}

export function CloseReasonsTableView({
  state,
  items,
  dragDisabled,
  hasFilters,
  onEdit,
  onDeactivate,
  onReactivate,
  onReorder,
  onClearFilters,
}: CloseReasonsTableViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (state === 'loading') {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} data-testid="close-reason-skeleton" className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="border-destructive/40 bg-destructive/10 rounded-md border p-6 text-center">
        <p className="text-foreground text-sm">Não foi possível carregar os motivos.</p>
      </div>
    );
  }

  if (items.length === 0 && !hasFilters) {
    return (
      <div className="border-border flex flex-col items-center gap-3 rounded-md border p-12 text-center">
        <p className="text-foreground text-base font-medium">
          Nenhum motivo de fechamento cadastrado.
        </p>
        <p className="text-muted-foreground text-sm">
          Crie motivos para usar no auto-fechamento de canais e no encerramento manual de tickets.
        </p>
      </div>
    );
  }

  if (items.length === 0 && hasFilters) {
    return (
      <div className="border-border flex flex-col items-center gap-3 rounded-md border p-12 text-center">
        <p className="text-foreground text-base font-medium">
          Nenhum motivo corresponde aos filtros.
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      </div>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...items];
    const [moved] = next.splice(oldIndex, 1);
    if (!moved) return;
    next.splice(newIndex, 0, moved);
    onReorder(next.map((r) => r.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Nome</TableHead>
            <TableHead>Mensagem</TableHead>
            <TableHead>Departamentos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((reason) => (
              <CloseReasonRow
                key={reason.id}
                reason={reason}
                dragDisabled={dragDisabled}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
                onReactivate={onReactivate}
              />
            ))}
          </SortableContext>
        </TableBody>
      </Table>
    </DndContext>
  );
}
```

- [ ] **Step 4: Rodar — DEVE PASSAR**

```bash
pnpm test components/close-reasons/close-reasons-table-view.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/close-reasons/close-reasons-table-view.tsx components/close-reasons/close-reasons-table-view.test.tsx
git commit -m "feat(close-reasons): adiciona CloseReasonsTableView com DndContext e estados"
```

---

## Task 8: `CloseReasonsTable` (smart) + teste do reorder

Container: data + toolbar (search + filtro Ativos/Inativos) + mutations (update p/ reativar, reorder). Sem teste isolado adicional além do reorder.

**Files:**

- Create: `components/close-reasons/close-reasons-table.tsx`
- Create: `components/close-reasons/close-reasons-table.test.tsx`

- [ ] **Step 1: Teste do reorder primeiro**

```tsx
// components/close-reasons/close-reasons-table.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const reorderMutate = vi.fn();

vi.mock('@/lib/generated/hooks/useCloseReasonsControllerList', () => ({
  useCloseReasonsControllerList: () => ({
    data: {
      items: [
        {
          id: 'r1',
          name: 'Atendido',
          message: null,
          active: true,
          sortOrder: 0,
          departments: [],
        },
        {
          id: 'r2',
          name: 'Sem retorno',
          message: null,
          active: true,
          sortOrder: 1,
          departments: [],
        },
        {
          id: 'r3',
          name: 'Sem mensagem',
          message: null,
          active: true,
          sortOrder: 2,
          departments: [],
        },
      ],
      pagination: { hasMore: false, nextCursor: null },
    },
    isPending: false,
    isError: false,
  }),
  closeReasonsControllerListQueryKey: () => ['close-reasons', 'list'],
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerUpdate', () => ({
  useCloseReasonsControllerUpdate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  closeReasonsControllerUpdateMutationKey: () => ['close-reasons', 'update'],
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerSoftDelete', () => ({
  useCloseReasonsControllerSoftDelete: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerReorder', () => ({
  useCloseReasonsControllerReorder: () => ({ mutateAsync: reorderMutate, isPending: false }),
  closeReasonsControllerReorderMutationKey: () => ['close-reasons', 'reorder'],
}));

import { CloseReasonsTable } from './close-reasons-table';

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  reorderMutate.mockReset();
});

describe('CloseReasonsTable', () => {
  it('renderiza 3 rows de motivos', () => {
    renderWithProviders(<CloseReasonsTable />);
    expect(screen.getByText('Atendido')).toBeInTheDocument();
    expect(screen.getByText('Sem retorno')).toBeInTheDocument();
    expect(screen.getByText('Sem mensagem')).toBeInTheDocument();
  });

  it('hint "Limpe os filtros" aparece quando search está preenchido', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    renderWithProviders(<CloseReasonsTable />);
    await user.type(screen.getByLabelText(/buscar/i), 'A');
    await waitFor(() => {
      expect(screen.getByText(/limpe os filtros para reordenar/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Rodar — DEVE FALHAR**

```bash
pnpm test components/close-reasons/close-reasons-table.test.tsx
```

Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `CloseReasonsTable`**

```tsx
// components/close-reasons/close-reasons-table.tsx
'use client';

import { useDeferredValue, useEffect, useId, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import {
  useCloseReasonsControllerList,
  closeReasonsControllerListQueryKey,
} from '@/lib/generated/hooks/useCloseReasonsControllerList';
import { useCloseReasonsControllerUpdate } from '@/lib/generated/hooks/useCloseReasonsControllerUpdate';
import { useCloseReasonsControllerSoftDelete } from '@/lib/generated/hooks/useCloseReasonsControllerSoftDelete';
import {
  useCloseReasonsControllerReorder,
  closeReasonsControllerReorderMutationKey,
} from '@/lib/generated/hooks/useCloseReasonsControllerReorder';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CloseReasonsTableView } from './close-reasons-table-view';
import { CloseReasonDialog } from './close-reason-dialog';
import { DeactivateCloseReasonDialog } from './deactivate-close-reason-dialog';
import type { CloseReasonListItem } from './close-reason-row';

type StatusFilter = 'active' | 'inactive';

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
];

export function CloseReasonsTable() {
  const filterId = useId();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<StatusFilter>('active');

  const [editTarget, setEditTarget] = useState<CloseReasonListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<CloseReasonListItem | null>(null);

  const params = useMemo(
    () => ({
      limit: 100,
      sort: 'sortOrder' as const,
      active: status === 'active',
      ...(deferredSearch.trim().length > 0 ? { search: deferredSearch.trim() } : {}),
    }),
    [deferredSearch, status],
  );

  const query = useCloseReasonsControllerList(params, { client: { client: apiClient } });

  const update = useCloseReasonsControllerUpdate({ client: { client: apiClient } });
  const softDelete = useCloseReasonsControllerSoftDelete({ client: { client: apiClient } });
  const reorder = useCloseReasonsControllerReorder({
    client: { client: apiClient },
    mutation: { mutationKey: closeReasonsControllerReorderMutationKey() },
  });

  const serverItems = (query.data?.items ?? []) as CloseReasonListItem[];

  // Lista local pra optimistic update de reorder.
  const [localItems, setLocalItems] = useState<CloseReasonListItem[]>(serverItems);
  useEffect(() => {
    setLocalItems(serverItems);
  }, [serverItems]);

  const hasFilters = deferredSearch.trim().length > 0 || status === 'inactive';
  const dragDisabled = hasFilters || reorder.isPending;
  const state = query.isPending ? 'loading' : query.isError ? 'error' : 'ready';

  function invalidate() {
    void queryClient.invalidateQueries({
      queryKey: closeReasonsControllerListQueryKey(),
      exact: false,
    });
  }

  async function handleReorder(orderedIds: string[]) {
    const original = localItems;
    const byId = new Map(localItems.map((r) => [r.id, r]));
    const next = orderedIds
      .map((id) => byId.get(id))
      .filter((r): r is CloseReasonListItem => r !== undefined);
    setLocalItems(next);

    try {
      await reorder.mutateAsync({ data: { orderedIds } });
      invalidate();
    } catch {
      setLocalItems(original);
      toast.error('Não foi possível reordenar.');
    }
  }

  async function handleReactivate(reason: CloseReasonListItem) {
    try {
      await update.mutateAsync({ id: reason.id, data: { active: true } });
      toast.success(`Motivo "${reason.name}" reativado.`);
      invalidate();
    } catch {
      toast.error('Não foi possível reativar o motivo.');
    }
  }

  async function handleDeactivateConfirm() {
    if (!deactivateTarget) return;
    try {
      await softDelete.mutateAsync({ id: deactivateTarget.id });
      toast.success(`Motivo "${deactivateTarget.name}" desativado.`);
      invalidate();
      setDeactivateTarget(null);
    } catch {
      toast.error('Não foi possível desativar o motivo.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor={`${filterId}-search`} className="sr-only">
          Buscar por nome
        </Label>
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            id={`${filterId}-search`}
            type="search"
            placeholder="Buscar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>

        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-40" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {dragDisabled && hasFilters && (
        <p className="text-muted-foreground text-xs">Limpe os filtros para reordenar.</p>
      )}

      <CloseReasonsTableView
        state={state}
        items={localItems}
        dragDisabled={dragDisabled}
        hasFilters={hasFilters}
        onEdit={(r) => setEditTarget(r)}
        onDeactivate={(r) => setDeactivateTarget(r)}
        onReactivate={handleReactivate}
        onReorder={handleReorder}
        onClearFilters={() => {
          setSearch('');
          setStatus('active');
        }}
      />

      {editTarget && (
        <CloseReasonDialog
          mode="edit"
          reason={editTarget}
          open
          onClose={() => setEditTarget(null)}
        />
      )}

      {deactivateTarget && (
        <DeactivateCloseReasonDialog
          reason={{ id: deactivateTarget.id, name: deactivateTarget.name }}
          open
          submitting={softDelete.isPending}
          onConfirm={handleDeactivateConfirm}
          onClose={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Rodar — DEVE PASSAR**

```bash
pnpm test components/close-reasons/close-reasons-table.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Rodar suite completa pra regressão**

```bash
pnpm test
```

Expected: todos passam.

- [ ] **Step 6: Commit**

```bash
git add components/close-reasons/close-reasons-table.tsx components/close-reasons/close-reasons-table.test.tsx
git commit -m "feat(close-reasons): adiciona CloseReasonsTable (smart container) com reorder"
```

---

## Task 9: Page + loading + error + sidebar + route-titles

**Files:**

- Create: `app/(app)/configuracoes/motivos-fechamento/page.tsx`
- Create: `app/(app)/configuracoes/motivos-fechamento/loading.tsx`
- Create: `app/(app)/configuracoes/motivos-fechamento/error.tsx`
- Modify: `components/app-sidebar.tsx` (adiciona item no `settingsSubItems`)
- Modify: `lib/route-titles.ts` (adiciona título)

- [ ] **Step 1: Criar `page.tsx`**

```tsx
// app/(app)/configuracoes/motivos-fechamento/page.tsx
import type { Metadata } from 'next';
import { CloseReasonDialogTrigger } from '@/components/close-reasons/close-reason-dialog-trigger';
import { CloseReasonsTable } from '@/components/close-reasons/close-reasons-table';

export const metadata: Metadata = { title: 'Motivos de fechamento — DigiChat' };

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Motivos de fechamento</h1>
          <p className="text-muted-foreground text-sm">
            Cadastre motivos para encerrar tickets. Define a mensagem automática e os departamentos
            onde cada motivo aparece.
          </p>
        </div>
        <CloseReasonDialogTrigger />
      </header>

      <CloseReasonsTable />
    </div>
  );
}
```

- [ ] **Step 2: Criar `loading.tsx`**

```tsx
// app/(app)/configuracoes/motivos-fechamento/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Criar `error.tsx`**

```tsx
// app/(app)/configuracoes/motivos-fechamento/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function CloseReasonsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-foreground text-xl font-semibold">
          Não foi possível carregar os motivos
        </h2>
        <p className="text-muted-foreground text-sm">Tente novamente em instantes.</p>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Adicionar item na sidebar**

Editar `components/app-sidebar.tsx`. Localizar o array `settingsSubItems` e adicionar entrada antes de "Integrações":

```ts
const settingsSubItems = [
  { href: '/configuracoes/departamentos', label: 'Departamentos' },
  { href: '/configuracoes/tags', label: 'Tags' },
  { href: '/configuracoes/usuarios', label: 'Usuários' },
  { href: '/configuracoes/quick-replies', label: 'Quick Replies' },
  { href: '/configuracoes/canais', label: 'Canais' },
  { href: '/configuracoes/motivos-fechamento', label: 'Motivos de fechamento' },
  { href: '/configuracoes/integracoes', label: 'Integrações' },
  { href: '/configuracoes/preferencias', label: 'Preferências' },
  { href: '/configuracoes/design-system', label: 'Design System' },
] as const;
```

- [ ] **Step 5: Adicionar título da rota em `lib/route-titles.ts`**

Verificar arquivo `lib/route-titles.ts`. Adicionar entrada na constante de títulos:

```bash
grep -n 'canais\|integracoes' lib/route-titles.ts
```

Localizar a estrutura existente e replicar o pattern adicionando:

```ts
'/configuracoes/motivos-fechamento': 'Motivos de fechamento',
```

ou — se o arquivo usa formato diferente — alinhar com o estilo existente. (Subagente: ler o arquivo inteiro antes de editar pra preservar o pattern.)

- [ ] **Step 6: Gates completos**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

Expected: tudo verde.

- [ ] **Step 7: Commit**

```bash
git add app/\(app\)/configuracoes/motivos-fechamento components/app-sidebar.tsx lib/route-titles.ts
git commit -m "feat(close-reasons): tela /configuracoes/motivos-fechamento (Sprint 1.4 Fase C)"
```

---

## Task 10: Smoke manual + verificação final

Não criar arquivos. Validação.

- [ ] **Step 1: Subir crm-api + dev server**

```bash
# Terminal A
cd ../crm-api && pnpm start:dev

# Terminal B (do worktree)
pnpm dev
```

- [ ] **Step 2: Drift check de tipos gerados**

```bash
pnpm generate:api:from-snapshot && git diff --exit-code lib/generated
```

Expected: zero diff.

- [ ] **Step 3: Cenários manuais (login ADMIN)**

- [ ] Sidebar exibe "Motivos de fechamento" sob Configurações.
- [ ] Rota direta `/configuracoes/motivos-fechamento` renderiza empty state ("Nenhum motivo de fechamento cadastrado.")
- [ ] Criar motivo "Atendimento concluído" sem departments → aparece na lista com badge "Ativo".
- [ ] Criar motivo "Sem retorno" com 1 department → coluna mostra nome do depto.
- [ ] Criar motivo "Atendimento concluído" duplicado → erro inline pt-BR no campo.
- [ ] Editar motivo: trocar só o nome → submit envia só `{ name }` (validar via DevTools Network).
- [ ] Drag handle do motivo 3 → arrastar pra topo → lista re-ordenada, refresh mantém ordem.
- [ ] Aplicar busca "atend" → drag handle fica disabled, hint "Limpe os filtros para reordenar." aparece.
- [ ] Limpar filtros → drag volta a funcionar.
- [ ] Desativar motivo via dropdown → some da lista "Ativos"; aparece em "Inativos" com botão "Reativar".
- [ ] Reativar via dropdown → volta a aparecer em "Ativos".

- [ ] **Step 4: Cenário integrado com canais (1.4b + 1.4c juntos)**

- [ ] Voltar pra `/configuracoes/canais`, criar canal Gupshup com `inactivityTimeoutMinutes=30`.
- [ ] Confirmar que o Select de Close Reason agora popula com os motivos criados.
- [ ] Selecionar "Sem retorno", salvar → canal criado com sucesso.

- [ ] **Step 5: RBAC (login AGENT)**

- [ ] Logout, login como AGENT (criar via convite se necessário) → sidebar **não** mostra "Motivos de fechamento".
- [ ] Tenta `/configuracoes/motivos-fechamento` direto → redirect pra `/atendimentos`.

- [ ] **Step 6: Gates finais automatizados**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

Expected: tudo verde (1 warning informational do RHF `watch()` persistente é OK).

- [ ] **Step 7: Status report ao PO**

Reportar:

- Tasks 0a/0b/1–9 entregues.
- Tests adicionados: 4 arquivos (`deactivate-close-reason-dialog`, `close-reason-dialog`, `close-reasons-table-view`, `close-reasons-table`).
- Sem mudanças em `lib/rbac.ts` (gating já cobre por prefix).
- Item adicionado em `components/app-sidebar.tsx` + `lib/route-titles.ts`.

**Não fazer `git push` sem o PO confirmar.** Quando autorizado:

```bash
git push -u origin feat/sprint-1-4b-canais-ui
gh pr create --title "feat(canais + motivos): Sprint 1.4 Fases B + C" --body "$(cat <<'EOF'
## Summary
- Sprint 1.4 Fase B: tela /configuracoes/canais (CRUD + mascaramento + reveal ADMIN-only + 409 delete).
- Sprint 1.4 Fase C: tela /configuracoes/motivos-fechamento (CRUD + multi-select departments + drag-and-drop reorder).
- Fases combinadas em um único PR porque auto-close de canal só é utilizável end-to-end com motivos cadastrados.

## Test plan
- [x] pnpm format:check && pnpm lint && pnpm typecheck && pnpm test verdes.
- [x] pnpm generate:api:from-snapshot && git diff --exit-code lib/generated zero diff.
- [x] Smoke manual contra crm-api local (ADMIN cria/edita/reordena/desativa motivos; cria canal usando motivo).
EOF
)"
```

Após merge, **PR docs separado** em `docs/update-roadmap-1-4-fase-1` marcando os checkboxes das §5.1 do `ROADMAP.md` (B + C) e adicionando entrada para a §4.8 (gap de close-reasons UI fechado).

---

## Self-review (writing-plans skill)

**Spec coverage:**

- CRUD ADMIN/SUPER_ADMIN → Tasks 4, 7, 8 ✓
- Toolbar busca + filtro Ativos/Inativos → Task 8 ✓
- Form: name, message, departmentIds, active → Tasks 2, 4 ✓
- Drag-and-drop reorder com a11y + optimistic + revert → Tasks 1, 6, 7, 8 ✓
- Empty state com CTA → Task 7 ✓
- Sidebar item → Task 9 ✓
- TODO de campos cortados → Task 2 ✓
- Backend gap (close-reasons OpenAPI decorators) → Tasks 0a, 0b ✓
- Remoção do cast stale em channel-dialog.tsx → Task 0b ✓

**Placeholder scan:** sem TBD/TODO de plano (TODOs do código são intencionais e listados em §2 do spec). Cada step tem código completo + commands + expected output.

**Type consistency:** `CloseReasonForDialog` (Task 4) usado em Tasks 6, 8 com adição de `sortOrder` via `CloseReasonListItem` (extends). `CloseReasonFormValues` (Task 2) usado em Task 4. Mutation keys + query keys derivados dos helpers gerados pelo Kubb — não inventados.

**Scope check:** plano único, 11 tasks, todas relativas à mesma feature. Sem decomposição extra necessária.
