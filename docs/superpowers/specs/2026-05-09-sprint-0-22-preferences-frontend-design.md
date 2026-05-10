# Sprint 0.22 — Frontend de Preferências (Company Settings)

> **Repo:** `crm-web`
> **Branch:** `feat/sprint-0-22-preferencias`
> **Pré-requisito merged:** `crm-api` mini-PR `fix(company-settings): expose response schemas in OpenAPI` (análogo aos PRs #41–#46), expondo `CompanySettingsResponseDto` em `GET /companies/me/settings` e `PATCH /companies/me/settings` no `openapi.snapshot.json`. Sem isso, Kubb gera `CompanySettingsControllerFindMine200 = unknown` e o frontend fica sem tipagem do response.
> **Substitui:** `PlaceholderPage` em `app/(app)/configuracoes/preferencias/page.tsx`.

## 1. Objetivo

Substituir o placeholder de `/configuracoes/preferencias` por um formulário real que consome `GET /companies/me/settings` (todos os perfis) e `PATCH /companies/me/settings` (apenas ADMIN), expondo **12 toggles booleanos** agrupados em 6 cards temáticos. O 13º campo do schema (`defaultBotChatFlowId`) fica **fora desta sprint** porque depende de `ChatFlow`, que só existe na Fase 3a.

A Sprint estabelece o padrão UI de "form de configuração" (sticky footer com Salvar/Descartar, dirty-aware, RBAC inline) que será reusado quando outras telas de Configurações Avançadas chegarem (CSAT, working hours por departamento, etc).

A maior parte das flags só ganha efeito real em fases posteriores (ver tabela §3.3 do `audit-03B-comportamento-global.md`); o backend persiste hoje, mesmo que features consumidoras ainda não existam.

## 2. Decisões alinhadas com o humano

1. **Save explícito**, não auto-save. Botão "Salvar alterações" sticky no rodapé; envia o objeto inteiro (apenas campos modificados via `dirtyFields`) num único PATCH. Diverge da sugestão `RF-CS-2` do audit (auto-save com debounce 500ms) porque (a) consistência com o padrão de form das sprints 0.18–0.20, (b) menos requisições, (c) UX mais previsível pra config sensível.
2. **Botão "Descartar alterações"** ao lado do Salvar, ambos disabled quando `!isDirty`. Reset volta para o último valor carregado do GET.
3. **`defaultBotChatFlowId` fora do escopo.** Não renderiza nenhum campo. Se vier no GET (provavelmente `null`), ignora; no PATCH, omite. Comentário inline justifica.
4. **RBAC inline na tela:**
   - AGENT, SUPERVISOR: GET funciona, página renderiza, todos os Switches `disabled`, sem footer de ação. Tooltip em cada switch: "Apenas administradores podem alterar".
   - ADMIN, SUPER_ADMIN: tudo habilitado.
   - Detecção via `useCurrentUser()` (`contexts/current-user-context.tsx`).
   - Backend já bloqueia PATCH não-ADMIN com 403; o interceptor existente trata o toast.
5. **Estrutura de pastas seguindo padrão do projeto:** `components/preferences/` (não `app/.../components/`). Consistente com `components/quick-replies/`, `components/users/`, `components/departments/`, `components/tags/`.
6. **Página continua slim como nas sprints anteriores.** Server Component apenas renderiza `<PreferencesForm />` (Client Component). Sem prefetch SSR — replicamos o padrão de `quick-replies/page.tsx` (slim + cliente busca dados via hook). Loading vira responsabilidade do `loading.tsx` (sem `<Suspense>` interno) + skeleton no Client durante a query.
7. **`loading.tsx` e `error.tsx` locais** em `app/(app)/configuracoes/preferencias/`. Hoje só existem versões globais; criar locais melhora UX sem quebrar nada.
8. **Schema do form deriva do Kubb:** `updateCompanySettingsDtoSchema.omit({ defaultBotChatFlowId: true })` — não redeclaramos campos manualmente. Tipo derivado via `z.infer`. Defaults vêm do GET.
9. **Item "Preferências" no AppSidebar já existe** ([`app-sidebar.tsx:54`](crm-web/components/app-sidebar.tsx#L54)) e em `nav-user.tsx:89`. Nada a alterar no sidebar; substitui apenas a página.
10. **Sem teste E2E real.** Cobertura via RTL + Vitest (não-bloqueante conforme §4.6 do ROADMAP).
11. **Componentes shared no design-system:** `PreferenceSection` e `PreferenceSwitchRow` adicionados a `components/preferences/` e expostos numa subseção do showcase `/configuracoes/design-system`. Sem amarração com API real no showcase — estado local de demonstração.
12. **Item "Preferências" do nav-user dropdown** já aponta pra rota correta — sem mudança.

## 3. Escopo funcional

### 3.1 Cards e flags

Cada card é um `<Card>` com header (título + descrição curta) e lista de `PreferenceSwitchRow`. Copy alinhada à tabela §3.3 do audit-03B.

**a) Visibilidade de tickets**
| Campo | Label | Helper text |
|---|---|---|
| `hideOtherUsersTickets` | Ocultar tickets de outros atendentes | Atendente vê apenas tickets atribuídos a ele e os pendentes do departamento. |
| `agentSeeOtherUsersTicketsOnSameChannel` | Atendente vê tickets de outros do mesmo canal | Permite visibilidade extra dentro do mesmo canal de atendimento. |
| `agentSeeTicketsWithOtherDefaultAgents` | Atendente vê tickets de contatos com outro responsável padrão | Mantém visibilidade quando o contato tem responsável (carteira) diferente. |

**b) Privacidade**
| Campo | Label | Helper text |
|---|---|---|
| `hidePhoneFromAgents` | Ocultar número de telefone dos atendentes | Telefone do contato aparece mascarado para o perfil Atendente. |

**c) Grupos do WhatsApp**
| Campo | Label | Helper text |
|---|---|---|
| `ignoreGroupMessages` | Ignorar mensagens de grupos | Mensagens vindas de grupos são descartadas antes de criar ticket. |
| `showAssignedGroups` | Mostrar grupos atribuídos na fila | Quando ligado, tickets de grupos atribuídos aparecem na listagem. |

