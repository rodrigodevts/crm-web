# Sprint 0.14 — App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layout base pós-login do DigiChat — route group `(app)` protegido por cookie httpOnly, sidebar + header + drawer mobile, login real substituindo o placeholder, e 13 páginas placeholder (6 top-level + 7 sub-itens de Configurações).

**Architecture:** Auth canônica por cookie httpOnly assinado pelo backend. `proxy.ts` (Next 16) bloqueia rotas sem cookie. Server Component em `app/(app)/layout.tsx` faz fetch server-side de `GET /api/v1/me` repassando cookies da request — 401 → `redirect('/login')`. Client Components reativos consomem o user via Context. Estado de UI volátil em Zustand hidratado de cookie pra first paint sem flicker. Axios interceptor refaz refresh transparente em 401 client-side com singleton de promise pra concorrência.

**Tech Stack:** Next.js 16 App Router (`proxy.ts` com `proxy()` + `proxyConfig`), TanStack Query 5 via Kubb hooks, Zustand 5, axios, shadcn/ui (existentes: button, card, input, label, dropdown-menu; adicionar: dialog, sonner), `@radix-ui/react-*`, Tailwind 4 com tokens semânticos do design system v2, Vitest 4 + jsdom + `@testing-library/react`.

**Branch:** `feat/sprint-0-14-app-shell` (já criada a partir de `origin/main`; já tem 2 commits: sync de OpenAPI e spec).

---

## Pré-requisitos confirmados

- `lib/generated/types/UserResponseDto.ts` — campos `id, companyId, name, email, role, absenceMessage, absenceActive, lastSeenAt, departments[], createdAt, updatedAt`.
- `lib/generated/hooks/useMeControllerFindMine.ts` — query hook GET /me.
- `lib/generated/hooks/useAuthControllerLogin.ts` — mutation hook POST /auth/login.
- `lib/generated/hooks/useAuthControllerLogout.ts` — mutation hook POST /auth/logout.
- `lib/generated/hooks/useAuthControllerRefresh.ts` — mutation hook POST /auth/refresh.
- Backend rodando em `http://localhost:3000` com cookies httpOnly habilitados.
- Variáveis: `WEB_ORIGIN=http://localhost:3001` no backend; `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1` no `crm-web`.

---

## Task 0: Adicionar primitives shadcn — dialog + sonner

**Files:**

- Create: `components/ui/dialog.tsx` (via shadcn CLI)
- Create: `components/ui/sonner.tsx` (via shadcn CLI)
- Modify: `package.json` (deps: `@radix-ui/react-dialog`, `sonner`)
- Modify: `components/providers.tsx` (montar `<Toaster />`)

**Sobre aprovação de novas deps:** CLAUDE.md §6 exige confirmação humana antes de adicionar dependência nova. As 2 são pré-requisito do escopo da sprint (drawer mobile + toasts de auth feedback). Se em execução o agente bater nessa regra, pausar e pedir OK explícito antes de instalar.

- [ ] **Step 0.1: Pedir OK pra adicionar `@radix-ui/react-dialog` e `sonner` (via shadcn CLI)**

Mensagem ao humano: "Sprint 0.14 precisa de 2 deps novas via shadcn CLI: `dialog` (pra drawer mobile) e `sonner` (pra toasts de auth feedback). Posso instalar?"

Aguardar OK explícito antes de prosseguir.

- [ ] **Step 0.2: Instalar dialog**

Run:

```bash
pnpm dlx shadcn@latest add dialog
```

Expected: `components/ui/dialog.tsx` criado, `@radix-ui/react-dialog` adicionada em `package.json`.

- [ ] **Step 0.3: Instalar sonner**

Run:

```bash
pnpm dlx shadcn@latest add sonner
```

Expected: `components/ui/sonner.tsx` criado, `sonner` adicionada em `package.json`.

- [ ] **Step 0.4: Montar `<Toaster />` no providers**

Modificar `components/providers.tsx`:

```tsx
'use client';

import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/query-provider';
import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        {children}
        <Toaster richColors position="top-right" />
      </QueryProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 0.5: Verificar build**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: tudo verde.

- [ ] **Step 0.6: Commit**

```bash
git add components/ui/dialog.tsx components/ui/sonner.tsx components/providers.tsx package.json pnpm-lock.yaml
git commit -m "chore(deps): add shadcn dialog and sonner primitives"
```

---

## Task 1: `lib/api-client.ts` — axios com interceptor 401→refresh

**Files:**

- Create: `lib/api-client.ts`
- Create: `lib/api-client.test.ts`

Justificativa: Kubb gera o cliente axios em `lib/generated/client/`, mas sem `withCredentials` nem interceptor de 401. Precisamos de uma instância configurada e injetar nos hooks via `client` config.

- [ ] **Step 1.1: Escrever o test arquivo (TDD)**

Criar `lib/api-client.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { AxiosInstance } from 'axios';

