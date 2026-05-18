# CLAUDE.md — `crm-web/lib/`

> Este aviso vive em `lib/` (não em `lib/generated/`) porque o Kubb roda
> com `clean: true` e apaga tudo que estiver dentro de `lib/generated/`
> a cada `pnpm generate:api`.

> **PASTA `generated/` GERADA POR KUBB. NÃO EDITE ARQUIVOS AQUI MANUALMENTE.**

---

## O que está aqui

Esta pasta contém:

- `types/` — tipos TypeScript gerados a partir do OpenAPI do backend
- `hooks/` — hooks TanStack Query gerados por endpoint
- `schemas/` — schemas Zod (mesmos do backend, replicados)
- `client/` — cliente HTTP tipado

---

## Como regenerar

A partir da raiz de `crm-web/`:

```bash
pnpm generate:api
```

Esse comando:

1. Lê o OpenAPI spec do backend (URL via `API_OPENAPI_URL` env var, default `http://localhost:3000/api/v1/openapi.json`)
2. Gera todos os arquivos desta pasta
3. Limpa arquivos antigos não usados

---

## Quando regenerar

- Após qualquer PR no backend que mude:
  - Schema Zod (em `crm-api/src/modules/*/schemas/`)
  - Endpoint REST (novo, removido, alterado)
  - Enum
- Antes de implementar feature consumidora no frontend

---

## Como usar

Importe sempre desta pasta no resto do projeto:

```tsx
// Tipos
import { type Ticket, type CreateTicketDto } from '@/lib/generated/types';

// Hooks TanStack Query
import { useGetTickets, useCreateTicket } from '@/lib/generated/hooks';

// Schemas Zod (para forms)
import { CreateTicketSchema } from '@/lib/generated/schemas';
```

---

## Por que não editar manualmente

Edições manuais são **sobrescritas** na próxima vez que `pnpm generate:api` rodar.

Se você precisa customizar:

1. Customize o **schema Zod no backend** (em `crm-api/src/modules/*/schemas/`)
2. Adicione `.describe()` para enriquecer OpenAPI
3. Regenere no frontend

Se precisa de helper local que não cabe no backend, criar em outro lugar:

- `lib/api-client.ts` — wrappers customizados
- `lib/utils.ts` — utilities gerais
- `hooks/` (sem `generated/`) — hooks customizados que usam os gerados

---

## Configuração do Kubb

Ver `kubb.config.ts` na raiz de `crm-web/`.

Se precisar mudar comportamento do gerador (adicionar plugin, mudar output), edite `kubb.config.ts`, não os arquivos gerados.

---

## Commits

Esta pasta **é commitada** no repo (não está em `.gitignore`).

Razão: CI/CD funciona sem precisar rodar backend. Tipo: testes do frontend rodam só com tipos gerados, sem startup do backend.

Trade-off: PRs que mudam OpenAPI geram diff grande nesta pasta. Aceitável — code review do diff foca no schema do backend, esta pasta é "consequência".
