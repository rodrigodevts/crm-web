# ROADMAP.md — crm-web

> Plano de fases do **frontend** (`crm-web`). Para escopo backend, ver `../crm-api/ROADMAP.md` — fonte canônica.
>
> **Versão:** 12 (Fase 1 frontend em andamento — sync com `crm-api/ROADMAP.md` v23 / Fase 1 backend concluída)
> **Última atualização:** 15/05/2026
>
> **Documento companheiro:** `ARCHITECTURE.md` (raiz crm-web).

---

## Sumário

1. Premissas
2. Critério de "fase pronta"
3. Mapa geral de fases
4. Fase 0 — Bootstrap do crm-web
5. Fases 1–8 — fatia frontend
6. Rastreamento

---

## 1. Premissas

- Dev solo, ~3h/dia × 6 dias/semana.
- Filosofia médio-termo: bem feito, focado no essencial.
- Cada fase deve ser entregável e testável end-to-end antes da próxima.
- Estimativas em semanas são chutes calibrados — não promessas.
- **Frontend e backend evoluem em paralelo.** Cada fase tem entregáveis em ambos os repos. Este documento cobre só `crm-web`.

---

## 2. Critério de "fase pronta" (frontend)

1. Telas funcionando em ambiente de desenvolvimento contra crm-api real.
2. Testes passando (`pnpm test`).
3. `pnpm typecheck`, `pnpm lint`, `pnpm format:check` verdes localmente; `pnpm build` cai pra CI (limitação conhecida — ver `CLAUDE.md` §11).
4. `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` zero diff.
5. Documentação atualizada (`ARCHITECTURE.md` se houver mudança arquitetural).
6. Validação manual end-to-end conforme checklist da fase.

---

## 3. Mapa geral de fases

| #   | Nome                                             | Estimativa  | Status       |
| --- | ------------------------------------------------ | ----------- | ------------ |
| 0   | Bootstrap do crm-web                             | 1-2 semanas | concluída    |
| 1   | Tela de canal Gupshup (config + status realtime) | 1-2 semanas | em andamento |
| 2   | UI Izing-like de Atendimentos + composer HSM     | 4-5 semanas | aguardando   |
| 3a  | Editor JSON estruturado de Bot/Fluxo             | 3-4 semanas | aguardando   |
| 3b  | Templates de fluxo + simulador                   | 2-3 semanas | aguardando   |
| 4   | Polimento, telas de configurações, CSAT          | 3-4 semanas | aguardando   |
| 5   | Tela de campanhas + webhooks de saída            | 2-3 semanas | aguardando   |
| 6   | Builder visual de fluxo (React Flow)             | 3-4 semanas | aguardando   |
| 7   | UI Baileys (QR code, status)                     | 1 semana    | aguardando   |
| 8   | Migração / on-premise / docs                     | variável    | aguardando   |

> Estimativas frontend são menores que as totais do crm-api porque grande parte do trabalho de cada fase está no backend.

---

## 4. Fase 0 — Bootstrap do crm-web

**Objetivo:** scaffolding técnico, integração com OpenAPI do backend, docs e convenções.

### 4.1 Setup base

- [x] Repo `crm-web` no GitHub sob AGPLv3 (`rodrigodevts/crm-web`)
- [x] Next.js 16.2.4 + App Router + TypeScript estrito
- [x] Tailwind CSS 4
- [x] shadcn/ui inicializado com componentes base (button, card, dropdown-menu, input, label)
- [x] TanStack Query, React Hook Form, Zod, axios, lucide, geist, next-themes instalados
- [x] CI/CD básico — `.github/workflows/ci.yml` (lint, format:check, typecheck, test, build)
- [x] lefthook (pre-commit + pre-push)
- [x] Vitest 4 + jsdom + @testing-library/react
- [x] ESLint 9 + Prettier 3 + .editorconfig + .nvmrc

### 4.2 Integração com OpenAPI do backend (Kubb)

- [x] `kubb.config.ts` com 5 plugins (oas, ts, zod, client, react-query)
- [x] Script `pnpm generate:api`
- [x] `lib/generated/` populado contra OpenAPI do backend
- [x] `lib/CLAUDE.md` documentando "código gerado, não editar"