// Hoisted mocks
const refreshMock = vi.fn();
vi.mock('@/lib/generated/client/authControllerRefresh', () => ({
  authControllerRefresh: refreshMock,
}));

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetModules();
    refreshMock.mockReset();
  });

  it('cria instance com baseURL e withCredentials', async () => {
    const { apiClient } = await import('./api-client');
    expect(apiClient.defaults.baseURL).toBe('http://localhost:3000/api/v1');
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('em 401, dispara refresh e refaz request original', async () => {
    refreshMock.mockResolvedValueOnce({ user: { id: 'u1' } });

    const { apiClient } = await import('./api-client');
    const adapter = vi.fn();
    let firstCall = true;
    adapter.mockImplementation((config) => {
      if (firstCall && config.url === '/me') {
        firstCall = false;
        return Promise.reject({
          response: { status: 401 },
          config,
        });
      }
      return Promise.resolve({
        data: { user: { id: 'u1' } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    });
    (apiClient as AxiosInstance).defaults.adapter = adapter;

    const result = await apiClient.get('/me');

    expect(refreshMock).toHaveBeenCalledOnce();
    expect(result.status).toBe(200);
  });

  it('em 401 do refresh, redireciona pra /login', async () => {
    refreshMock.mockRejectedValueOnce({ response: { status: 401 } });

    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '', toString: () => '', assign: hrefSetter },
    });

    const { apiClient } = await import('./api-client');
    const adapter = vi.fn().mockRejectedValue({
      response: { status: 401 },
      config: { url: '/me', method: 'get' },
    });
    (apiClient as AxiosInstance).defaults.adapter = adapter;

    await expect(apiClient.get('/me')).rejects.toBeDefined();
  });

  it('compartilha promise de refresh entre 401s simultâneos', async () => {
    let resolveRefresh: (v: unknown) => void = () => {};
    refreshMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const { apiClient } = await import('./api-client');
    const adapter = vi.fn();
    const seen = new Set<string>();
    adapter.mockImplementation((config) => {
      const key = `${config.method}-${config.url}-${seen.has(config.url ?? '')}`;
      if (!seen.has(config.url ?? '')) {
        seen.add(config.url ?? '');
        return Promise.reject({ response: { status: 401 }, config });
      }
      return Promise.resolve({ data: 'ok', status: 200, statusText: 'OK', headers: {}, config });
    });
    (apiClient as AxiosInstance).defaults.adapter = adapter;

    const p1 = apiClient.get('/a');
    const p2 = apiClient.get('/b');

    setTimeout(() => resolveRefresh({ user: { id: 'u1' } }), 0);
    await Promise.all([p1, p2]);

    expect(refreshMock).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 1.2: Rodar e confirmar que falha**

Run: `pnpm test lib/api-client.test.ts`
Expected: FAIL — module './api-client' not found.

- [ ] **Step 1.3: Implementar `lib/api-client.ts`**

```ts
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
// Import dinâmico via require() pra evitar dependência circular em testes
// (a chamada acontece dentro do interceptor, não no top-level).
import type { authControllerRefresh as AuthControllerRefreshFn } from '@/lib/generated/client/authControllerRefresh';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

let _authControllerRefresh: typeof AuthControllerRefreshFn | null = null;
async function getAuthControllerRefresh(): Promise<typeof AuthControllerRefreshFn> {
  if (!_authControllerRefresh) {
    const mod = await import('@/lib/generated/client/authControllerRefresh');
    _authControllerRefresh = mod.authControllerRefresh;
  }
  return _authControllerRefresh;
}

let inFlightRefresh: Promise<void> | null = null;

async function performRefresh(): Promise<void> {
  if (inFlightRefresh) return inFlightRefresh;

  // Passar o próprio apiClient pra que o cookie `refresh_token` seja enviado.
  // O interceptor abaixo detecta pela URL que essa é a chamada de refresh
  // e evita loop infinito caso ela mesma retorne 401.
  inFlightRefresh = (async () => {
    const refresh = await getAuthControllerRefresh();
    await refresh({}, { client: apiClient });
  })().finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const isRefreshCall = originalRequest.url?.includes('/auth/refresh');
    if (isRefreshCall) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await performRefresh();
      return apiClient.request(originalRequest);
    } catch (refreshError) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    }
  },
);
```

- [ ] **Step 1.4: Rodar e confirmar que passa**

Run: `pnpm test lib/api-client.test.ts`
Expected: PASS (4/4).

- [ ] **Step 1.5: Configurar Kubb hooks para usarem o `apiClient`**

O Kubb gera hooks com axios default global. Precisamos passar nosso instance via `client` config a cada chamada. Para evitar repetição, criar wrapper helper.

Modificar `lib/api-client.ts` adicionando export:

```ts
// adicionar ao final de lib/api-client.ts
export const apiClientConfig = { client: apiClient };
```

(Hooks Kubb aceitam `{ client: instance }` no segundo parâmetro do mutation/query.)

- [ ] **Step 1.6: Commit**

```bash
git add lib/api-client.ts lib/api-client.test.ts
git commit -m "feat(api): add axios client with 401→refresh interceptor"
```

---

## Task 2: `lib/auth-server.ts` — fetch /me server-side

**Files:**

- Create: `lib/auth-server.ts`
- Create: `lib/auth-server.test.ts`

- [ ] **Step 2.1: Escrever o test (TDD)**

Criar `lib/auth-server.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchCurrentUser } from './auth-server';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';

const fakeUser: UserResponseDto = {
  id: '00000000-0000-7000-8000-000000000001',
  companyId: '00000000-0000-7000-8000-000000000002',
  name: 'Maria',
  email: 'maria@example.com',
  role: 'AGENT',
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: null,
  departments: [],
  createdAt: '2026-05-06T00:00:00.000Z',
  updatedAt: '2026-05-06T00:00:00.000Z',
};

describe('fetchCurrentUser', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna user em 200', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeUser,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchCurrentUser('access_token=abc; refresh_token=xyz');

    expect(result).toEqual(fakeUser);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/me'),
      expect.objectContaining({
        headers: expect.objectContaining({ cookie: 'access_token=abc; refresh_token=xyz' }),
        cache: 'no-store',
      }),
    );
  });

  it('retorna null em 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }),
    );

    const result = await fetchCurrentUser('access_token=expired');

    expect(result).toBeNull();
  });

  it('throws em 5xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );

    await expect(fetchCurrentUser('access_token=abc')).rejects.toThrow(/500/);
  });

  it('throws em erro de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    await expect(fetchCurrentUser('access_token=abc')).rejects.toThrow(/ECONNREFUSED/);
  });
});
```

- [ ] **Step 2.2: Rodar e confirmar falha**

Run: `pnpm test lib/auth-server.test.ts`
Expected: FAIL — module './auth-server' not found.

- [ ] **Step 2.3: Implementar `lib/auth-server.ts`**

```ts
import 'server-only';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export async function fetchCurrentUser(cookieHeader: string): Promise<UserResponseDto | null> {
  const response = await fetch(`${baseURL}/me`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch /me: ${response.status}`);
  }

  return (await response.json()) as UserResponseDto;
}
```

Atenção: `import 'server-only'` impede que esse arquivo seja importado em Client Components. Não testar `getCurrentUserOnServer` chamado de Server Component — testar só `fetchCurrentUser` (a função pura que recebe cookies como string).

- [ ] **Step 2.4: Rodar e confirmar passa**

Run: `pnpm test lib/auth-server.test.ts`
Expected: PASS (4/4).

- [ ] **Step 2.5: Adicionar wrapper consumível pelo Server Component**

Apêndice em `lib/auth-server.ts`:

```ts
import { cookies } from 'next/headers';

export async function getCurrentUserOnServer(): Promise<UserResponseDto | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  return fetchCurrentUser(cookieHeader);
}
```

(Este wrapper não testamos em unit — `cookies()` de `next/headers` não funciona fora de uma request Next.js. Coberto pela validação manual.)

- [ ] **Step 2.6: Commit**

```bash
git add lib/auth-server.ts lib/auth-server.test.ts
git commit -m "feat(auth): add server-side fetch of current user"
```

---

## Task 3: `stores/layout-store.ts` — Zustand para sidebar collapsed + mobile drawer

**Files:**

- Create: `stores/layout-store.ts`
- Create: `stores/layout-store.test.ts`

- [ ] **Step 3.1: Escrever o test**

Criar `stores/layout-store.test.ts`:

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { useLayoutStore } from './layout-store';

describe('layoutStore', () => {
  beforeEach(() => {
    useLayoutStore.setState({ sidebarCollapsed: false, mobileDrawerOpen: false });
    document.cookie = 'digichat_sidebar=; path=/; max-age=0';
  });

  it('default state: sidebar expanded, drawer closed', () => {
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(false);
    expect(useLayoutStore.getState().mobileDrawerOpen).toBe(false);
  });

  it('toggleSidebar alterna estado e escreve cookie', () => {
    useLayoutStore.getState().toggleSidebar();
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(true);
    expect(document.cookie).toContain('digichat_sidebar=collapsed');

    useLayoutStore.getState().toggleSidebar();
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(false);
    expect(document.cookie).toContain('digichat_sidebar=expanded');
  });

  it('hydrate aplica valor inicial vindo do cookie', () => {
    useLayoutStore.getState().hydrate(true);
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(true);
  });

  it('setMobileDrawerOpen controla o drawer mobile sem afetar cookie', () => {
    useLayoutStore.getState().setMobileDrawerOpen(true);
    expect(useLayoutStore.getState().mobileDrawerOpen).toBe(true);
    expect(document.cookie).not.toContain('digichat_sidebar');
  });
});
```

