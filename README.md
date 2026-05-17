# crm-web

[![CI](https://github.com/rodrigodevts/crm-web/actions/workflows/ci.yml/badge.svg)](https://github.com/rodrigodevts/crm-web/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

Frontend do **DigiChat** — CRM omnichannel WhatsApp multi-tenant.

Stack: Next.js 16 App Router + React 19 + Tailwind 4 + shadcn/ui + Geist + TanStack Query + Kubb.

Licença: AGPL-3.0-or-later.

---

## Documentação canônica

Plano, arquitetura, workflow e contribuição vivem no repositório de docs `crm-specs` (fonte única — não duplicar aqui):

- [ROADMAP](https://github.com/rodrigodevts/crm-specs/blob/main/ROADMAP.md)
- [ARCHITECTURE](https://github.com/rodrigodevts/crm-specs/blob/main/ARCHITECTURE.md)
- [WORKFLOW](https://github.com/rodrigodevts/crm-specs/blob/main/WORKFLOW.md)
- [CONTRIBUTING](https://github.com/rodrigodevts/crm-specs/blob/main/CONTRIBUTING.md)

No setup de dev o `crm-specs` é clonado como sibling, então localmente: `../crm-specs/<arquivo>.md`.

---

## Pré-requisitos

- Node.js **22 LTS** (`.nvmrc`)
- pnpm **10+**
- `crm-api` rodando em `http://localhost:3000` (necessário para `pnpm generate:api`)

## Setup local

1. Backend `crm-api` rodando em `http://localhost:3000` com `WEB_ORIGIN=http://localhost:3001` no `.env`.
2. `cp .env.example .env` no `crm-web`.
3. `pnpm install`.
4. `pnpm dev` (porta 3001).
5. Abrir `http://localhost:3001/login` e autenticar.

Auth canônica via cookie httpOnly assinado pelo backend (ver ADR 0001 do `crm-api`). Frontend não persiste tokens em localStorage.

### Git hooks (Lefthook)

Os hooks são instalados automaticamente pelo `prepare` script no `pnpm install`. Se precisar reinstalar manualmente:

```bash
pnpm exec lefthook install
```

O que roda:

- **pre-commit** (paralelo, só nos arquivos staged): `eslint --fix`, `prettier --write`, `tsc --noEmit`
- **pre-push**: `pnpm test`

Para pular pontualmente (use com parcimônia): `LEFTHOOK=0 git commit ...` ou `git push --no-verify`.

## Endpoints disponíveis nesta etapa

| URL          | Descrição                                     |
| ------------ | --------------------------------------------- |
| `GET /`      | Home placeholder com toggle de tema           |
| `GET /login` | Form placeholder (sem submit funcional ainda) |

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

Detalhada em [ARCHITECTURE](https://github.com/rodrigodevts/crm-specs/blob/main/ARCHITECTURE.md) §5.2.

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

| Var                   | Default                                     | Quando usar              |
| --------------------- | ------------------------------------------- | ------------------------ |
| `API_OPENAPI_URL`     | `http://localhost:3000/api/v1/openapi.json` | Para `pnpm generate:api` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000`                     | Base do client gerado    |

## Documentação local

- [`CLAUDE.md`](./CLAUDE.md) — instruções operacionais para agentes
- [`design-system.md`](./design-system.md) — cores, tipografia, espaçamento
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — padrões de commit, PR, código
- [`docs/conventions/`](./docs/conventions/) — multi-tenant, errors, API, testing
