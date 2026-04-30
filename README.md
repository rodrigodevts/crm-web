# crm-web

Frontend do **DigiChat** — CRM omnichannel WhatsApp multi-tenant.

Stack: Next.js 15 App Router + React 19 + Tailwind 4 + shadcn/ui + Geist + TanStack Query + Kubb.

Licença: AGPL-3.0-or-later.

---

## Pré-requisitos

- Node.js **22 LTS** (`.nvmrc`)
- pnpm **10+**
- `crm-api` rodando em `http://localhost:3000` (necessário para `pnpm generate:api`)

## Setup local

```bash
# 1. Dependências
pnpm install

# 2. Subir o crm-api em outro terminal
cd ../crm-api && pnpm start:dev

# 3. Gerar tipos/hooks/schemas a partir do OpenAPI do backend
pnpm generate:api

# 4. Subir a app em watch mode (porta 3001 — 3000 fica para o crm-api)
pnpm dev
```

Abra [http://localhost:3001](http://localhost:3001).

## Endpoints disponíveis nesta etapa

| URL                 | Descrição                                    |
| ------------------- | -------------------------------------------- |
| `GET /`             | Home placeholder com toggle de tema          |
| `GET /login`        | Form placeholder (sem submit funcional ainda)|

## Comandos

```bash
pnpm dev               # next dev (porta 3001)
pnpm build             # next build
pnpm start             # next start (porta 3001)

pnpm generate:api      # Kubb lê localhost:3000/api/v1/openapi.json
                       # e gera lib/generated/{types,schemas,hooks,client}/

pnpm test              # vitest run
pnpm test:watch        # vitest

pnpm lint              # eslint .
pnpm typecheck         # tsc --noEmit
pnpm format            # prettier --write
```

## Estrutura

Detalhada em [`ARCHITECTURE.md`](./ARCHITECTURE.md) §5.2.

```
app/
├── layout.tsx               # GeistSans/Mono + Providers
├── page.tsx                 # home placeholder
├── globals.css              # Tailwind v4 + design tokens (Sky/Slate)
├── not-found.tsx
└── (auth)/
    ├── layout.tsx
    └── login/
        ├── page.tsx
        ├── login-form.tsx
        └── login-form.test.tsx

components/
├── providers.tsx            # ThemeProvider + QueryProvider
├── theme-provider.tsx       # next-themes wrapper
├── theme-toggle.tsx         # Sun/Moon dropdown (pt-BR)
├── query-provider.tsx       # TanStack Query 5
└── ui/                      # shadcn/ui (button, input, label, card, dropdown-menu)

lib/
├── utils.ts                 # cn = clsx + tailwind-merge
├── CLAUDE.md                # aviso sobre lib/generated/
└── generated/               # gerado pelo Kubb — não editar
    ├── types/
    ├── schemas/
    ├── hooks/
    └── client/
```

## Variáveis de ambiente

| Var                  | Default                                          | Quando usar              |
| -------------------- | ------------------------------------------------ | ------------------------ |
| `API_OPENAPI_URL`    | `http://localhost:3000/api/v1/openapi.json`      | Para `pnpm generate:api` |
| `NEXT_PUBLIC_API_URL`| `http://localhost:3000`                          | Base do client gerado    |

## Próximos passos da Fase 0

Ver [`ROADMAP.md`](./ROADMAP.md) §5. Em ordem:

1. Auth real (`/login` chamando `/auth/login` da API + JWT em cookie)
2. `middleware.ts` redirecionando rotas protegidas
3. Layout autenticado (`(dashboard)/layout.tsx` com sidebar + header)
4. Páginas dummy de Atendimentos
5. Telas básicas de Configurações (Departments, Users, Tags, CloseReasons)
6. CI GitHub Actions

## Documentação relacionada

- [`CLAUDE.md`](./CLAUDE.md) — instruções operacionais
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — fundação técnica
- [`ROADMAP.md`](./ROADMAP.md) — plano de fases
- [`design-system.md`](./design-system.md) — cores, tipografia, espaçamento
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — padrões de commit, PR, código
- [`docs/conventions/`](./docs/conventions/) — multi-tenant, errors, API, testing