**d) Roteamento**
| Campo | Label | Helper text |
|---|---|---|
| `forceWalletRouting` | Forçar roteamento por carteira | Atribui automaticamente o ticket ao responsável padrão (carteira) do contato. |

**e) Permissões do atendente**
| Campo | Label | Helper text |
|---|---|---|
| `agentCanDeleteContacts` | Atendente pode deletar contatos | Libera a ação de excluir contato para o perfil Atendente. |
| `agentCanChangeDefaultAgent` | Atendente pode trocar o responsável padrão do contato | Permite alterar a carteira do contato sem precisar de Supervisor/Admin. |
| `agentCanEditTags` | Atendente pode editar tags do contato | Libera adicionar e remover tags no contato durante o atendimento. |
| `agentCanToggleSignature` | Atendente pode escolher se assina a mensagem | Mostra checkbox "incluir assinatura" no composer; quando desligado, a assinatura segue o padrão do tenant. |

**f) Bot**
| Campo | Label | Helper text |
|---|---|---|
| `hideBotTicketsFromAgents` | Ocultar tickets em atendimento por bot | Tickets que estão sendo conduzidos pelo bot ficam invisíveis para atendentes até a transferência. |

> Total: 12 toggles. `defaultBotChatFlowId` propositalmente fora.

### 3.2 Estados da tela

- **Loading inicial:** `loading.tsx` mostra skeleton da página (header + 6 cards skeleton). Enquanto a query roda, `PreferencesForm` mostra skeleton inline equivalente.
- **Empty:** não aplicável — `CompanySettings` é criado junto com `Company` (garantia do backend, ver `companies` factory).
- **Error:** `error.tsx` local com botão "Tentar novamente"; mutation errors viram toast via interceptor existente.
- **Success da mutation:** toast verde `"Preferências atualizadas"` (sonner) + `queryClient.invalidateQueries({ queryKey: companySettingsControllerFindMineQueryKey() })`.

### 3.3 Comportamento do form

- `react-hook-form` + `zodResolver(formSchema)`.
- `formSchema = updateCompanySettingsDtoSchema.omit({ defaultBotChatFlowId: true })`.
- `defaultValues` vem do response do GET (já tipado depois do fix backend).
- Submit envia **apenas os campos dirty** (`Object.fromEntries(Object.entries(values).filter(([k]) => dirtyFields[k]))`) — evita PATCH sobrescrever flags que ninguém tocou.
- Footer sticky (`sticky bottom-0`, fundo `bg-bg-base`, borda topo `border-border-default`) com `Button` Salvar (`variant=default`, type=submit) e `Button` Descartar (`variant=outline`, `onClick={() => reset()}`). Ambos `disabled={!isDirty || isSubmitting}`.
- Quando `role !== 'ADMIN' && role !== 'SUPER_ADMIN'`: footer não renderiza; cada Switch fica `disabled` com tooltip.

