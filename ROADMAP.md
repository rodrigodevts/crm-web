# ROADMAP.md — crm-web

> Plano de fases do **frontend** (`crm-web`). Para escopo backend, ver `../crm-api/ROADMAP.md` — fonte canônica.
>
> **Versão:** 7 (fatia frontend)
> **Última atualização:** 06/05/2026
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
3. `pnpm typecheck`, `pnpm lint`, `pnpm build` verdes.
4. `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` zero diff.
5. Documentação atualizada (`ARCHITECTURE.md` se houver mudança arquitetural).
6. Validação manual end-to-end conforme checklist da fase.

---

## 3. Mapa geral de fases

| #   | Nome                                             | Estimativa  | Status       |
| --- | ------------------------------------------------ | ----------- | ------------ |
| 0   | Bootstrap do crm-web                             | 1-2 semanas | em andamento |
| 1   | Tela de canal Gupshup (config + status realtime) | 1-2 semanas | aguardando   |
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

### 4.3 Sprint 0.13 — Fechamento de gaps (esta sprint)

- [ ] LICENSE AGPLv3
- [ ] Deps `zustand` e `socket.io-client`
- [ ] `openapi.snapshot.json` + script `generate:api:from-snapshot`
- [ ] CI: drift detection em `lib/generated/`
- [ ] Smoke test do tipo gerado em `lib/generated.test.ts`
- [ ] CLAUDE.md raiz adaptado pro escopo frontend
- [ ] ROADMAP.md raiz adaptado pro escopo frontend (este documento)

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

- [ ] Tela de register
- [ ] Layout base Izing-like (sidebar + header + área principal)
- [ ] Páginas dummy de Atendimentos
- [ ] Telas básicas de Configurações
- [ ] Tema final do design-system aplicado (paleta refinada)
- [ ] E2E real (Playwright contra backend)

---

## 5. Fases 1–8 (fatia frontend)

> Detalhamento em sprints à medida que cada fase começa. Aqui só os entregáveis frontend principais.

### 5.1 Fase 1 — Tela de canal Gupshup

- [ ] Tela de configuração de canal
- [ ] Mascaramento de credenciais com botão "Revelar para editar"
- [ ] Card de canal com status em tempo real (socket.io-client)
- [ ] Tela básica de mensagens recebidas (validação)

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

| Fase    | Início  | Fim | Status       | Notas                                            |
| ------- | ------- | --- | ------------ | ------------------------------------------------ |
| Fase 0  | 2026-04 | —   | em andamento | Sprint 0.13 (bootstrap gap closure) em execução. |
| Fase 1  | —       | —   | aguardando   | —                                                |
| Fase 2  | —       | —   | aguardando   | —                                                |
| Fase 3a | —       | —   | aguardando   | —                                                |
| Fase 3b | —       | —   | aguardando   | —                                                |
| Fase 4  | —       | —   | aguardando   | —                                                |
| Fase 5  | —       | —   | aguardando   | Pré-req da Fase 8 backend.                       |
| Fase 6  | —       | —   | aguardando   | —                                                |
| Fase 7  | —       | —   | aguardando   | —                                                |
| Fase 8  | —       | —   | aguardando   | Requer Fase 5 backend.                           |
