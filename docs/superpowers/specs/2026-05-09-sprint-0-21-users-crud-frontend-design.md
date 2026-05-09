# Sprint 0.21 Fase B — `/configuracoes/usuarios` CRUD completo

> **Repo:** `crm-web`
> **Branch sugerida:** `feat/users-crud-screen`
> **Gap fechado:** ROADMAP §4.8 — "Sprint 0.21 — Usuários CRUD edit/delete + role change"
> **Pré-requisito:** PR #49 do crm-api mergeado em `main` (`feat(users): expõe active, corrige filtro active=false e suporta reativação via PATCH`).
> **Snapshot/generated:** sincronizados nesta sessão. `UserResponseDto.active`, `UpdateUserDto.active?`, `UserListResponseDto.items[*].active` tipados.

## 1. Objetivo

Completar o CRUD da tela `/configuracoes/usuarios` reaproveitando o pattern já consagrado em Tags (PR #27) e Quick Replies (PR #28). Hoje a tela só lista e convida — falta editar, desativar (soft), reativar e forçar logout. Reorganizar a página em tabs `Usuários | Convites` para que o foco principal seja a tabela de usuários.

Fora de escopo: hard delete, edição da própria conta (`/me`), troca de senha pelo admin, reset por email, mexer em `rbac.ts` ou `proxy.ts`, contagem de convites pendentes na tab.

## 2. Decisões alinhadas

1. **Layout em tabs `Usuários | Convites`** (default `Usuários`). Header com `<InviteUserDialog />` continua acima das tabs, contextual a ambas. Subtítulo do header ajustado para "Gerencie usuários e convites do tenant." Estado da tab em React state local — sem `searchParams`. `<InvitationsTable>` movida para dentro de `<TabsContent value="invitations">` sem mudanças internas (continua com suas próprias tabs PENDING/ACCEPTED/REVOKED).
2. **Avatar na mesma coluna do Nome** (`size-8`, `<AvatarFallback>{getInitials(user.name)}</AvatarFallback>`, sem `<AvatarImage>` — avatarUrl não existe no backend até Fase 4). Reusa helper `getInitials` em `lib/initials.ts` e padrão de `nav-user.tsx`.
3. **Split data/view** em `UsersTable` (Client, fetcher) + `UsersTableView` (apresentação). Mesmo pattern de Tags.
4. **7 colunas:** Nome (com avatar + badges contextuais) | E-mail | Perfil | Departamentos | Última atividade | Status | Ações.
5. **Filtros (toolbar):** `<InputGroup>` + `<SearchIcon>` (debounced via `useDeferredValue`) | `<Select>` Role (Todos/Admin/Supervisor/Atendente, default Todos) | `<Select>` Status (Ativos/Inativos, default Ativos). Limit fixo 50, nota "Mostrando os primeiros 50…" quando `hasMore`.
6. **Gates por linha** calculados no fetcher e passados como `canEditItem`/`canDeactivateItem`/`canForceLogoutItem`:
   - `me.id === u.id` → esconde Editar/Desativar/Force-logout, mostra badge "Você".
   - `u.role === 'SUPER_ADMIN'` → esconde Editar/Desativar/Force-logout, mostra badge "Conta da plataforma".
   - `u.role === 'ADMIN' && u.id === lastActiveAdminId` (memo derivado da lista filtrada por active=true) → esconde apenas Desativar; Editar fica disponível (mudar role pra SUPERVISOR/AGENT cai em 409 do backend e é tratado inline pelo dialog).
   - Reativar aparece somente quando `!u.active && u.role !== 'SUPER_ADMIN'`.
7. **Prioridade dos badges no Nome:** Você > Conta da plataforma > Ausente. Apenas um aparece por linha.
8. **UserDialog modo edit only** (sem create — convite cuida disso). Form RHF + `zodResolver` com schema local em pt-BR. Campos: nome (required), email (required, lowercase trim), perfil (required), departamentos (multi via lista de `<Checkbox>` em scrollable `max-h-60 overflow-y-auto`). Sem campo password — sprint dedicada de reset (ROADMAP §5.5).
9. **DeactivateUserDialog** = `<AlertDialog>` destrutivo, chama `useUsersControllerDelete` (DELETE = soft no backend). Mensagem deixa explícito que o usuário deixa de fazer login mas o histórico é preservado e pode ser reativado.
10. **ForceLogoutUserDialog** = `<AlertDialog>` destrutivo, chama `useUsersControllerForceLogout`. Mensagem deixa explícito que encerra sessões mas conta segue ativa. **Sem invalidate** da list (não muda `lastSeenAt` imediatamente).
11. **Reativar inline** — chama `useUsersControllerUpdate({ id, data: { active: true } })` direto, com toast e invalidate. Sem AlertDialog (não-destrutivo, alinhado com Tags).
12. **Schema do form é local** em pt-BR (não compor com `updateUserDtoSchema` gerado) — ergonomia das mensagens compensa duplicação mínima.
13. **ADMIN-only** — gate herdado de `(app)/configuracoes/layout.tsx`. Não mexer em `rbac.ts` nem em `proxy.ts`.

## 3. Estrutura de arquivos

```
app/(app)/configuracoes/usuarios/
  page.tsx                                 # ajustado: tabs + subtítulo

components/users/
  users-table.tsx                          # extendido: filtros, gates, dialogs
  users-table-view.tsx                     # extendido: avatar, badges, status, ações
  users-table.test.tsx                     # extendido
  users-table-view.test.tsx                # extendido
  user-dialog.tsx                          # NOVO — edit only
  user-dialog.test.tsx                     # NOVO
  deactivate-user-dialog.tsx               # NOVO
  deactivate-user-dialog.test.tsx          # NOVO
  force-logout-user-dialog.tsx             # NOVO
  force-logout-user-dialog.test.tsx        # NOVO
  invite-user-dialog.tsx                   # inalterado
  invitations-table.tsx                    # inalterado (movido pra tab)
```

## 4. Page (`app/(app)/configuracoes/usuarios/page.tsx`)

Server Component como hoje, expondo metadata. Tabs em estado local exigem componente Client; criamos um wrapper Client mínimo `UsersPageTabs` que recebe `<UsersTable />` e `<InvitationsTable />` como `children` slots:

```tsx
<header>
  <h1>Usuários</h1>
  <p>Gerencie usuários e convites do tenant.</p>
  <InviteUserDialog />
</header>
<UsersPageTabs
  usersSlot={<UsersTable />}
  invitationsSlot={<InvitationsTable />}
/>
```

`UsersPageTabs` é `'use client'` e renderiza `<Tabs defaultValue="users">` com `<TabsList>` + dois `<TabsContent>`. Mantém Server Components nos slots (tanto `UsersTable` quanto `InvitationsTable` continuam como compõem hoje — fetchers internos próprios).

## 5. `UsersTable` (fetcher)

```tsx
'use client';
function UsersTable() {
  const me = useCurrentUser();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [role, setRole] = useState<RoleFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('active');

  const [editTarget, setEditTarget] = useState<UserListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserListItem | null>(null);
  const [forceLogoutTarget, setForceLogoutTarget] = useState<UserListItem | null>(null);

  const params = useMemo(
    () => ({
      limit: 50,
      active: status === 'active',
      ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
      ...(role !== 'all' ? { role } : {}),
    }),
    [deferredSearch, role, status],
  );

  const query = useUsersControllerList(params, { client: { client: apiClient } });
  const update = useUsersControllerUpdate({ client: { client: apiClient } });
  const queryClient = useQueryClient();

  const items = query.data?.items ?? [];
  const lastActiveAdminId = useMemo(() => {
    const admins = items.filter((u) => u.role === 'ADMIN' && u.active);
    return admins.length === 1 ? admins[0]!.id : null;
  }, [items]);

  const canEditItem = (u) => u.id !== me.id && u.role !== 'SUPER_ADMIN';
  const canDeactivateItem = (u) =>
    u.active &&
    u.id !== me.id &&
    u.role !== 'SUPER_ADMIN' &&
    !(u.role === 'ADMIN' && u.id === lastActiveAdminId);
  const canForceLogoutItem = (u) => u.active && u.id !== me.id && u.role !== 'SUPER_ADMIN';

  const handleReactivate = async (u) => {
    try {
      await update.mutateAsync({ id: u.id, data: { active: true } });
      toast.success(`Usuário "${u.name}" reativado.`);
      void queryClient.invalidateQueries({ queryKey: usersControllerListQueryKey(), exact: false });
    } catch {
      toast.error('Não foi possível reativar o usuário. Tente novamente.');
    }
  };

  // ... toolbar de filtros + <UsersTableView ...> + 3 dialogs
}
```

Toolbar de filtros idêntica em estrutura à de `tags-table.tsx`.

## 6. `UsersTableView` (apresentação)

Props:

```ts
interface UsersTableViewProps {
  state: 'loading' | 'error' | 'ready';
  items: UserListItem[];
  me: UserResponseDto;
  canEditItem: (u: UserListItem) => boolean;
  canDeactivateItem: (u: UserListItem) => boolean;
  canForceLogoutItem: (u: UserListItem) => boolean;
  onEdit: (u: UserListItem) => void;
  onDeactivate: (u: UserListItem) => void;
  onForceLogout: (u: UserListItem) => void;
  onReactivate: (u: UserListItem) => void;
  emptyMessage?: string;
}
```

Coluna Nome:

```tsx
<TableCell>
  <div className="flex items-center gap-3">
    <Avatar className="size-8">
      <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
    </Avatar>
    <div className="flex items-center gap-2">
      <span className="font-medium">{u.name}</span>
      {nameBadge(u, me)}
    </div>
  </div>
</TableCell>
```

Função `nameBadge` resolve a prioridade Você > Conta da plataforma > Ausente e devolve no máximo um `<Badge variant="secondary" className="text-xs">`. Coluna Status: `<Badge variant={u.active ? 'default' : 'outline'}>` Ativo/Inativo. Coluna Ações: container `flex justify-end gap-1`. Para cada botão, gate via prop `canX(u)`. Reativar aparece quando `!u.active`.

Empty/loading/error tratados como em `tags-table-view.tsx`. Empty message vem do fetcher: "Nenhum usuário {ativo|inativo} encontrado.", default "Nenhum usuário encontrado."

## 7. `UserDialog`

Espelha `tag-dialog.tsx`. Schema local:

```ts
const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome precisa ter pelo menos 2 caracteres')
    .max(100, 'Máximo de 100 caracteres'),
  email: z.string().trim().toLowerCase().email('E-mail em formato inválido'),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'AGENT']),
  departmentIds: z.array(z.string().uuid()).default([]),
});
```

Campos no JSX:

- `<FieldLabel required>` em Nome, E-mail e Perfil.
- Departamentos: `useDepartmentsControllerList({ active: true, limit: 100 })` + `<Controller name="departmentIds">` renderizando lista de `<Checkbox>` em container scrollable. Estado loading: 3 skeletons (`h-5 w-3/4`). Estado vazio: "Nenhum departamento ativo cadastrado." Lista grande: scroll interno preserva input.

Submit:

```ts
const payload: UpdateUserDto = {
  name: values.name.trim(),
  email: values.email.trim().toLowerCase(),
  role: values.role,
  departmentIds: values.departmentIds,
};
await update.mutateAsync({ id: user.id, data: payload });
```

Erros (mesma estrutura de `tag-dialog.tsx`):

| Status                                                       | Mapeamento                                                                         |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 409 com `message` mencionando email/duplicado/already exists | `setError('email', { message })`                                                   |
| 409 com `message` mencionando admin/último/last              | `setError('root', { message })`                                                    |
| 403                                                          | `setError('root', { message: 'Você não tem permissão para alterar esta conta.' })` |
| 400 com `errors[]`                                           | `setError(field)` por campo conhecido; sobra cai em root                           |
| 5xx                                                          | root: 'Erro no servidor. Tente novamente em instantes.'                            |
| network                                                      | root: 'Sem conexão com o servidor.'                                                |

Pós-sucesso: toast, `invalidateQueries({ queryKey: usersControllerListQueryKey(), exact: false })`, fecha dialog.

`useEffect` de reset ao abrir: `reset(toFormValues(user))` quando `open && user`.

## 8. `DeactivateUserDialog`

Espelha `deactivate-tag-dialog.tsx`. Mutation: `useUsersControllerDelete({ id })`. Mensagem:

> Desativar usuário "{name}"?
>
> Ele deixa de fazer login, mas histórico (tickets, mensagens, atribuições) é preservado. Você pode reativá-lo depois pelo filtro "Inativos".

Pós-sucesso: toast `Usuário "{name}" desativado.` + invalidate. Erros: 409 último ADMIN → toast com mensagem do backend; outros → toast genérico.

## 9. `ForceLogoutUserDialog`

Espelha `delete-quick-reply-dialog.tsx` (AlertDialog destrutivo simples). Mutation: `useUsersControllerForceLogout({ id })`. Mensagem:

> Forçar logout de "{name}"?
>
> Encerra todas as sessões ativas deste usuário. Ele permanece com a conta ativa e poderá fazer login de novo.

Pós-sucesso: toast `Sessões de "{name}" encerradas.` (sem invalidate). Erro: toast genérico.

## 10. Testes (RTL)

**`users-table-view.test.tsx`** (estende):

- Estados loading/error/ready/empty (mensagem contextual).
- Linha completa: avatar com iniciais, nome, email, role traduzido, departamentos joined, lastSeenAt formatado, badge Status (Ativo/Inativo).
- Badges contextuais: Você (self), Conta da plataforma (SUPER_ADMIN), Ausente (absenceActive). Apenas um por vez.
- Ações por gate:
  - Linha normal ativa: Editar + Desativar + Forçar logout visíveis; Reativar oculto.
  - Linha self: nenhuma ação visível; badge Você.
  - Linha SUPER_ADMIN: nenhuma ação; badge Conta da plataforma.
  - Linha último ADMIN ativo: Editar + Forçar logout visíveis, Desativar oculto.
  - Linha inativa: Reativar visível, demais ocultas.

**`users-table.test.tsx`** (estende):

- Filtros search/role/status alimentam params (verifica via `apiClient.defaults.adapter` mock que `config.params` reflete os filtros).
- Reativar inline dispara PATCH `{active:true}` + invalidate + toast.
- Botão Editar abre `UserDialog`; Desativar abre `DeactivateUserDialog`; Forçar logout abre `ForceLogoutUserDialog` (verifica via `aria-label`/título do dialog).

**`user-dialog.test.tsx`** (novo):

- Edit success: PATCH com payload correto, toast, invalidate, fecha.
- 409 email duplicado mapeado pro field `email` (mensagem aparece junto ao input).
- 409 último admin mapeado pro root.
- Validação: min(2) nome, formato email, role enum (não permite SUPER_ADMIN).
- Multi-select de departments populado pela lista mockada; check/uncheck atualiza `departmentIds`.
- Reset ao reabrir: form recarrega valores do user passado.

**`deactivate-user-dialog.test.tsx`** (novo):

- Confirma → DELETE chamado, toast sucesso, invalidate, fecha.
- Cancela → mutation não chamada, fecha.
- 409 → toast com mensagem do backend, dialog permanece aberto.

**`force-logout-user-dialog.test.tsx`** (novo):

- Confirma → POST force-logout, toast sucesso, fecha. Sem invalidate.
- Cancela → mutation não chamada.
- Erro → toast genérico.

## 11. Critério de pronto

- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` verdes localmente.
- `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated openapi.snapshot.json` zero diff (snapshot já comitado neste PR).
- ROADMAP §4.8 atualizado registrando Sprint 0.21 como entregue.
- Validação manual end-to-end contra crm-api local: editar nome/role/departments, desativar, reativar via filtro Inativos, force logout em outra sessão, regras de proteção self / SUPER_ADMIN / último ADMIN, filtros search/role/status combinando, paginação se houver `hasMore`, tabs alternando `Usuários ↔ Convites`.
- Tela permanece ADMIN-only (sem mexer em `rbac.ts` ou `proxy.ts`).
- PR aberto contra `origin/main` referenciando o PR #49 do crm-api.

## 12. Riscos e contingências

- **Aninhamento Tabs externa + Tabs interna da `InvitationsTable`** pode parecer pesado. Mitigação: testar visualmente; se ficar ruim, mover a label "Convites" pra incluir ícone (`<MailIcon>`) e dar peso visual menor à interna. Não é bloqueante.
- **`active` na lista** vem como `boolean` agora — qualquer fixture de teste antiga sem o campo precisa ganhar `active: true` para não quebrar tipos (cobertura: ajustar `baseItem` em `users-table-view.test.tsx` e `sampleUser` em `users-table.test.tsx`).
- **Filtro `role` no backend**: o param `role` já é aceito (visto em `useUsersControllerList` types). Se houver bug retornando 400, usar fallback de filtrar client-side e abrir issue no backend — mas é improvável.
