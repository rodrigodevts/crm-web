# Sprint 0.22 — Preferências (Company Settings) Frontend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o `<PlaceholderPage>` em `/configuracoes/preferencias` por um form real consumindo `GET/PATCH /companies/me/settings`, com 12 toggles em 6 cards, RBAC inline (ADMIN edita, demais visualizam), save explícito via botão sticky, e componentes reutilizáveis (`PreferenceSection`, `PreferenceSwitchRow`) expostos no design-system showcase.

**Architecture:** Duas fases independentes mas sequenciais. **Phase A** (no crm-api worktree, branch `fix/company-settings-openapi-schemas`): mini-PR análogo aos PRs #41–#46, expondo `CompanySettingsResponseDto` no OpenAPI. **Phase B** (no crm-web worktree, branch `feat/sprint-0-22-preferencias`, depois do merge da Phase A): regen Kubb, atualizar RBAC, criar componentes shared, criar `PreferencesForm` split em view+fetcher (padrão Tags/Quick Replies), substituir page placeholder, adicionar showcase. `defaultBotChatFlowId` deliberadamente fora do escopo.

**Tech Stack:** **Backend:** NestJS 11, nestjs-zod, @nestjs/swagger, vitest. **Frontend:** Next.js 16 App Router, React 19, TypeScript estrito, Tailwind 4, shadcn/ui, TanStack Query 5 (hooks via Kubb), React Hook Form 7 + Zod, Vitest + RTL, sonner.

**Spec:** [docs/superpowers/specs/2026-05-09-sprint-0-22-preferences-frontend-design.md](../specs/2026-05-09-sprint-0-22-preferences-frontend-design.md)

---

## Premissas