## 4. Estrutura de arquivos

```
crm-web/
├── app/(app)/configuracoes/preferencias/
│   ├── page.tsx                        (Server Component slim — renderiza <PreferencesForm />)
│   ├── loading.tsx                     (skeleton da página inteira)
│   └── error.tsx                       (error boundary local com retry)
├── components/preferences/
│   ├── preferences-form.tsx            ('use client' — RHF, sticky footer, RBAC inline)
│   ├── preferences-form.test.tsx       (RTL: defaultValues, dirty, submit, descartar, RBAC)
│   ├── preference-section.tsx          (Card de seção — shared/showcase)
│   └── preference-switch-row.tsx       (linha label + helper + Switch — shared/showcase)
└── app/(app)/configuracoes/design-system/_sections/
    └── (subseção nova mostrando PreferenceSection + Row com 2-3 exemplos estáticos)
```

## 5. Camadas e contratos

### 5.1 Tipos do Kubb (após o fix backend)

- `CompanySettingsResponseDto` — schema completo com 12 booleans + `defaultBotChatFlowId`. Vem de `lib/generated/types/`.
- `UpdateCompanySettingsDto` — já existe no Kubb; usado como request type.
- `useCompanySettingsControllerFindMine()` — query hook.
- `useCompanySettingsControllerUpdateMine()` — mutation hook.
- `companySettingsControllerFindMineQueryKey()` — para `invalidateQueries`.

### 5.2 Componentes shared

**`PreferenceSection`** — Card com header (título + descrição) e slot pra children (rows).

```tsx
type PreferenceSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};
```

**`PreferenceSwitchRow`** — linha com label, helper text, Switch alinhado à direita. Acessível: `<Label htmlFor>`, `aria-describedby` aponta pro helper, foco visível, navegação por teclado. Suporta `disabled` + `tooltip`.

```tsx
type PreferenceSwitchRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  disabledReason?: string; // tooltip quando disabled
};
```

### 5.3 PreferencesForm

```tsx
'use client';

export function PreferencesForm() {
  const me = useCurrentUser();
  const canEdit = me.role === 'ADMIN' || me.role === 'SUPER_ADMIN';
  const queryClient = useQueryClient();
  const { data, isPending, isError } = useCompanySettingsControllerFindMine();
  const mutation = useCompanySettingsControllerUpdateMine({
    mutation: {
      onSuccess: () => {
        toast.success('Preferências atualizadas');
        queryClient.invalidateQueries({
          queryKey: companySettingsControllerFindMineQueryKey(),
        });
        form.reset(form.getValues()); // sincroniza dirty state
      },
    },
  });
  // schema, form, handleSubmit, reset...
}
```

## 6. RBAC

