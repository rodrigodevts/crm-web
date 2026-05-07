# Sistema de convite de usuários — design

> Substitui o gap "Página de register" do ROADMAP §4.8 (descartado em PR #16
>
> - crm-api PR #39 — modelo de self-signup público não cabe no produto).
>   Spec novo: criação de usuários **só por convite de admin existente**.
>   E-mail transacional fica fora desta entrega (sprint futura).

---

## Contexto e decisão

DigiChat é multi-tenant SaaS Izing-like. Usuários (ADMIN/AGENT) **não**
se auto-cadastram — são criados por um admin do tenant via convite.

Tenants (Companies) **também não** se auto-cadastram. Provisionamento
inicial fica a cargo do operador da plataforma (você), via seed/CLI/painel
super-admin (não escopado aqui).

---

## Fluxo end-to-end

```
[Admin existente]
   ↓ /configuracoes/usuarios
   ↓ "Convidar usuário" → modal: email + role
   ↓ POST /users/invitations
   ↓ Backend cria Invitation { tokenHash, status=PENDING }
   ↓ Resposta: { id, email, role, status, inviteUrl, createdAt }
   ↓ Admin copia inviteUrl (toast + ação na tabela)
   ↓ [out-of-scope] Email transacional manda inviteUrl
   ↓
[Convidado]
   ↓ Acessa /aceitar-convite/:token (público, sem auth)
   ↓ Server Component faz GET /users/invitations/by-token/:token
   ↓ Renderiza form pré-preenchido (email + role read-only)
   ↓ Convidado preenche: nome + senha + confirmar senha
   ↓ POST /users/invitations/by-token/:token/accept
   ↓ Backend cria User, marca Invitation status=ACCEPTED
   ↓ Backend seta cookies httpOnly (auto-login)
   ↓ Frontend router.push('/atendimentos')
```

---

## Decisões de produto (alinhadas)

| Tópico             | Decisão                                                   |
| ------------------ | --------------------------------------------------------- |
| Expiração do token | **Sem expiração** — vale até `ACCEPTED` ou `REVOKED`      |
| Form de aceite     | **Só nome + senha** (email + role já fixos pelo convite)  |
| Envio de e-mail    | **Fora de escopo** — admin copia link manualmente por ora |
| Roles convidáveis  | `ADMIN` e `AGENT` (não `SUPER_ADMIN`)                     |
| Re-convite         | Admin pode revogar e gerar novo / regenerar token         |
| Multi-tenant       | Mesmo email pode ter conta em múltiplos tenants           |

---

## Backend (`crm-api`)

### Modelo Prisma

```prisma
model Invitation {
  id            String           @id @default(cuid())
  email         String           // lowercased on write
  role          UserRole         // só ADMIN | AGENT
  tokenHash     String           @unique // SHA-256 hex (64 chars)
  companyId    String
  invitedById   String
  status        InvitationStatus @default(PENDING)
  acceptedAt    DateTime?
  acceptedById  String?
  revokedAt     DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  company       Company          @relation(fields: [companyId], references: [id], onDelete: Cascade)
  invitedBy     User             @relation("InvitedBy", fields: [invitedById], references: [id])
  acceptedBy    User?            @relation("AcceptedBy", fields: [acceptedById], references: [id])

  @@index([companyId, status])
  // partial-unique: só um PENDING por (company, email)
  @@unique([companyId, email, status], name: "uniq_pending_invitation_per_email")
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  REVOKED
}
```

> **Nota:** Prisma não suporta partial unique nativamente em todas as
> versões. Alternativa: enforçar a regra na camada de aplicação +
> índice composto (companyId, email, status) sem unique. Decidir na
> Fase A do sprint conforme versão do Prisma do crm-api.

### Geração de token

- 32 bytes random → hex (64 chars). `crypto.randomBytes(32).toString('hex')`.
- Plaintext devolvido **uma única vez** no POST de criação e no resend.
- Banco guarda só `SHA-256(token)` (col `tokenHash`).
- `inviteUrl = ${FRONTEND_URL}/aceitar-convite/${token}`.

### Endpoints

#### Admin (auth required, role ≥ ADMIN, scoped to user's company)

| Método | Rota                            | Body / Query           | Resposta                                                        |
| ------ | ------------------------------- | ---------------------- | --------------------------------------------------------------- |
| POST   | `/users/invitations`            | `{ email, role }`      | `InvitationCreatedDto` + `inviteUrl`                            |
| GET    | `/users/invitations`            | `?status=PENDING\|...` | Lista paginada de `InvitationDto`                               |
| POST   | `/users/invitations/:id/revoke` | —                      | `InvitationDto` (status=REVOKED)                                |
| POST   | `/users/invitations/:id/resend` | —                      | `InvitationCreatedDto` com novo `inviteUrl` (token rotacionado) |

#### Público (sem auth, rate-limited)

| Método | Rota                                        | Body                 | Resposta                              |
| ------ | ------------------------------------------- | -------------------- | ------------------------------------- |
| GET    | `/users/invitations/by-token/:token`        | —                    | `{ email, role, companyName }` ou 404 |
| POST   | `/users/invitations/by-token/:token/accept` | `{ name, password }` | `AuthResponseDto` + cookies httpOnly  |

### Erros relevantes

| Cenário                                            | Status | Code           |
| -------------------------------------------------- | ------ | -------------- |
| E-mail já é usuário ativo da company (POST create) | 409    | EMAIL_TAKEN    |
| E-mail já tem PENDING na mesma company             | 409    | INVITE_PENDING |
| Token inválido / não existe (GET/POST by-token)    | 404    | NOT_FOUND      |
| Token corresponde a invite ACCEPTED ou REVOKED     | 410    | GONE           |
| Form de aceite com payload inválido                | 400    | VALIDATION     |

### Domain rules

- `acceptedById` é `null` até o aceite (FK aponta pro User criado).
- Aceite cria User com `companyId = invitation.companyId`, `role = invitation.role`,
  `email = invitation.email`, `name + passwordHash` do form.
- Mesmo `email` pode existir em múltiplos `companyId`s (multi-tenant). User é
  scoped por `(companyId, email)` único — já é o invariant atual do crm-api.
- Re-convite: `resend` invalida o `tokenHash` antigo e gera novo. Status continua PENDING.
- Revoke: status → REVOKED, `revokedAt` setado. Token antigo deixa de funcionar.

### Rate limiting

- Aceite público: usar `@nestjs/throttler` com limite ~5 tentativas/minuto/IP no `by-token/accept`.
- GET by-token: throttler mais leve (~30/minuto/IP) — só leitura.
- Endpoints admin: throttler global do projeto.

### Testes

- Unit: domain service (criação, rotação de token, revoke, accept transitions, hash de token)
- Integration/e2e:
  - Multi-tenant isolation (admin de A não vê convites de B)
  - Token vazado não permite aceitar de outra company
  - Aceitar com email já existente em outra company → cria novo User no tenant correto
  - Aceitar invite REVOKED → 410
  - Resend rotaciona o tokenHash (token antigo deixa de funcionar)

---

## Frontend (`crm-web`)

### Arquivos novos

```
app/
├── (auth)/
│   └── aceitar-convite/
│       └── [token]/
│           └── page.tsx          # Server Component
└── (app)/
    └── configuracoes/
        └── usuarios/
            └── page.tsx          # substitui placeholder

components/
├── accept-invite-form.tsx        # 'use client'
└── users/
    ├── invite-user-dialog.tsx    # 'use client', modal
    ├── invitations-table.tsx     # 'use client', tabela com ações
    └── users-table.tsx           # 'use client', lista de usuários ativos
```

### `(auth)/aceitar-convite/[token]/page.tsx`

Server Component:

1. Recebe `params.token`.
2. Faz `GET /users/invitations/by-token/:token` no servidor (sem cookies).
3. Se `404` ou `410` → renderiza tela de "convite inválido ou expirado" com link pra `/login`.
4. Se OK → renderiza `<AcceptInviteForm token={token} email={...} role={...} companyName={...} />`.

### `accept-invite-form.tsx`

Mesmo padrão do `login-form.tsx`:

- `'use client'`
- Schema Zod local em pt-BR: `name` (2-100), `password` (8-128), `confirmPassword` (refine matching).
- Hook gerado: `useUsersControllerAcceptInvitation` (Kubb).
- Pós-sucesso: `router.push('/atendimentos')` (cookies já vêm do backend).
- Erros mapeados:
  - `400` → "Não foi possível concluir o cadastro. Verifique os dados."
  - `410` → "Este convite não é mais válido. Peça um novo ao administrador."
  - `5xx`/network → mensagens do mesmo padrão dos outros forms.
- Acessibilidade: igual aos outros forms (labels, aria-invalid, role="alert").

### `(app)/configuracoes/usuarios/page.tsx`

Server Component que renderiza:

- `<UsersTable />` — lista de usuários ativos (gap separado, mas pode ir junto).
- `<InvitationsSection />` — header com botão "Convidar usuário" + filtro por status + tabela.
  - `<InviteUserDialog />` aciona pelo botão.
  - `<InvitationsTable />` mostra os convites com colunas:
    - Email | Role | Status | Convidado por | Data | Ações
  - Ações por linha:
    - PENDING: copiar link | reenviar (gera novo token) | revogar
    - ACCEPTED: nada (informativo)
    - REVOKED: nada (informativo)

### `invite-user-dialog.tsx`

Modal shadcn (`Dialog`):

- Form: `email` + `role` (`Select`).
- Submit → `useUsersControllerCreateInvitation` → mutate.
- On success: toast com botão "Copiar link" (mostra `inviteUrl`).
- On 409 EMAIL_TAKEN: erro inline no campo email "Esse e-mail já é usuário desta empresa."
- On 409 INVITE_PENDING: erro inline "Já existe convite pendente para esse e-mail. Reenvie ou revogue na lista."

### `proxy.ts` (ajustes)

- `PUBLIC_PATHS = ['/login', '/aceitar-convite']` (`/register` sai com o revert).
- Match: `/aceitar-convite/abc123` libera porque tem o prefixo.
- Se autenticado entra em `/aceitar-convite/...`: redireciona pra `/atendimentos` com query `?invite=conflict` (UI mostra toast "Você já está logado. Saia para aceitar este convite.").
  - Alternativa mais simples: deixar passar e o form falhar no aceite. **Decisão final na implementação.**

### Design system / componentes

- Reusar shadcn já instalados: `Card`, `Button`, `Input`, `Label`, `Select`, `Dialog`, `Field*`, `Table`, `Badge`, `Checkbox`.
- Possível adição: `<Toast>` (sonner já está em `components/ui/sonner.tsx`).
- Visual da página de aceite espelha `/login` (Card 2-col com brand panel à direita).

### Testes RTL

- `accept-invite-form.test.tsx`:
  - Renderiza com email/role/companyName visíveis e read-only
  - Validação: nome required, senha mínima 8, confirm match
  - Submit OK → mutateAsync com `{ name, password }` + push pra /atendimentos
  - 410 → mensagem "convite não é mais válido"
- `invite-user-dialog.test.tsx`:
  - Submit OK → toast aparece com inviteUrl visível e botão de copy
  - 409 EMAIL_TAKEN → erro inline no email
  - 409 INVITE_PENDING → erro inline com instrução
- `invitations-table.test.tsx`:
  - Renderiza colunas e ações corretas por status
  - Click em "Revogar" chama mutation e atualiza tabela
  - Click em "Reenviar" gera novo link no toast

---

## Decomposição em sprints

### Sprint dedicado (Fase 0, substituindo o item de register)

**Fase A — `crm-api`:**

- Migration Prisma: `Invitation` + `InvitationStatus`
- Schemas Zod (`modules/users/schemas/invitation.schema.ts`, etc)
- Domain service + Application service + Controller
- Endpoints (admin + público)
- Throttler nos endpoints públicos
- Testes unit + e2e
- OpenAPI atualizado

**Fase B — `crm-web`:**

- `pnpm generate:api:from-snapshot` (após Fase A mergear)
- `(auth)/aceitar-convite/[token]/page.tsx` + `accept-invite-form.tsx`
- `(app)/configuracoes/usuarios/page.tsx` (lista + tab convites)
- `invite-user-dialog.tsx`, `invitations-table.tsx`
- Ajuste `proxy.ts` (`/aceitar-convite` na allowlist)
- Testes RTL
- Verificação completa (format/lint/typecheck/test/build/snapshot drift)

### Sprints futuras (não escopadas aqui)

- **Email transacional**: provider (Resend/SES/SMTP), template, integração com convite (dispatch automático no POST). Decisão arquitetural própria. Item separado no ROADMAP.
- **Aceite com 2FA opcional**: se a empresa exigir, gate adicional no aceite.
- **Notificação ao admin** quando o convite é aceito (email/socket).

---

## Critério de pronto (sprint dedicado)

Backend:

- Migration aplicada e seed sem regressões
- 100% dos cenários de erro cobertos por teste e2e
- OpenAPI publicado com os 5 endpoints novos
- Throttler verificado nos endpoints públicos
- Multi-tenant isolation testada

Frontend:

- `/aceitar-convite/:token` funciona ponta a ponta contra crm-api real
- Admin convida → recebe link → segundo browser aceita → vira usuário
- Tabela de convites com revoke/resend/copy-link funcionais
- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` verdes
- Drift snapshot zero
- ROADMAP §4.8 com `[x]` no item de convite
