# Sprint 0.13 — Bootstrap gap closure

> **Data:** 2026-05-06
> **Status:** aprovado
> **Tipo:** sprint de manutenção / fechamento de fase
> **Branch alvo:** `feat/sprint-0-13-bootstrap-gap-closure` (forkada de `origin/main` atualizado)

---

## 1. Contexto

O ROADMAP do crm-api lista Sprint 0.13 como "bootstrap do crm-web". Inspeção do estado atual revelou que a maior parte do bootstrap **já está pronta** (Next.js 16.2.4, Tailwind 4, shadcn/ui, kubb.config.ts, lib/generated/ populado com `/health`, CI, lefthook, vitest, ARCHITECTURE.md, design-system.md, conventions docs etc).

Esta sprint, portanto, **não é greenfield**. É fechamento de gaps materiais e adaptação de docs herdadas verbatim do crm-api.

## 2. Escopo (Opção A aprovada)

Cinco entregas, todas pequenas:

1. **LICENSE AGPLv3** — adicionar arquivo `LICENSE` na raiz, idêntico ao do crm-api.
2. **Deps faltantes** — instalar `zustand` e `socket.io-client` (declarados no ARCHITECTURE.md §4 mas ausentes em `package.json`). Sem uso ainda; ficam disponíveis pras próximas sprints.
3. **CI: API drift detection** — novo job/step que roda `pnpm generate:api` contra um snapshot do OpenAPI commitado e falha se houver `git diff` em `lib/generated/`.
4. **Smoke test do tipo gerado** — teste curto em `lib/generated.test.ts` que importa um type/schema gerado e valida shape, sem chamar backend.
5. **Adaptação de docs herdadas** — `ROADMAP.md` e `CLAUDE.md` raiz do crm-web foram colocados como cópias verbatim do crm-api. Adaptar pro escopo frontend (e marcar `[x]` o que já foi feito).

### Anti-objetivos (explícitos)

- Não tocar em scaffolding já feito (Next.js, shadcn, kubb.config.ts, eslint, prettier, lefthook, vitest, providers, theme-toggle, login form).
- Não criar páginas novas (anti-objetivo declarado pelo brief).
- Não rodar backend no CI (over-engineering pra esta sprint — drift via snapshot é suficiente).
- Não regenerar arquivos em `lib/generated/` como parte do trabalho (eles ficam como estão até a próxima vez que o backend mudar).
- Não fazer push pro remoto sem confirmação explícita do humano.

---

## 3. Arquitetura por entrega

### 3.1 LICENSE

Cópia byte-a-byte do `LICENSE` em `crm-api/`. Texto AGPLv3 GNU completo (não a versão short header). Posicionado em `crm-web/LICENSE`.

Não há decisão arquitetural — é compliance trivial.

### 3.2 Dependências (zustand + socket.io-client)

Comando único:

```bash
pnpm add zustand socket.io-client
```

Resultado esperado em `package.json`:

- `zustand` em `dependencies` — versão latest estável (v5.x)
- `socket.io-client` em `dependencies` — versão 4+ (alinhado a ARCHITECTURE.md §4)

**Por que sem uso ainda:** declarar deps cedo evita que próximas sprints precisem misturar "instalar lib" com "usar lib" no mesmo PR. Trade-off é manter dep ociosa por algumas sprints — aceitável.

**Verificação:** `pnpm install --frozen-lockfile` e `pnpm typecheck` continuam passando.

### 3.3 CI: API drift detection

**Decisão de design:** snapshot do OpenAPI commitado vs subir backend no CI.

Optamos por snapshot porque:

- Backend e frontend são repos separados; subir o backend exige clonar outro repo, instalar deps, rodar Postgres+Redis no CI. Muito atrito pra benefício marginal.
- Snapshot detecta drift no **frontend** — qualquer mudança de OpenAPI no backend exige PR no frontend que regenere e atualize o snapshot. Isso é a verdadeira intenção do drift check.
- Quando dev local roda `pnpm generate:api` contra backend ao vivo, ele atualiza `lib/generated/` E pode atualizar o snapshot (se decidirmos automatizar isso).

**Implementação:**

Novo arquivo na raiz: `openapi.snapshot.json`

Conteúdo inicial: dump atual do `/api/v1/openapi.json` do crm-api rodando localmente. Capturado uma vez nesta sprint via:

```bash
curl -s http://localhost:3000/api/v1/openapi.json -o openapi.snapshot.json
```

Atualização do `kubb.config.ts`: aceitar `API_OPENAPI_URL` apontando pra arquivo local (já aceita — campo `input.path` aceita URL ou path). Confirmar comportamento.

Atualização de `package.json`:

```json
"generate:api": "kubb generate",
"generate:api:from-snapshot": "API_OPENAPI_URL=./openapi.snapshot.json kubb generate"
```

