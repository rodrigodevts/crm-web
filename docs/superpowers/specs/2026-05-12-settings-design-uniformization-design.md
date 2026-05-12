# Uniformização de design das telas de Configurações

> **Repo:** `crm-web`
> **Branch sugerida:** `chore/settings-design-uniformization`
> **Pré-requisito:** Sprint 0.23 (Tema final) mergeada em `origin/main` — confirmado (`c8dc705`).

## 1. Objetivo

Padronizar os padrões visuais e comportamentais das sub-páginas de `/configuracoes/*`, que hoje convivem com pequenas divergências entre módulos, e consolidar as decisões no `design-system.md` como referência viva.

A análise comparativa identificou 12 pontos de divergência. Após brainstorm com o humano, **6 foram descartados** (mantidos como estão) e **6 entram nesta rodada**. O resultado é uma rodada cirúrgica de uniformização — sem extração de novos componentes shell — focada em padrões observáveis e na documentação.

## 2. Decisões alinhadas

1. **Cor de botão destrutivo: vermelho em qualquer destrutivo.** Toda ação que afeta negativamente um recurso (Desativar, Apagar, Revogar, Forçar logout) usa `variant="ghost"` + `className="text-destructive hover:text-destructive"`. Reversibilidade (soft/hard delete) não muda a cor. Hoje só "Apagar quick reply" segue o padrão; ele vira a referência canônica.

2. **`window.confirm` → Dialog em Invitations.** Criar `RevokeInvitationDialog` espelhando `DeactivateXDialog` dos outros módulos. Não adicionar busca em Invitations — fora de escopo nesta rodada.

3. **Shell de página: padrão documentado, sem componente.** Continuar repetindo as ~10 linhas (`flex flex-col gap-6 p-6` + `<header className="flex items-center justify-between">` + título + descrição + CTA opcional) em cada `page.tsx`. Documentar no `design-system.md` como pattern canônico. Não extrair `<SettingsPageShell>` — abstrair algo tão pequeno e estável adiciona ruído sem ganho real.

4. **`PlaceholderPage` adota o shell padrão.** Reescrever `components/layout/placeholder-page.tsx` para usar o mesmo wrapper + header das listas, com corpo "Em breve" simples (sem `flex h-full items-center justify-center`). Aceitar prop `description?: string` opcional. Quando Canais/Integrações forem implementadas, o desenvolvedor preenche o corpo sem reescrever a moldura.

5. **`PreferenceSection` mantém `<h2>` inline — descartado após investigação.** O ponto 12 da análise (usar `<CardTitle>` ao invés de `<h2>` inline) **não entra**: o `<CardTitle>` local em `components/ui/card.tsx:36` renderiza como `<div>` (text-base, font-medium), não como heading. Trocar perderia semântica de heading para screen readers e reduziria o tamanho visual de `text-lg` (atual) pra `text-base`. Manter `<h2 className="text-foreground text-lg font-semibold">` é a escolha mais defensável. Documentar essa decisão no `design-system.md` §4.6.

6. **Loading/error: regra única.**
   - **Listas com tabela** (Departments, Tags, Users, Quick Replies, Invitations) tratam loading e error _internamente_ via `state='loading' | 'error' | 'ready'` no `<TableView>` — skeleton em `TableRow colSpan={N}` para loading, `text-destructive` para error. **Não criar `loading.tsx` nem `error.tsx` de rota.**
   - **Páginas só de form/conteúdo** (Preferências hoje, futuras telas similares) tratam loading e error _em nível de rota_ via `loading.tsx` (skeleton da página inteira) e `error.tsx` (mensagem + retry). Preferências já segue esse padrão — não muda.
   - O smoke check confirmou que as 4 table-views existentes já têm o estado de error tratado.

7. **Documentação no `design-system.md`.** Adicionar nova seção **"Padrões de telas de configuração"** consolidando os 8 padrões observados (ver §4) + 1 exceção documentada (Quick Replies sem filtro Status, porque a UI faz hard-delete embora o backend faça soft).

