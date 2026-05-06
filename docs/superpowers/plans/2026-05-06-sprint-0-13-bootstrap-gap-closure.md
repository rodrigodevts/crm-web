# Sprint 0.13 — Bootstrap gap closure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar 5 gaps materiais do bootstrap do crm-web (LICENSE, deps zustand+socket.io-client, drift check de tipos no CI via snapshot OpenAPI, smoke test do tipo gerado, adaptação de ROADMAP.md+CLAUDE.md raiz pro escopo frontend).

**Architecture:** Mudanças cirúrgicas. Nenhuma refatoração lateral. Cada task gera commit Conventional. Sem touch em scaffolding pronto (Next.js, shadcn, kubb.config.ts, eslint, prettier, vitest, lefthook). Drift de tipos detectado via comparação `git diff` em `lib/generated/` após regenerar contra `openapi.snapshot.json` commitado na raiz.

**Tech Stack:** Next.js 16.2.4, Tailwind 4, Vitest 4, Kubb 4, pnpm 10, GitHub Actions, lefthook, AGPLv3.

**Spec:** [`docs/superpowers/specs/2026-05-06-sprint-0-13-bootstrap-gap-closure-design.md`](../specs/2026-05-06-sprint-0-13-bootstrap-gap-closure-design.md)

**Branch alvo:** `feat/sprint-0-13-bootstrap-gap-closure` (já criada da `origin/main` atualizado, spec já commitado em `9644ad2`).

---

## Pré-requisitos

- crm-api rodando localmente em `http://localhost:3000` para capturar o snapshot OpenAPI (Task 4).
  - Se não estiver rodando: `cd ../crm-api && pnpm start:dev` em outro terminal.
  - Confirmação: `curl -s http://localhost:3000/api/v1/openapi.json | head -c 50` retorna JSON válido.

---

## Task 1: Sanity check do ambiente

Verifica que estamos na branch certa, working tree limpo, e que `pnpm install --frozen-lockfile` está OK antes de começar.

**Files:** nenhum modificado.

- [ ] **Step 1.1: Confirmar branch e working tree**

Run:

```bash
git branch --show-current
git status --short
```

Expected:

- branch: `feat/sprint-0-13-bootstrap-gap-closure`
- status: vazio (working tree limpo)

Se a branch não bater, criar via `git checkout -b feat/sprint-0-13-bootstrap-gap-closure origin/main` (após `git fetch origin`).

- [ ] **Step 1.2: Confirmar deps instaladas**

Run:

```bash
pnpm install --frozen-lockfile
```

Expected: zero alterações, "Lockfile is up to date" ou equivalente.

- [ ] **Step 1.3: Confirmar baseline verde**

Run:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Expected: todos verdes. Se algum falhar, parar e investigar — não é trabalho desta sprint corrigir baseline existente.

---

## Task 2: Adicionar LICENSE AGPLv3

**Files:**

- Create: `LICENSE` (cópia byte-a-byte de `../crm-api/LICENSE`)

- [ ] **Step 2.1: Copiar LICENSE do crm-api**

Run:

```bash
cp ../crm-api/LICENSE ./LICENSE
```

- [ ] **Step 2.2: Verificar bytes idênticos**

Run:

```bash
diff -q ./LICENSE ../crm-api/LICENSE && wc -l ./LICENSE
```

Expected:

- `diff` sem saída (arquivos idênticos)
- `wc -l` retorna `661`

- [ ] **Step 2.3: Confirmar primeira linha**

Run:

```bash
head -1 ./LICENSE
```

Expected: `                    GNU AFFERO GENERAL PUBLIC LICENSE`

- [ ] **Step 2.4: Commit**

```bash
git add LICENSE
git commit -m "$(cat <<'EOF'
chore: add LICENSE (AGPLv3)

Copia do LICENSE do crm-api. Mesmo licenciamento (AGPL-3.0-or-later
declarado em package.json) — o arquivo estava ausente.
EOF
)"
```

Expected: commit cria `LICENSE`. Pre-commit hooks rodam (format pode tocar nada, typecheck/lint não aplicam).

---

## Task 3: Instalar zustand e socket.io-client

**Files:**

- Modify: `package.json` (adicionar 2 deps em `dependencies`)
- Modify: `pnpm-lock.yaml` (gerado)

- [ ] **Step 3.1: Instalar deps**

Run:

```bash
pnpm add zustand socket.io-client
```

Expected: Comando finaliza sem erro. `package.json` ganha entradas em `dependencies`.

- [ ] **Step 3.2: Verificar entradas em package.json**

Run:

```bash
grep -E '"(zustand|socket\.io-client)"' package.json
```

Expected: 2 linhas com versões. `zustand` deve ser `^5.x` e `socket.io-client` deve ser `^4.x` ou superior.

- [ ] **Step 3.3: Confirmar baseline ainda verde**

Run:

```bash
pnpm typecheck && pnpm test
```

Expected: ambos verdes. Nenhum import novo ainda — só deps declaradas.

- [ ] **Step 3.4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore(deps): add zustand and socket.io-client