- Worktrees criados em `~/dev-space/digigov/digichat/crm-api-worktrees/` e (se necessário criar) `~/dev-space/digigov/digichat/crm-web-worktrees/`. Caminhos absolutos sempre.
- Validação local crm-api: `pnpm lint && pnpm typecheck && pnpm test`. Validação local crm-web: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`. `pnpm build` fica no CI (limitação documentada em CLAUDE.md §11 do crm-web).
- Branch protection ativa em `main` nos dois repos: tudo via PR.
- Hooks Kubb existentes (sem fix backend): `useCompanySettingsControllerFindMine`, `useCompanySettingsControllerUpdateMine`, `companySettingsControllerFindMineQueryKey`. Tipos: response `unknown` antes do fix; após o fix vira `CompanySettingsResponseDto` com 13 campos.
- Item "Preferências" no AppSidebar já aponta pra `/configuracoes/preferencias` ([`app-sidebar.tsx:54`](crm-web/components/app-sidebar.tsx#L54)) e em `nav-user.tsx:89`.
- Componentes shadcn já no projeto: `Button`, `Card`, `Switch`, `Label`, `Tooltip`, `Skeleton`. Verificado em `components/ui/`.
- `useCurrentUser` em `@/contexts/current-user-context` retorna `UserResponseDto` com `role`.
- Padrão de teste para hooks Kubb: mockar `apiClient.defaults.adapter` (axios) — visto em `quick-reply-dialog.test.tsx`.

---

## Files

### Phase A (crm-api)

**Modify:**

- `src/modules/company-settings/schemas/company-settings-response.schema.ts` — adiciona `class CompanySettingsResponseDto extends createZodDto(...)`.
- `src/modules/company-settings/controllers/company-settings.controller.ts` — adiciona `@ApiOkResponse`, troca `import type` por `import` da classe.
- `src/modules/company-settings/services/company-settings.application.service.ts` — eventualmente atualiza imports se usava `type CompanySettingsResponseDto` (verificar).
- `openapi.snapshot.json` — regenerado.

### Phase B (crm-web)

**Create:**

- `components/preferences/preference-switch-row.tsx` — linha label + helper + Switch.
- `components/preferences/preference-switch-row.test.tsx`
- `components/preferences/preference-section.tsx` — Card de seção.
- `components/preferences/preference-section.test.tsx`
- `components/preferences/preferences-form-view.tsx` — `'use client'`, recebe defaults + handlers, render dos 6 cards e footer, sem fetch.
- `components/preferences/preferences-form-view.test.tsx` — RTL: render, dirty, descartar, RBAC.
- `components/preferences/preferences-form.tsx` — `'use client'`, fetcher (useGet/useUpdate, RBAC, queryClient invalidate), passa pra view.
- `components/preferences/preferences-form.test.tsx` — RTL: loading/error/submit/onSuccess/payload-dirty-only.
- `app/(app)/configuracoes/preferencias/loading.tsx`
- `app/(app)/configuracoes/preferencias/error.tsx`
- `app/(app)/configuracoes/design-system/_sections/composites-preferences.tsx` — nova subseção do showcase.

**Modify:**

- `lib/rbac.ts` — adiciona `/configuracoes/preferencias` em AGENT e SUPERVISOR; atualiza docstring.
- `lib/rbac.test.ts` — atualiza matriz cobrindo as novas linhas.
- `app/(app)/configuracoes/preferencias/page.tsx` — substitui `<PlaceholderPage />` por `<PreferencesForm />`.
- `app/(app)/configuracoes/design-system/page.tsx` — wireup da nova subseção (importa `CompositesPreferences` e renderiza dentro de `<Composites />` ou seção própria).
- `lib/generated/**` — regenerado pelo Kubb após sync do snapshot.
- `openapi.snapshot.json` — sync do snapshot do crm-api atualizado.

---

# Phase A — Backend OpenAPI fix (crm-api)

## Task A0: Setup branch + worktree no crm-api

**Files:** N/A (setup)

- [ ] **Step 1: Criar worktree em `crm-api-worktrees/sprint-0-22-fix-openapi`**

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api
git fetch origin
git worktree add /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api-worktrees/sprint-0-22-fix-openapi -b fix/company-settings-openapi-schemas origin/main
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api-worktrees/sprint-0-22-fix-openapi
pnpm install --frozen-lockfile
```

Expected: worktree criado, branch `fix/company-settings-openapi-schemas` checked-out a partir de `origin/main` atualizado, deps instaladas sem mudanças no lockfile.

- [ ] **Step 2: Confirmar baseline verde**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: tudo verde. Se algo falhar, abortar — não é bug introduzido por nós.

---

## Task A1: Converter ResponseSchema em classe DTO e atualizar imports do controller/service

**Files:**

- Modify: `src/modules/company-settings/schemas/company-settings-response.schema.ts`
- Modify: `src/modules/company-settings/controllers/company-settings.controller.ts`
- Modify: `src/modules/company-settings/services/company-settings.application.service.ts` (se necessário)

- [ ] **Step 1: Substituir o conteúdo de `company-settings-response.schema.ts`**

```ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CompanySettingsResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),

  hideOtherUsersTickets: z.boolean(),
  agentSeeOtherUsersTicketsOnSameChannel: z.boolean(),
  agentSeeTicketsWithOtherDefaultAgents: z.boolean(),
  hidePhoneFromAgents: z.boolean(),
  ignoreGroupMessages: z.boolean(),
  showAssignedGroups: z.boolean(),
  forceWalletRouting: z.boolean(),
  agentCanDeleteContacts: z.boolean(),
  agentCanChangeDefaultAgent: z.boolean(),
  agentCanEditTags: z.boolean(),
  agentCanToggleSignature: z.boolean(),
  hideBotTicketsFromAgents: z.boolean(),
  defaultBotChatFlowId: z.string().uuid().nullable(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export class CompanySettingsResponseDto extends createZodDto(CompanySettingsResponseSchema) {}
```

(Substitui o `export type CompanySettingsResponseDto = z.infer<...>` pela classe. Mantém o schema exportado.)

- [ ] **Step 2: Atualizar `company-settings.controller.ts` — remover `import type` da classe e adicionar `@ApiOkResponse`**

Substituir o conteúdo inteiro por:

```ts
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import type { User } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { CompanySettingsResponseDto } from '../schemas/company-settings-response.schema';
import { UpdateCompanySettingsDto } from '../schemas/update-company-settings.schema';
import { CompanySettingsApplicationService } from '../services/company-settings.application.service';

@ApiTags('company-settings')
@Controller('companies/me/settings')
export class CompanySettingsController {
  constructor(private readonly app: CompanySettingsApplicationService) {}

  @Get()
  @ApiOkResponse({ type: CompanySettingsResponseDto })
  @ZodSerializerDto(CompanySettingsResponseDto)
  async findMine(@CurrentUser() currentUser: User): Promise<CompanySettingsResponseDto> {
    return this.app.findMine(currentUser);
  }

  @Patch()
  @Roles('ADMIN')
  @ApiOkResponse({ type: CompanySettingsResponseDto })
  @ZodSerializerDto(CompanySettingsResponseDto)
  async updateMine(
    @CurrentUser() currentUser: User,
    @Body() body: UpdateCompanySettingsDto,
  ): Promise<CompanySettingsResponseDto> {
    return this.app.updateMine(currentUser, body);
  }
}
```

Mudanças vs. atual:

- `import { ApiOkResponse, ApiTags } from '@nestjs/swagger';` (era só `ApiTags`).
- `import { CompanySettingsResponseDto } from '...';` (era `import type` + import do schema separado — a classe carrega o schema runtime).
- `@ApiOkResponse({ type: CompanySettingsResponseDto })` em ambos os métodos.
- `@ZodSerializerDto(CompanySettingsResponseDto)` (recebe a classe — `nestjs-zod` aceita; o schema runtime fica acessível via `.schema` interno do `createZodDto`).

- [ ] **Step 3: Verificar/atualizar `company-settings.application.service.ts`**

Run:

```bash
grep -n "CompanySettingsResponseDto\|company-settings-response" src/modules/company-settings/services/company-settings.application.service.ts
```

Se o service usa `import type { CompanySettingsResponseDto }`, ajustar para `import` normal (a classe agora é usada em runtime). Se usa só pra type annotation no return, manter `import type`. Decidir conforme uso real.

Expected: arquivo continua tipado, sem warnings.

- [ ] **Step 4: Rodar lint + typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: zero erros. Se `nestjs-zod` reclamar do `@ZodSerializerDto(CompanySettingsResponseDto)`, fazer fallback para `@ZodSerializerDto(CompanySettingsResponseSchema)` mantendo o schema importado.

- [ ] **Step 5: Commit**

```bash
git add src/modules/company-settings/
git commit -m "refactor(company-settings): expose response as createZodDto class for OpenAPI"
```

---

## Task A2: Regenerar OpenAPI snapshot e validar diff

**Files:**

- Modify: `openapi.snapshot.json`

- [ ] **Step 1: Identificar comando de geração do snapshot**

```bash
grep -n "openapi" package.json | head
```

Se não houver script dedicado, o snapshot vem da rota `/api/v1/docs-json` do Nest com `SwaggerModule`. Padrão usado em commits anteriores (ex: PR #46 commit `f27cf54`): rodar `pnpm test:schema` (que monta a app, faz GET no JSON e compara/atualiza o snapshot) ou regerar via script auxiliar. Conferir a presença de `vitest.schema.config.ts` que gere/atualize o snapshot.

- [ ] **Step 2: Regenerar o snapshot**

Comando provável (a confirmar no projeto):

```bash
pnpm test:schema -- -u
```

(O flag `-u` em vitest atualiza snapshots. Se a config do schema test for outra, ajustar.)

Expected: `openapi.snapshot.json` mudou. `git diff openapi.snapshot.json | head -100` mostra:

- Em `components.schemas`: adição de `CompanySettingsResponseDto` (com 15 propriedades — 12 booleans + `defaultBotChatFlowId` nullable + `id`+`companyId`+`createdAt`+`updatedAt`).
- Em `paths."/api/v1/companies/me/settings".get.responses.200.content."application/json".schema`: agora um `$ref` para `CompanySettingsResponseDto` (era `description: ""`).
- Mesmo para `.patch.responses.200`.

- [ ] **Step 3: Rodar test:schema sem `-u` para confirmar que o snapshot bate**

```bash
pnpm test:schema
```

Expected: passa.

- [ ] **Step 4: Rodar suíte completa**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: tudo verde. Em particular, e2e do `company-settings` (`tests/company-settings.controller.e2e-spec.ts`) deve continuar passando — o ZodSerializerDto e o behavior runtime não mudam, só a metadata do OpenAPI.

- [ ] **Step 5: Commit**

```bash
git add openapi.snapshot.json
git commit -m "chore(openapi): regenerate snapshot after company-settings schema export"
```

---

## Task A3: Push, abrir PR e aguardar merge

**Files:** N/A

- [ ] **Step 1: Push da branch**

```bash
git push -u origin fix/company-settings-openapi-schemas
```

Expected: branch publicada.

- [ ] **Step 2: Abrir PR via gh**

```bash
gh pr create --title "fix(company-settings): expose response schemas in OpenAPI" --body "$(cat <<'EOF'
## Summary

- Adiciona `@ApiOkResponse` em `CompanySettingsController.findMine()` e `updateMine()`
- Converte `CompanySettingsResponseDto` em classe via `createZodDto` (necessário pra `type:` do swagger)
- Regenera `openapi.snapshot.json` no mesmo commit

Mesmo pattern aplicado em PR #41 (invitations), #42 (users), #43 (departments), #46 (tags). Sem isso, Kubb gera `CompanySettingsControllerFindMine200 = unknown` no crm-web e bloqueia a Sprint 0.22 (Preferências) frontend.

## Test plan

- [x] `pnpm test:schema` passa (snapshot atualizado)
- [x] `pnpm test` passa (e2e do company-settings inalterado)
- [x] `pnpm lint && pnpm typecheck` verdes
EOF
)"
```

Expected: PR aberto. Anotar URL.

- [ ] **Step 3: Aguardar CI verde + revisão humana + merge**

(Não-automatizado. Revisor humano mergeia.)

- [ ] **Step 4: Limpar worktree após merge**

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api
git worktree remove /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api-worktrees/sprint-0-22-fix-openapi
git fetch origin && git checkout main && git pull
```

Expected: worktree removido, main local atualizado com o merge.

---

# Phase B — Frontend Sprint 0.22 (crm-web)

> **Pré-requisito:** Phase A mergeada. `openapi.snapshot.json` do crm-api tem o schema exposto. Caso contrário, parar e voltar pra Phase A.

## Task B0: Setup branch + worktree no crm-web e regen Kubb

**Files:**

- Modify: `openapi.snapshot.json`
- Modify: `lib/generated/**`

- [ ] **Step 1: Criar worktree**

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web
git fetch origin
git worktree add /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web-worktrees/sprint-0-22-preferencias -b feat/sprint-0-22-preferencias origin/main
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web-worktrees/sprint-0-22-preferencias
pnpm install --frozen-lockfile
```

Expected: worktree criado, deps OK.

- [ ] **Step 2: Sincronizar `openapi.snapshot.json` do crm-api atualizado**

```bash
cp /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api/openapi.snapshot.json ./openapi.snapshot.json
git diff openapi.snapshot.json | head -40
```

Expected: diff mostra adição do schema `CompanySettingsResponseDto` em `components.schemas` e `$ref` nos dois endpoints `/companies/me/settings`.

- [ ] **Step 3: Regenerar Kubb a partir do snapshot**

```bash
pnpm generate:api:from-snapshot
```

Expected: arquivos em `lib/generated/types/CompanySettingsControllerFindMine.ts` e `lib/generated/types/CompanySettingsControllerUpdateMine.ts` mudaram. O type `CompanySettingsControllerFindMine200` deixa de ser `unknown` e passa a ser `CompanySettingsResponseDto`. Schema `companySettingsResponseDtoSchema` aparece em `lib/generated/schemas/`.

- [ ] **Step 4: Confirmar tipo gerado**

```bash
grep -n "CompanySettingsResponseDto\|unknown" lib/generated/types/CompanySettingsControllerFindMine.ts
```

Expected: `CompanySettingsResponseDto` aparece, `unknown` não.

- [ ] **Step 5: Rodar typecheck e baseline de testes**

```bash
pnpm typecheck && pnpm test
```

Expected: verde. (Nenhum consumidor existente do tipo `unknown` quebra — não há nenhum hoje.)

- [ ] **Step 6: Commit prep**

```bash
git add openapi.snapshot.json lib/generated/
git commit -m "chore(openapi): sync snapshot + regen kubb (company-settings response)"
```

---

## Task B1: Atualizar RBAC para liberar `/configuracoes/preferencias` a AGENT e SUPERVISOR

**Files:**

- Modify: `lib/rbac.ts`
- Modify: `lib/rbac.test.ts`

- [ ] **Step 1: Atualizar `lib/rbac.ts`**

Substituir o bloco da docstring + `ROUTE_ACCESS` por:

```ts
import type { UserResponseDtoRoleEnumKey } from '@/lib/generated/types/UserResponseDto';

export type Role = UserResponseDtoRoleEnumKey;

/**
 * Mapa estático de prefixos de rota acessíveis por role. Default deny:
 * rota fora do mapa retorna false. Match é por prefixo — `/configuracoes`
 * cobre `/configuracoes/usuarios`, etc.
 *
 * AGENT e SUPERVISOR têm acesso explícito a duas telas de Configurações:
 * - `/configuracoes/quick-replies` — única tela onde criam/editam suas
 *   PERSONAL próprias.
 * - `/configuracoes/preferencias` — visualização das flags da empresa
 *   (toggles disabled). A escrita é bloqueada inline na tela e no backend
 *   (PATCH apenas ADMIN).
 *
 * O restante de `/configuracoes/*` segue restrito a ADMIN e SUPER_ADMIN.
 */