### 4.3 Sprint 0.13 — Fechamento de gaps (entregue, PR #11)

- [x] LICENSE AGPLv3
- [x] Deps `zustand` e `socket.io-client`
- [x] `openapi.snapshot.json` + script `generate:api:from-snapshot`
- [x] CI: drift detection em `lib/generated/`
- [x] Smoke test do tipo gerado em `lib/generated.test.ts`
- [x] CLAUDE.md raiz adaptado pro escopo frontend
- [x] ROADMAP.md raiz adaptado pro escopo frontend (este documento)

### 4.4 Documentação base

- [x] `ARCHITECTURE.md` raiz (referência canônica do projeto inteiro)
- [x] `WORKFLOW.md` raiz (workflow Superpowers)
- [x] `design-system.md` raiz (cores, tipografia, componentes)
- [x] `CONTRIBUTING.md` raiz
- [x] `docs/conventions/` (api-conventions, error-handling, multi-tenant-checklist, testing-strategy)
- [x] `CLAUDE.md` em `app/`, `components/`, `lib/`

### 4.5 UI mínima validada

- [x] `(auth)/login` com formulário + teste (`login-form.test.tsx`)
- [x] `theme-provider`, `theme-toggle`, `query-provider`, `providers.tsx`

### 4.6 Pendente (próximas sprints da Fase 0 ou Fase 4)