8. **Fora de escopo nesta rodada** (decisões explícitas do humano):
   - Tabs aninhadas em Invitations (status como tabs internas dentro da tab "Convites" do nível 1) — mantém.
   - Largura dos `<SelectTrigger>` variar entre `w-36` e `w-44` — mantém.
   - Múltiplas ações inline na linha de Users (até 4 botões) — mantém.
   - Badge `variant="default"` carregar semânticas diferentes (Ativo em Tags/Depts vs Pendente em Invitations) — mantém.
   - Adicionar busca em Invitations — mantém.
   - Quick Replies usar Switch para "Apenas as minhas" — mantém, a regra vai ser documentada como caso "toggle pessoal de fluxo".

## 3. Mudanças de código

### 3.1 Cor destrutiva nas table-views

Aplicar `className="text-destructive hover:text-destructive"` nos `<Button variant="ghost" size="sm">` listados abaixo:

| Arquivo                                                 | Botão(ões)                                             |
| ------------------------------------------------------- | ------------------------------------------------------ |
| `components/departments/departments-table-view.tsx`     | "Desativar" (linha ~123)                               |
| `components/tags/tags-table-view.tsx`                   | "Desativar" (linha ~123)                               |
| `components/users/users-table-view.tsx`                 | "Desativar" (linha ~159), "Forçar logout" (linha ~171) |
| `components/users/invitations-table-view.tsx`           | "Revogar" (linha ~129)                                 |
| `components/quick-replies/quick-replies-table-view.tsx` | "Apagar" — **já está**, manter                         |

O botão "Reativar" (ícone `RotateCcwIcon`) **não** é destrutivo — fica neutro.

### 3.2 `RevokeInvitationDialog`

Novo componente em `components/users/revoke-invitation-dialog.tsx` espelhando `components/departments/deactivate-department-dialog.tsx`:

- Props: `invitation: InvitationListItem | null`, `open: boolean`, `onOpenChange: (next: boolean) => void`
- Body: pergunta de confirmação com email do convite
- Footer: `<Button variant="outline">Cancelar</Button>` + `<Button variant="destructive">Revogar</Button>` (estado `isPending` desabilita ambos e mostra "Revogando…")
- Usa `useInvitationsControllerRevoke` com `onSuccess`: toast `Convite de {email} revogado` + invalida `invitationsControllerListQueryKey`
- Usa `onError`: toast `Não foi possível revogar o convite`

`components/users/invitations-table.tsx`:

- Remover bloco `if (!window.confirm(...))` do `handleAction('revoke', ...)`
- Adicionar state `revokeTarget` e renderizar `<RevokeInvitationDialog ...>` no fim do componente
- Em `handleAction('revoke', item)` setar `setRevokeTarget(item)` ao invés de chamar mutate direto
- A mutation `useInvitationsControllerRevoke` migra do `invitations-table.tsx` pro novo dialog

### 3.3 `PlaceholderPage`

Reescrever `components/layout/placeholder-page.tsx`:

```tsx
export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold">{title}</h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </header>
      <div className="text-muted-foreground text-sm">Em breve.</div>
    </div>
  );
}
```

Páginas que usam `<PlaceholderPage>` hoje (Canais, Integrações, e a raiz `/configuracoes`) **não** precisam ser editadas — a API é compatível, só o visual muda.

## 4. Documentação em `design-system.md`

Adicionar **uma nova seção** "Padrões de telas de configuração" antes de "Iconografia". Conteúdo:

### 4.1 Shell de página

Estrutura padrão (não componente — pattern):

```tsx
<div className="flex flex-col gap-6 p-6">
  <header className="flex items-center justify-between">
    <div>
      <h1 className="text-foreground text-2xl font-semibold">Título</h1>
      <p className="text-muted-foreground text-sm">Descrição curta da seção.</p>
    </div>
    <CTA />
  </header>
  {/* corpo */}
</div>
```

- Wrapper: `flex flex-col gap-6 p-6`
- Título: `<h1>` com `text-2xl font-semibold text-foreground`
- Descrição: `<p>` com `text-sm text-muted-foreground`
- CTA opcional (botão "Novo", "Convidar", etc) à direita do header via `justify-between`
- Sem CTA? Remover `justify-between` e o `<div>` wrapper interno
- Páginas só de conteúdo (sem ação primária) seguem o mesmo wrapper; o corpo entra abaixo do `<header>`