const ROUTE_ACCESS: Record<Role, ReadonlyArray<string>> = {
  AGENT: [
    '/atendimentos',
    '/contatos',
    '/campanhas',
    '/configuracoes/quick-replies',
    '/configuracoes/preferencias',
  ],
  SUPERVISOR: [
    '/atendimentos',
    '/contatos',
    '/campanhas',
    '/bot-fluxo',
    '/dashboard',
    '/configuracoes/quick-replies',
    '/configuracoes/preferencias',
  ],
  ADMIN: ['/atendimentos', '/contatos', '/campanhas', '/bot-fluxo', '/dashboard', '/configuracoes'],
  SUPER_ADMIN: [
    '/atendimentos',
    '/contatos',
    '/campanhas',
    '/bot-fluxo',
    '/dashboard',
    '/configuracoes',
  ],
};

export function canAccessRoute(role: Role, route: string): boolean {
  const allowed = ROUTE_ACCESS[role];
  return allowed.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
}

/**
 * Áreas administrativas (Configurações, gestão de usuários, etc.) ficam
 * restritas a ADMIN e SUPER_ADMIN. Espelha as restrições `@Roles('ADMIN')`
 * no backend (ex.: crm-api/src/modules/invitations/controllers/invitations.controller.ts).
 *
 * RBAC efetivo (helpers granulares + diferenciação SUPERVISOR vs ADMIN nas
 * features) está mapeado no ROADMAP §4.8 como sprint dedicada.
 */
export function canAccessAdminAreas(role: Role): boolean {
  return canAccessRoute(role, '/configuracoes');
}
```

- [ ] **Step 2: Atualizar `lib/rbac.test.ts` — adicionar linhas para Preferências**

Adicionar dentro do array `matrix` de `canAccessRoute`, próximo ao bloco AGENT/SUPERVISOR:

```ts
    // Preferências: AGENT e SUPERVISOR podem acessar (visualização);
    // edição é bloqueada inline na tela e no backend.
    { role: 'AGENT', route: '/configuracoes/preferencias', expected: true },
    { role: 'SUPERVISOR', route: '/configuracoes/preferencias', expected: true },
    { role: 'ADMIN', route: '/configuracoes/preferencias', expected: true },
    { role: 'SUPER_ADMIN', route: '/configuracoes/preferencias', expected: true },
```

(Inserir depois das linhas de quick-replies de cada role, mantendo ordem semântica.)

`canAccessAdminAreas` continua igual: `AGENT` e `SUPERVISOR` retornam false (porque pedimos `/configuracoes` e nenhum dos dois tem o prefixo bare). Confirmar que o teste existente continua passando.

- [ ] **Step 3: Rodar testes**

```bash
pnpm test -- rbac
```

Expected: passa, com as 4 novas linhas.

- [ ] **Step 4: Lint + typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: verde.

- [ ] **Step 5: Commit**

```bash
git add lib/rbac.ts lib/rbac.test.ts
git commit -m "feat(rbac): allow AGENT and SUPERVISOR to view /configuracoes/preferencias"
```

---

## Task B2: Criar `PreferenceSwitchRow` (presentational) + test

**Files:**

- Create: `components/preferences/preference-switch-row.tsx`
- Create: `components/preferences/preference-switch-row.test.tsx`

- [ ] **Step 1: Escrever o teste primeiro (RED)**

`components/preferences/preference-switch-row.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreferenceSwitchRow } from './preference-switch-row';