- [ ] **Step 3.2: Rodar e confirmar falha**

Run: `pnpm test stores/layout-store.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3.3: Implementar `stores/layout-store.ts`**

```ts
import { create } from 'zustand';

const SIDEBAR_COOKIE = 'digichat_sidebar';
const SIDEBAR_MAX_AGE_SEC = 60 * 60 * 24 * 365;

function writeSidebarCookie(collapsed: boolean) {
  if (typeof document === 'undefined') return;
  const value = collapsed ? 'collapsed' : 'expanded';
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SIDEBAR_COOKIE}=${value}; path=/; max-age=${SIDEBAR_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

interface LayoutState {
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  toggleSidebar: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  hydrate: (sidebarCollapsed: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    writeSidebarCookie(next);
    set({ sidebarCollapsed: next });
  },
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
  hydrate: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));
```

- [ ] **Step 3.4: Rodar e confirmar passa**

Run: `pnpm test stores/layout-store.test.ts`
Expected: PASS (4/4).

- [ ] **Step 3.5: Commit**

```bash
git add stores/layout-store.ts stores/layout-store.test.ts
git commit -m "feat(layout): add Zustand store for sidebar collapsed + mobile drawer"
```

---

## Task 4: `contexts/current-user-context.tsx` — Provider + hook

**Files:**

- Create: `contexts/current-user-context.tsx`

Componente puramente estrutural — sem teste unitário (covered by manual validation + downstream component tests que consomem o hook).

- [ ] **Step 4.1: Implementar**

```tsx
'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';

const CurrentUserContext = createContext<UserResponseDto | null>(null);

export function CurrentUserProvider({
  user,
  children,
}: {
  user: UserResponseDto;
  children: ReactNode;
}) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): UserResponseDto {
  const user = useContext(CurrentUserContext);
  if (!user) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider');
  }
  return user;
}
```

- [ ] **Step 4.2: Verificar typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 4.3: Commit**

```bash
git add contexts/current-user-context.tsx
git commit -m "feat(layout): add CurrentUserContext provider and hook"
```

---

## Task 5: `proxy.ts` — Next 16 middleware (cookie gate)

**Files:**

- Create: `proxy.ts` (raiz do projeto)

Em Next.js 16+: `proxy.ts` exporta `proxy()` (não `middleware()`) e `proxyConfig` (não `config`). Confirmado em https://nextjs.org/docs/app/building-your-application/routing/middleware (verificar build no fim).

- [ ] **Step 5.1: Implementar**

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token');

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

- [ ] **Step 5.2: Verificar build**

Run: `pnpm build`
Expected: build OK; logs incluem `Proxy` ou `Middleware` registrado.

- [ ] **Step 5.3: Commit**

```bash
git add proxy.ts
git commit -m "feat(auth): add proxy.ts cookie-gate for protected routes"
```

---

## Task 6: Atualizar `login-form.tsx` para login real

**Files:**

- Modify: `app/(auth)/login/login-form.tsx`
- Modify: `app/(auth)/login/login-form.test.tsx`

- [ ] **Step 6.1: Atualizar o test (TDD)**

Substituir o conteúdo de `app/(auth)/login/login-form.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from './login-form';

const pushMock = vi.fn();
const loginMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: pushMock }),
}));