Atualização de `.github/workflows/ci.yml`. Adicionar antes do step `Test`:

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

**Trade-off conhecido:** se o backend evoluir e ninguém atualizar `openapi.snapshot.json` no frontend, o frontend vai ficar dessincronizado com o backend real até alguém perceber. Mitigação: regenerar snapshot é parte do checklist quando o backend muda. Não é problema da Sprint 0.13.

**Erro deliberado a tolerar:** se Kubb gerar arquivos com timestamp ou ordenação não-determinística, o drift check vai pegar falso-positivo. Verificar empiricamente nesta sprint — se acontecer, configurar Kubb pra saída determinística antes de fechar a sprint.

### 3.4 Smoke test do tipo gerado

Arquivo novo: `lib/generated.test.ts` (na raiz de `lib/`, não dentro de `lib/generated/` — esse último está em `exclude` do vitest e é "código gerado").

Conteúdo proposto (mínimo):

```typescript
import { describe, it, expect, expectTypeOf } from 'vitest';
import { healthResponseDtoSchema, type HealthResponseDto } from '@/lib/generated';

describe('lib/generated — smoke test', () => {
  it('exposes the health endpoint type', () => {
    expectTypeOf<HealthResponseDto>().toHaveProperty('status');
  });

  it('exposes a working Zod schema for the health response', () => {
    const valid = healthResponseDtoSchema.safeParse({ status: 'ok' });
    expect(valid.success).toBe(true);
  });
});
```

**Decisão:** usar `expectTypeOf` (vitest) pra validar tipo + `safeParse` pra validar schema runtime. Não fazer chamada real à API — smoke test é só "barrel funciona, tipos importam, schema parseia".

**Risco:** se o schema gerado pelo Kubb usar nome diferente de `healthResponseDtoSchema` ou se o enum de status for `'ok' | 'error'` em vez de só `'ok'`, o teste quebra. Conferir contra `lib/generated/index.ts` (já lido durante brainstorm: `healthResponseDtoSchema` existe, status enum derivado de `HealthResponseDtoStatusEnumKey`). Ajustar input do `safeParse` se necessário.

### 3.5 Adaptação de ROADMAP.md e CLAUDE.md raiz

**ROADMAP.md (crm-web).** Atual é cópia verbatim do crm-api ROADMAP v6 (27/04/2026, status "aguardando" em todas as fases). Realidade: muita coisa de Fase 0 do crm-api **não se aplica** ao crm-web (Schema Prisma, Auth backend, Workers BullMQ, etc), e várias coisas de Fase 0 que **se aplicam** ao crm-web já estão feitas.

Estratégia: **encolher e refocar.**

- Manter premissas, critério de "fase pronta", filosofia, mapa geral de fases (referencial pro time saber em qual fase está).
- Em cada fase, manter **só os entregáveis frontend** (ou que dependem do frontend).
- Marcar `[x]` o que já está feito.
- Adicionar nota no topo: "Para escopo backend, ver `crm-api/ROADMAP.md`. Este documento é a fatia frontend."
- Atualizar tabela de rastreamento da Fase 0 com nota: "Sprint 0.13 (bootstrap crm-web): em andamento — fechamento de gaps."

**CLAUDE.md raiz (crm-web).** Atual é cópia verbatim do crm-api CLAUDE.md, com triggers de query Prisma, endpoint REST, multi-tenant-checklist, etc — **tudo backend.**

Adaptação:

- **Seção 1 (Você está no projeto).** Manter, ajustar pra dizer "frontend Next.js do CRM DigiChat". Apontar pra crm-api/CLAUDE.md como complemento de regras de domínio que não estão neste repo.
- **Seção 2 (Antes de qualquer ação leia).** Trocar lista pra: este CLAUDE.md, ROADMAP.md (crm-web), ARCHITECTURE.md (que está aqui mas é cópia do crm-api — manter), design-system.md.
- **Seção 3 (Triggers por contexto).**
  - Remover: query Prisma, endpoint REST, lógica de erro, multi-tenant-checklist, audits do crm-specs (esses ficam relevantes só quando o frontend implementa UI da feature, e a leitura é referência, não regra).
  - Manter: "antes de modificar UI/componente → design-system.md".
  - Adicionar: "antes de consumir endpoint do backend → checar `lib/generated/`. Se faltar tipo, regenerar via `pnpm generate:api`. Se ainda faltar, é gap no backend — não inventar tipo local nem `as Type`."
  - Adicionar: "antes de adicionar dep nova → confirmar com humano (regra herdada)".
- **Seção 4 (Regras não-negociáveis).**
  - Remover bloco "Multi-tenant" (4 regras Prisma).
  - Remover bloco "Arquitetura de 3 camadas" (NestJS).
  - Remover bloco "Schemas Zod" formato de input do backend (mas manter regra "DTOs vêm do backend via lib/generated; React Hook Form usa o mesmo schema").
  - Remover "Working Hours".
  - Manter: "Erros — mensagens em pt-BR" (renomeado pra "Texto pro usuário em pt-BR"), "Pastas read-only", "Branch e PR".
  - Adicionar: "lib/generated/ é código gerado. Não editar. Se precisa customizar, ajustar schema no backend e regenerar."