describe('PreferenceSwitchRow', () => {
  it('renderiza label, descrição e switch com estado controlado', () => {
    render(
      <PreferenceSwitchRow
        id="test-flag"
        label="Ocultar tickets de outros atendentes"
        description="Atendente vê apenas tickets atribuídos a ele e os pendentes do departamento."
        checked={true}
        onCheckedChange={vi.fn()}
      />,
    );

    const sw = screen.getByRole('switch', {
      name: 'Ocultar tickets de outros atendentes',
    });
    expect(sw).toBeChecked();
    expect(screen.getByText(/atendente vê apenas tickets/i)).toBeInTheDocument();
  });

  it('chama onCheckedChange ao clicar', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PreferenceSwitchRow
        id="test-flag"
        label="Flag X"
        description="Helper X"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );

    await user.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('quando disabled, switch não aceita clique e mostra tooltip de razão', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PreferenceSwitchRow
        id="test-flag"
        label="Flag X"
        description="Helper X"
        checked={false}
        onCheckedChange={onCheckedChange}
        disabled
        disabledReason="Apenas administradores podem alterar"
      />,
    );

    const sw = screen.getByRole('switch');
    expect(sw).toBeDisabled();
    await user.click(sw);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('linka helper ao switch via aria-describedby', () => {
    render(
      <PreferenceSwitchRow
        id="test-flag"
        label="Flag X"
        description="Helper descritivo"
        checked={false}
        onCheckedChange={vi.fn()}
      />,
    );

    const sw = screen.getByRole('switch');
    const describedBy = sw.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const helper = document.getElementById(describedBy as string);
    expect(helper?.textContent).toBe('Helper descritivo');
  });
});
```

- [ ] **Step 2: Verificar que o teste falha (RED)**

```bash
pnpm test -- preference-switch-row
```

Expected: FAIL com `Cannot find module './preference-switch-row'`.

- [ ] **Step 3: Implementar `PreferenceSwitchRow`**

`components/preferences/preference-switch-row.tsx`:

```tsx
'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type PreferenceSwitchRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
};

export function PreferenceSwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  disabledReason,
}: PreferenceSwitchRowProps) {
  const helperId = `${id}-helper`;

  const switchEl = (
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-describedby={helperId}
    />
  );

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 space-y-1">
        <Label htmlFor={id} className="text-text-primary text-sm font-medium">
          {label}
        </Label>
        <p id={helperId} className="text-text-secondary text-sm">
          {description}
        </p>
      </div>
      {disabled && disabledReason ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{switchEl}</span>
          </TooltipTrigger>
          <TooltipContent>{disabledReason}</TooltipContent>
        </Tooltip>
      ) : (
        switchEl
      )}
    </div>
  );
}
```

- [ ] **Step 4: Rodar teste (GREEN)**

```bash
pnpm test -- preference-switch-row
```

Expected: 4 testes passam.

- [ ] **Step 5: Commit**

```bash
git add components/preferences/preference-switch-row.tsx components/preferences/preference-switch-row.test.tsx
git commit -m "feat(preferences): PreferenceSwitchRow component with a11y + disabled tooltip"
```

---

## Task B3: Criar `PreferenceSection` (presentational) + test

**Files:**

- Create: `components/preferences/preference-section.tsx`
- Create: `components/preferences/preference-section.test.tsx`

- [ ] **Step 1: Escrever o teste primeiro**

`components/preferences/preference-section.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreferenceSection } from './preference-section';