### 4.2 Toolbar de listas

Acima da tabela. Ordem fixa: busca → selects → switches.

```tsx
<div className="flex flex-wrap items-center gap-3">
  <InputGroup className="w-full max-w-sm">
    <InputGroupAddon>
      <SearchIcon className="size-4" />
    </InputGroupAddon>
    <InputGroupInput type="search" placeholder="Buscar…" />
  </InputGroup>
  {/* selects de filtro com Label visível à esquerda */}
  {/* switch(es) de filtro com Label à direita */}
</div>
```

- Busca: sempre `InputGroup` + `SearchIcon size-4` + `max-w-sm` + `useDeferredValue`
- Selects de filtro: largura `w-36` por padrão; aumentar caso a caso (`w-44`) quando o rótulo mais longo não couber
- Label `sr-only` para a busca; visível (`text-muted-foreground text-sm`) para Selects e Switches
- Filtros binários → **Select** com duas opções (quando é uma dimensão de filtragem, ex.: Status Ativos/Inativos); **Switch** quando é um toggle pessoal de fluxo (ex.: "Apenas as minhas")

### 4.3 Wrapper e estados de tabela

```tsx
<div className="rounded-md border">
  <Table>{/* ... */}</Table>
</div>
```

Estados obrigatórios dentro do `<TableBody>`:

- **Loading:** `Array.from({length: 3})` linhas com `<TableCell colSpan={N}><Skeleton className="h-6 w-full" /></TableCell>`
- **Error:** uma linha com `<TableCell colSpan={N} className="text-destructive text-center">Erro ao carregar X.</TableCell>`
- **Empty:** uma linha com `<TableCell colSpan={N} className="text-muted-foreground text-center">{emptyMessage}</TableCell>`

Rodapé "mais resultados" (quando `hasMore`): `<p className="text-muted-foreground text-sm">Mostrando os primeiros {LIMIT} resultados. Use a busca para refinar.</p>`

### 4.4 Ações de linha

- `<Button variant="ghost" size="sm">` com `<Icon className="size-4" /> Texto`
- Container: `<div className="flex justify-end gap-1">`
- Até 4 ações inline é aceitável quando todas são frequentes (ex.: Users)
- `aria-label` em cada botão com a entidade alvo: `aria-label={\`Editar X ${item.name}\`}`

### 4.5 Cor de botão destrutivo

**Regra:** toda ação destrutiva (que afeta negativamente o recurso, mesmo que reversível) usa `text-destructive hover:text-destructive`:

```tsx
<Button
  variant="ghost"
  size="sm"
  className="text-destructive hover:text-destructive"
  onClick={() => onDeactivate(item)}
  aria-label={`Desativar X ${item.name}`}
>
  <BanIcon className="size-4" />
  Desativar
</Button>
```

Aplica a: Desativar, Apagar, Revogar, Forçar logout. Não aplica a: Editar, Reativar, Copiar link, Reenviar.

Em **dialogs de confirmação destrutiva** o botão de confirmação usa `variant="destructive"` (não ghost), já que é a ação primária do dialog.

### 4.6 Form longo com sticky bar

Padrão observado em Preferências:

```tsx
<form>
  {sections.map(...)} {/* cada section é um <Card> com <h2 text-lg font-semibold> + <CardDescription> + linhas */}
  <div className="bg-background border-border sticky bottom-0 -mx-6 flex justify-end gap-2 border-t px-6 py-4">
    <Button type="button" variant="outline">Descartar alterações</Button>
    <Button type="submit">Salvar alterações</Button>
  </div>
</form>
```

- Usar quando o form é longo (mais que uma altura de viewport)
- Cada seção em `<Card>` separado. Título da seção em `<h2 className="text-foreground text-lg font-semibold">` (não usar `<CardTitle>` — ele é `<div>` no shadcn baseline e perde semântica de heading) + `<CardDescription>` para o subtítulo
- Botão Descartar e Salvar desabilitados quando `!isDirty || isSubmitting`
- Sticky bar mantém o `-mx-6 px-6` para alinhar com o padding `p-6` do shell