vi.mock('@/lib/generated/hooks/useAuthControllerLogin', () => ({
  useAuthControllerLogin: () => ({
    mutateAsync: loginMock,
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function renderWithQuery(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('LoginForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    loginMock.mockReset();
  });

  it('renders email/password fields and submit button', () => {
    renderWithQuery(<LoginForm />);
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('submits with body { email, password } and redirects on success', async () => {
    loginMock.mockResolvedValueOnce({ user: { id: 'u1', name: 'Maria' } });

    const user = userEvent.setup();
    renderWithQuery(<LoginForm />);

    await user.type(screen.getByLabelText(/e-mail/i), 'maria@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'senha123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        data: { email: 'maria@example.com', password: 'senha123' },
      });
      expect(pushMock).toHaveBeenCalledWith('/atendimentos');
    });
  });

  it('shows inline error on 401', async () => {
    loginMock.mockRejectedValueOnce({ response: { status: 401 } });

    const user = userEvent.setup();
    renderWithQuery(<LoginForm />);

    await user.type(screen.getByLabelText(/e-mail/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'errada123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/e-mail ou senha incorretos/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6.2: Instalar `@testing-library/user-event` se ainda faltar**

Run: `pnpm list @testing-library/user-event 2>&1 | head`

Se ausente:

```bash
pnpm add -D @testing-library/user-event
```

(Lib auxiliar de testing-library; já é parte da família existente — não é "lib nova" no sentido arquitetural.)

- [ ] **Step 6.3: Rodar test e confirmar falha**

Run: `pnpm test app/\(auth\)/login/login-form.test.tsx`
Expected: FAIL (form ainda placeholder).

- [ ] **Step 6.4: Reescrever `login-form.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthControllerLogin } from '@/lib/generated/hooks/useAuthControllerLogin';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha precisa ter pelo menos 8 caracteres'),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const login = useAuthControllerLogin({
    client: { client: apiClient },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await login.mutateAsync({ data: values });
      router.push('/atendimentos');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setSubmitError('E-mail ou senha incorretos.');
      } else if (typeof status === 'number' && status >= 500) {
        setSubmitError('Erro no servidor. Tente novamente em instantes.');
      } else {
        setSubmitError('Sem conexão com o servidor.');
      }
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Entrar</CardTitle>
        <CardDescription>Acesse sua conta DigiChat</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email ? (
              <p className="text-danger-600 text-sm" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-danger-600 text-sm" role="alert">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          {submitError ? (
            <p className="text-danger-600 text-sm" role="alert">
              {submitError}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6.5: Rodar test e confirmar passa**

Run: `pnpm test app/\(auth\)/login/login-form.test.tsx`
Expected: PASS (3/3).

- [ ] **Step 6.6: Commit**

```bash
git add app/\(auth\)/login/login-form.tsx app/\(auth\)/login/login-form.test.tsx package.json pnpm-lock.yaml
git commit -m "feat(auth): wire login form to backend with cookie auth"
```

---

## Task 7: Atualizar `app/page.tsx` — root redirect

**Files:**

- Modify: `app/page.tsx`

- [ ] **Step 7.1: Reescrever `app/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.has('access_token');
  redirect(hasAccess ? '/atendimentos' : '/login');
}
```

- [ ] **Step 7.2: Verificar build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS.

- [ ] **Step 7.3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(routing): redirect root to /atendimentos or /login based on auth cookie"
```

---

## Task 8: `components/layout/app-sidebar-item.tsx`

**Files:**

- Create: `components/layout/app-sidebar-item.tsx`
- Create: `components/layout/app-sidebar-item.test.tsx`

- [ ] **Step 8.1: Escrever o test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppSidebarItem } from './app-sidebar-item';
import { Home } from 'lucide-react';

const pathnameMock = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock(),
}));

describe('AppSidebarItem', () => {
  it('marks aria-current="page" when pathname matches exactly', () => {
    pathnameMock.mockReturnValue('/atendimentos');
    render(<AppSidebarItem href="/atendimentos" icon={Home} label="Atendimentos" />);
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
  });

  it('marks aria-current="page" when pathname is a sub-route', () => {
    pathnameMock.mockReturnValue('/configuracoes/tags');
    render(<AppSidebarItem href="/configuracoes" icon={Home} label="Configurações" />);
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark aria-current when pathname is unrelated', () => {
    pathnameMock.mockReturnValue('/contatos');
    render(<AppSidebarItem href="/atendimentos" icon={Home} label="Atendimentos" />);
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current');
  });

  it('renders label hidden visually when collapsed but exposed via title', () => {
    pathnameMock.mockReturnValue('/atendimentos');
    render(<AppSidebarItem href="/atendimentos" icon={Home} label="Atendimentos" collapsed />);
    expect(screen.getByRole('link')).toHaveAttribute('title', 'Atendimentos');
  });
});
```

- [ ] **Step 8.2: Rodar e confirmar falha**

Run: `pnpm test components/layout/app-sidebar-item.test.tsx`
Expected: FAIL.

- [ ] **Step 8.3: Implementar**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function AppSidebarItem({
  href,
  icon: Icon,
  label,
  collapsed,
  onNavigate,
}: AppSidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        'hover:bg-bg-muted focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
        isActive
          ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 font-medium'
          : 'text-text-secondary',
        collapsed && 'justify-center',
      )}
    >
      {isActive ? (
        <span
          aria-hidden
          className="bg-primary-500 absolute top-1 bottom-1 left-0 w-0.5 rounded-r"
        />
      ) : null}
      <Icon className="h-5 w-5 shrink-0" />
      {collapsed ? null : <span className="truncate">{label}</span>}
    </Link>
  );
}
```

- [ ] **Step 8.4: Rodar e confirmar passa**

Run: `pnpm test components/layout/app-sidebar-item.test.tsx`
Expected: PASS (4/4).

- [ ] **Step 8.5: Commit**

```bash
git add components/layout/app-sidebar-item.tsx components/layout/app-sidebar-item.test.tsx
git commit -m "feat(layout): add AppSidebarItem with active-route highlighting"
```

---

## Task 9: `components/layout/app-sidebar-section.tsx` (Configurações expansível)

**Files:**

- Create: `components/layout/app-sidebar-section.tsx`

Sem test unitário separado — coberto por manual validation (interação de expansão tem mais valor em e2e).

- [ ] **Step 9.1: Implementar**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarSubItem {
  href: string;
  label: string;
}

interface AppSidebarSectionProps {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  items: SidebarSubItem[];
  onNavigate?: () => void;
}

export function AppSidebarSection({
  href,
  icon: Icon,
  label,
  collapsed,
  items,
  onNavigate,
}: AppSidebarSectionProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const [open, setOpen] = useState(isActive);

  if (collapsed) {
    return (
      <Link
        href={href}
        title={label}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center justify-center rounded-md px-3 py-2 text-sm',
          'hover:bg-bg-muted focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
          isActive
            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
            : 'text-text-secondary',
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`sidebar-section-${label}`}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          'hover:bg-bg-muted focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
          isActive
            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 font-medium'
            : 'text-text-secondary',
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? (
        <ul id={`sidebar-section-${label}`} className="mt-1 ml-7 space-y-0.5">
          {items.map((sub) => {
            const subActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
            return (
              <li key={sub.href}>
                <Link
                  href={sub.href}
                  onClick={onNavigate}
                  aria-current={subActive ? 'page' : undefined}
                  className={cn(
                    'block rounded-md px-3 py-1.5 text-sm transition-colors',
                    'hover:bg-bg-muted focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
                    subActive ? 'text-primary-600 font-medium' : 'text-text-secondary',
                  )}
                >
                  {sub.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 9.2: Verificar typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 9.3: Commit**

```bash
git add components/layout/app-sidebar-section.tsx
git commit -m "feat(layout): add AppSidebarSection with expandable sub-items"
```

---

## Task 10: `components/layout/app-sidebar.tsx`

**Files:**

- Create: `components/layout/app-sidebar.tsx`

Composição estática de items + section. Sem teste unitário (cada child já tem o seu).

- [ ] **Step 10.1: Implementar**

```tsx
'use client';

import {
  BarChart3,
  Bot,
  ChevronsLeft,
  ChevronsRight,
  Megaphone,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';
import { useLayoutStore } from '@/stores/layout-store';
import { AppSidebarItem } from './app-sidebar-item';
import { AppSidebarSection, type SidebarSubItem } from './app-sidebar-section';
import { cn } from '@/lib/utils';

const TOP_LEVEL = [
  { href: '/atendimentos', icon: MessageSquare, label: 'Atendimentos' },
  { href: '/contatos', icon: Users, label: 'Contatos' },
  { href: '/campanhas', icon: Megaphone, label: 'Campanhas' },
  { href: '/bot-fluxo', icon: Bot, label: 'Bot/Fluxo' },
  { href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
] as const;

const SETTINGS_SUB_ITEMS: SidebarSubItem[] = [
  { href: '/configuracoes/departamentos', label: 'Departamentos' },
  { href: '/configuracoes/tags', label: 'Tags' },
  { href: '/configuracoes/usuarios', label: 'Usuários' },
  { href: '/configuracoes/quick-replies', label: 'Quick Replies' },
  { href: '/configuracoes/canais', label: 'Canais' },
  { href: '/configuracoes/integracoes', label: 'Integrações' },
  { href: '/configuracoes/preferencias', label: 'Preferências' },
];

interface AppSidebarProps {
  onNavigate?: () => void;
  variant?: 'desktop' | 'mobile';
}

export function AppSidebar({ onNavigate, variant = 'desktop' }: AppSidebarProps) {
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed) && variant === 'desktop';
  const toggle = useLayoutStore((s) => s.toggleSidebar);

  return (
    <aside
      aria-label="Navegação principal"
      className={cn(
        'bg-bg-subtle border-border-default flex h-full flex-col border-r transition-[width]',
        variant === 'desktop' && (collapsed ? 'w-16' : 'w-60'),
        variant === 'mobile' && 'w-72',
      )}
    >
      <div className="border-border-default border-b px-4 py-4">
        <span
          className={cn(
            'text-text-primary text-lg font-semibold',
            collapsed && variant === 'desktop' && 'text-center',
          )}
        >
          {collapsed && variant === 'desktop' ? 'D' : 'DigiChat'}
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {TOP_LEVEL.map((item) => (
          <AppSidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
        <AppSidebarSection
          href="/configuracoes"
          icon={Settings}
          label="Configurações"
          collapsed={collapsed}
          items={SETTINGS_SUB_ITEMS}
          onNavigate={onNavigate}
        />
      </nav>

      {variant === 'desktop' ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'border-border-default text-text-secondary hover:bg-bg-muted flex items-center gap-2 border-t px-4 py-3 text-sm',
            'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
            collapsed && 'justify-center',
          )}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {collapsed ? null : <span>Recolher</span>}
        </button>
      ) : null}
    </aside>
  );
}
```

- [ ] **Step 10.2: Verificar typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 10.3: Commit**

```bash
git add components/layout/app-sidebar.tsx
git commit -m "feat(layout): add AppSidebar with collapse toggle and Configurações section"
```

---

## Task 11: `components/layout/user-menu.tsx`

**Files:**

- Create: `components/layout/user-menu.tsx`
- Create: `components/layout/user-menu.test.tsx`
- Create: `lib/initials.ts` (helper puro)
- Create: `lib/initials.test.ts`

Helper puro extraído pra teste isolado.

- [ ] **Step 11.1: Test do helper**

`lib/initials.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getInitials } from './initials';

describe('getInitials', () => {
  it('1 palavra → 1 letra', () => {
    expect(getInitials('Maria')).toBe('M');
  });

  it('2 palavras → 2 letras', () => {
    expect(getInitials('Maria Silva')).toBe('MS');
  });

  it('3+ palavras → primeiras 2', () => {
    expect(getInitials('Maria das Dores Silva')).toBe('MD');
  });

  it('vazio → "?"', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials('   ')).toBe('?');
  });

  it('letras minúsculas viram maiúsculas', () => {
    expect(getInitials('joão paulo')).toBe('JP');
  });
});
```

- [ ] **Step 11.2: Implementar `lib/initials.ts`**

```ts
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}
```

- [ ] **Step 11.3: Rodar tests do helper**

Run: `pnpm test lib/initials.test.ts`
Expected: PASS (5/5).

- [ ] **Step 11.4: Test do componente**

`components/layout/user-menu.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserMenu } from './user-menu';
import { CurrentUserProvider } from '@/contexts/current-user-context';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';

const replaceMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
}));

vi.mock('@/lib/generated/hooks/useAuthControllerLogout', () => ({
  useAuthControllerLogout: () => ({
    mutateAsync: logoutMock,
    isPending: false,
  }),
}));

const fakeUser: UserResponseDto = {
  id: '00000000-0000-7000-8000-000000000001',
  companyId: '00000000-0000-7000-8000-000000000002',
  name: 'Maria Silva',
  email: 'maria@example.com',
  role: 'AGENT',
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: null,
  departments: [],
  createdAt: '2026-05-06T00:00:00.000Z',
  updatedAt: '2026-05-06T00:00:00.000Z',
};

function renderWithProviders(ui: React.ReactNode, user: UserResponseDto = fakeUser) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CurrentUserProvider user={user}>{ui}</CurrentUserProvider>
    </QueryClientProvider>,
  );
}

describe('UserMenu', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    logoutMock.mockReset();
  });

  it('renders initials derived from user name', () => {
    renderWithProviders(<UserMenu />);
    expect(screen.getByText('MS')).toBeInTheDocument();
  });

  it('opens dropdown on click and shows user info', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserMenu />);

    await user.click(screen.getByRole('button', { name: /menu do usuário/i }));

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /sair/i })).toBeInTheDocument();
  });

  it('calls logout mutation and replaces route on Sair click', async () => {
    logoutMock.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<UserMenu />);

    await user.click(screen.getByRole('button', { name: /menu do usuário/i }));
    await user.click(screen.getByRole('menuitem', { name: /sair/i }));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledOnce();
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });
});
```

- [ ] **Step 11.5: Implementar `user-menu.tsx`**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthControllerLogout } from '@/lib/generated/hooks/useAuthControllerLogout';
import { apiClient } from '@/lib/api-client';
import { useCurrentUser } from '@/contexts/current-user-context';
import { getInitials } from '@/lib/initials';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const user = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthControllerLogout({ client: { client: apiClient } });

  const initials = getInitials(user.name);

  async function handleLogout() {
    try {
      await logout.mutateAsync({ data: {} });
      queryClient.clear();
      router.replace('/login');
    } catch {
      toast.error('Não foi possível sair. Tente novamente.');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Menu do usuário"
          className={cn(
            'hover:bg-bg-muted focus-visible:ring-primary-500 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none',
          )}
        >
          <span
            aria-hidden
            className="bg-primary-500 text-text-inverse flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
          >
            {initials}
          </span>
          <span className="text-text-primary hidden text-sm font-medium md:inline">
            {user.name || 'Usuário'}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-text-primary text-sm font-medium">{user.name || 'Usuário'}</div>
          <div className="text-text-secondary text-xs">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/configuracoes/preferencias')}>
          <User className="mr-2 h-4 w-4" />
          Meu perfil
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleLogout} disabled={logout.isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          {logout.isPending ? 'Saindo…' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 11.6: Rodar tests do componente**

Run: `pnpm test components/layout/user-menu.test.tsx`
Expected: PASS (3/3).

- [ ] **Step 11.7: Commit**

```bash
git add lib/initials.ts lib/initials.test.ts components/layout/user-menu.tsx components/layout/user-menu.test.tsx
git commit -m "feat(layout): add UserMenu with initials avatar and logout"
```

---

## Task 12: `components/layout/mobile-sidebar-drawer.tsx`

**Files:**

- Create: `components/layout/mobile-sidebar-drawer.tsx`

Sem test unitário (Radix Dialog em jsdom é frágil; coberto por validação manual).

- [ ] **Step 12.1: Implementar**

```tsx
'use client';

import { useEffect } from 'react';
import { useLayoutStore } from '@/stores/layout-store';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AppSidebar } from './app-sidebar';

const MD_BREAKPOINT_PX = 768;

export function MobileSidebarDrawer() {
  const open = useLayoutStore((s) => s.mobileDrawerOpen);
  const setOpen = useLayoutStore((s) => s.setMobileDrawerOpen);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= MD_BREAKPOINT_PX && open) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="fixed inset-y-0 left-0 h-full w-72 max-w-full translate-x-0 translate-y-0 rounded-none border-0 p-0 sm:rounded-none">
        <DialogTitle className="sr-only">Menu de navegação</DialogTitle>
        <AppSidebar variant="mobile" onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 12.2: Verificar typecheck e build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS.

- [ ] **Step 12.3: Commit**

```bash
git add components/layout/mobile-sidebar-drawer.tsx
git commit -m "feat(layout): add MobileSidebarDrawer with auto-close on resize"
```

---

## Task 13: `components/layout/app-header.tsx`

**Files:**

- Create: `lib/route-titles.ts`
- Create: `components/layout/app-header.tsx`

- [ ] **Step 13.1: Criar `lib/route-titles.ts`**

```ts
const TITLES: Record<string, string> = {
  '/atendimentos': 'Atendimentos',
  '/contatos': 'Contatos',
  '/campanhas': 'Campanhas',
  '/bot-fluxo': 'Bot/Fluxo',
  '/dashboard': 'Dashboard',
  '/configuracoes': 'Configurações',
  '/configuracoes/departamentos': 'Departamentos',
  '/configuracoes/tags': 'Tags',
  '/configuracoes/usuarios': 'Usuários',
  '/configuracoes/quick-replies': 'Quick Replies',
  '/configuracoes/canais': 'Canais',
  '/configuracoes/integracoes': 'Integrações',
  '/configuracoes/preferencias': 'Preferências',
};

export function getRouteTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const matched = Object.keys(TITLES)
    .filter((k) => pathname.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0];
  return matched ? TITLES[matched] : '';
}
```

- [ ] **Step 13.2: Implementar `app-header.tsx`**

```tsx
'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { useLayoutStore } from '@/stores/layout-store';
import { getRouteTitle } from '@/lib/route-titles';
import { UserMenu } from './user-menu';

export function AppHeader() {
  const pathname = usePathname();
  const title = getRouteTitle(pathname);
  const setMobileDrawerOpen = useLayoutStore((s) => s.setMobileDrawerOpen);

  return (
    <header className="bg-bg-base border-border-default flex h-14 items-center gap-3 border-b px-4">
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={() => setMobileDrawerOpen(true)}
        className="hover:bg-bg-muted focus-visible:ring-primary-500 rounded-md p-2 focus-visible:ring-2 focus-visible:outline-none md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-text-primary text-base font-semibold">{title}</h1>
      <div className="flex-1" />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
```

- [ ] **Step 13.3: Verificar typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 13.4: Commit**

```bash
git add lib/route-titles.ts components/layout/app-header.tsx
git commit -m "feat(layout): add AppHeader with title slot, theme toggle, and UserMenu"
```

---

## Task 14: `components/layout/app-shell.tsx`

**Files:**

- Create: `components/layout/app-shell.tsx`

- [ ] **Step 14.1: Implementar**

```tsx
'use client';

import { useEffect, type ReactNode } from 'react';
import { CurrentUserProvider } from '@/contexts/current-user-context';
import { useLayoutStore } from '@/stores/layout-store';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { MobileSidebarDrawer } from './mobile-sidebar-drawer';

interface AppShellProps {
  user: UserResponseDto;
  sidebarCollapsedInitial: boolean;
  children: ReactNode;
}

export function AppShell({ user, sidebarCollapsedInitial, children }: AppShellProps) {
  const hydrate = useLayoutStore((s) => s.hydrate);

  useEffect(() => {
    hydrate(sidebarCollapsedInitial);
  }, [hydrate, sidebarCollapsedInitial]);

  return (
    <CurrentUserProvider user={user}>
      <div className="bg-bg-base text-text-primary flex h-screen overflow-hidden">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <MobileSidebarDrawer />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </CurrentUserProvider>
  );
}
```

- [ ] **Step 14.2: Verificar typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 14.3: Commit**

```bash
git add components/layout/app-shell.tsx
git commit -m "feat(layout): add AppShell composing sidebar, header, and drawer"
```

---

## Task 15: `app/(app)/layout.tsx` — Server Component que monta o shell

**Files:**

- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/loading.tsx`
- Create: `app/(app)/error.tsx`

- [ ] **Step 15.1: Implementar `layout.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUserOnServer } from '@/lib/auth-server';
import { AppShell } from '@/components/layout/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOnServer();
  if (!user) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  const sidebarCollapsedInitial = cookieStore.get('digichat_sidebar')?.value === 'collapsed';

  return (
    <AppShell user={user} sidebarCollapsedInitial={sidebarCollapsedInitial}>
      {children}
    </AppShell>
  );
}
```

- [ ] **Step 15.2: Implementar `loading.tsx`**

```tsx
export default function AppLoading() {
  return (
    <div className="bg-bg-base flex h-screen overflow-hidden">
      <div className="bg-bg-subtle border-border-default hidden w-60 border-r md:block" />
      <div className="flex flex-1 flex-col">
        <div className="bg-bg-base border-border-default h-14 border-b" />
        <div className="bg-bg-muted/50 flex-1 animate-pulse" />
      </div>
    </div>
  );
}
```

- [ ] **Step 15.3: Implementar `error.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function AppError({
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
    <div className="flex h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-text-primary text-xl font-semibold">Algo deu errado</h2>
        <p className="text-text-secondary text-sm">
          Não conseguimos carregar essa parte. Tente recarregar.
        </p>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 15.4: Verificar build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS.

- [ ] **Step 15.5: Commit**

```bash
git add app/\(app\)/layout.tsx app/\(app\)/loading.tsx app/\(app\)/error.tsx
git commit -m "feat(routing): add (app) protected layout with /me fetch and shell"
```

---

## Task 16: Páginas placeholder — top-level (6) e sub-itens (7)

**Files:**

- Create: `app/(app)/atendimentos/page.tsx`
- Create: `app/(app)/contatos/page.tsx`
- Create: `app/(app)/campanhas/page.tsx`
- Create: `app/(app)/bot-fluxo/page.tsx`
- Create: `app/(app)/dashboard/page.tsx`
- Create: `app/(app)/configuracoes/page.tsx`
- Create: `app/(app)/configuracoes/departamentos/page.tsx`
- Create: `app/(app)/configuracoes/tags/page.tsx`
- Create: `app/(app)/configuracoes/usuarios/page.tsx`
- Create: `app/(app)/configuracoes/quick-replies/page.tsx`
- Create: `app/(app)/configuracoes/canais/page.tsx`
- Create: `app/(app)/configuracoes/integracoes/page.tsx`
- Create: `app/(app)/configuracoes/preferencias/page.tsx`

- [ ] **Step 16.1: Criar componente shared `Placeholder`**

`components/layout/placeholder-page.tsx`:

```tsx
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-text-primary mb-2 text-2xl font-semibold">{title}</h2>
        <p className="text-text-secondary text-sm">Em breve.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 16.2: Criar 13 page.tsx**

Cada arquivo com este molde (substituindo `<NOME>`):

```tsx
import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const metadata: Metadata = { title: '<NOME> — DigiChat' };

export default function Page() {
  return <PlaceholderPage title="<NOME>" />;
}
```

Mapping nome → arquivo:

| Arquivo                                          | `<NOME>`      |
| ------------------------------------------------ | ------------- |
| `app/(app)/atendimentos/page.tsx`                | Atendimentos  |
| `app/(app)/contatos/page.tsx`                    | Contatos      |
| `app/(app)/campanhas/page.tsx`                   | Campanhas     |
| `app/(app)/bot-fluxo/page.tsx`                   | Bot/Fluxo     |
| `app/(app)/dashboard/page.tsx`                   | Dashboard     |
| `app/(app)/configuracoes/page.tsx`               | Configurações |
| `app/(app)/configuracoes/departamentos/page.tsx` | Departamentos |
| `app/(app)/configuracoes/tags/page.tsx`          | Tags          |
| `app/(app)/configuracoes/usuarios/page.tsx`      | Usuários      |
| `app/(app)/configuracoes/quick-replies/page.tsx` | Quick Replies |
| `app/(app)/configuracoes/canais/page.tsx`        | Canais        |
| `app/(app)/configuracoes/integracoes/page.tsx`   | Integrações   |
| `app/(app)/configuracoes/preferencias/page.tsx`  | Preferências  |

- [ ] **Step 16.3: Verificar build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS; logs listam 13 rotas registradas em `(app)/`.

- [ ] **Step 16.4: Commit**

```bash
git add app/\(app\)/ components/layout/placeholder-page.tsx
git commit -m "feat(routing): add 13 placeholder pages for (app) routes"
```

---

## Task 17: Atualizar README e `.env.example`

**Files:**

- Create: `.env.example`
- Modify: `README.md` (adicionar seção de setup local)

- [ ] **Step 17.1: Criar `.env.example`**

```
# URL pública da API do crm-api (sem trailing slash, com /api/v1)
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

- [ ] **Step 17.2: Adicionar seção "Setup local" ao `README.md`**

Inserir após a seção "Stack" (ou no topo se não houver):

```markdown
## Setup local

1. Backend `crm-api` rodando em `http://localhost:3000` com `WEB_ORIGIN=http://localhost:3001` no `.env`.
2. `cp .env.example .env` no `crm-web`.
3. `pnpm install`.
4. `pnpm dev` (porta 3001).
5. Abrir `http://localhost:3001/login` e autenticar.

Auth canônica via cookie httpOnly assinado pelo backend (ver ADR 0001 do `crm-api`). Frontend não persiste tokens em localStorage.
```

- [ ] **Step 17.3: Commit**

```bash
git add .env.example README.md
git commit -m "docs: add .env.example and local setup instructions"
```

---

## Task 18: Verificação final por evidência

**Files:** none (manual + lint/test/build).

- [ ] **Step 18.1: Format / lint / typecheck / test / build**

Run em sequência:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Esperado: todos verdes. Se algum falhar, corrigir e re-rodar antes de seguir.

- [ ] **Step 18.2: Drift detection do snapshot**

Run:

```bash
pnpm generate:api:from-snapshot && git diff --exit-code lib/generated openapi.snapshot.json
```

Expected: zero diff.

- [ ] **Step 18.3: Validação manual end-to-end**

Subir backend + frontend:

```bash
# terminal 1 — em ../crm-api
pnpm start:dev

# terminal 2 — em crm-web
pnpm dev
```

Marcar cada item rodando manualmente com o navegador:

- [ ] `http://localhost:3001/` sem login → 307 `/login`
- [ ] Login com credenciais válidas (criar via crm-api seed) → cookies httpOnly visíveis em DevTools (`access_token`, `refresh_token`, ambos `HttpOnly`) → redirect `/atendimentos`
- [ ] Sidebar destaca rota ativa em todas 6 rotas top
- [ ] "Configurações" expande, sub-itens navegam, todos abrem placeholder com título correto no header
- [ ] Toggle dark/light afeta sidebar, header, dropdown, drawer mobile, login form
- [ ] Resize `< md` → sidebar oculta, hamburger aparece
- [ ] Hamburger abre drawer; Esc fecha; backdrop fecha; click em link fecha
- [ ] Toggle de collapse desktop persiste após reload (cookie `digichat_sidebar` em DevTools)
- [ ] Logout limpa cookies (DevTools mostra `Set-Cookie` com `Max-Age=0`) → `/login`
- [ ] Acessar `/atendimentos` direto após logout → `/login`
- [ ] Editar valor de `access_token` no DevTools (forçar inválido) → próxima nav protegida → 401 → refresh → se válido segue, senão `/login`
- [ ] Stub backend retornando 5xx no `/me` (matar o backend e tentar nav) → vê `error.tsx` com botão "Tentar novamente"
- [ ] Acessibilidade: navegar shell inteiro por Tab; Enter ativa link; Esc fecha drawer/dropdown; focus visible em todos elementos

- [ ] **Step 18.4: Atualizar todos do plan**

Confirmar que todos os checkboxes do plano estão marcados como `[x]`.

- [ ] **Step 18.5: Push da branch + abrir PR via gh CLI (com confirmação humana antes)**

Pedir OK ao humano antes do push:

> "Tudo verificado. Posso fazer push da branch `feat/sprint-0-14-app-shell` e abrir PR via gh?"

Após OK:

```bash
git push -u origin feat/sprint-0-14-app-shell
gh pr create --title "Sprint 0.14 — app shell pós-login" --body "$(cat <<'EOF'
## Sumário

- Login real substituindo placeholder (cookie httpOnly)
- Route group `(app)` com 13 páginas placeholder
- `proxy.ts` (Next 16) gateando rotas por presença de `access_token`
- Server Component em `app/(app)/layout.tsx` faz fetch /me com cookies da request
- Axios interceptor com refresh seamless em 401 (singleton de promise)
- Sidebar (collapse persistido em cookie), Header, UserMenu (iniciais), Mobile drawer
- Spec em `docs/superpowers/specs/2026-05-06-sprint-0-14-app-shell-design.md`
- Plan em `docs/superpowers/plans/2026-05-06-sprint-0-14-app-shell.md`

## Test plan

- [ ] CI verde (lint, format, typecheck, test, build)
- [ ] Snapshot drift zero
- [ ] Validação manual checklist completo (ver §18.3 do plan)
EOF
)"
```

---

## Pós-merge: PR de docs separado

Após o merge dessa sprint, abrir branch nova `docs/update-roadmap-0-13-0-14`:

- Marcar 7 checkboxes em `ROADMAP.md` §4.3 (Sprint 0.13 — feita em PR #11).
- Marcar "Layout base Izing-like" e "Páginas dummy de Atendimentos" em §4.6.
- Adicionar nota em §4.6 sobre gaps remanescentes desta sprint:
  - Showcase `/design-system` com componentes do shell
  - Tela de Register
  - RBAC efetivo por role
  - Avatar com upload
  - Tela "Meu perfil" funcional (`PATCH /me`)

PR pequeno, sem código.