- **Sidebar:** o item "Preferências" já existe em [`app-sidebar.tsx:54`](crm-web/components/app-sidebar.tsx#L54), mas é filtrado por `canAccessRoute(role, '/configuracoes/preferencias')`. Hoje só ADMIN e SUPER_ADMIN passam (porque têm `/configuracoes` no mapa); AGENT e SUPERVISOR só têm `/configuracoes/quick-replies` explícito.
- **Mudança em `lib/rbac.ts`:** adicionar `/configuracoes/preferencias` aos arrays de `AGENT` e `SUPERVISOR` no `ROUTE_ACCESS`, com docstring atualizada explicando que essa segunda exceção (após Quick Replies) é necessária porque a tela de preferências serve dois papéis: visualização (todos) e edição (ADMIN-only inline).
- **Rota:** após o ajuste em `rbac.ts`, fica acessível a AGENT, SUPERVISOR, ADMIN, SUPER_ADMIN. O `proxy.ts` não faz gating por role (só seta `x-pathname`).
- **Página:** GET roda pra qualquer role autenticado; toggles `disabled` + tooltip e footer omitido quando `role !== 'ADMIN' && role !== 'SUPER_ADMIN'`.
- **Backend:** PATCH bloqueado pra não-ADMIN com 403; toast existente no interceptor trata.
- **Atualizar testes existentes do `app-sidebar.test.tsx` (se houver)** para refletir a nova visibilidade do item Preferências em AGENT/SUPERVISOR.

## 7. Acessibilidade

- Cada Switch tem `<Label htmlFor>` apontando pro próprio id.
- Helper text linkado via `aria-describedby`.
- `focus-visible:ring-ring` herdado dos componentes shadcn.
- Navegação por teclado: Tab percorre os switches em ordem, Espaço/Enter alterna.
- Botões Salvar/Descartar com `aria-disabled` quando `!isDirty`.
- Tooltip de disabled visível por foco e por hover.

## 8. Telemetria / observabilidade

Sem mudança nesta sprint. Logs de PATCH do backend já registram quem alterou o quê via auditoria padrão.

## 9. Testes (RTL + Vitest)

`components/preferences/preferences-form.test.tsx`:

1. **Renderiza com defaultValues** — recebe response mockado, todos os switches refletem o estado correto.
2. **Toggle altera dirty + habilita botão Salvar** — clicar num switch deixa o botão habilitado.
3. **Submit chama mutation com payload contendo só campos dirty** — toggle 1 switch, submit, verifica `mutate({ data: { hideOtherUsersTickets: false } })`.
4. **Descartar alterações reseta** — toggle, click Descartar, switches voltam ao default, botão Salvar fica disabled.
5. **Sucesso mostra toast e re-sincroniza** — mock mutation com `onSuccess`, verifica toast.
6. **RBAC AGENT** — todos os switches `disabled`, footer não renderiza, tooltip presente.
7. **RBAC SUPER_ADMIN** — tudo habilitado.

Mock de `useCurrentUser` via wrapper `<CurrentUserProvider>` simulando o role desejado. Mock de hooks Kubb via `vi.mock` no padrão das outras suites do projeto.

## 10. Validação ao final (evidência)

- `pnpm dev` sobe e `/configuracoes/preferencias` renderiza
- Login com ADMIN → toggles editáveis, salvar persiste no backend, refresh mantém o valor
- Login com AGENT → toggles disabled, sem footer
- Toggle dark/light em ambos os modos funciona
- `/configuracoes/design-system` continua funcionando e exibe a nova subseção `PreferenceSection`/`PreferenceSwitchRow`
- `pnpm test` passa (RTL do form)
- `pnpm lint` passa
- `pnpm typecheck` passa
- `pnpm build` passa local OU CI verde

## 11. Pré-requisitos backend (PR à parte, antes desta sprint)

Mini-PR no `crm-api`:

- **Branch:** `fix/company-settings-openapi-schemas`
- **Mudança:** adicionar `@ApiOkResponse({ schema: ... })` em `CompanySettingsController.findMine()` e `updateMine()` apontando pro `companySettingsResponseSchema` já existente (`src/modules/company-settings/schemas/company-settings-response.schema.ts`). Padrão idêntico ao aplicado em PRs #41 (invitations), #42 (users), #43 (departments), #46 (tags).
- **Verificação:** `pnpm openapi:snapshot` regenera `openapi.snapshot.json`; `git diff` mostra `responses.200.content.application/json.schema` populado para ambos os endpoints.
- **Mergear** antes de iniciar a Sprint 0.22 frontend.
- **Em seguida no `crm-web`:** `pnpm generate:api:from-snapshot` (ou `pnpm generate:api` apontando pro backend local atualizado) e commit do diff em `lib/generated/`. Pode ir no primeiro commit da branch da sprint frontend.

## 12. Atualização de ROADMAP (PR separado, depois do merge da sprint)

- `crm-web/ROADMAP.md` §4.8: marcar Sprint 0.22 como entregue.
- `crm-api/ROADMAP.md`: marcar item correspondente da Fase 0 (CompanySettings frontend exposto) como entregue.
- Branch: `docs/update-roadmap-0-22`. PR à parte.

## 13. Restrições não-negociáveis (recap)

- [ ] Multi-tenant transparente: NUNCA enviar `companyId` em request body
- [ ] Tokens semânticos via Tailwind/`@theme` — sem cores hardcoded
- [ ] Tipografia via tokens (`font-sans`, `font-ui`, `text-base`)
- [ ] Composição com `Switch`, `Card`, `Button`, `Tooltip` shadcn já no projeto — não recriar
- [ ] Tipos do `@/lib/generated`, **NÃO** redeclarar `CompanySettings` ou flags
- [ ] Sem `localStorage`/`sessionStorage`
- [ ] Sem `any`, sem `as Type` sem comentário justificando
- [ ] Mensagens em pt-BR
- [ ] WCAG AA: label, aria-describedby, foco visível, teclado
- [ ] Light + dark mode funcionando
- [ ] `defaultBotChatFlowId` fora do escopo (não renderizar, não enviar)
