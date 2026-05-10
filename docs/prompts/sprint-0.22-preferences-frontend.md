# Sprint 0.22 — Preferências (Company settings) frontend

> Rode este prompt **no `crm-web`** (sessão Claude Code aberta na raiz do `crm-web`).
> **Pré-requisito:** módulo `CompanySettings` do `crm-api` já está mergeado em `main` (controller `companies/me/settings` com `GET` para todos os perfis e `PATCH` ADMIN-only, 13 flags). Hooks gerados (`useCompanySettingsControllerFindMine`, `useCompanySettingsControllerUpdateMine`) e tipos (`CompanySettingsControllerFindMine200`, `UpdateCompanySettingsDto`) já existem em `lib/generated/`. Não há mudança de backend nesta sprint.
> **Contexto:** primeira tela de Configurações que **não é tabela** — é um form de toggles agrupados por seção. Padrão UX/RHF/Zod a replicar é o de Tags (PR #27) e Quick Replies (PR #28); o que muda é a forma (toggles + dropdown desabilitado em vez de tabela + dialog).

---

## Prompt

```text
Vamos fechar a Sprint 0.22 do DigiChat: implementar a tela
/configuracoes/preferencias consumindo CompanySettings — 12 toggles
booleanos + 1 dropdown (defaultBotChatFlowId, desabilitado nesta
sprint). Hoje a página é só PlaceholderPage. Referência:
crm-web/ROADMAP.md §4.8 ("Sprint 0.22 — Preferências (Company
settings)") e crm-specs/areas/03-configuracoes.md "Tela 13:
Configurações Avançadas" + crm-specs/audits/audit-03B-comportamento-
global.md §3 (decisões por flag).

# Pré-requisito (verificar antes de codar)

1. git pull em ambos os repos (crm-api e crm-web).
2. Sincronizar snapshot e regenerar (sem rodar crm-api):
   - pnpm generate:api:from-snapshot
3. Confirmar que existem em lib/generated/:
   - hooks/useCompanySettingsControllerFindMine.ts
   - hooks/useCompanySettingsControllerUpdateMine.ts
   - types/CompanySettingsControllerFindMine.ts (response com 13 flags
     + id/companyId/createdAt/updatedAt)
   - types/UpdateCompanySettingsDto.ts (todos os 13 campos optional;
     defaultBotChatFlowId aceita uuid ou null)
   - schemas/updateCompanySettingsDtoSchema.ts
4. Confirmar que a entrada da sidebar
   `{ href: '/configuracoes/preferencias', label: 'Preferências' }`
   já existe em components/app-sidebar.tsx (foi adicionada na
   Sprint 0.14). Não precisa mexer.

Se algo acima estiver faltando, PARAR e reportar — significa que o
snapshot não está sincronizado ou que o backend regrediu.

# Escopo desta sprint

- Substituir o PlaceholderPage de
  app/(app)/configuracoes/preferencias/page.tsx por uma tela real:
  header (título + descrição) + componente PreferencesForm.
- Componente PreferencesForm ('use client') que:
  - Carrega o estado via useCompanySettingsControllerFindMine().
  - Renderiza 12 Switches agrupados em 5 seções via Card (uma seção
    por área: Visibilidade de tickets, Privacidade, Grupos, Roteamento,
    Permissões de atendente). Bot fica em uma 6ª seção mostrando o
    select desabilitado + nota explicativa.
  - Cada toggle persiste IMEDIATAMENTE ao alternar
    (auto-save por flag) via useCompanySettingsControllerUpdateMine,
    enviando apenas o campo alterado no PATCH.
  - UI de "salvando…" inline ao lado do label (spinner pequeno em
    Loader2) enquanto a mutation está pending; toast de sucesso
    sucinto opcional, toast de erro obrigatório.
  - Em erro 4xx/5xx, REVERTER o estado visual do switch para o
    último valor confirmado (rollback otimista) e mostrar toast
    em pt-BR.
  - Forbidden 403 (AGENT/SUPERVISOR tentando alterar) → toast
    "Apenas administradores podem alterar preferências." Os
    Switches ficam visíveis para AGENT/SUPERVISOR (eles precisam
    saber o estado), mas DESABILITADOS.
- Estados da página:
  - loading: skeleton de 6 cards (cabeçalho + N linhas de switch).
  - error: mensagem com botão "Tentar novamente" (refetch).
  - ready: form renderizado.
- Tela visível para todos os perfis logados (GET é público), mas
  edição (PATCH) só para ADMIN — gate via `useCurrentUser()` para
  desabilitar Switches quando role !== 'ADMIN'. Nenhum redirect
  novo no proxy.ts.
- Atualizar ROADMAP §4.8 marcando Sprint 0.22 como entregue.

# Fora de escopo (NÃO implementar nesta sprint)

- Endpoint /chat-flows ainda não existe (Bot é Fase 3a). O dropdown
  de defaultBotChatFlowId fica DESABILITADO com nota "Configurável
  quando fluxos de bot forem implementados (Fase 3a)." Se o backend
  retornar valor (não-null), exibir como read-only com label "ID
  do fluxo: <uuid truncado>". Round-trip preservado: nunca enviamos
  esse campo no PATCH desta sprint (a UI nem oferece interação).
- Auditoria de mudanças (quem alterou qual flag e quando) — fora
  do escopo do MVP.
- Cache Redis das settings — é responsabilidade do backend, já
  mencionado no audit 03B §3.5; nada a fazer no front.
- Aplicação efetiva das flags (queries de tickets, mascaramento de
  telefone, etc) — vai entrando feature por feature em fases
  posteriores. Aqui é só a tela de configuração.

# Decisões já alinhadas com o humano (NÃO re-discutir no brainstorm)

- Auto-save POR FLAG (uma mutation por toggle), não batch com botão
  Salvar. Decisão registrada no audit 03B §3.5 RF-CS-2; a alternativa
  "batch com debounce 500ms" foi descartada pra ficar mais próxima do
  comportamento do sistema atual (Tela 13 do legado também é auto-save).
- 13 flags agrupadas em 6 seções (uma por Card), nesta ordem:
  1. Visibilidade de tickets — #1, #3, #10
  2. Privacidade — #2
  3. Grupos — #4, #6
  4. Roteamento — #5
  5. Permissões de atendente — #7, #8, #9, #12
  6. Bot — hideBotTicketsFromAgents + defaultBotChatFlowId (este
     desabilitado)
- Componente Switch shadcn (já instalado em components/ui/switch.tsx).
  Nada de Checkbox aqui — Switch comunica melhor "estado contínuo".
- Rollback otimista: ao togglar, atualiza imediatamente o valor local
  (UI responsiva); em erro, reverte e mostra toast.
- Tela disponível pra AGENT/SUPERVISOR também (eles precisam saber
  o que está ativo pra entender o sistema), mas com Switches
  desabilitados. Texto inline no header da página: "Edição
  disponível apenas para administradores."
- Strings de UI 100% em pt-BR. Identificadores em inglês.
- Sem novo gate no proxy.ts — apenas o gate de autenticação
  (já existente para `(app)/*`).
- Toast usa o mesmo padrão das outras sprints (sonner via
  `import { toast } from 'sonner'`).

# Mapa label → field (pt-BR, copiado/refinado da Tela 13 do legado)

| Seção                     | Field (camelCase)                          | Label                                                                            | Hint curto opcional                                                                  |
| ------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Visibilidade de tickets   | hideOtherUsersTickets                      | Ocultar tickets atribuídos a outros atendentes                                   | Atendente vê apenas os próprios e os pendentes do departamento.                      |
| Visibilidade de tickets   | agentSeeOtherUsersTicketsOnSameChannel     | Permitir ver tickets de outros atendentes no mesmo canal                         | Exceção à regra anterior, restrita a canais que o atendente acessa.                  |
| Visibilidade de tickets   | agentSeeTicketsWithOtherDefaultAgents      | Permitir ver tickets quando o contato tem outro atendente padrão                 | Útil quando carteira não é regra dura.                                               |
| Privacidade               | hidePhoneFromAgents                        | Ocultar números de telefone dos atendentes                                       | Mostra apenas os 4 últimos dígitos para perfis não-ADMIN.                            |
| Grupos                    | ignoreGroupMessages                        | Ignorar mensagens de grupo                                                       | Mensagens recebidas em grupos são descartadas (sem ticket).                          |
| Grupos                    | showAssignedGroups                         | Mostrar grupos atribuídos                                                        | Tickets originados em grupos aparecem na fila quando há atribuição.                  |
| Roteamento                | forceWalletRouting                         | Forçar atendimento via carteira                                                  | Se o contato tem atendente padrão, o ticket vai direto para ele.                     |
| Permissões de atendente   | agentCanDeleteContacts                     | Permitir que atendentes excluam contatos                                         | Ação destrutiva — mantenha desligado se não for necessário.                          |
| Permissões de atendente   | agentCanChangeDefaultAgent                 | Permitir que atendentes alterem o atendente padrão do contato                    | Mexer na carteira de outros atendentes.                                              |
| Permissões de atendente   | agentCanEditTags                           | Permitir que atendentes editem tags                                              | Sem isso, apenas ADMIN/SUPERVISOR cria/edita tags.                                   |
| Permissões de atendente   | agentCanToggleSignature                    | Permitir que atendentes alternem o envio com assinatura                          | Habilita um checkbox no compositor de mensagem.                                      |
| Bot                       | hideBotTicketsFromAgents                   | Ocultar tickets em atendimento por bot da fila dos atendentes                    | Default ON. Tickets em fluxo automático ficam fora da fila do AGENT.                 |
| Bot                       | defaultBotChatFlowId                       | Fluxo de bot padrão                                                              | Configurável quando fluxos de bot forem implementados (Fase 3a). Desabilitado agora. |

> Confirme as descrições com o humano no brainstorm — copy é negociável,
> mas os labels acima já partem do legado + audit 03B.

# Antes de codar

1. Ler nesta ordem (NÃO PULE — convenções do projeto evoluíram):
   - crm-web/CLAUDE.md (raiz)
   - crm-web/ROADMAP.md §4.8 (Sprint 0.22 contexto)
   - crm-web/ARCHITECTURE.md
   - crm-web/design-system.md (Cards, Switch, espaçamento)
   - crm-web/WORKFLOW.md
   - crm-web/app/CLAUDE.md
   - crm-web/components/CLAUDE.md
   - crm-web/lib/CLAUDE.md
   - crm-web/lib/generated/CLAUDE.md (aviso "não editar")
   - crm-web/app/(app)/configuracoes/preferencias/page.tsx (estado atual)
   - crm-web/app/(app)/configuracoes/tags/page.tsx
     (PADRÃO de header de página)
   - crm-web/app/(app)/configuracoes/layout.tsx
     (gate de Configurações)
   - crm-web/components/tags/tags-table.tsx
     (PADRÃO data layer + mutations + toasts + invalidate)
   - crm-web/components/tags/tag-dialog.tsx
     (PADRÃO RHF + zodResolver + tratamento 4xx/5xx)
   - crm-web/components/users/users-table.tsx
     (PADRÃO `useCurrentUser()` + gate inline)
   - crm-web/components/ui/switch.tsx (Radix wrapper)
   - crm-web/components/ui/card.tsx (Card/CardHeader/CardContent)
   - crm-web/lib/generated/hooks/useCompanySettingsControllerFindMine.ts
   - crm-web/lib/generated/hooks/useCompanySettingsControllerUpdateMine.ts
   - crm-web/lib/generated/types/CompanySettingsControllerFindMine.ts
   - crm-web/lib/generated/types/UpdateCompanySettingsDto.ts
   - crm-web/lib/generated/schemas/updateCompanySettingsDtoSchema.ts
   - crm-web/contexts/current-user-context.tsx (`useCurrentUser`)
   - crm-web/lib/api-client.ts (interceptor de erros)
   - crm-specs/areas/03-configuracoes.md (Tela 13)
   - crm-specs/audits/audit-03B-comportamento-global.md §3
     (decisões por flag, defaults, conflito #1 vs #10)

2. Rodar Superpowers /brainstorming antes de qualquer código.
   Pontos abertos pra fechar com o humano:
   - Confirmação dos labels e hints da tabela acima — refinar copy.
   - Comportamento exato do "salvando…": Loader2 ao lado do label
     do toggle salvando? Ou opacidade reduzida no Card inteiro?
     Sugestão: spinner inline pequeno (text-muted-foreground) ao
     lado do label da linha que está salvando, para evitar layout
     shift.
   - Toast de sucesso: silenciar (ruído visual) ou mostrar uma
     versão muito sucinta tipo "Preferência atualizada"? Sugestão
     primária: silenciar success, mostrar apenas erros — UX comum
     em telas de auto-save.
   - Texto exato da nota do dropdown desabilitado de bot.
   - Tratamento do toggle quando a request está em flight:
     bloquear novo toggle (disabled) ou enfileirar? Sugestão:
     desabilitar o switch específico até a mutation resolver
     (queueMicrotask não vale a pena aqui).
   - Confirmar a divisão em 6 seções (5 ativas + Bot). Aceita
     reordenar/renomear seções.
   - Empty state de erro de carregamento: card único centralizado
     com botão "Tentar novamente" chamando refetch.

3. Após alinhamento, /write-plan e quebrar em steps com TDD:
   - Step 1: components/preferences/preferences-form-section.tsx
     ('use client'). Componente burro que recebe título, descrição
     e children (linhas de toggle). Card + CardHeader + CardContent.
     Teste RTL: render básico (título, descrição, children
     receberam o slot).
   - Step 2: components/preferences/preference-toggle-row.tsx
     ('use client'). Recebe label, hint, checked, disabled,
     isSaving, onChange. Renderiza linha com Switch + texto +
     Loader2 condicional. Teste RTL: toggle dispara onChange,
     disabled bloqueia, isSaving mostra spinner, hint aparece
     se passado.
   - Step 3: components/preferences/preferences-form.tsx
     ('use client'). Componente "data + view": carrega
     settings via hook gerado, calcula `canEdit` via
     useCurrentUser (`me.role === 'ADMIN'`), agrupa flags em
     seções, gerencia estado local com rollback otimista.
     Helper `useTogglePreference(field)` interno encapsula a
     mutation + rollback + toast de erro. Teste RTL com mocks
     dos hooks gerados:
       - render loading (skeleton)
       - render error com botão "Tentar novamente"
       - render ready com 12 switches no estado correto
       - toggle de uma flag dispara PATCH apenas com aquele
         field
       - PATCH falha → switch volta + toast de erro
       - me.role === 'AGENT' → todos os switches disabled
       - me.role === 'SUPERVISOR' → todos os switches disabled
       - dropdown de defaultBotChatFlowId está sempre disabled
         e sem opções selecionáveis
   - Step 4: ajustar app/(app)/configuracoes/preferencias/page.tsx
     pra renderizar header (h1 "Preferências" + descrição) +
     PreferencesForm. Padrão idêntico ao tags/page.tsx.
   - Step 5: Verificação manual end-to-end contra crm-api local
     (login como ADMIN; togglar uma flag → reflete no GET após
     refresh; login como AGENT → switches disabled; matar a
     conexão e tentar togglar → toast de erro + rollback).
   - Step 6: marcar Sprint 0.22 como entregue em ROADMAP.md §4.8.
   - Step 7: Spec da fase em
     docs/superpowers/specs/<data>-sprint-0-22-preferences-frontend-design.md.

# Regras não-negociáveis (CLAUDE.md crm-web)

- Branch dedicada (feat/preferences-screen) a partir de
  origin/main atualizado.
- main protegida — PR obrigatório.
- Sem --no-verify, sem push --force.
- TypeScript strict; sem any/as Type sem comentário justificando.
- Tipos vêm de lib/generated. Se algum campo aparecer como
  `unknown`, é gap do snapshot — PARAR e rodar
  pnpm generate:api:from-snapshot. Se persistir, é gap de backend
  — PARAR e reportar.
- Strings visíveis em pt-BR; identificadores em inglês.
- Default Server Component; 'use client' só em PreferencesForm,
  PreferenceToggleRow e PreferencesFormSection.
- Não editar lib/generated/ à mão.
- Reuso > criação: components/ui/switch.tsx, card.tsx, label.tsx,
  skeleton.tsx, button.tsx já estão instalados; nada a adicionar.
- Não criar Form RHF aqui — não há submit unificado nem campos
  texto. Estado local + mutation por field é mais simples e
  cabe melhor no padrão "auto-save por flag".
- pnpm build NÃO entra no gate local (limitação documentada em
  CLAUDE.md §11). Verificação local =
  pnpm format:check && pnpm lint && pnpm typecheck && pnpm test.
- Ao iterar feedback de UX após primeiro deploy, NÃO fazer git push
  após cada commit local — esperar usuário sinalizar que a rodada de
  feedback está completa (regra do projeto).

# Critério de pronto

- /configuracoes/preferencias renderiza header (h1
  "Preferências" + descrição curta + nota "Edição disponível
  apenas para administradores." quando role !== ADMIN) + 6 cards
  (5 com toggles ativos + Bot com 1 toggle ativo + 1 dropdown
  desabilitado).
- 12 switches (todos os booleanos da tabela de mapping) refletem
  o estado vindo do backend e persistem auto-save por flag.
- Mutation envia APENAS o campo alterado (verificar com Network
  tab durante manual e via mock no teste).
- Rollback otimista funcionando: erro 4xx/5xx volta o switch +
  toast em pt-BR.
- 403 mostra toast "Apenas administradores podem alterar
  preferências." e mantém o estado anterior.
- AGENT/SUPERVISOR veem a tela com switches refletindo estado
  atual mas DESABILITADOS.
- Dropdown de defaultBotChatFlowId está visível, desabilitado e
  com nota "Configurável quando fluxos de bot forem implementados
  (Fase 3a)." Se o backend retornar valor não-null, mostra "ID do
  fluxo: <uuid truncado para 8 chars + ellipsis>" inline.
- Loading state: skeleton dos 6 cards.
- Error state: card único com mensagem em pt-BR e botão "Tentar
  novamente" disparando refetch.
- Testes RTL:
  - preferences-form-section: render básico.
  - preference-toggle-row: toggle dispara onChange, disabled
    bloqueia, isSaving mostra spinner, hint condicional.
  - preferences-form: loading + error + ready + toggle dispara
    PATCH com 1 campo + erro reverte switch + role gate
    (ADMIN edita, AGENT/SUPERVISOR readonly) + dropdown bot
    sempre disabled.
- pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
  verdes.
- pnpm generate:api:from-snapshot && git diff --exit-code
  lib/generated zero diff.
- ROADMAP §4.8 atualizado registrando Sprint 0.22 como entregue.
- Spec da fase em
  docs/superpowers/specs/<data>-sprint-0-22-preferences-frontend-design.md.
- PR aberto referenciando o módulo CompanySettings do crm-api
  (já em main).

Pode começar pela leitura dos docs e em seguida abrir o brainstorm.
```