describe('PreferenceSection', () => {
  it('renderiza título, descrição e children', () => {
    render(
      <PreferenceSection title="Visibilidade de tickets" description="Quem enxerga o quê na fila.">
        <div data-testid="child">Conteúdo</div>
      </PreferenceSection>,
    );

    expect(
      screen.getByRole('heading', { name: 'Visibilidade de tickets', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Quem enxerga o quê na fila.')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Confirmar RED**

```bash
pnpm test -- preference-section
```

Expected: FAIL módulo não encontrado.

- [ ] **Step 3: Implementar**

`components/preferences/preference-section.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type PreferenceSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function PreferenceSection({ title, description, children }: PreferenceSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle asChild>
          <h2 className="text-text-primary text-lg font-semibold">{title}</h2>
        </CardTitle>
        <CardDescription className="text-text-secondary text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="divide-border-default divide-y">{children}</CardContent>
    </Card>
  );
}
```

(Confirmar que `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` são exportados de `@/components/ui/card` — checar se necessário com `grep -n "export" components/ui/card.tsx`. Se `CardTitle` não aceitar `asChild`, usar `<CardTitle>{title}</CardTitle>` direto e ajustar o teste.)

- [ ] **Step 4: Rodar teste (GREEN)**

```bash
pnpm test -- preference-section
```

Expected: passa. Se a heading semantics falhar (ex: shadcn `CardTitle` renderiza `div` por padrão), reabrir o componente e usar `<h2>` cru dentro do `CardHeader` em vez de `<CardTitle asChild>`.

- [ ] **Step 5: Commit**

```bash
git add components/preferences/preference-section.tsx components/preferences/preference-section.test.tsx
git commit -m "feat(preferences): PreferenceSection card wrapper"
```

---

## Task B4: Criar `PreferencesFormView` (presentational, RHF inside) + test

**Files:**

- Create: `components/preferences/preferences-form-view.tsx`
- Create: `components/preferences/preferences-form-view.test.tsx`

`PreferencesFormView` é o componente burro: recebe `defaultValues`, `canEdit`, `onSubmit` e `isSubmitting` via props. Owns o RHF internamente, renderiza os 6 cards e o footer sticky. Não conhece nada de fetch.

- [ ] **Step 1: Escrever o teste primeiro**

`components/preferences/preferences-form-view.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreferencesFormView, type PreferencesFormValues } from './preferences-form-view';

const defaults: PreferencesFormValues = {
  hideOtherUsersTickets: true,
  agentSeeOtherUsersTicketsOnSameChannel: false,
  agentSeeTicketsWithOtherDefaultAgents: true,
  hidePhoneFromAgents: false,
  ignoreGroupMessages: false,
  showAssignedGroups: false,
  forceWalletRouting: false,
  agentCanDeleteContacts: false,
  agentCanChangeDefaultAgent: false,
  agentCanEditTags: false,
  agentCanToggleSignature: false,
  hideBotTicketsFromAgents: false,
};

describe('PreferencesFormView', () => {
  it('renderiza os 6 cards e os 12 switches refletindo defaultValues', () => {
    render(<PreferencesFormView defaultValues={defaults} canEdit onSubmit={vi.fn()} />);

    // 6 cards
    expect(screen.getByRole('heading', { name: 'Visibilidade de tickets' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Privacidade' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Grupos do WhatsApp' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Roteamento' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Permissões do atendente' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bot' })).toBeInTheDocument();

    // amostra de 4 switches
    expect(
      screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }),
    ).toBeChecked();
    expect(
      screen.getByRole('switch', {
        name: 'Atendente vê tickets de outros do mesmo canal',
      }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('switch', {
        name: 'Ocultar número de telefone dos atendentes',
      }),
    ).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Ignorar mensagens de grupos' })).not.toBeChecked();
  });

  it('botão Salvar está disabled enquanto não dirty; habilita ao mudar um switch', async () => {
    const user = userEvent.setup();
    render(<PreferencesFormView defaultValues={defaults} canEdit onSubmit={vi.fn()} />);

    const save = screen.getByRole('button', { name: 'Salvar alterações' });
    const discard = screen.getByRole('button', { name: 'Descartar alterações' });
    expect(save).toBeDisabled();
    expect(discard).toBeDisabled();

    await user.click(screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }));

    expect(save).toBeEnabled();
    expect(discard).toBeEnabled();
  });

  it('Descartar alterações reseta para defaultValues e desabilita botões', async () => {
    const user = userEvent.setup();
    render(<PreferencesFormView defaultValues={defaults} canEdit onSubmit={vi.fn()} />);

    const sw = screen.getByRole('switch', {
      name: 'Ocultar tickets de outros atendentes',
    });
    await user.click(sw);
    expect(sw).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Descartar alterações' }));

    expect(sw).toBeChecked();
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
  });

  it('submit chama onSubmit apenas com campos dirty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PreferencesFormView defaultValues={defaults} canEdit onSubmit={onSubmit} />);

    await user.click(screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }));
    await user.click(screen.getByRole('switch', { name: 'Ignorar mensagens de grupos' }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      hideOtherUsersTickets: false,
      ignoreGroupMessages: true,
    });
  });

  it('quando canEdit=false, todos os switches ficam disabled e o footer some', () => {
    render(<PreferencesFormView defaultValues={defaults} canEdit={false} onSubmit={vi.fn()} />);

    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(12);
    for (const sw of switches) {
      expect(sw).toBeDisabled();
    }

    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Descartar alterações' })).not.toBeInTheDocument();
  });

  it('quando isSubmitting=true, botão Salvar mostra estado loading e bloqueia novo submit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <PreferencesFormView
        defaultValues={defaults}
        canEdit
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );

    await user.click(screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }));

    rerender(
      <PreferencesFormView defaultValues={defaults} canEdit onSubmit={onSubmit} isSubmitting />,
    );

    const save = screen.getByRole('button', { name: /salvando/i });
    expect(save).toBeDisabled();
  });
});
```

- [ ] **Step 2: Confirmar RED**

```bash
pnpm test -- preferences-form-view
```

Expected: FAIL módulo não encontrado.

- [ ] **Step 3: Implementar `PreferencesFormView`**

`components/preferences/preferences-form-view.tsx`:

```tsx
'use client';

import { useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { PreferenceSection } from './preference-section';
import { PreferenceSwitchRow } from './preference-switch-row';

const FORM_FIELDS = [
  'hideOtherUsersTickets',
  'agentSeeOtherUsersTicketsOnSameChannel',
  'agentSeeTicketsWithOtherDefaultAgents',
  'hidePhoneFromAgents',
  'ignoreGroupMessages',
  'showAssignedGroups',
  'forceWalletRouting',
  'agentCanDeleteContacts',
  'agentCanChangeDefaultAgent',
  'agentCanEditTags',
  'agentCanToggleSignature',
  'hideBotTicketsFromAgents',
] as const;

type FieldName = (typeof FORM_FIELDS)[number];

const formSchema = z.object(
  Object.fromEntries(FORM_FIELDS.map((name) => [name, z.boolean()])) as Record<
    FieldName,
    z.ZodBoolean
  >,
);

export type PreferencesFormValues = z.infer<typeof formSchema>;

type SectionConfig = {
  title: string;
  description: string;
  rows: ReadonlyArray<{ name: FieldName; label: string; helper: string }>;
};

const SECTIONS: ReadonlyArray<SectionConfig> = [
  {
    title: 'Visibilidade de tickets',
    description: 'Define o que cada atendente enxerga na fila.',
    rows: [
      {
        name: 'hideOtherUsersTickets',
        label: 'Ocultar tickets de outros atendentes',
        helper: 'Atendente vê apenas tickets atribuídos a ele e os pendentes do departamento.',
      },
      {
        name: 'agentSeeOtherUsersTicketsOnSameChannel',
        label: 'Atendente vê tickets de outros do mesmo canal',
        helper: 'Permite visibilidade extra dentro do mesmo canal de atendimento.',
      },
      {
        name: 'agentSeeTicketsWithOtherDefaultAgents',
        label: 'Atendente vê tickets de contatos com outro responsável padrão',
        helper: 'Mantém visibilidade quando o contato tem responsável (carteira) diferente.',
      },
    ],
  },
  {
    title: 'Privacidade',
    description: 'Dados sensíveis exibidos para atendentes.',
    rows: [
      {
        name: 'hidePhoneFromAgents',
        label: 'Ocultar número de telefone dos atendentes',
        helper: 'Telefone do contato aparece mascarado para o perfil Atendente.',
      },
    ],
  },
  {
    title: 'Grupos do WhatsApp',
    description: 'Comportamento para mensagens vindas de grupos.',
    rows: [
      {
        name: 'ignoreGroupMessages',
        label: 'Ignorar mensagens de grupos',
        helper: 'Mensagens vindas de grupos são descartadas antes de criar ticket.',
      },
      {
        name: 'showAssignedGroups',
        label: 'Mostrar grupos atribuídos na fila',
        helper: 'Quando ligado, tickets de grupos atribuídos aparecem na listagem.',
      },
    ],
  },
  {
    title: 'Roteamento',
    description: 'Como tickets são distribuídos automaticamente.',
    rows: [
      {
        name: 'forceWalletRouting',
        label: 'Forçar roteamento por carteira',
        helper: 'Atribui automaticamente o ticket ao responsável padrão (carteira) do contato.',
      },
    ],
  },
  {
    title: 'Permissões do atendente',
    description: 'Ações liberadas para o perfil Atendente.',
    rows: [
      {
        name: 'agentCanDeleteContacts',
        label: 'Atendente pode deletar contatos',
        helper: 'Libera a ação de excluir contato para o perfil Atendente.',
      },
      {
        name: 'agentCanChangeDefaultAgent',
        label: 'Atendente pode trocar o responsável padrão do contato',
        helper: 'Permite alterar a carteira do contato sem precisar de Supervisor/Admin.',
      },
      {
        name: 'agentCanEditTags',
        label: 'Atendente pode editar tags do contato',
        helper: 'Libera adicionar e remover tags no contato durante o atendimento.',
      },
      {
        name: 'agentCanToggleSignature',
        label: 'Atendente pode escolher se assina a mensagem',
        helper:
          'Mostra checkbox "incluir assinatura" no composer; quando desligado, a assinatura segue o padrão do tenant.',
      },
    ],
  },
  {
    title: 'Bot',
    description: 'Comportamento de tickets em atendimento por bot.',
    rows: [
      {
        name: 'hideBotTicketsFromAgents',
        label: 'Ocultar tickets em atendimento por bot',
        helper:
          'Tickets que estão sendo conduzidos pelo bot ficam invisíveis para atendentes até a transferência.',
      },
    ],
  },
];

export type PreferencesFormViewProps = {
  defaultValues: PreferencesFormValues;
  canEdit: boolean;
  onSubmit: (dirtyValues: Partial<PreferencesFormValues>) => void;
  isSubmitting?: boolean;
};

export function PreferencesFormView({
  defaultValues,
  canEdit,
  onSubmit,
  isSubmitting = false,
}: PreferencesFormViewProps) {
  const formId = useId();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm<PreferencesFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const submit = handleSubmit((values) => {
    const dirtyOnly = Object.fromEntries(
      Object.entries(values).filter(([k]) => Boolean(dirtyFields[k as FieldName])),
    ) as Partial<PreferencesFormValues>;
    onSubmit(dirtyOnly);
  });

  return (
    <form id={formId} onSubmit={submit} className="flex flex-col gap-6 pb-24">
      {SECTIONS.map((section) => (
        <PreferenceSection
          key={section.title}
          title={section.title}
          description={section.description}
        >
          {section.rows.map((row) => (
            <Controller
              key={row.name}
              control={control}
              name={row.name}
              render={({ field }) => (
                <PreferenceSwitchRow
                  id={`${formId}-${row.name}`}
                  label={row.label}
                  description={row.helper}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!canEdit}
                  disabledReason={!canEdit ? 'Apenas administradores podem alterar' : undefined}
                />
              )}
            />
          ))}
        </PreferenceSection>
      ))}

      {canEdit ? (
        <div className="bg-bg-base border-border-default sticky bottom-0 -mx-6 flex justify-end gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset(defaultValues)}
            disabled={!isDirty || isSubmitting}
          >
            Descartar alterações
          </Button>
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
```

- [ ] **Step 4: Rodar teste (GREEN)**

```bash
pnpm test -- preferences-form-view
```

Expected: 6 testes passam.

- [ ] **Step 5: Lint + typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: verde.

- [ ] **Step 6: Commit**

```bash
git add components/preferences/preferences-form-view.tsx components/preferences/preferences-form-view.test.tsx
git commit -m "feat(preferences): PreferencesFormView with 6 sections, 12 toggles, sticky footer, RBAC"
```

---

## Task B5: Criar `PreferencesForm` (data layer) + test

**Files:**

- Create: `components/preferences/preferences-form.tsx`
- Create: `components/preferences/preferences-form.test.tsx`

`PreferencesForm` é o Client Component que faz fetch via `useCompanySettingsControllerFindMine`, mutate via `useCompanySettingsControllerUpdateMine`, decide `canEdit` via `useCurrentUser`, mostra skeleton durante loading, e passa pra `PreferencesFormView`. Toast de sucesso, `invalidateQueries` no `onSuccess`. Re-syncing dirty state usa o `data` da response do PATCH (ou refaz reset com novos defaults após o GET re-rodar).

- [ ] **Step 1: Escrever o teste primeiro**

`components/preferences/preferences-form.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import type { CompanySettingsResponseDto } from '@/lib/generated/types/CompanySettingsResponseDto';
import { CurrentUserProvider } from '@/contexts/current-user-context';
import { PreferencesForm } from './preferences-form';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn(),
  },
}));

const fakeUser = (overrides: Partial<UserResponseDto> = {}): UserResponseDto => ({
  absenceActive: false,
  absenceMessage: null,
  active: true,
  companyId: '00000000-0000-7000-8000-0000000000aa',
  createdAt: '2026-05-01T00:00:00.000Z',
  departments: [],
  email: 'admin@example.com',
  id: '00000000-0000-7000-8000-0000000000bb',
  lastSeenAt: null,
  name: 'Admin',
  role: 'ADMIN',
  updatedAt: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

const fakeSettings = (
  overrides: Partial<CompanySettingsResponseDto> = {},
): CompanySettingsResponseDto => ({
  id: '00000000-0000-7000-8000-000000000100',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  hideOtherUsersTickets: true,
  agentSeeOtherUsersTicketsOnSameChannel: false,
  agentSeeTicketsWithOtherDefaultAgents: true,
  hidePhoneFromAgents: false,
  ignoreGroupMessages: false,
  showAssignedGroups: false,
  forceWalletRouting: false,
  agentCanDeleteContacts: false,
  agentCanChangeDefaultAgent: false,
  agentCanEditTags: false,
  agentCanToggleSignature: false,
  hideBotTicketsFromAgents: false,
  defaultBotChatFlowId: null,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

function Wrapper({ children, user = fakeUser() }: { children: ReactNode; user?: UserResponseDto }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <CurrentUserProvider user={user}>{children}</CurrentUserProvider>
    </QueryClientProvider>
  );
}

const originalAdapter = apiClient.defaults.adapter;

function setAdapter(handler: (config: AxiosRequestConfig) => Promise<unknown> | unknown): void {
  const adapter = vi.fn().mockImplementation((config) => Promise.resolve(handler(config)));
  apiClient.defaults.adapter = adapter as AxiosAdapter;
}

function ok(data: unknown, status = 200) {
  return (config: AxiosRequestConfig) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config,
  });
}

describe('PreferencesForm', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('mostra skeleton enquanto carrega settings', () => {
    setAdapter(() => new Promise(() => {})); // never resolves
    render(
      <Wrapper>
        <PreferencesForm />
      </Wrapper>,
    );
    expect(screen.getByTestId('preferences-skeleton')).toBeInTheDocument();
  });

  it('renderiza form populado com dados do GET para ADMIN (toggles editáveis)', async () => {
    setAdapter(ok(fakeSettings()));
    render(
      <Wrapper>
        <PreferencesForm />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }),
      ).toBeChecked();
    });
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument();
  });

  it('para AGENT: toggles disabled e footer não renderiza', async () => {
    setAdapter(ok(fakeSettings()));
    render(
      <Wrapper user={fakeUser({ role: 'AGENT' })}>
        <PreferencesForm />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }),
      ).toBeDisabled();
    });
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument();
  });

  it('submit envia PATCH apenas com campos dirty e mostra toast de sucesso', async () => {
    const requests: AxiosRequestConfig[] = [];
    setAdapter((config) => {
      requests.push(config);
      if (config.method === 'patch') {
        return ok(fakeSettings({ hideOtherUsersTickets: false, ignoreGroupMessages: true }))(
          config,
        );
      }
      return ok(fakeSettings())(config);
    });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <PreferencesForm />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }),
      ).toBeChecked();
    });

    await user.click(screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }));
    await user.click(screen.getByRole('switch', { name: 'Ignorar mensagens de grupos' }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Preferências atualizadas');
    });

    const patchCall = requests.find((r) => r.method === 'patch');
    expect(patchCall).toBeDefined();
    expect(patchCall?.url).toContain('/companies/me/settings');
    const body = JSON.parse(String(patchCall?.data ?? '{}'));
    expect(body).toEqual({
      hideOtherUsersTickets: false,
      ignoreGroupMessages: true,
    });
    expect(body.defaultBotChatFlowId).toBeUndefined();
  });

  it('exibe error state quando GET falha', async () => {
    setAdapter(() => Promise.reject({ response: { status: 500, data: {} } }));
    render(
      <Wrapper>
        <PreferencesForm />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('preferences-error')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Confirmar RED**

```bash
pnpm test -- components/preferences/preferences-form.test
```

Expected: FAIL módulo não encontrado.

- [ ] **Step 3: Implementar `PreferencesForm`**

`components/preferences/preferences-form.tsx`:

```tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCurrentUser } from '@/contexts/current-user-context';
import { useCompanySettingsControllerFindMine } from '@/lib/generated/hooks/useCompanySettingsControllerFindMine';
import {
  useCompanySettingsControllerUpdateMine,
  companySettingsControllerUpdateMineMutationKey,
} from '@/lib/generated/hooks/useCompanySettingsControllerUpdateMine';
import { companySettingsControllerFindMineQueryKey } from '@/lib/generated/hooks/useCompanySettingsControllerFindMine';
import type { CompanySettingsResponseDto } from '@/lib/generated/types/CompanySettingsResponseDto';
import { Skeleton } from '@/components/ui/skeleton';
import { PreferencesFormView, type PreferencesFormValues } from './preferences-form-view';

function toFormValues(settings: CompanySettingsResponseDto): PreferencesFormValues {
  return {
    hideOtherUsersTickets: settings.hideOtherUsersTickets,
    agentSeeOtherUsersTicketsOnSameChannel: settings.agentSeeOtherUsersTicketsOnSameChannel,
    agentSeeTicketsWithOtherDefaultAgents: settings.agentSeeTicketsWithOtherDefaultAgents,
    hidePhoneFromAgents: settings.hidePhoneFromAgents,
    ignoreGroupMessages: settings.ignoreGroupMessages,
    showAssignedGroups: settings.showAssignedGroups,
    forceWalletRouting: settings.forceWalletRouting,
    agentCanDeleteContacts: settings.agentCanDeleteContacts,
    agentCanChangeDefaultAgent: settings.agentCanChangeDefaultAgent,
    agentCanEditTags: settings.agentCanEditTags,
    agentCanToggleSignature: settings.agentCanToggleSignature,
    hideBotTicketsFromAgents: settings.hideBotTicketsFromAgents,
  };
}

export function PreferencesForm() {
  const me = useCurrentUser();
  const canEdit = me.role === 'ADMIN' || me.role === 'SUPER_ADMIN';

  const queryClient = useQueryClient();
  const query = useCompanySettingsControllerFindMine();
  const mutation = useCompanySettingsControllerUpdateMine({
    mutation: {
      mutationKey: companySettingsControllerUpdateMineMutationKey(),
      onSuccess: () => {
        toast.success('Preferências atualizadas');
        void queryClient.invalidateQueries({
          queryKey: companySettingsControllerFindMineQueryKey(),
        });
      },
    },
  });

  const defaultValues = useMemo(() => (query.data ? toFormValues(query.data) : null), [query.data]);

  if (query.isPending) {
    return (
      <div data-testid="preferences-skeleton" className="flex flex-col gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError || !defaultValues) {
    return (
      <div
        data-testid="preferences-error"
        className="border-border-default rounded-md border p-6 text-center"
      >
        <p className="text-text-secondary text-sm">
          Não conseguimos carregar as preferências. Recarregue a página.
        </p>
      </div>
    );
  }

  return (
    <PreferencesFormView
      key={query.dataUpdatedAt}
      defaultValues={defaultValues}
      canEdit={canEdit}
      isSubmitting={mutation.isPending}
      onSubmit={(dirty) => mutation.mutate({ data: dirty })}
    />
  );
}
```

(Notas: o `key={query.dataUpdatedAt}` força remount do view após cada GET bem-sucedido — incluindo o re-fetch disparado pelo `invalidateQueries` no `onSuccess` da mutation —, sincronizando o `defaultValues` do RHF com o estado atual do servidor sem precisar de `reset` manual. `defaultBotChatFlowId` deliberadamente fora do `toFormValues` e do payload do PATCH.)

- [ ] **Step 4: Rodar teste (GREEN)**

```bash
pnpm test -- components/preferences/preferences-form.test
```

Expected: 5 testes passam.

- [ ] **Step 5: Rodar suite completa de preferences**

```bash
pnpm test -- preferences
```

Expected: todos os arquivos `components/preferences/*.test.tsx` verdes.

- [ ] **Step 6: Lint + typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: verde.

- [ ] **Step 7: Commit**

```bash
git add components/preferences/preferences-form.tsx components/preferences/preferences-form.test.tsx
git commit -m "feat(preferences): PreferencesForm fetcher + sonner toast + invalidateQueries"
```

---

## Task B6: Substituir `page.tsx` placeholder + criar `loading.tsx` e `error.tsx` locais

**Files:**

- Modify: `app/(app)/configuracoes/preferencias/page.tsx`
- Create: `app/(app)/configuracoes/preferencias/loading.tsx`
- Create: `app/(app)/configuracoes/preferencias/error.tsx`

- [ ] **Step 1: Substituir `page.tsx`**

```tsx
import type { Metadata } from 'next';
import { PreferencesForm } from '@/components/preferences/preferences-form';

export const metadata: Metadata = { title: 'Preferências — DigiChat' };

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-text-primary text-2xl font-semibold">Preferências</h1>
        <p className="text-text-secondary text-sm">
          Configurações que afetam toda a empresa. Apenas administradores podem alterar.
        </p>
      </header>

      <PreferencesForm />
    </div>
  );
}
```

- [ ] **Step 2: Criar `loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-col gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Criar `error.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function PreferencesError({
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
        <h2 className="text-text-primary text-xl font-semibold">
          Não foi possível carregar as preferências
        </h2>
        <p className="text-text-secondary text-sm">Tente novamente em instantes.</p>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Lint, typecheck, test**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: tudo verde.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/configuracoes/preferencias/
git commit -m "feat(preferences): replace placeholder with real page + loading + error"
```

---

## Task B7: Adicionar subseção `PreferenceSection` ao showcase do design-system

**Files:**

- Create: `app/(app)/configuracoes/design-system/_sections/composites-preferences.tsx`
- Modify: `app/(app)/configuracoes/design-system/page.tsx` (wireup) — depende da estrutura atual; ver Step 2.
- Modify: `app/(app)/configuracoes/design-system/toc.tsx` (se necessário)

- [ ] **Step 1: Criar a subseção do showcase**

`app/(app)/configuracoes/design-system/_sections/composites-preferences.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { PreferenceSection } from '@/components/preferences/preference-section';
import { PreferenceSwitchRow } from '@/components/preferences/preference-switch-row';

export function CompositesPreferences() {
  const [hideTickets, setHideTickets] = useState(true);
  const [forceRouting, setForceRouting] = useState(false);
  const [agentTags, setAgentTags] = useState(false);

  return (
    <section id="compostos-preferences" className="flex flex-col gap-6">
      <header>
        <h3 className="text-text-primary text-base font-semibold">
          Preferences (Card de configuração)
        </h3>
        <p className="text-text-secondary text-sm">
          Card temático com header descritivo e linhas de toggle. Usado em{' '}
          <code>/configuracoes/preferencias</code>.
        </p>
      </header>

      <PreferenceSection title="Visibilidade de tickets" description="Quem enxerga o quê na fila.">
        <PreferenceSwitchRow
          id="ds-hide-tickets"
          label="Ocultar tickets de outros atendentes"
          description="Atendente vê apenas tickets atribuídos a ele e os pendentes do departamento."
          checked={hideTickets}
          onCheckedChange={setHideTickets}
        />
        <PreferenceSwitchRow
          id="ds-force-routing"
          label="Forçar roteamento por carteira"
          description="Atribui automaticamente o ticket ao responsável padrão (carteira) do contato."
          checked={forceRouting}
          onCheckedChange={setForceRouting}
        />
      </PreferenceSection>

      <PreferenceSection
        title="Permissões do atendente (disabled)"
        description="Demonstração com switches em estado disabled e tooltip de razão."
      >
        <PreferenceSwitchRow
          id="ds-agent-tags-disabled"
          label="Atendente pode editar tags do contato"
          description="Libera adicionar e remover tags no contato durante o atendimento."
          checked={agentTags}
          onCheckedChange={setAgentTags}
          disabled
          disabledReason="Apenas administradores podem alterar"
        />
      </PreferenceSection>
    </section>
  );
}
```

- [ ] **Step 2: Wireup na página do design-system**

Inspecionar primeiro:

```bash
cat app/\(app\)/configuracoes/design-system/page.tsx
cat app/\(app\)/configuracoes/design-system/_sections/composites.tsx 2>/dev/null | head -40
```

Se `<Composites />` é um wrapper com sub-componentes hardcoded, adicionar `<CompositesPreferences />` ao final dele. Se `Composites` não existir como arquivo separado mas está inline em `page.tsx`, adicionar diretamente lá. Manter o ToC consistente: se há `{ id: 'compostos', label: 'Compostos' }`, o anchor `#compostos-preferences` da nova subseção fica aninhado dentro daquela seção e não precisa entrada própria no ToC (consistente com as outras subseções compostas — confirmar).

Edição mínima viável: importar e renderizar `<CompositesPreferences />` dentro do `<Section id="compostos">` ou dentro do `<Composites />`, depois das outras subseções compostas existentes.

- [ ] **Step 3: Subir o dev server e abrir `/configuracoes/design-system`**

```bash
pnpm dev &  # rodar em background pelo agente humano
```

Validação manual: navegar até a seção Compostos → confirmar que aparece "Preferences (Card de configuração)" com 2 cards de exemplo, switches alternam, tooltip de disabled aparece em foco.

- [ ] **Step 4: Lint + typecheck + test**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: verde.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/configuracoes/design-system/
git commit -m "docs(design-system): showcase de PreferenceSection + PreferenceSwitchRow"
```

---

## Task B8: Validação manual end-to-end + push + PR

**Files:** N/A

- [ ] **Step 1: Subir dev server e validar fluxos manualmente**

```bash
pnpm dev
```

Em outra janela ou via UI:

1. **Login com ADMIN** → `/configuracoes/preferencias`:
   - Os 6 cards com 12 toggles aparecem populados.
   - Toggle de qualquer switch habilita "Salvar" e "Descartar".
   - Click em "Salvar alterações" → toast verde "Preferências atualizadas". Refresh F5 mantém o valor.
   - Click em "Descartar" → reverte sem PATCH.
2. **Login com AGENT** → `/configuracoes/preferencias`:
   - Todos os switches `disabled`. Tooltip "Apenas administradores podem alterar" aparece ao focar/hover.
   - Footer com botões NÃO renderiza.
3. **Toggle dark/light** (`/configuracoes/preferencias` aberto): cards e switches legíveis em ambos.
4. **`/configuracoes/design-system` (login ADMIN)**: subseção nova de Preferences renderiza, não quebra nada.
5. **Sidebar** com login AGENT/SUPERVISOR: item "Preferências" aparece dentro de Configurações; click leva pra rota.

Se algum passo falhar, voltar pra task anterior, corrigir, re-validar.

- [ ] **Step 2: Validação automatizada final**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

Expected: tudo verde.

- [ ] **Step 3: Push e abrir PR**

```bash
git push -u origin feat/sprint-0-22-preferencias
gh pr create --title "feat(preferences): tela /configuracoes/preferencias (Sprint 0.22)" --body "$(cat <<'EOF'
## Summary

Substitui o placeholder de `/configuracoes/preferencias` por um form real
com 12 toggles em 6 cards consumindo `GET/PATCH /companies/me/settings`.

- Save explícito via botão sticky (Salvar / Descartar), envia apenas campos dirty
- RBAC inline: ADMIN edita, AGENT/SUPERVISOR visualizam (toggles disabled, sem footer)
- `defaultBotChatFlowId` fora do escopo (depende de ChatFlow — Fase 3a)
- Componentes shared `PreferenceSection` e `PreferenceSwitchRow` com showcase no `/configuracoes/design-system`
- `lib/rbac.ts` libera `/configuracoes/preferencias` para AGENT e SUPERVISOR
- Sync de `openapi.snapshot.json` + regen Kubb após merge do PR `fix(company-settings): expose response schemas in OpenAPI` no crm-api

## Test plan

- [x] `pnpm test` passa (PreferenceSwitchRow, PreferenceSection, PreferencesFormView, PreferencesForm, rbac)
- [x] `pnpm lint && pnpm typecheck && pnpm format:check` verdes
- [x] Manual: ADMIN edita, AGENT vê disabled, dark/light, showcase OK
EOF
)"
```

Expected: PR aberto. Anotar URL, reportar pro humano.

- [ ] **Step 4: Após merge, limpar worktree**

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web
git worktree remove /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web-worktrees/sprint-0-22-preferencias
git fetch origin && git checkout main && git pull
```

---

## Task B9 (post-merge): Atualizar ROADMAP em PRs separados

**Files:**

- Modify: `crm-web/ROADMAP.md` §4.8 — marcar Sprint 0.22 como entregue
- Modify: `crm-api/ROADMAP.md` — marcar item correspondente da Fase 0

- [ ] **Step 1: Branch dedicada `docs/update-roadmap-0-22` em cada repo, commit, push, PR**

(Mecânica padrão. Não detalhada aqui pra evitar inflar o plano.)

---

## Self-review

**Spec coverage:**

- §1 Objetivo → toda a Phase B
- §2.1 Save explícito → Task B4 (footer + dirty)
- §2.2 Botões dirty-aware → Task B4
- §2.3 `defaultBotChatFlowId` fora → Task B5 `toFormValues` + payload
- §2.4 RBAC inline → Tasks B4 (canEdit prop) + B5 (`useCurrentUser`)
- §2.5 Pasta `components/preferences/` → Tasks B2–B5
- §2.6 Page slim + skeleton + sem Suspense → Task B6
- §2.7 loading.tsx + error.tsx locais → Task B6
- §2.8 Schema deriva do Kubb → adendo: o spec original sugeria `omit({ defaultBotChatFlowId: true })`; mas como Update DTO é todos opcionais e o form modela 12 booleanos required (do response), `formSchema` aqui é construído explicitamente com os 12 nomes. Equivalente em conteúdo — ver explicação inline no plano (Task B4). **Sem gap.**
- §2.9 Sidebar item já existe → Task B1 só ajusta RBAC
- §2.10 Sem E2E real → Tasks B4 + B5 cobrem RTL
- §2.11 Componentes shared no showcase → Task B7
- §3.1 12 flags com copy → Task B4 `SECTIONS`
- §3.2 Estados loading/empty/error/success → Task B5 + B6
- §3.3 Comportamento do form → Task B4 + B5
- §4 Estrutura de arquivos → conforme Files
- §5.1 Tipos do Kubb → Task B0 regen + B5 imports
- §5.2 Props dos componentes → Tasks B2 + B3
- §5.3 PreferencesForm pseudo → Task B5
- §6 RBAC → Task B1
- §7 Acessibilidade → Tasks B2 (ARIA) + B4 (label)
- §8 Telemetria → out of scope, OK
- §9 Testes RTL → Tasks B2, B3, B4, B5
- §10 Validação final → Task B8
- §11 Pré-requisito backend → Phase A
- §12 ROADMAP → Task B9
- §13 Restrições → recap, sem nova task

**Placeholder scan:** nenhum "TBD"/"TODO" em steps (apenas em validações que pedem confirmação local — ex: comando do snapshot do crm-api). Marcado claramente onde precisa confirmar.

**Type consistency:**

- `PreferencesFormValues` tem 12 chaves; `toFormValues` mapeia 12; `SECTIONS` lista 12 (3+1+2+1+4+1) → consistente.
- `companySettingsControllerFindMineQueryKey` importado do hook do GET (re-export verificado em [`useCompanySettingsControllerFindMine.ts:12`](crm-web/lib/generated/hooks/useCompanySettingsControllerFindMine.ts#L12)).
- `companySettingsControllerUpdateMineMutationKey` importado do hook do PATCH (verificado em [`useCompanySettingsControllerUpdateMine.ts:12`](crm-web/lib/generated/hooks/useCompanySettingsControllerUpdateMine.ts#L12)).
- `CompanySettingsResponseDto` import path: `@/lib/generated/types/CompanySettingsResponseDto` — só existirá após Task B0 (regen). Documento isso na premissa.