- [x] Tela de register substituída por sistema de convite — `/aceitar-convite/[token]` (Sprint 0.16 Fase B, PR #15/#16)
- [x] Layout base Izing-like (sidebar + header + área principal) — Sprint 0.14, PR #13
- [x] Páginas dummy de Atendimentos — 13 rotas placeholder, Sprint 0.14, PR #13
- [x] Telas reais de Configurações — Departamentos, Tags, Quick Replies, Usuários CRUD, Preferências (ver §4.8 pra detalhe por sprint)
- [x] Tema final consolidado — Sprint 0.23 (PR #33)
- [ ] E2E real (Playwright contra backend) — não-bloqueante, sprint dedicada quando o stack estabilizar

### 4.7 Sprint 0.14 — App Shell pós-login (entregue, PR #13)

- [x] Auth real ponta a ponta (login + cookies httpOnly + refresh interceptor + logout)
- [x] `proxy.ts` Next 16 com cookie gate
- [x] `(app)` route group protegido com Server Component fetching `/me` e redirect 401
- [x] AppSidebar (5 itens + Configurações expansível com 7 sub-itens + NavSecondary)
- [x] SiteHeader com title slot dinâmico + ThemeToggle
- [x] Drawer mobile via Sheet + atalho Cmd/Ctrl+B
- [x] NavUser com nome real + Sair (mutation + queryClient.clear + redirect)
- [x] 13 páginas placeholder
- [x] Theme provider próprio cookie-based SSR (sem `next-themes`, compatível React 19)
- [x] Backend Me/Auth integrado (consome `crm-api` PRs #34/#36/#37)

### 4.8 Plano de fechamento da Fase 0

#### Entregue

- [x] Sistema de convite de usuários (Sprint 0.16 Fase B, PR #15/#16) — substitui "Página de register"; admin convida via `/configuracoes/usuarios`, convidado aceita em `/aceitar-convite/[token]`
- [x] Showcase `/configuracoes/design-system` (Sprint 0.17) — catálogo descritivo de tokens + primitivos shadcn + compostos do projeto
- [x] Telas reais de Configurações — Departamentos (Sprint 0.18, PR #26), Tags (Sprint 0.19, PR #27), Quick Replies (Sprint 0.20, PR #28)
- [x] RBAC baseline (PR #19, refinado na Sprint 0.20 PR #28) — sidebar oculta, redirect 403, toast 403 no interceptor, gate por rota via `x-pathname` no `proxy.ts`
- [x] **Sprint 0.21 — Usuários CRUD edit/delete + role change** (pareada com PR #49 do crm-api). Tela `/configuracoes/usuarios` ganha CRUD completo: edição de nome/email/role/departments via `UserDialog`, desativação via DELETE soft, reativação inline via PATCH `active=true`, força logout via POST dedicado. Tabs `Usuários | Convites` reorganizam a página com foco nos usuários; convite passa a oferecer ADMIN/SUPERVISOR/AGENT. Gates de proteção: self, SUPER_ADMIN, último ADMIN ativo. Filtros search/role/status na toolbar.
- [x] **Sprint 0.22 — Preferências (Company settings)** (PR #31, pareada com PR #50 do crm-api). Tela `/configuracoes/preferencias` consumindo `GET/PATCH /companies/me/settings` com 12 toggles em 6 cards (Visibilidade de tickets / Privacidade / Grupos do WhatsApp / Roteamento / Permissões do atendente / Bot). Save explícito via footer sticky `Salvar alterações` / `Descartar alterações`; submit envia apenas campos dirty. RBAC inline: ADMIN/SUPER_ADMIN editam; AGENT/SUPERVISOR vêem switches disabled com tooltip e footer omitido. `lib/rbac.ts` libera `/configuracoes/preferencias` como segunda exceção para AGENT e SUPERVISOR. Componentes shared `PreferenceSection` e `PreferenceSwitchRow` com showcase no `/configuracoes/design-system`. `defaultBotChatFlowId` propositalmente fora do escopo (depende de `ChatFlow` — Fase 3a).
- [x] **Sprint 0.23 — Tema final consolidado** (PR #33). Vocabulário Tailwind canônico do `crm-web` consolidado em **shadcn baseline**: 16 ghost-tokens (`text-text-primary`, `bg-bg-base`, `border-border-default`, etc) substituídos por seus equivalentes shadcn (`text-foreground`, `bg-background`, `border-border`, `bg-sidebar`, `bg-muted`) em 7 arquivos. `design-system.md` v3 com tabela Figma↔CSS e tipografia consolidada em Geist Sans + Geist Mono (descartado Archivo+Inter+JetBrains da visão antiga). `ARCHITECTURE.md` v8. Paleta primary `#1b84ff` mantida em `--primary`/`--ring`/`--sidebar-primary` + escala `--color-primary-50..950` exposta. Showcase `/configuracoes/design-system` simplificado: removido `DriftBanner` (descrevia o drift que esta sprint resolveu) e TOC lateral (não agregava navegação). CTAs primários do header das telas de configurações elevados pra `size=lg`. Memory `feedback_real_tailwind_tokens` removida.

**Fase 0 concluída em 2026-05-10.** Próximo passo: Fase 1 — Tela de canal Gupshup (vide §5.1).

#### Movido pra fora da Fase 0

- **Canais** → Fase 1 (já era o entregável principal da fase). Vide §5.1.
- **Integrações** → Fase 4 (CRUD de `IntegrationLink` + UI na sidebar do ticket). Vide §5.5.

#### Não-bloqueante (entra quando a feature aparecer no fluxo)

- **RBAC efetivo granular** (`<RequireRole>`, mapa de rotas, ações condicionais por componente) — endereçar em sprint dedicada quando uma feature exigir gate fino. O baseline atual cobre os caminhos críticos (sidebar + redirect + interceptor + gate por rota).
- **Upload de avatar** — backend e fluxo de upload pendentes; entra quando alguma persona exigir customização visual.
- **E2E real** (Playwright contra `crm-api` rodando em ambiente de teste) — sprint dedicada quando o stack estiver estabilizado em staging. Hoje os fluxos críticos têm cobertura via testes unitários + RTL.

---

## 5. Fases 1–8 (fatia frontend)

> Detalhamento em sprints à medida que cada fase começa. Aqui só os entregáveis frontend principais.

### 5.1 Fase 1 — Tela de canal Gupshup

> **Documento canônico de planejamento da Fase 1:** `../crm-api/ROADMAP.md` §6 (versão 23, 15/05/2026). A fatia frontend abaixo é pareada com as sprints backend correspondentes.
>
> **Cross-repo (15/05/2026):** **Fase 1 backend concluída** no `crm-api` (Sprint 1.9 deploy + Sprint 1.9-hotfix). A Fase 1 **frontend** segue **em andamento** — Sprint 1.6 Fase B **entregue** (esta branch); falta Sprint 1.8 Fase B (detalhe abaixo). O checklist ponta-a-ponta `crm-api/ROADMAP.md` §6.4 está verde nos itens 1–9 e 11; o **item 10 ("status do canal em tempo real no frontend") tem só a emissão backend validada** (Socket.IO `channel:status`, Sprint 1.8b) — a superfície de UI é a Sprint 1.8 Fase B aqui, ainda pendente.
>
> **Sem dependência de deploy** para as sprints frontend: cada uma roda contra `crm-api` local. A validação ponta-a-ponta com Gupshup real foi feita na Sprint 1.9 backend via **deploy no Coolify (VPS compartilhado)** — o Cloudflare Tunnel foi descartado (premissa antiga). A Sprint 1.9-hotfix corrigiu o `externalId` do Gupshup (`ev.gsId ?? ev.id`).

**Pré-req frontend:** `pnpm generate:api:from-snapshot` precisa rodar contra OpenAPI atualizado do `crm-api` após cada sprint backend que altere contratos.

#### Sprint 1.4 Fase B — Tela `/configuracoes/canais` (CRUD + mascaramento + revelação) — entregue PR #35

- [x] Pareada com Sprint 1.4 do `crm-api` (CRUD do módulo `channels`)
- [x] Página `/configuracoes/canais` com lista de canais (cards com nome, número, status badge, depto padrão, ícone do canal lógico via `ChannelKindIcon` extensível pra Instagram/Telegram)
- [x] `ChannelDialog` (criar/editar) com campos: Nome, `provider` (Gupshup ativo + Baileys disabled), `phoneNumber` com máscara via `MaskedPhoneInput` shared, credenciais Gupshup (`apiKey`, `appId`, `appName`), `defaultDepartmentId`, `inactivityTimeoutMinutes` + `inactivityCloseReasonId` (dependente)
- [x] Mascaramento dos campos sensíveis em GET (`***last4`)
- [x] Botão "Revelar para editar" → POST `/channels/:id/reveal-credentials` (ADMIN only, gera audit log no backend)
- [x] Ações inline com confirmação: `Ativar / Desativar / Forçar restart` no card
- [x] Soft delete (deletedAt) com confirmação (bloqueia se houver tickets OPEN/PENDING — backend retorna 409, frontend mostra counts em estado bloqueado do dialog)
- [x] RBAC: AGENT/SUPERVISOR não vêem o item de menu nem acessam a rota (gate em `lib/rbac.ts` + `proxy.ts`)
- [x] Showcase: não foi necessário — `MaskedPhoneInput`, `MultiSelectCombobox` e `ChannelKindIcon` foram introduzidos como shared mas reusam pattern de primitivos já catalogados

#### Sprint 1.4 Fase C — Tela `/configuracoes/motivos-fechamento` (CRUD + drag-and-drop reorder) — entregue PR #35

> Gap-filler: a UI de Motivos de Fechamento foi pulada nas Sprints 0.18-0.22 (Departments, Tags, Quick Replies, Users, Preferences) embora o backend já estivesse pronto. Sprint 1.4 Fase C fecha esse gap junto da Sprint 1.4 Fase B porque a feature de auto-fechamento de canal só é utilizável end-to-end com motivos cadastrados.

- [x] Página `/configuracoes/motivos-fechamento` com tabela bordada alinhada ao pattern de Departments/Tags (header sempre visível, estados como TableRow colSpan, ações inline ghost+sm Editar/Excluir)
- [x] Toolbar: busca debounced
- [x] `CloseReasonDialog` (criar/editar) com campos: Nome (único por tenant), Mensagem automática opcional, Departamentos via `MultiSelectCombobox` shared (search + badges com remoção)
- [x] **Hard delete real** (PRs cross-repo no crm-api #61 bootstrap, #62 OpenAPI decorators, #63 list inclui departments, #64 troca soft por hard delete). `DeleteCloseReasonDialog` com 2 estados (confirmação / bloqueado por `channelsUsingCount` em FK violation)
- [x] Drag-and-drop reorder via `@dnd-kit/sortable` (mouse + touch + keyboard a11y, optimistic update, revert no erro, desabilitado quando filtros ativos)
- [x] RBAC: AGENT/SUPERVISOR sem acesso (mesmo gate de Configurações)
- [x] Fields cortados intencionalmente com TODO no schema: `triggersCsat` (CSAT, Fase 4), `asksDealValue` (composer, Fase 2), `funnelId` (SalesFunnel, Fase 4+)

#### Sprint 1.6 Fase B — Tela básica de mensagens recebidas (validação) — entregue

- [x] Pareada com Sprint 1.6 do `crm-api` (envio outbound + status updates)
- [x] Página `/atendimentos/canais-debug/[channelId]` (não é a tela final — só validação ponta-a-ponta da Fase 1; será descartada/substituída na Fase 2)
- [x] Lista as últimas N mensagens INBOUND/OUTBOUND do canal (timestamp, ticketId curto, conteúdo defensivo, status)
- [x] Composer minimalista de texto (POST `/tickets/:id/messages`)
- [x] Atualização em tempo real via socket.io-client (eventos `message:new`, `message:status`)
- [x] Suficiente para checklist §6.4 do `crm-api/ROADMAP.md` (cenários 4–7, 11)

> **Validação manual §6.4 (contra crm-api local, via replay do webhook-recorder):** cenários **4, 5, 7, 11** validados na tela debug. O cenário **6** (`outOfHoursMessage` OUTBOUND) estava bloqueado por gap do crm-api (envio era TODO órfão da Sprint 1.6 backend) — destravado pelo follow-up **crm-api PR #80** (`feat(sprint-1.6 follow-up): envio real de outOfHoursMessage`) e então validado verde na tela. **Desvio consciente** (CLAUDE.md §4.4): o composer usa schema Zod local em vez do gerado pelo Kubb — o schema gerado termina em `as unknown as z.ZodType<T>` e quebra o `zodResolver`; todo o restante do repo usa schema local (ver `message-composer.tsx` e memória `project_kubb_zod_schema_zodresolver`). Aceitável por ser tela descartável; a tipagem da mutation continua sendo a gerada.

#### Sprint 1.8 Fase B — Card de canal com status realtime

> **Backend pronto e validado** (Sprint 1.8b do `crm-api`, emissão `channel:status`). Esta sprint frontend é a peça que falta para fechar `crm-api/ROADMAP.md` §6.4 item 10.

- [ ] Pareada com Sprint 1.8 do `crm-api` (eventos Socket.IO `channel:status`)
- [ ] Card de canal em `/configuracoes/canais` consome socket.io-client
- [ ] Indicador visual por estado (badge já existe da 1.4b; falta o realtime feed)
- [ ] Toast em transições críticas (`CONNECTED → DISCONNECTED`, qualquer estado → `ERROR`)
- [ ] Mostra `lastError` quando estado é `ERROR`
- [ ] Reconexão automática do socket (com indicador de "reconectando")

### 5.2 Fase 2 — UI Izing-like de Atendimentos

- [ ] Sidebar de fila com 3 abas + virtualização
- [ ] Dropdown "Ordenar por" (4 opções)
- [ ] Visual de ticket pinned + seção Fixados
- [ ] Menu do card com Fixar/Desfixar
- [ ] Filtro avançado com toggle "Em fluxo de bot"
- [ ] Header polimórfico
- [ ] Composer livre + HSM com preview
- [ ] Painel lateral 5 abas (Info, Custom Fields, Funil, ChatBot manual, Histórico)
- [ ] Modais: Iniciar atendimento, Transferir, Resolver, Editar Contato
- [ ] **Modo busca isolado** de realtime (resolve bug do sistema atual)

### 5.3 Fase 3a — Editor JSON estruturado de Bot/Fluxo

- [ ] Tela de lista de fluxos
- [ ] Editor com painéis (árvore + form tipado por tipo + validação)
- [ ] CRUD de `BotCredential`
- [ ] Modal/painel de simulador (mínimo viável)
- [ ] Aba "ChatBot manual" funcional no painel lateral do ticket
- [ ] Indicador "Bot rodando" + botão "Parar bot"

### 5.4 Fase 3b — Templates de fluxo + simulador

- [ ] UI marketplace de templates
- [ ] Ação "Criar fluxo a partir de template"
- [ ] Simulador completo inline com step-by-step

### 5.5 Fase 4 — Polimento, configurações, CSAT

- [ ] Tela de Contatos completa
- [ ] Tela de Configurações da Company (13 flags)
- [ ] Tela completa de Departamentos
- [ ] Tela completa de Usuários
- [ ] Tela de Quick Replies (pessoal e global)
- [ ] Tela de CustomFieldDefinition
- [ ] Tela de SalesFunnel + LeadStatus (read-only)
- [ ] Tela de IntegrationLink + UI na sidebar do ticket
- [ ] UI CSAT (configuração + dashboard de notas)
- [ ] Dashboard básico de métricas
- [ ] BusinessHoliday + UI

### 5.6 Fase 5 — Campanhas + Webhooks + API push

- [ ] Tela: criar lista, criar campanha, agendamento
- [ ] Relatório de campanha
- [ ] UI de gestão de webhooks (criar, listar, ver logs, re-disparar)
- [ ] Botão API push customizável no ticket

### 5.7 Fase 6 — Builder visual de fluxo

- [ ] React Flow integrado
- [ ] Canvas drag-and-drop com paleta
- [ ] Edição inline de propriedades
- [ ] Validação visual
- [ ] Salvar/carregar JSON compatível com Bot Engine
- [ ] Versionamento básico (rascunho vs publicado)
- [ ] Modo compacto dos nodes

### 5.8 Fase 7 — UI Baileys

- [ ] Tela de QR code
- [ ] Frontend renderiza dinamicamente "Rejeitar Ligações" via capabilities

### 5.9 Fase 8 — Migração / on-premise

- [ ] Documentação de instalação on-premise (frontend)
- [ ] Treinamento visual de atendentes

---

## 6. Rastreamento

| Fase    | Início     | Fim        | Status       | Notas                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------- | ---------- | ---------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fase 0  | 2026-04    | 2026-05-10 | concluída    | Sprints 0.13–0.23 entregues (bootstrap, app shell, design-system showcase, convites, Departamentos, Tags, Quick Replies, Usuários CRUD, Preferências, Tema final). Canais movidos pra Fase 1; E2E/RBAC granular/upload de avatar não-bloqueantes.                                                                                                                                                     |
| Fase 1  | 2026-05-11 | —          | em andamento | **Fase 1 backend concluída no `crm-api`** (Sprint 1.9 deploy Coolify + 1.9-hotfix externalId; `crm-api/ROADMAP.md` v23). Frontend: Sprints 1.4 Fase B (canais UI) e 1.4 Fase C (motivos de fechamento) entregues em PR #35 — pareadas com crm-api PRs #56, #61, #62, #63, #64. Pendente: Sprint 1.6 Fase B (mensagens debug) e Sprint 1.8 Fase B (realtime do canal — fecha §6.4 item 10 do crm-api). |
| Fase 2  | —          | —          | aguardando   | —                                                                                                                                                                                                                                                                                                                                                                                                     |
| Fase 3a | —          | —          | aguardando   | —                                                                                                                                                                                                                                                                                                                                                                                                     |
| Fase 3b | —          | —          | aguardando   | —                                                                                                                                                                                                                                                                                                                                                                                                     |
| Fase 4  | —          | —          | aguardando   | —                                                                                                                                                                                                                                                                                                                                                                                                     |
| Fase 5  | —          | —          | aguardando   | Pré-req da Fase 8 backend.                                                                                                                                                                                                                                                                                                                                                                            |
| Fase 6  | —          | —          | aguardando   | —                                                                                                                                                                                                                                                                                                                                                                                                     |
| Fase 7  | —          | —          | aguardando   | —                                                                                                                                                                                                                                                                                                                                                                                                     |
| Fase 8  | —          | —          | aguardando   | Requer Fase 5 backend.                                                                                                                                                                                                                                                                                                                                                                                |