### 4.7 Loading e error

- **Página com tabela:** trata internamente via `state` no `<TableView>`. **Não** criar `loading.tsx` nem `error.tsx` de rota.
- **Página só de form/conteúdo:** trata em nível de rota via `app/.../loading.tsx` (skeleton da página inteira, incluindo header) e `app/.../error.tsx` (mensagem amigável + botão retry usando `reset()`).

### 4.8 Filtros binários: Switch vs Select

- **Select** quando o filtro é uma _dimensão de filtragem_ com semântica simétrica (`Ativos` / `Inativos`, `Contato` / `Ticket` / `Ambos`)
- **Switch** quando é um _toggle pessoal de fluxo_ com estado padrão claramente neutro (ex.: `Apenas as minhas` — desligado = todos; ligado = só as minhas)

### 4.9 Exceção documentada — Quick Replies sem filtro Status

A tabela de Quick Replies não expõe filtro `Ativos / Inativos`. Motivo: o backend faz soft-delete (marca `active=false`), mas a UI modela DELETE como hard delete — o item somente desaparece. O hook lista usa `active: true` fixo. Decisão é consciente; ver `components/quick-replies/quick-replies-table.tsx:51-54`.

## 5. Testes existentes a checar

Os testes de visualização (`*-table-view.test.tsx`) podem fazer assertions sobre estrutura ou classes. Antes de editar cada view, rodar o teste correspondente e ajustar se quebrar:

- `components/departments/departments-table-view.test.tsx`
- `components/tags/tags-table-view.test.tsx`
- `components/users/users-table-view.test.tsx`
- `components/users/invitations-table-view.test.tsx`
- `components/quick-replies/quick-replies-table-view.test.tsx`

Mudanças nos testes: ajustar assertions só onde for necessário para o novo estado (cor destrutiva nova classe, elemento de heading do CardTitle, etc). Não relaxar cobertura.

Para o novo `RevokeInvitationDialog`, espelhar o teste de `DeactivateDepartmentDialog`: aberto/fechado, label do email, click em "Revogar" chama mutate, estado pending desabilita.

## 6. Estratégia de PR

PR único `chore/settings-design-uniformization` partindo de `origin/main` atualizado, organizado em commits lógicos:

1. `docs(design-system): patterns de telas de configuração`
2. `refactor(settings): aplica cor destrutiva em todas as ações destrutivas das listas`
3. `refactor(invitations): substitui window.confirm por RevokeInvitationDialog`
4. `refactor(placeholder-page): adota shell padrão de configurações`

Não atualiza `ROADMAP.md` — esta rodada não está numerada como sprint; é uma micro-melhoria de polish que entra como `chore`.

## 7. Verificação local

Antes de abrir PR:

```
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

Visual:

- `/configuracoes/departamentos` — botão "Desativar" vermelho na linha
- `/configuracoes/tags` — idem
- `/configuracoes/usuarios` — "Desativar" e "Forçar logout" vermelhos na linha
- `/configuracoes/usuarios` (tab Convites) — "Revogar" vermelho na linha; ao clicar abre Dialog (não `window.confirm`); confirmação revoga e atualiza a lista
- `/configuracoes/quick-replies` — "Apagar" continua vermelho (sem regressão)
- `/configuracoes/canais` e `/configuracoes/integracoes` — header igual ao das outras com "Em breve" no corpo, sem centralização vertical
- `/configuracoes/preferencias` — sem regressão visual (não há mudanças nesta rodada)

## 8. Riscos

- **Quebra de teste por assertion estrutural.** `preference-section.test.tsx` pode esperar `<h2>` específico. Mitigação: rodar o teste antes da edição, ajustar para `getByRole('heading')`.
- **Cor destrutiva sobre row hover.** O `hover:bg-accent` default do botão ghost pode interferir com a cor de texto destrutiva quando hover. Verificar visualmente — se ficar ruim, manter `hover:text-destructive` explícito (já incluído no padrão).
- **`<RevokeInvitationDialog>` esquecer de invalidar a query.** Mitigação: cobrir no teste do dialog (`expect(invalidateQueries).toHaveBeenCalled()`).