- **Seção 5 (Workflow Superpowers).** Manter como está — é mesmo workflow.
- **Seção 6 (Quando perguntar).** Trocar lista de exemplos pra serem frontend-relevantes (adicionar dep, criar component novo se já existe similar, mudar tema, refatorar).
- **Seção 7 (Top 7 erros a evitar).** Substituir os backend-specific:
  1. Editar `lib/generated/` à mão.
  2. Inventar tipo local quando o backend não expôs (deve ser gap reportado, não shim).
  3. Reescrever component existente sem ser pedido.
  4. Adicionar lib não-aprovada (lista em ARCHITECTURE.md §4 frontend).
  5. Misturar lógica de Server Component com Client Component.
  6. `any` ou `as Type` sem comentário (TS estrito).
  7. Criar arquivos não pedidos.
- **Seção 8 (Subdiretórios com CLAUDE.md).** Listar só os do crm-web (já está parcialmente certo — manter).
- **Seção 9 (Hierarquia de busca).** Adaptar — começa por audit, depois area, depois Chatwoot (referência leve pra UI), doc oficial, perguntar.
- **Seção 10 (Final de sessão).** Tirar "Migration criada e testada se mudou schema".

ARCHITECTURE.md no crm-web é cópia do crm-api e está OK como referência canônica do projeto inteiro. Não muda nesta sprint.

WORKFLOW.md, CONTRIBUTING.md, design-system.md — não tocar.

---

## 4. Ordem de execução (proposta pro plano)

1. Forkar branch nova de `origin/main` atualizado (não da `chore/upgrade-next-16` local — está atrás).
2. Adicionar LICENSE.
3. `pnpm add zustand socket.io-client` + commit (deps)
4. Capturar `openapi.snapshot.json` rodando crm-api localmente.
5. Atualizar `package.json` script + ajustar CI workflow.
6. Adicionar smoke test `lib/generated.test.ts`.
7. Adaptar `CLAUDE.md` raiz.
8. Adaptar `ROADMAP.md` raiz.
9. Verificação final: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` e `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` tudo verde.
10. Commits Conventional. PR via gh CLI **somente após confirmação do humano**.

---

## 5. Testes

- **Smoke test:** `lib/generated.test.ts` (novo).
- **CI drift:** snapshot regenerado em CI deve igualar arquivos commitados.
- **Sem mudanças** em `login-form.test.tsx` (já passa).

Nenhum teste removido. Nenhum teste skipado.

---

## 6. Verificação manual (checklist de fechamento)

- [ ] `pnpm install --frozen-lockfile` clean
- [ ] `pnpm format:check` verde
- [ ] `pnpm lint` verde
- [ ] `pnpm typecheck` verde
- [ ] `pnpm test` verde (smoke test inclui)
- [ ] `pnpm build` verde
- [ ] `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` zero diff
- [ ] LICENSE presente e idêntico ao do crm-api
- [ ] `package.json` tem zustand e socket.io-client
- [ ] CLAUDE.md raiz não menciona Prisma/multi-tenant-checklist/3 camadas backend
- [ ] ROADMAP.md raiz reflete escopo frontend e marca itens feitos
- [ ] PR aberto **somente** com aprovação do humano

---

## 7. Riscos e mitigações

| Risco                                                            | Probabilidade       | Impacto | Mitigação                                                                                                        |
| ---------------------------------------------------------------- | ------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| Kubb gera output não-determinístico → drift check falha em verde | Baixa               | Médio   | Verificar empiricamente; se falhar, configurar Kubb pra estável antes de fechar sprint                           |
| `healthResponseDtoSchema` muda nome no Kubb 5.x                  | Baixa               | Baixo   | Ajustar imports do smoke test contra `lib/generated/index.ts` real                                               |
| Reduzir CLAUDE.md frontend remove regra que ainda valia          | Média               | Médio   | Cada remoção é justificada inline; humano revisa o spec                                                          |
| Snapshot do OpenAPI fica obsoleto silenciosamente                | Alta no longo prazo | Médio   | Trade-off conhecido; resolver em sprint futura com automação opcional (renovate-style bot ou hook no crm-api CI) |

---

## 8. Decisões pra revisitar em sprints futuras

- Automação do refresh do `openapi.snapshot.json` (bot, hook, ou integração com `crm-api` CI).
- Adicionar lib de testes E2E (Playwright) — fora de escopo aqui, anti-objetivo do brief.
- Subir backend no CI quando integração frontend↔backend ficar mais densa (Fase 2+).
