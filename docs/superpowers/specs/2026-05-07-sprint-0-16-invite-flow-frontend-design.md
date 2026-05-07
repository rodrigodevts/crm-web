# Sprint 0.16 Fase B — Frontend de convite de usuários

> **Repo:** `crm-web`
> **Branch:** `feat/invitations`
> **Pré-requisito merged:** `crm-api` PR #40 (`feat(invitations)` — Sprint 0.16 Fase A, commit `4205f83`)
> **Substitui o gap descartado:** "Página de register" (PRs #15/#16 do `crm-web` — Sprint 0.15 Fase B revertida)

## 1. Objetivo

Entregar a UI completa do fluxo de convite de usuários consumindo os endpoints
publicados pelo `crm-api` na Fase A:

- **Admin** convida via tela de Configurações → Usuários
- **Convidado** aceita via link público `/aceitar-convite/[token]`

## 2. Decisões alinhadas com o humano

1. Token sem expiração — vale até `ACCEPTED` ou `REVOKED`.
2. Aceite captura **apenas nome + senha**; email/role/companyName aparecem read-only no formulário.
3. Envio de email transacional **fora de escopo** desta sprint. Admin copia o `inviteUrl` manualmente (toast pós-create + ação na tabela).
4. Roles convidáveis na UI: **`ADMIN` e `AGENT`** (backend aceita `SUPERVISOR` também, mas a UI restringe à dupla básica enquanto não houver especificação dedicada de Supervisor).
5. `proxy.ts` simplesmente libera `/aceitar-convite` (sem redirect imediato pra `/atendimentos` se o usuário já estiver autenticado — o backend lida com isso).
6. Lista de usuários ativos (`UsersTable`) — **fora de escopo**, declarada como TODO inline na página `/configuracoes/usuarios` e gap separado no §4.8 do ROADMAP.

## 3. Componentes e rotas

### Rotas

- `app/(auth)/aceitar-convite/[token]/page.tsx` — Server Component que faz `GET /api/v1/invitations/by-token/:token` server-side com `cache: 'no-store'` e ramifica:
  - **200** → `<AcceptInviteForm />` com email/role/companyName read-only
  - **404 / 410** → tela "Convite indisponível" + link pra `/login`
  - **outros** → tela "Erro ao carregar convite"
- `app/(app)/configuracoes/usuarios/page.tsx` — substitui o `<PlaceholderPage />` por header com botão `<InviteUserDialog />` + seção `<InvitationsTable />`. UsersTable é TODO declarado.

### Componentes client

- `components/accept-invite-form.tsx` — RHF + Zod local (`name`, `password`, `confirmPassword` com `.refine`). Usa `useInvitationsPublicControllerAccept`. Sucesso → `router.push('/atendimentos')` (cookies httpOnly setados pelo backend). Erros: 410, 404, 400, 5xx, network.
- `components/users/invite-user-dialog.tsx` — Dialog shadcn com email + role select. Usa `useInvitationsControllerCreate`. Sucesso → toast com action "Copiar link" + invalida `invitationsControllerListQueryKey()`. 409 → mensagem inline no campo email (mensagem do backend é renderizada diretamente — distingue `Email já cadastrado` × `Já existe um convite pendente para este email`).
- `components/users/invitations-table.tsx` — Table shadcn com filtro por status (Tabs Pendentes/Aceitos/Revogados) e ações por linha. PENDING: copiar link / reenviar / revogar. ACCEPTED & REVOKED: sem ações.

### Helpers

- `lib/invite-server.ts` — `fetchInvitationByToken(token)` retorna discriminated union `{kind:'ok'|'invalid'|'error'}`.
- `lib/api/invitations.ts` — schemas Zod espelhando os DTOs de resposta do backend (workaround pro gap do OpenAPI publishing — ver §6).

### Infra

- `proxy.ts` — adiciona `/aceitar-convite` em `PUBLIC_PATHS`.

## 4. Hooks Kubb usados (lib/generated)

| Endpoint                                          | Hook                                                       |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `POST /api/v1/invitations`                        | `useInvitationsControllerCreate`                           |
| `GET /api/v1/invitations`                         | `useInvitationsControllerList`                             |
| `POST /api/v1/invitations/:id/revoke`             | `useInvitationsControllerRevoke`                           |
| `POST /api/v1/invitations/:id/resend`             | `useInvitationsControllerResend`                           |
| `GET /api/v1/invitations/by-token/:token`         | (Server Component fetch direto via `lib/invite-server.ts`) |
| `POST /api/v1/invitations/by-token/:token/accept` | `useInvitationsPublicControllerAccept`                     |

## 5. Tratamento de erros (matriz)

| Endpoint        | Status  | UI                                                         |
| --------------- | ------- | ---------------------------------------------------------- |
| Create          | 409     | Mensagem do backend inline no campo email (`message`)      |
| Create          | 400     | "Não foi possível validar os dados."                       |
| Create          | 5xx     | "Erro no servidor. Tente novamente em instantes."          |
| Create          | network | "Sem conexão com o servidor."                              |
| Accept          | 410     | "Este convite não está mais disponível…" + bloqueia retry  |
| Accept          | 404     | "Convite não encontrado."                                  |
| Accept          | 400     | "Não foi possível validar os dados. Confira nome e senha." |
| Accept          | 5xx     | "Erro no servidor. Tente novamente em instantes."          |
| GetByToken (SC) | 404/410 | Tela "Convite indisponível" no Server Component            |
| Revoke          | erro    | toast.error "Não foi possível revogar o convite"           |
| Resend          | erro    | toast.error "Não foi possível reenviar o convite"          |

## 6. Gap reportado: OpenAPI response publishing (Fase A)

A Fase A no `crm-api` (PR #40) declara `@ZodSerializerDto` em todos os endpoints de Invitation
mas **só uma das 5 rotas com corpo** declara também `@ApiOkResponse({ type: ... })` ou
`@ApiCreatedResponse({ type: ... })`. Sem essas annotations, o Swagger não inclui o schema
de resposta no OpenAPI e o Kubb gera `Response = unknown` em `lib/generated/types/Invitations*.ts`.

Rotas afetadas (tipos `unknown` em `lib/generated`):

- `POST /api/v1/invitations` → `InvitationCreatedDto` (faltava `@ApiCreatedResponse`)
- `GET  /api/v1/invitations` → `InvitationListResponseDto` (faltava `@ApiOkResponse`)
- `POST /api/v1/invitations/:id/resend` → `InvitationCreatedDto` (faltava `@ApiOkResponse`)
- `GET  /api/v1/invitations/by-token/:token` → `PublicInvitationDto` (faltava `@ApiOkResponse`)

(A 5ª rota com corpo, `POST /by-token/:token/accept`, já tem `@ApiOkResponse({ type: AuthResponseDto })` e funciona corretamente.)

**Workaround:** `crm-web/lib/api/invitations.ts` define schemas Zod espelhando exatamente
`crm-api/src/modules/invitations/schemas/invitation-response.schema.ts`. Componentes parseiam
o `unknown` retornado via `parseInvitationCreated`, `parseInvitationList`, `parsePublicInvitation`.

**Próximo passo (sprint dedicada no `crm-api`):** adicionar os 4 decoradores faltantes,
regerar `crm-web/openapi.snapshot.json` + `lib/generated`, remover o `lib/api/invitations.ts`
e voltar a importar tipos de `lib/generated/types/`.

## 7. Cobertura de testes

| Arquivo                                        | Casos                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `proxy.test.ts`                                | Rotas públicas / privadas / cookie gating                           |
| `components/accept-invite-form.test.tsx`       | Render read-only, validação Zod, submit feliz, 410                  |
| `components/users/invite-user-dialog.test.tsx` | Submit + toast com Copiar link, 409 EMAIL_TAKEN, 409 INVITE_PENDING |
| `components/users/invitations-table.test.tsx`  | Render por status (PENDING/ACCEPTED), revoke com confirmação        |

## 8. Critério de pronto (espelho do prompt)

- [x] `/aceitar-convite/[token]` acessível sem auth (proxy libera)
- [x] Server Component lida com 404/410 mostrando tela amigável
- [x] `accept-invite-form` usa hook gerado, schema Zod local com `refine` de senha
- [x] Pós-sucesso: redirect pra `/atendimentos`
- [x] `InviteUserDialog` em `/configuracoes/usuarios` com toast + copy-link
- [x] `InvitationsTable` mostra convites com filtro por status e ações por status
- [x] Mensagens de erro em pt-BR pros casos 409, 410, 400, 5xx, network
- [x] Testes RTL conforme tabela §7
- [x] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` verdes (validar no commit final)
- [x] `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` zero diff (validar no commit final)
- [x] ROADMAP §4.8 marcado com `[x]` pra "Sistema de convite de usuários"
- [x] Spec da fase em `docs/superpowers/specs/2026-05-07-sprint-0-16-invite-flow-frontend-design.md` (este arquivo)
- [ ] PR aberto referenciando o PR mergeado da Fase A no `crm-api` (#40)
