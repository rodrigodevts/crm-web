# CLAUDE.md — `crm-web/app/`

> Convenções de rotas e layouts (Next.js 15 App Router).

---

## Estrutura

```
app/
├── layout.tsx                    # root layout (providers, fonts, html)
├── page.tsx                      # home (redirect para /tickets ou /login)
├── globals.css                   # Tailwind base + design tokens
├── (auth)/                       # rotas públicas
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── register/page.tsx
└── (dashboard)/                  # rotas autenticadas
    ├── layout.tsx                # sidebar + header
    ├── tickets/
    │   ├── page.tsx
    │   ├── [id]/page.tsx
    │   └── components/           # componentes específicos da rota
    ├── contacts/
    ├── chat-flows/
    ├── channels/
    ├── settings/
    │   ├── departments/
    │   ├── users/
    │   ├── tags/
    │   └── ...
    └── reports/
```

---

## Route groups `(auth)` e `(dashboard)`

- `(auth)`: layout sem sidebar, sem header autenticado. Para login/register.
- `(dashboard)`: layout com sidebar + header. Para tudo que requer auth.

Parênteses não aparecem na URL. `app/(dashboard)/tickets/page.tsx` → `/tickets`.

---

## Server vs Client Components

- **Default: Server Component** (sem `'use client'`)
- **`'use client'`**: somente quando precisa de hooks (useState, useEffect), eventos (onClick, onChange), browser APIs

Princípio: server-side por padrão, client-side quando necessário.

Server Components podem:

- Fazer fetch direto a APIs (com cookies de autenticação)
- Acessar variáveis de ambiente sem expor ao cliente
- Compor com Client Components

Client Components não podem:

- Ser async
- Importar Server Components diretamente (use `children` slot)

---

## Layouts aninhados

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-sidebar flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="bg-background flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

```tsx
// app/(dashboard)/tickets/layout.tsx
export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <TicketsSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
```

Layouts persistem entre navegações dentro do mesmo grupo. Não recarregam.

---

## Rotas dinâmicas

```
app/(dashboard)/tickets/[id]/page.tsx
```

Acesso ao param:

```tsx
// Server Component
export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // params é Promise no Next.js 15
  return <TicketDetail id={id} />;
}
```

```tsx
// Client Component
'use client';
import { useParams } from 'next/navigation';

export default function TicketPage() {
  const { id } = useParams() as { id: string };
  return <TicketDetail id={id} />;
}
```

---

## Loading e Error states

Cada rota tem suporte a:

```
app/(dashboard)/tickets/
├── page.tsx
├── loading.tsx        # mostrado enquanto page.tsx carrega
└── error.tsx          # mostrado se page.tsx jogar erro
```

Use Skeleton em `loading.tsx`, mensagem amigável em `error.tsx`.

---

## Metadata

Cada page exporta metadata:

```tsx
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tickets — DigiChat',
  description: 'Lista de atendimentos',
};
```

Layout root tem metadata default. Pages sobrescrevem.

---

## Auth via middleware

`middleware.ts` na raiz do `crm-web/`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // verifica JWT em cookie
  const token = request.cookies.get('access_token');

  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
```

---

## Realtime via Socket.IO

Hook customizado em `hooks/use-socket.ts`:

```tsx
'use client';

import { useEffect } from 'react';
import { socketClient } from '@/lib/socket-client';

export function useTicketSubscription(ticketId: string, onUpdate: (ticket: Ticket) => void) {
  useEffect(() => {
    socketClient.emit('join-ticket', { ticketId });
    socketClient.on('ticket:updated', onUpdate);

    return () => {
      socketClient.emit('leave-ticket', { ticketId });
      socketClient.off('ticket:updated', onUpdate);
    };
  }, [ticketId, onUpdate]);
}
```

Use em pages que precisam de updates em tempo real.

---

## Páginas de configurações

Pasta `app/(dashboard)/settings/`:

- Cada subseção é uma rota: `/settings/departments`, `/settings/users`, etc
- Layout com sidebar específica de configurações
- Apenas `ADMIN` pode acessar (validar via middleware ou layout)

---

## Antes de criar rota nova

- [ ] Confirme que feature está na fase atual (`ROADMAP.md`)
- [ ] Decidir se precisa de auth (route group `(dashboard)` ou `(auth)`)
- [ ] Adicionar metadata
- [ ] Loading state se há fetch
- [ ] Error boundary
- [ ] Componentes específicos da rota em pasta local `components/`
