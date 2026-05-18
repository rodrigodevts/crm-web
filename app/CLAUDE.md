# CLAUDE.md — `crm-web/app/`

> Convenções de rotas e layouts (Next.js 16 App Router).

---

## Estrutura

```
app/
├── layout.tsx                    # root layout (providers, fonts, html)
├── page.tsx                      # home (redirect para /atendimentos ou /login)
├── globals.css                   # Tailwind base + design tokens
├── (auth)/                       # rotas públicas
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── aceitar-convite/[token]/page.tsx
└── (app)/                        # rotas autenticadas
    ├── layout.tsx                # sidebar + header
    ├── atendimentos/
    │   ├── page.tsx
    │   ├── canais-debug/         # tela de debug de mensagens
    │   └── components/           # componentes específicos da rota
    ├── contatos/
    ├── bot-fluxo/
    ├── campanhas/
    ├── dashboard/
    ├── ajuda/
    └── configuracoes/
        ├── canais/
        ├── departamentos/
        ├── usuarios/
        ├── tags/
        ├── motivos-fechamento/
        ├── quick-replies/
        ├── preferencias/
        ├── integracoes/
        └── design-system/
```

---

## Route groups `(auth)` e `(app)`

- `(auth)`: layout sem sidebar, sem header autenticado. Para login e aceitar-convite.
- `(app)`: layout com sidebar + header. Para tudo que requer auth.

Parênteses não aparecem na URL. `app/(app)/atendimentos/page.tsx` → `/atendimentos`.

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
// app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
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
// app/(app)/atendimentos/layout.tsx
export default function AtendimentosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <AtendimentosSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
```

Layouts persistem entre navegações dentro do mesmo grupo. Não recarregam.

---

## Rotas dinâmicas

```
app/(app)/configuracoes/canais/[id]/page.tsx
```

Acesso ao param:

```tsx
// Server Component
export default async function CanalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // params é Promise no Next.js 16
  return <CanalDetail id={id} />;
}
```

```tsx
// Client Component
'use client';
import { useParams } from 'next/navigation';

export default function CanalPage() {
  const { id } = useParams() as { id: string };
  return <CanalDetail id={id} />;
}
```

---

## Loading e Error states

Cada rota tem suporte a:

```
app/(app)/atendimentos/
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
  title: 'Atendimentos — DigiChat',
  description: 'Lista de atendimentos',
};
```

Layout root tem metadata default. Pages sobrescrevem.

---

## Auth via proxy

`proxy.ts` na raiz do `crm-web/` (Next.js 16 renomeou `middleware.ts` → `proxy.ts`):

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/aceitar-convite'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward o pathname pra Server Components — Next 16 não expõe via headers()
  // por padrão; layouts usam pra gates RBAC dependentes da rota atual.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  const passThrough = { request: { headers: requestHeaders } };

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next(passThrough);
  }

  const accessToken = request.cookies.get('access_token');
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next(passThrough);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

---

## Realtime via Socket.IO

Socket criado via `createSocket()` de `lib/realtime/socket.ts`. Sem singleton global — cada hook que precisa de realtime cria e destrói o socket no `useEffect`. Hooks disponíveis em `hooks/`:

- `useChannelMessagesRealtime(channelId)` — mensagens de um canal em tempo real (eventos `message:new`, `message:status`)
- `useChannelsStatusRealtime(refetch, channelNameById)` — status de todos os canais (evento `channel:status`, toasts de transição)

Padrão de uso:

```tsx
'use client';

import { useEffect } from 'react';
import { createSocket } from '@/lib/realtime/socket';

export function useMinhaSubscription(id: string, onEvento: (data: unknown) => void) {
  useEffect(() => {
    const socket = createSocket(); // novo socket por montagem
    socket.on('meu:evento', onEvento);

    return () => {
      socket.off('meu:evento', onEvento);
      socket.disconnect();
    };
  }, [id, onEvento]);
}
```

O `createSocket()` usa `withCredentials: true` — o cookie `access_token` é enviado no handshake e o backend autentica e auto-joina as salas da empresa.

---

## Páginas de configurações

Pasta `app/(app)/configuracoes/`:

- Cada subseção é uma rota: `/configuracoes/departamentos`, `/configuracoes/usuarios`, etc
- Layout com sidebar específica de configurações
- Apenas `ADMIN` pode acessar (validar via proxy ou layout)

---

## Antes de criar rota nova

- [ ] Confirme que feature está na fase atual (`../crm-specs/ROADMAP.md`)
- [ ] Decidir se precisa de auth (route group `(app)` ou `(auth)`)
- [ ] Adicionar metadata
- [ ] Loading state se há fetch
- [ ] Error boundary
- [ ] Componentes específicos da rota em pasta local `components/`