Declarados no ARCHITECTURE.md §4 como parte do stack frontend mas
ausentes do package.json. Sem uso ainda — ficam disponíveis pras
próximas sprints (state global e realtime).
EOF
)"
```

---

## Task 4: Capturar `openapi.snapshot.json` da API ao vivo

**Files:**

- Create: `openapi.snapshot.json` (raiz)

- [ ] **Step 4.1: Confirmar crm-api rodando**

Run:

```bash
curl -sf http://localhost:3000/api/v1/openapi.json -o /dev/null && echo "OK" || echo "API NOT RUNNING"
```

Expected: `OK`. Se "API NOT RUNNING", subir crm-api em outro terminal antes de continuar (`cd ../crm-api && pnpm start:dev`).

- [ ] **Step 4.2: Capturar snapshot**

Run:

```bash
curl -s http://localhost:3000/api/v1/openapi.json | jq '.' > openapi.snapshot.json
```

Expected: arquivo `openapi.snapshot.json` criado com JSON formatado (jq pretty-print pra reduzir ruído de diff).

Se `jq` não estiver disponível, usar:

```bash
curl -s http://localhost:3000/api/v1/openapi.json | node -e "process.stdin.on('data', d=>{process.stdout.write(JSON.stringify(JSON.parse(d), null, 2))})" > openapi.snapshot.json
```

- [ ] **Step 4.3: Validar conteúdo do snapshot**

Run:

```bash
jq '.openapi, .info.title, (.paths | keys | length)' openapi.snapshot.json
```

Expected: versão OpenAPI, título da API, e número de paths > 0. Pelo menos `/api/v1/health` deve estar presente:

```bash
jq '.paths | keys' openapi.snapshot.json | grep -i health
```

Expected: pelo menos uma linha contendo `health`.

- [ ] **Step 4.4: Não commitar ainda — depende da próxima task**

Snapshot fica untracked. Próxima task valida que regenerar contra ele produz output idêntico ao atual.

---

## Task 5: Validar determinismo do Kubb contra snapshot

Antes de adicionar script e CI, confirmar empiricamente que `kubb generate` com input local produz exatamente o mesmo `lib/generated/` que está commitado. Isso valida o snapshot E o determinismo do Kubb.

**Files:** nenhum modificado de fato (lib/generated deve não mudar).

- [ ] **Step 5.1: Rodar kubb apontando pro snapshot**

Run:

```bash
API_OPENAPI_URL=./openapi.snapshot.json pnpm generate:api
```

Expected: comando termina sem erro.

- [ ] **Step 5.2: Verificar zero diff em lib/generated**

Run:

```bash
git diff --stat lib/generated
```

Expected: vazio. Se aparecer diff:

- Diff cosmético/whitespace → Kubb mudou de versão entre o `lib/generated` commitado e agora. Aceitar diff (representa state atual), commitar como parte da próxima task de smoke test.
- Diff semântico (mudança de schema/endpoints) → o `crm-api` mudou desde a última geração do `lib/generated`. Aceitar diff e commitar.
- Diff intermitente entre execuções (não-determinismo) → BLOQUEADOR. Parar e investigar Kubb config.

- [ ] **Step 5.3: Se houve diff em 5.2, rodar de novo pra confirmar estabilidade**

Run:

```bash
API_OPENAPI_URL=./openapi.snapshot.json pnpm generate:api
git diff --stat lib/generated
```

Expected: diff IDÊNTICO ao da Step 5.2. Se mudar entre runs, é não-determinismo — bloqueador.

- [ ] **Step 5.4: Resumir achado**

Decisão de design:

- Sem diff: prosseguir; o snapshot atual reflete o `lib/generated` commitado.
- Diff estável (igual entre runs): aceitar; commitar `lib/generated` regenerado junto com o snapshot na Task 6.
- Diff instável: parar plano, abrir investigação separada.

---

## Task 6: Adicionar script `generate:api:from-snapshot` e commitar snapshot

**Files:**

- Modify: `package.json` (novo script)
- Create: `openapi.snapshot.json` (commitar)
- Modify (talvez): `lib/generated/**` (se Task 5 produziu diff estável aceito)

- [ ] **Step 6.1: Adicionar script em package.json**

Editar `package.json`. Localizar bloco `"scripts"`. Logo após a linha `"generate:api": "kubb generate",` adicionar:

```json
"generate:api:from-snapshot": "API_OPENAPI_URL=./openapi.snapshot.json kubb generate",
```

Resultado esperado em `package.json`:

```json
"generate:api": "kubb generate",
"generate:api:from-snapshot": "API_OPENAPI_URL=./openapi.snapshot.json kubb generate",
```

- [ ] **Step 6.2: Validar script via pnpm**

Run:

```bash
pnpm generate:api:from-snapshot
git diff --exit-code lib/generated
```

Expected: comando termina sem erro. `git diff --exit-code` retorna 0 (zero diff vs ponto pós-Task 5).

- [ ] **Step 6.3: Commit do snapshot + script + (se aplicável) lib/generated regenerado**

```bash
git add openapi.snapshot.json package.json
git diff --cached --stat lib/generated >/dev/null 2>&1 && git add lib/generated
git status --short
```

Expected output do `git status`: `openapi.snapshot.json` (novo), `package.json` (modificado), e talvez arquivos em `lib/generated/` se Task 5 aceitou diff estável.

```bash
git commit -m "$(cat <<'EOF'
chore(api-types): add openapi.snapshot.json and from-snapshot script

Snapshot do OpenAPI do crm-api commitado para que CI valide drift
de tipos sem precisar subir o backend. Novo script
'generate:api:from-snapshot' regenera lib/generated apontando pro
snapshot local em vez do backend ao vivo.

Drift detection no CI vem na próxima task.
EOF
)"
```

---

## Task 7: Smoke test do tipo gerado

TDD adaptado: como `lib/generated/` já existe, o teste passa de cara contra o artefato atual. Valor é regredir se Kubb mudar shape ou se barrel quebrar.

**Files:**

- Create: `lib/generated.test.ts`

**Conferido durante brainstorm:**

- `HealthResponseDto` em `lib/generated/types/HealthResponseDto.ts` tem 3 campos: `status` (enum `'ok'`), `uptime` (number ≥ 0), `timestamp` (ISO datetime com offset).
- `healthResponseDtoSchema` em `lib/generated/schemas/healthResponseDtoSchema.ts` valida os 3 campos.
- Barrel em `lib/generated/index.ts` exporta tipo e schema.

- [ ] **Step 7.1: Escrever o teste primeiro (red — esperado: passa porque artefato existe)**

Criar `lib/generated.test.ts`:

```typescript
import { describe, expect, expectTypeOf, it } from 'vitest';
import { healthResponseDtoSchema, type HealthResponseDto } from '@/lib/generated';

describe('lib/generated — smoke test', () => {
  it('expõe o tipo HealthResponseDto com a shape esperada', () => {
    expectTypeOf<HealthResponseDto>().toHaveProperty('status');
    expectTypeOf<HealthResponseDto>().toHaveProperty('uptime');
    expectTypeOf<HealthResponseDto>().toHaveProperty('timestamp');
  });

  it('valida payload válido do health endpoint', () => {
    const result = healthResponseDtoSchema.safeParse({
      status: 'ok',
      uptime: 123,
      timestamp: '2026-05-06T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita payload com status inválido', () => {
    const result = healthResponseDtoSchema.safeParse({
      status: 'broken',
      uptime: 0,
      timestamp: '2026-05-06T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 7.2: Rodar teste (espera-se PASS porque artefato já existe)**

Run:

```bash
pnpm test -- lib/generated.test.ts
```

Expected: 3 testes passam. Se algum falhar:

- Falha de import → barrel está dessincronizado; investigar antes de prosseguir.
- Falha do `safeParse` válido → schema mudou (novo campo obrigatório, etc); ajustar payload do teste.
- Falha do `safeParse` inválido (deveria rejeitar e não rejeitou) → schema mudou; investigar.

- [ ] **Step 7.3: Confirmar suite inteira ainda verde**

Run:

```bash
pnpm test
```

Expected: todos os testes passam (smoke novo + login-form pré-existente).

- [ ] **Step 7.4: Commit**

```bash
git add lib/generated.test.ts
git commit -m "$(cat <<'EOF'
test(generated): add smoke test for kubb-generated types

Valida que o barrel lib/generated exporta type+schema do health
endpoint, que o Zod schema aceita payload bem-formado e rejeita
status fora do enum. Pega regressões de shape sem chamar a API.
EOF
)"
```

---

## Task 8: CI — drift detection em `lib/generated`

**Files:**

- Modify: `.github/workflows/ci.yml`

- [ ] **Step 8.1: Editar `.github/workflows/ci.yml`**

Localizar o bloco de steps. Inserir 2 steps novos **entre** o step `Typecheck` e o step `Test`:

```yaml
- name: Generate API types from snapshot
  run: pnpm generate:api:from-snapshot

- name: Detect API types drift
  run: |
    if ! git diff --exit-code --stat lib/generated; then
      echo "::error::lib/generated/ está dessincronizado com openapi.snapshot.json."
      echo "Rode 'pnpm generate:api:from-snapshot' localmente e comite a saída."
      exit 1
    fi
```

Resultado: o step `Test` continua sendo o próximo, sem mais alterações.

- [ ] **Step 8.2: Verificar formato do YAML**

Run:

```bash
cat .github/workflows/ci.yml | grep -A 1 "Generate API types"
cat .github/workflows/ci.yml | grep -A 6 "Detect API types drift"
```

Expected: blocos novos presentes e indentados consistente com os steps vizinhos (6 espaços antes de `-`).

- [ ] **Step 8.3: Simular drift detection localmente**

Run:

```bash
pnpm generate:api:from-snapshot
git diff --exit-code lib/generated && echo "OK — sem drift"
```

Expected: `OK — sem drift`. Confirma que o step do CI vai passar.

- [ ] **Step 8.4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci: detect drift between openapi.snapshot.json and lib/generated

Novo step que regenera lib/generated contra o snapshot commitado e
falha se o diff for não-vazio. Pega PRs que esquecem de comitar
lib/generated regenerado depois de atualizar o snapshot.
EOF
)"
```

---

## Task 9: Adaptar `CLAUDE.md` raiz pro escopo frontend

**Files:**

- Modify: `CLAUDE.md` (raiz)

A versão atual é cópia verbatim do `crm-api/CLAUDE.md` e referencia regras de backend (Prisma, multi-tenant-checklist, NestJS 3 camadas, etc) que não se aplicam ao frontend.

- [ ] **Step 9.1: Reescrever CLAUDE.md raiz**

Substituir o conteúdo inteiro de `CLAUDE.md` pelo seguinte:

````markdown
# CLAUDE.md — DigiChat Web (raiz)

> Instruções operacionais para Claude Code no `crm-web`. **Leia este arquivo a cada sessão antes de qualquer ação.**
>
> Documento diretivo, não descritivo. Cada regra tem trigger explícito.
>
> **Para regras de domínio e backend, ver `../crm-api/CLAUDE.md`.** Este arquivo cobre só o frontend.

---

## 1. Você está no projeto DigiChat Web

Frontend Next.js 16 (App Router) do CRM omnichannel WhatsApp multi-tenant DigiChat. Stack: Next.js 16 + React 19 + Tailwind 4 + shadcn/ui + TanStack Query 5 + Zustand + React Hook Form + Zod + socket.io-client + Kubb.

Filosofia: AGPLv3 open-source, dev solo com Claude Code, médio-termo. Sem over-engineering.

Backend correspondente vive em `../crm-api/` (NestJS + Fastify + Prisma + Postgres + Redis + BullMQ).

---

## 2. Antes de QUALQUER ação, leia

A cada sessão nova, sempre:

1. **Este arquivo** (`CLAUDE.md` raiz crm-web) — você está aqui
2. **`ROADMAP.md`** raiz crm-web — confirme em qual fase/sprint estamos
3. **`ARCHITECTURE.md`** raiz crm-web — fundação técnica do projeto inteiro (cópia da do crm-api, serve como referência canônica)
4. **`design-system.md`** raiz crm-web — cores, tipografia, espaçamento, componentes
5. **`WORKFLOW.md`** raiz crm-web — workflow Superpowers

Não pule essa leitura mesmo que pareça redundante. Decisões mudam.

---

## 3. Triggers de leitura por contexto

### Antes de modificar UI / componente

**LEIA SEMPRE:** `design-system.md`

Cores, tipografia, espaçamento, componentes shadcn/ui, estados.

### Antes de consumir endpoint do backend

**Confira `lib/generated/`** (gerado por Kubb).

- Se faltar tipo/hook/schema do endpoint → rodar `pnpm generate:api` (com crm-api rodando) ou `pnpm generate:api:from-snapshot`.
- Se ainda faltar → é gap no backend. Reportar e adicionar lá. **Nunca** inventar tipo local nem `as Type` pra contornar.
- `lib/generated/` é código gerado. **Não editar à mão.**

### Antes de implementar UI de área específica do produto

**LEIA o audit** em `../crm-specs/audits/` (se acessível):

- Canais → `audit-04-canais.md`
- Configurações (Departments, Tags, Users, etc) → `audit-03A/03B/03C-*.md`
- Bot/Fluxo → `audit-05-bot-fluxo.md`
- Atendimentos/Tickets → `audit-06-atendimentos.md`

Audits são o contrato visual e comportamental.

### Antes de adicionar dependência nova (npm package)

**Pergunte ao humano antes.** Lista de libs aprovadas em `ARCHITECTURE.md` §4 (Frontend `crm-web`). Se não estiver lá, requer aprovação.

---

## 4. Regras não-negociáveis

### TypeScript estrito

1. **Sem `any` ou `as Type`** sem comentário justificando.
2. **TypeScript strict ligado** (`strict`, `noUncheckedIndexedAccess`). Não relaxar.

### Tipos vêm do backend

3. **DTOs do backend são fonte da verdade.** Importe de `@/lib/generated` — types, schemas Zod e hooks TanStack Query.
4. **Forms** usam o mesmo schema Zod do backend (via `@hookform/resolvers/zod`) sempre que possível.
5. **`lib/generated/` não é editável.** Para customizar, ajustar schema no backend e regenerar.

### Texto pro usuário em pt-BR

6. **Strings visíveis** (labels, mensagens, erros) em pt-BR.
7. **Identificadores no código em inglês** (variáveis, funções, componentes).

### Server vs Client Components

8. **Default é Server Component.** Adicionar `'use client'` só em componentes que precisam de hooks de interatividade (useState, useEffect, useQuery, etc).
9. **Não misturar** lógica que pertence ao server (fetch, secrets) dentro de Client Components.

### Pastas read-only (referência arquitetural)

10. **`/home/rodrigo-digigov/referencias/chatwoot`** é apenas referência arquitetural pra leitura. NUNCA modifique, crie ou delete arquivos lá.

### Branch e PR

11. **`main` é branch protegida.** Push direto falha. Toda mudança vai em branch separada e mergeada via PR.
12. **Padrão de nome de branch:** prefixo Conventional. `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`, `refactor/<slug>`, `style/<slug>`, `test/<slug>`.
13. **Crie a branch a partir de `origin/main` atualizado** antes do primeiro commit.
14. **Sem bypass:** sem `git push --force` em main, sem `--no-verify`. PR é o caminho.

### CI: drift de tipos gerados

15. **Se o backend muda OpenAPI, o frontend deve regenerar.** `lib/generated/` regenerado contra `openapi.snapshot.json` deve ter zero diff em CI. Se você atualizar o snapshot, comite o `lib/generated` correspondente no mesmo PR.

---

## 5. Workflow padrão (com Superpowers)

Detalhado em `WORKFLOW.md`. Resumo:

```
1. Você descreve o que quer construir
2. Superpowers ativa /brainstorming → refina requisitos
3. Você aprova design
4. Superpowers ativa /write-plan → plano multi-step
5. Cria git worktree isolado
6. Superpowers ativa /execute-plan
   - TDD: testes primeiro
   - Cada step: implementa, valida, code review
7. Verificação final (testes, lint, typecheck, build)
8. Merge ou PR
```

Antes de codar: sempre brainstorm. Antes de declarar pronto: verificação por evidência (`pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`).

---

## 6. Quando perguntar (e quando não)

### SEMPRE pergunte ao humano antes de:

- Adicionar dependência nova
- Criar componente novo se já existe similar (preferir reuso/extensão)
- Mudar tema do design-system (cores, tipografia base)
- Refatorar código existente que não foi pedido
- Tomar decisão arquitetural não documentada
- Implementar feature de fase futura no ROADMAP
- Pular regra de algum CLAUDE.md de subdiretório

### NÃO precisa perguntar para:

- Aplicar padrão já estabelecido em outro componente
- Renomear variável local
- Ajustar formatação/lint
- Escrever teste pra função/componente recém-criado
- Atualizar documentação que está desatualizada

**Quando em dúvida sobre se deve perguntar: pergunte.**

---

## 7. Padrões de erro a evitar (TOP 7)

1. **Editar `lib/generated/` à mão.** É sobrescrito no próximo `pnpm generate:api`.
2. **Inventar tipo local porque o backend não expôs.** Reporte como gap, não faça shim.
3. **Reescrever component existente sem ser pedido.** Modificação cirúrgica, não refactor lateral.
4. **Adicionar lib não-aprovada.** Use só o que está em `ARCHITECTURE.md` §4 frontend.
5. **Misturar Server Component e Client Component sem critério.** Default Server; `'use client'` só onde precisa.
6. **`any` ou `as Type` sem comentário.** TypeScript estrito é não-negociável.
7. **Criar arquivos não pedidos.** Se feature pediu X, não crie testes/docs/configs extras sem necessidade.

---

## 8. Subdiretórios com `CLAUDE.md` próprio

Quando trabalhando dentro destas pastas, leia também o `CLAUDE.md` específico:

- `app/CLAUDE.md` — convenções de rotas e layouts
- `components/CLAUDE.md` — convenções de componentes
- `lib/CLAUDE.md` — aviso da pasta `lib/generated/` (gerada, não editar)

Claude Code lê `CLAUDE.md` da pasta atual automaticamente.

---

## 9. Quando precisar de informação que não está em nenhum arquivo

Hierarquia de busca:

1. **Audit da feature** em `../crm-specs/audits/` (se acessível) — primeira consulta pra UI/comportamento
2. **Spec descritiva do sistema atual** em `../crm-specs/areas/`
3. **Backend correspondente** em `../crm-api/` — schemas Zod, audits, ARCHITECTURE.md
4. **Chatwoot** clonado em `/home/rodrigo-digigov/referencias/chatwoot` — referência **read-only** de padrões de UI/socket (Vue, traduzir mentalmente pra React)
5. **Doc oficial** da lib (Next.js, Tailwind, shadcn, TanStack Query, Zod, etc) — nunca chutar API
6. **Pergunta ao humano** — se nada acima resolver

NÃO improvise comportamento crítico. Pergunte.

---

## 10. Ao final de cada sessão

Verifique:

- [ ] Documentação atualizada se descobriu algo novo
- [ ] `ARCHITECTURE.md` atualizado se houve decisão arquitetural relevante
- [ ] `lib/generated/` regenerado se o backend mudou OpenAPI
- [ ] Testes passando (`pnpm test`)
- [ ] Lint, typecheck, format e build OK
- [ ] Commit message segue Conventional Commits

Reporte ao humano:

- O que foi feito
- O que ficou pendente
- Decisões tomadas que não estavam no plano
- Próximo passo sugerido
````

- [ ] **Step 9.2: Validar render do markdown rapidamente**

Run:

```bash
head -1 CLAUDE.md
wc -l CLAUDE.md
grep -c "^##" CLAUDE.md
```

Expected:

- Primeira linha: `# CLAUDE.md — DigiChat Web (raiz)`
- Linhas: > 150 (rough)
- Heading `##` count: 10 (seções 1–10)

- [ ] **Step 9.3: Pre-commit format check**

Run:

```bash
pnpm format:check CLAUDE.md 2>&1 || pnpm prettier --check CLAUDE.md
```

Se `prettier` reclamar, formatar:

```bash
pnpm prettier --write CLAUDE.md
```

- [ ] **Step 9.4: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(claude): rewrite CLAUDE.md raiz pro escopo frontend

A versão anterior era cópia verbatim do crm-api e referenciava
regras de backend (Prisma, multi-tenant-checklist, 3 camadas
NestJS, working hours) que não se aplicam aqui. Substituída por
uma versão dirigida ao Claude Code dentro do crm-web: triggers
ligados a UI/design-system, lib/generated, deps frontend; regras
não-negociáveis focadas em TypeScript estrito, tipos vindos do
backend, Server vs Client Components, branch e PR; padrões TOP 7
de erros a evitar reescritos pra contexto frontend.

Backend e domínio continuam com fonte da verdade em
../crm-api/CLAUDE.md (referenciado).
EOF
)"
```

---

## Task 10: Adaptar `ROADMAP.md` raiz pro escopo frontend

**Files:**

- Modify: `ROADMAP.md` (raiz)

A versão atual é cópia verbatim do `crm-api/ROADMAP.md` v6 (27/04/2026, status "aguardando" em todas as fases). Adaptação: encolher pra fatia frontend, marcar feito o que já existe, incluir Sprint 0.13 em rastreamento.

- [ ] **Step 10.1: Reescrever ROADMAP.md raiz**

Substituir o conteúdo inteiro de `ROADMAP.md` pelo seguinte:

```markdown
# ROADMAP.md — crm-web

> Plano de fases do **frontend** (`crm-web`). Para escopo backend, ver `../crm-api/ROADMAP.md` — fonte canônica.
>
> **Versão:** 7 (fatia frontend)
> **Última atualização:** 06/05/2026
>
> **Documento companheiro:** `ARCHITECTURE.md` (raiz crm-web).

---

## Sumário

1. Premissas
2. Critério de "fase pronta"
3. Mapa geral de fases
4. Fase 0 — Bootstrap do crm-web
5. Fases 1–8 — fatia frontend
6. Rastreamento

---

## 1. Premissas

- Dev solo, ~3h/dia × 6 dias/semana.
- Filosofia médio-termo: bem feito, focado no essencial.
- Cada fase deve ser entregável e testável end-to-end antes da próxima.
- Estimativas em semanas são chutes calibrados — não promessas.
- **Frontend e backend evoluem em paralelo.** Cada fase tem entregáveis em ambos os repos. Este documento cobre só `crm-web`.

---

## 2. Critério de "fase pronta" (frontend)

1. Telas funcionando em ambiente de desenvolvimento contra crm-api real.
2. Testes passando (`pnpm test`).
3. `pnpm typecheck`, `pnpm lint`, `pnpm build` verdes.
4. `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` zero diff.
5. Documentação atualizada (`ARCHITECTURE.md` se houver mudança arquitetural).
6. Validação manual end-to-end conforme checklist da fase.

---

## 3. Mapa geral de fases

| #   | Nome                                             | Estimativa  | Status       |
| --- | ------------------------------------------------ | ----------- | ------------ |
| 0   | Bootstrap do crm-web                             | 1-2 semanas | em andamento |
| 1   | Tela de canal Gupshup (config + status realtime) | 1-2 semanas | aguardando   |
| 2   | UI Izing-like de Atendimentos + composer HSM     | 4-5 semanas | aguardando   |
| 3a  | Editor JSON estruturado de Bot/Fluxo             | 3-4 semanas | aguardando   |
| 3b  | Templates de fluxo + simulador                   | 2-3 semanas | aguardando   |
| 4   | Polimento, telas de configurações, CSAT          | 3-4 semanas | aguardando   |
| 5   | Tela de campanhas + webhooks de saída            | 2-3 semanas | aguardando   |
| 6   | Builder visual de fluxo (React Flow)             | 3-4 semanas | aguardando   |
| 7   | UI Baileys (QR code, status)                     | 1 semana    | aguardando   |
| 8   | Migração / on-premise / docs                     | variável    | aguardando   |

> Estimativas frontend são menores que as totais do crm-api porque grande parte do trabalho de cada fase está no backend.

---

## 4. Fase 0 — Bootstrap do crm-web

**Objetivo:** scaffolding técnico, integração com OpenAPI do backend, docs e convenções.

### 4.1 Setup base

- [x] Repo `crm-web` no GitHub sob AGPLv3 (`rodrigodevts/crm-web`)
- [x] Next.js 16.2.4 + App Router + TypeScript estrito
- [x] Tailwind CSS 4
- [x] shadcn/ui inicializado com componentes base (button, card, dropdown-menu, input, label)
- [x] TanStack Query, React Hook Form, Zod, axios, lucide, geist, next-themes instalados
- [x] CI/CD básico — `.github/workflows/ci.yml` (lint, format:check, typecheck, test, build)
- [x] lefthook (pre-commit + pre-push)
- [x] Vitest 4 + jsdom + @testing-library/react
- [x] ESLint 9 + Prettier 3 + .editorconfig + .nvmrc

### 4.2 Integração com OpenAPI do backend (Kubb)

- [x] `kubb.config.ts` com 5 plugins (oas, ts, zod, client, react-query)
- [x] Script `pnpm generate:api`
- [x] `lib/generated/` populado com `/health` (validação inicial do pipeline)
- [x] `lib/CLAUDE.md` documentando "código gerado, não editar"

### 4.3 Sprint 0.13 — Fechamento de gaps (esta sprint)

- [ ] LICENSE AGPLv3
- [ ] Deps `zustand` e `socket.io-client`
- [ ] `openapi.snapshot.json` + script `generate:api:from-snapshot`
- [ ] CI: drift detection em `lib/generated/`
- [ ] Smoke test do tipo gerado em `lib/generated.test.ts`
- [ ] CLAUDE.md raiz adaptado pro escopo frontend
- [ ] ROADMAP.md raiz adaptado pro escopo frontend (este documento)

### 4.4 Documentação base

- [x] `ARCHITECTURE.md` raiz (referência canônica do projeto inteiro)
- [x] `WORKFLOW.md` raiz (workflow Superpowers)
- [x] `design-system.md` raiz (cores, tipografia, componentes)
- [x] `CONTRIBUTING.md` raiz
- [x] `docs/conventions/` (api-conventions, error-handling, multi-tenant-checklist, testing-strategy)
- [x] `CLAUDE.md` em `app/`, `components/`, `lib/`

### 4.5 UI mínima validada

- [x] `(auth)/login` com formulário + teste (`login-form.test.tsx`)
- [x] `theme-provider`, `theme-toggle`, `query-provider`, `providers.tsx`

### 4.6 Pendente (próximas sprints da Fase 0 ou Fase 4)

- [ ] Tela de register
- [ ] Layout base Izing-like (sidebar + header + área principal)
- [ ] Páginas dummy de Atendimentos
- [ ] Telas básicas de Configurações
- [ ] Tema final do design-system aplicado (paleta refinada)
- [ ] E2E real (Playwright contra backend)

---

## 5. Fases 1–8 (fatia frontend)

> Detalhamento em sprints à medida que cada fase começa. Aqui só os entregáveis frontend principais.

### 5.1 Fase 1 — Tela de canal Gupshup

- [ ] Tela de configuração de canal
- [ ] Mascaramento de credenciais com botão "Revelar para editar"
- [ ] Card de canal com status em tempo real (socket.io-client)
- [ ] Tela básica de mensagens recebidas (validação)

### 5.2 Fase 2 — UI Izing-like de Atendimentos

- [ ] Sidebar de fila com 3 abas + virtualização
- [ ] Dropdown "Ordenar por" (4 opções)
- [ ] Visual de ticket pinned + seção Fixados
- [ ] Menu do card com Fixar/Desfixar
- [ ] Filtro avançado com toggle "Em fluxo de bot"
- [ ] Header polimórfico
- [ ] Composer livre + HSM com preview
- [ ] Painel lateral 5 abas (Info, Custom Fields, Funil, ChatBot manual, Histórico)
- [ ] Modais: Iniciar atendimento, Transferir, Resolver, Editar Contato
- [ ] **Modo busca isolado** de realtime (resolve bug do sistema atual)

### 5.3 Fase 3a — Editor JSON estruturado de Bot/Fluxo

- [ ] Tela de lista de fluxos
- [ ] Editor com painéis (árvore + form tipado por tipo + validação)
- [ ] CRUD de `BotCredential`
- [ ] Modal/painel de simulador (mínimo viável)
- [ ] Aba "ChatBot manual" funcional no painel lateral do ticket
- [ ] Indicador "Bot rodando" + botão "Parar bot"

### 5.4 Fase 3b — Templates de fluxo + simulador

- [ ] UI marketplace de templates
- [ ] Ação "Criar fluxo a partir de template"
- [ ] Simulador completo inline com step-by-step

### 5.5 Fase 4 — Polimento, configurações, CSAT

- [ ] Tela de Contatos completa
- [ ] Tela de Configurações da Company (13 flags)
- [ ] Tela completa de Departamentos
- [ ] Tela completa de Usuários
- [ ] Tela de Quick Replies (pessoal e global)
- [ ] Tela de CustomFieldDefinition
- [ ] Tela de SalesFunnel + LeadStatus (read-only)
- [ ] Tela de IntegrationLink + UI na sidebar do ticket
- [ ] UI CSAT (configuração + dashboard de notas)
- [ ] Dashboard básico de métricas
- [ ] BusinessHoliday + UI

### 5.6 Fase 5 — Campanhas + Webhooks + API push

- [ ] Tela: criar lista, criar campanha, agendamento
- [ ] Relatório de campanha
- [ ] UI de gestão de webhooks (criar, listar, ver logs, re-disparar)
- [ ] Botão API push customizável no ticket

### 5.7 Fase 6 — Builder visual de fluxo

- [ ] React Flow integrado
- [ ] Canvas drag-and-drop com paleta
- [ ] Edição inline de propriedades
- [ ] Validação visual
- [ ] Salvar/carregar JSON compatível com Bot Engine
- [ ] Versionamento básico (rascunho vs publicado)
- [ ] Modo compacto dos nodes

### 5.8 Fase 7 — UI Baileys

- [ ] Tela de QR code
- [ ] Frontend renderiza dinamicamente "Rejeitar Ligações" via capabilities

### 5.9 Fase 8 — Migração / on-premise

- [ ] Documentação de instalação on-premise (frontend)
- [ ] Treinamento visual de atendentes

---

## 6. Rastreamento

| Fase    | Início  | Fim | Status       | Notas                                            |
| ------- | ------- | --- | ------------ | ------------------------------------------------ |
| Fase 0  | 2026-04 | —   | em andamento | Sprint 0.13 (bootstrap gap closure) em execução. |
| Fase 1  | —       | —   | aguardando   | —                                                |
| Fase 2  | —       | —   | aguardando   | —                                                |
| Fase 3a | —       | —   | aguardando   | —                                                |
| Fase 3b | —       | —   | aguardando   | —                                                |
| Fase 4  | —       | —   | aguardando   | —                                                |
| Fase 5  | —       | —   | aguardando   | Pré-req da Fase 8 backend.                       |
| Fase 6  | —       | —   | aguardando   | —                                                |
| Fase 7  | —       | —   | aguardando   | —                                                |
| Fase 8  | —       | —   | aguardando   | Requer Fase 5 backend.                           |
```

- [ ] **Step 10.2: Validar marcações de checkbox**

Run:

```bash
grep -c "^- \[x\]" ROADMAP.md
grep -c "^- \[ \]" ROADMAP.md
```

Expected: alguns `[x]` (10+), alguns `[ ]` (todos os pendentes).

- [ ] **Step 10.3: Pre-commit format check**

Run:

```bash
pnpm prettier --write ROADMAP.md
```

- [ ] **Step 10.4: Commit**

```bash
git add ROADMAP.md
git commit -m "$(cat <<'EOF'
docs(roadmap): rewrite ROADMAP.md raiz pro escopo frontend

Versão anterior era cópia verbatim do crm-api ROADMAP v6 com tudo
"aguardando", incluindo entregáveis 100% backend (Schema Prisma,
Auth, Workers BullMQ, etc). Substituído por uma fatia frontend:
- premissas e critério de "fase pronta" adaptados pro crm-web
- Fase 0 expandida com bootstrap real (marcando [x] o que existe
  e Sprint 0.13 como em andamento)
- Fases 1–8 reduzidas aos entregáveis frontend principais
- referência canônica para escopo backend em ../crm-api/ROADMAP.md
EOF
)"
```

---

## Task 11: Verificação final completa

**Files:** nenhum modificado.

- [ ] **Step 11.1: Suite completa**

Run:

```bash
pnpm format:check && \
pnpm lint && \
pnpm typecheck && \
pnpm test && \
pnpm build
```

Expected: tudo verde.

- [ ] **Step 11.2: Drift check do snapshot**

Run:

```bash
pnpm generate:api:from-snapshot && git diff --exit-code lib/generated
```

Expected: comando termina com exit 0 (zero diff).

- [ ] **Step 11.3: Confirmar todos os 5 gaps fechados**

Run:

```bash
echo "=== LICENSE? ===" && ls LICENSE && \
echo "=== zustand+socket? ===" && grep -E '"(zustand|socket\.io-client)"' package.json && \
echo "=== snapshot? ===" && ls openapi.snapshot.json && \
echo "=== from-snapshot script? ===" && grep "generate:api:from-snapshot" package.json && \
echo "=== smoke test? ===" && ls lib/generated.test.ts && \
echo "=== CI drift step? ===" && grep "Detect API types drift" .github/workflows/ci.yml && \
echo "=== CLAUDE.md adaptado? ===" && grep -q "DigiChat Web" CLAUDE.md && echo "OK" && \
echo "=== ROADMAP adaptado? ===" && grep -q "Sprint 0.13" ROADMAP.md && echo "OK"
```

Expected: todas as 8 linhas com `OK` ou conteúdo encontrado.

- [ ] **Step 11.4: Sumário de commits**

Run:

```bash
git log --oneline origin/main..HEAD
```

Expected: ~7 commits desde origin/main (spec + license + deps + snapshot/script + smoke test + ci + claude.md + roadmap.md).

---

## Task 12: Confirmação final antes de PR (gate humano)

**Files:** nenhum modificado.

> ⚠️ **NÃO fazer push pro remote sem confirmação explícita do humano.** Regra estabelecida em CLAUDE.md raiz e reforçada no brief da sprint.

- [ ] **Step 12.1: Apresentar status pro humano**

Reportar ao humano (em mensagem de texto, não comando):

- Resumo do que foi feito em cada task.
- `git log --oneline origin/main..HEAD` colado.
- Confirmar que todas as verificações da Task 11 passaram.
- Pedir autorização explícita pra: (a) `git push origin feat/sprint-0-13-bootstrap-gap-closure` e (b) abrir PR via `gh pr create`.

- [ ] **Step 12.2: Push (somente após autorização)**

Quando humano autorizar:

```bash
git push -u origin feat/sprint-0-13-bootstrap-gap-closure
```

- [ ] **Step 12.3: Abrir PR (somente após autorização)**

```bash
gh pr create --title "Sprint 0.13: bootstrap gap closure" --body "$(cat <<'EOF'
## Summary

Sprint 0.13 do crm-web — fechamento dos gaps materiais do bootstrap (que já estava 80% pronto). Cinco entregas:

- LICENSE AGPLv3 adicionado.
- Dependências `zustand` e `socket.io-client` instaladas (sem uso ainda; ficam disponíveis pras próximas sprints).
- `openapi.snapshot.json` commitado + script `pnpm generate:api:from-snapshot`.
- CI valida drift de tipos: regenera `lib/generated` contra o snapshot e falha se houver diff.
- Smoke test em `lib/generated.test.ts` valida shape do tipo gerado.
- `CLAUDE.md` raiz reescrito pro escopo frontend (era cópia verbatim do crm-api).
- `ROADMAP.md` raiz reescrito pro escopo frontend.

Spec e plano em `docs/superpowers/`.

## Test plan

- [ ] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` verde
- [ ] `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` exit 0
- [ ] CI no PR fica verde nas mesmas etapas (incluindo o novo step de drift)
- [ ] Confirmar visualmente que LICENSE é o AGPLv3 idêntico ao do crm-api
- [ ] Confirmar que CLAUDE.md raiz não menciona Prisma/multi-tenant-checklist/3 camadas backend
- [ ] Confirmar que ROADMAP.md raiz só lista entregáveis frontend
EOF
)"
```

- [ ] **Step 12.4: Pegar URL do PR e reportar**

```bash
gh pr view --json url --jq .url
```

Reportar URL ao humano. Sprint encerrada.

---

## Self-review

Conferi este plano contra o spec antes de entregar:

**Cobertura do spec:**

- §3.1 LICENSE → Task 2 ✅
- §3.2 Deps → Task 3 ✅
- §3.3 CI drift → Tasks 4, 5, 6, 8 ✅
- §3.4 Smoke test → Task 7 ✅
- §3.5 ROADMAP+CLAUDE → Tasks 9, 10 ✅
- §6 Checklist verificação → Task 11 ✅
- §4 ordem de execução → Tasks numeradas seguem a ordem ✅
- §7 Risco "Kubb não-determinístico" → Task 5 trata empiricamente ✅

**Sem placeholders.** Todos os steps com código concreto, comandos exatos, expected output explícito.

**Consistência de tipos:** `HealthResponseDto` (status/uptime/timestamp) e `healthResponseDtoSchema` usados consistentemente nas Tasks 7 e 11. Script `generate:api:from-snapshot` referenciado de forma idêntica nas Tasks 6, 8 e 11.

**Gate humano explícito** na Task 12 antes de qualquer push/PR.
