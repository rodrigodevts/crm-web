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
