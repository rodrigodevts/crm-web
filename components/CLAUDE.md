# CLAUDE.md — `crm-web/components/`

> Convenções de componentes React.

---

## Antes de criar componente novo

**LEIA:** `design-system.md` (raiz do `crm-web`)

Cores, tipografia, espaçamento, padrões visuais. Tudo aqui deriva dele.

---

## Estrutura de pastas

```
components/
├── ui/                       # shadcn/ui components (auto-gerados pelo CLI)
├── layout/                   # Header, Sidebar, Footer, Drawer
├── tickets/                  # componentes específicos de tickets
│   ├── TicketCard.tsx
│   ├── TicketList.tsx
│   ├── ChatComposer.tsx
│   └── ...
├── chat/                     # componentes de chat
│   ├── MessageBubble.tsx     # 3 variantes (bot, atendente, sistema)
│   ├── MessageList.tsx
│   └── ...
├── shared/                   # componentes reutilizáveis sem domínio específico
└── forms/                    # forms reutilizáveis com React Hook Form + Zod
```

---

## Convenções de naming

- Arquivos: `PascalCase.tsx` (ex: `TicketCard.tsx`)
- Pastas: `kebab-case` (ex: `chat`, `tickets`)
- Componentes: `PascalCase` (ex: `function TicketCard()`)
- Props: `PascalCase` no nome do tipo (`TicketCardProps`), `camelCase` nos campos
- Hooks customizados: `useCamelCase` (ex: `useTicketSubscription`)

---

## Estrutura de componente

```tsx
// components/tickets/TicketCard.tsx

'use client';  // se usar hooks ou interatividade

import { type Ticket } from '@/lib/generated/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TicketCardProps {
  ticket: Ticket;
  isPinned?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TicketCard({
  ticket,
  isPinned = false,
  isSelected = false,
  onClick,
}: TicketCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg p-3 cursor-pointer transition-colors',
        'hover:bg-bg-muted',
        isSelected && 'bg-primary-50 dark:bg-primary-900/30',
        isPinned && 'border-l-2 border-primary',
      )}
      onClick={onClick}
    >
      {/* ... */}
    </div>
  );
}
```

**Regras:**
- `'use client'` só quando precisa (hooks, eventos, state)
- Default Server Component quando possível (Next.js 15)
- Props interface acima do componente, com `interface` (não `type`)
- Defaults via desestruturação, não `defaultProps` (deprecated)
- `cn()` de `@/lib/utils` para concatenar classes condicionais

---

## Tipos vêm do Kubb

**Sempre** importe tipos do `@/lib/generated/types`. Nunca redeclare:

```tsx
// ❌ ERRADO
type Ticket = { id: string; protocol: string; /* ... */ };

// ✅ CORRETO
import { type Ticket } from '@/lib/generated/types';
```

Se o tipo precisa de ajuste local, estenda:

```tsx
import { type Ticket } from '@/lib/generated/types';

interface TicketWithUI extends Ticket {
  isPinned: boolean;  // estado local de UI, não vem do backend
}
```

---

## Hooks de TanStack Query vêm do Kubb

```tsx
// ❌ ERRADO — hook manual
const { data } = useQuery({
  queryKey: ['tickets', id],
  queryFn: () => fetch(`/api/v1/tickets/${id}`).then(r => r.json()),
});

// ✅ CORRETO — hook gerado
import { useGetTicket } from '@/lib/generated/hooks';

const { data } = useGetTicket({ id });
```

Hooks gerados são tipados, têm retry policy padrão, e mudam automaticamente quando backend muda.

---

## Forms com React Hook Form + Zod

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTicketSchema, type CreateTicketDto } from '@/lib/generated/schemas';

export function CreateTicketForm() {
  const form = useForm<CreateTicketDto>({
    resolver: zodResolver(CreateTicketSchema),
  });

  // ...
}
```

Schemas Zod são exportados pelo Kubb a partir do OpenAPI. Mesmo schema do backend, validação consistente.

---

## Tema light/dark

Todo componente **deve funcionar em light e dark**. Use:

- Tokens de cor do design system (variáveis CSS) via Tailwind
- `cn()` com classes condicionais
- Nunca cor hardcoded (`bg-blue-500` direto)
- Sempre via tokens (`bg-primary`, `text-text`, `border-border`)

```tsx
// ❌ ERRADO
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">

// ✅ CORRETO (tokens semânticos do design-system)
<div className="bg-bg text-text">
```

---

## Acessibilidade

- Todo input tem `<label>` (visível ou `sr-only`)
- Ícones-só-de-botão têm `aria-label`
- Modais têm `aria-labelledby` e `aria-describedby`
- Focus visível em todos os elementos interativos (default do Tailwind)
- Navegação por teclado: Tab funciona, Enter/Space ativa, Esc fecha modais

---

## Estados obrigatórios

Todo componente que carrega dados ou tem estado dinâmico trata:

1. **Loading** (`<Skeleton />` ou spinner)
2. **Empty** (mensagem + ícone + ação se aplicável)
3. **Error** (mensagem amigável + retry se aplicável)
4. **Success** (estado normal)

Não deixar componente "branco" enquanto carrega.

---

## Componentes shadcn/ui

Adicionar via CLI:

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog
```

Resultado: arquivo em `components/ui/`. **Pode editar livremente** (componente é seu, não dependência).

---

## Mensagens em pt-BR

Texto visível pro usuário sempre em pt-BR:

```tsx
// ❌ ERRADO
<button>Save</button>

// ✅ CORRETO
<button>Salvar</button>
```

Sem i18n no MVP (decisão arquitetural). Adicionar i18n só quando aparecer caso real.

---

## Performance

- Memoizar listas grandes com `useMemo`
- Virtualizar listas com 100+ items (`@tanstack/react-virtual`)
- Lazy load pesado (`next/dynamic`) pra componentes grandes que não aparecem na primeira tela
- Imagens via `next/image` sempre

---

## Antes de mergear PR

- [ ] Funciona em light e dark
- [ ] Tipos vêm do `@/lib/generated/`, não declarados localmente
- [ ] Estados loading/empty/error tratados
- [ ] Acessibilidade básica (labels, aria, focus)
- [ ] Mensagens em pt-BR
- [ ] Componente shadcn/ui usado quando existe (não reinventar)
- [ ] Sem cor hardcoded (usa tokens do design-system)