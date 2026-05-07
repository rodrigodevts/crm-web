# /register page — design

> Sprint 0.15, Fase B. Gap #1 do ROADMAP §4.8 do `crm-web`.
> Backend (`POST /api/v1/auth/register`) entregue na Fase A (`crm-api` PR #38).

---

## Objetivo

Implementar self-signup de tenant: usuário preenche dados da empresa + admin,
submete o form, backend cria `Company + ADMIN` em transação única, seta cookies
httpOnly e o frontend navega para `/atendimentos`.

---

## Endpoint consumido

`POST /api/v1/auth/register` (hook gerado: `useAuthControllerRegister` em
`lib/generated/hooks/`).

DTO (`RegisterDto`):

| campo       | tipo           | obrigatório | validação backend   |
| ----------- | -------------- | ----------- | ------------------- |
| companyName | string         | sim         | 2-100 chars         |
| companySlug | string?        | não         | derivado se omitido |
| adminName   | string         | sim         | 2-100 chars         |
| adminEmail  | string         | sim         | email válido        |
| password    | string         | sim         | 8-128 chars         |
| acceptTerms | literal `true` | sim         | precisa ser `true`  |

Resposta `201`: `AuthResponseDto` (cookies setados pelo backend).
Erros: `400` (validação), `409` (email/slug em uso).

---

## Campos visíveis no form

1. **Empresa** (`companyName`) — required, 2-100
2. **Nome do admin** (`adminName`) — required, 2-100
3. **E-mail** (`adminEmail`) — required, formato email
4. **Senha** (`password`) — required, mínimo 8
5. **Confirmar senha** (`confirmPassword`, UI-only) — precisa bater com `password`
6. **Aceito os termos** (`acceptTerms`, checkbox) — precisa estar marcado

`companySlug` **não** é exposto no form. Backend deriva de `companyName`.
`confirmPassword` é descartado antes do submit ao backend.

---

## Validação client (Zod)

Schema local em `register-form.tsx`, espelhando o backend, com mensagens em
pt-BR e refine para `password === confirmPassword`. Mesmo padrão do
`login-form.tsx` (que também tem schema local com mensagens custom).

Razão de não usar `registerDtoSchema` gerado direto:

- mensagens em inglês (`"Invalid input: expected string"`)
- não tem `confirmPassword` (campo de UI)
- precisa de `superRefine` pra checar igualdade de senhas

---

## Tratamento de erro

- Catch no `mutateAsync`. Inspecionar `err.response.status`:
  - `409` → `"E-mail já cadastrado."` (global)
  - `400` → `"Não foi possível criar a conta. Verifique os dados."`
    (validação client deveria pegar antes; fallback)
  - `>=500` → `"Erro no servidor. Tente novamente em instantes."`
  - default → `"Sem conexão com o servidor."`
- Mensagem global aparece como `FieldDescription` `text-destructive`,
  igual ao `submitError` do login-form.

---

## Pós-sucesso

`router.push('/atendimentos')` (mesmo destino do login).

Não invalidamos `useMe` na client cache porque a auth é checada no
`(app)/layout.tsx` via Server Component (`getCurrentUserOnServer`). Toda
navegação re-executa o layout e re-busca `/me`.

---

## Acessibilidade

- `<FieldLabel htmlFor>` em cada input (mesmo padrão do login-form)
- `aria-invalid` e `role="alert"` nos `FieldDescription` de erro
- Botão de submit com `disabled` enquanto `mutation.isPending`
- `noValidate` no `<form>` (validação fica com Zod, não browser)

---

## Cookie gate (`proxy.ts`)

Já libera `/register` (está em `PUBLIC_PATHS`).
Adicional: se já há `access_token`, qualquer GET em `/login` ou `/register`
redireciona pra `/atendimentos`. Mesma regra simétrica pra ambos os paths
de auth — mantém consistência sem precisar checar nas pages.

---

## Cross-links

- `/register`: link "Já tem conta? Entrar" → `/login`
- `/login`: link "Não tem conta? Criar conta" → `/register`
  (pequena adição no LoginForm já existente)

---

## Layout / componentes

`app/(auth)/register/page.tsx` (Server Component) — mesmo wrapper visual do
`/login` (Card cheio centralizado).

`components/register-form.tsx` (`'use client'`) — espelha o `login-form.tsx`:

- Card com grid 2-col
- Lado esquerdo: form com `FieldGroup`, `Field`, `Input`, `Button`
- Lado direito: brand panel DigiChat (gradiente primary)
- Reusa shadcn/ui: `Card`, `Button`, `Field*`, `Input`, `Label` (precisa
  adicionar `Checkbox` se ainda não existe)

---

## Plano de teste

`components/register-form.test.tsx` (Vitest + React Testing Library):

1. Renderiza todos os campos com labels visíveis
2. Submit vazio → mostra erros required nos 5 campos
3. Senha < 8 caracteres → erro
4. Confirmar senha diferente → erro
5. Checkbox de termos não marcado → erro
6. Submit válido → `mutateAsync` chamado com payload sem `confirmPassword`
7. 409 → mostra "E-mail já cadastrado"

Mock do hook gerado via `vi.mock('@/lib/generated/hooks/useAuthControllerRegister')`.

---

## Critério de pronto

- `/register` acessível sem auth, redireciona pra `/atendimentos` se autenticado
- Form valida com Zod local (PT-BR)
- 409 mapeado pra mensagem amigável
- Submit usa hook gerado
- Pós-sucesso navega pra `/atendimentos`
- Cross-links nas duas páginas
- Testes RTL passam
- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` verdes
- `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` zero diff
- ROADMAP §4.8: item de register marcado `[x]`
- PR aberto referenciando `crm-api` PR #38
