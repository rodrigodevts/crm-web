# Docs canônicos no crm-specs (fonte única, ponteiro) — Design

> Resolve a dor de manter `ROADMAP.md`/`ARCHITECTURE.md`/`WORKFLOW.md`/`CONTRIBUTING.md`
> sincronizados manualmente entre os repos `crm-web` e `crm-api`.
>
> Spec escrito no `crm-web` (repo onde a sessão roda). A execução toca **3
> repos** (`crm-specs`, `crm-web`, `crm-api`) em PRs sequenciais.

## Problema

Quatro docs vivem duplicados em `crm-web` e `crm-api` e divergem na prática:

| Arquivo           | web (linhas) | api (linhas) | Divergência | Natureza                                     |
| ----------------- | ------------ | ------------ | ----------- | -------------------------------------------- |
| `WORKFLOW.md`     | 409          | 407          | ~16 linhas  | quase idêntico (drift)                       |
| `CONTRIBUTING.md` | 370          | 375          | ~8 linhas   | quase idêntico (drift)                       |
| `ARCHITECTURE.md` | 1047         | 1131         | ~162 linhas | fundação comum + stack por repo              |
| `ROADMAP.md`      | 303          | 921          | grande      | api é o plano canônico; web é fatia frontend |

Manter os dois lados em sincronia a cada sprint é trabalho manual recorrente e
fonte de drift.

## Decisões (do brainstorm)

1. **Fonte única canônica** — cada doc compartilhado existe em UM lugar só;
   `crm-web`/`crm-api` deixam de ter cópia.
2. **Repos separados é fixo** — `crm-web`, `crm-api`, `crm-specs` continuam 3
   repos GitHub independentes (AGPLv3, CI próprio). Sem monorepo.
3. **Mecanismo: ponteiro/link** — sem submodule, sem subtree. Os repos de
   código removem os `.md` e apontam por link. (Justificativa: `crm-specs` já
   é sibling sempre clonado e `additionalDirectory` do agente; submodule
   trocaria "copiar conteúdo" por "commitar bump de SHA" a cada sprint —
   continuaria sincronização manual.)
4. **Lar canônico: `crm-specs`** — repo de docs/specs que já existe, já
   clonado como sibling, já referenciado read-only como canônico.
5. **Conjunto de arquivos**: `ROADMAP.md`, `ARCHITECTURE.md`, `WORKFLOW.md`,
   `CONTRIBUTING.md`. **Fora de escopo**: `CLAUDE.md` (por-repo,
   intencionalmente diferente front/back), `README.md` (por-repo),
   `crm-web/design-system.md` (só web).
6. **§4.16 cross-repo**: ao fechar uma sprint, atualizar o ROADMAP canônico
   no `crm-specs` na MESMA sessão (sem deferir); commit/push direto na `main`
   do `crm-specs` (sem CI/branch-protection lá); o SHA/link é citado na
   descrição do PR de código.
7. **CONTRIBUTING.md**: stub de ~3 linhas nos repos de código (preserva o
   link automático do GitHub), conteúdo real só no `crm-specs`.
8. **WORKFLOW.md / CONTRIBUTING.md per-stack** (descoberto no planejamento):
   ~10 linhas divergem por motivo legítimo de stack (frontend:
   `pnpm format:check`, build cai pro CI §11; backend: `pnpm build`,
   `pnpm test:e2e`, gerador `pnpm g:feature`). Doc canônico **único** com
   **callouts explícitos por stack** onde o comando difere — não generaliza,
   não mantém por-repo.
9. **ARCHITECTURE.md é estruturalmente idêntico** (descoberto no
   planejamento): mesmas seções §1–§6 em ambos, §4 já tem "Backend (crm-api)"
   **e** "Frontend (crm-web)", §5.1/5.2/5.3 cobre os 3 repos. Não é
   "fundação + stack por repo" — é doc totalmente compartilhado que driftou.
   Canônico = o do `crm-api` (superset, 1131 linhas; CLAUDE.md já diz que o do
   crm-web "é cópia da do crm-api") + reconciliar drift. **Âncoras de seção
   preservadas automaticamente** → refs `§4`/`§N` do CLAUDE.md continuam
   resolvendo; só o caminho do arquivo muda. Sem doc de "mapeamento de
   seções".

## Arquitetura da solução

### A. Lar canônico e conjunto de arquivos

`crm-specs/` raiz (peers de `STRATEGY.md`) passa a hospedar a única cópia de
`ROADMAP.md`, `ARCHITECTURE.md`, `WORKFLOW.md`, `CONTRIBUTING.md`.

### B. Reconciliação de conteúdo (antes de virar fonte única — aditivo, sem perda)

- **ROADMAP** (merge mais pesado): base = ROADMAP canônico do `crm-api` (plano
  completo, 921 linhas). Dobrar dentro dele a fatia frontend que só existe no
  `crm-web/ROADMAP.md` — sprints 1.4b/1.4c/1.6b/1.8b granulares, §11
  (limitação `pnpm build` local), critério "fase pronta" frontend — como
  **seção frontend explícita**. Resultado: um ROADMAP único do produto
  (back + fatia front) sem perder o estado já registrado (ex.: §6.4 item 10
  fechado pela Sprint 1.8 Fase B).
- **ARCHITECTURE**: estruturalmente idêntico nos dois (mesmas seções,
  §4 já com Backend+Frontend, §5 com os 3 repos). Canônico = **copiar
  `crm-api/ARCHITECTURE.md` verbatim** (superset/canônico por definição) e
  reconciliar os ~162 linhas de drift de conteúdo, mantendo a estrutura de
  seções intacta. Âncoras (`§4`, etc.) ficam idênticas → nenhum
  re-apontamento de número de seção necessário (só o caminho do arquivo muda
  no passo D). Sem doc de mapeamento.
- **WORKFLOW / CONTRIBUTING**: doc canônico único. As ~10 linhas
  legitimamente por-stack viram **callouts explícitos** no formato:
  > **Frontend (`crm-web`):** `pnpm format:check`; `pnpm build` cai pro CI
  > (limitação §11). **Backend (`crm-api`):** `pnpm build` compila;
  > `pnpm test:e2e`; gerador `pnpm g:feature`.
  > Onde o `WORKFLOW.md` canônico cita uma regra do `CLAUDE.md`, **referenciar
  > por tópico/nome** ("a regra de ROADMAP-no-mesmo-ciclo do `CLAUDE.md` do
  > repo"), nunca por número — a numeração do `CLAUDE.md` difere por repo
  > (§4.16 no crm-web, §23 no crm-api) e continua por-repo. Demais hunks de
  > drift: adotar a versão mais atual (base = versão do `crm-web`, que recebeu
  > o update mais recente no PR #42).

### C. Consumo nos repos de código (ponteiro, sem cópia)

- `crm-web` e `crm-api`: **remover** `ROADMAP.md`, `ARCHITECTURE.md`,
  `WORKFLOW.md` da raiz.
- `CONTRIBUTING.md`: substituir por **stub** (~3 linhas) em cada repo de
  código — texto fixo apontando para `crm-specs/CONTRIBUTING.md` + URL pública
  do GitHub. Não é cópia de conteúdo; é ponteiro que o GitHub reconhece.
- `README.md` de cada repo de código: adicionar bloco **"Documentação
  canônica"** com links para os 4 arquivos no repo público `crm-specs`
  (`https://github.com/rodrigodevts/crm-specs/blob/main/<arquivo>`) + nota de
  que no setup de dev o `crm-specs` é clonado como sibling.

### D. CLAUDE.md dos dois repos (re-apontar, não duplicar)

- `crm-web/CLAUDE.md §2` e `crm-api/CLAUDE.md §2` (reading-list): trocar as
  entradas "ROADMAP/ARCHITECTURE/WORKFLOW raiz" por
  `../crm-specs/ROADMAP.md`, `../crm-specs/ARCHITECTURE.md`,
  `../crm-specs/WORKFLOW.md` (caminho relativo sibling; é `additionalDirectory`
  do agente).
- Refs internas a seções do `ARCHITECTURE.md` **não mudam de número** (a
  estrutura é idêntica e preservada). `crm-web/CLAUDE.md` "ARCHITECTURE.md §4
  (Frontend)" continua válido. **Exceção:** `crm-api/CLAUDE.md` cita
  "ARCHITECTURE.md seção 3" para libs aprovadas, mas libs/stack é §4 (§3 é
  "Arquitetura interna") — corrigir essa ref stale para §4 ao tocar a linha
  (in-escopo, é a mesma linha do re-apontamento de caminho).
- Remover do `crm-web/CLAUDE.md` a frase "(cópia da do crm-api, serve como
  referência canônica)" — deixa de ser cópia.

### E. Rework da regra de "ROADMAP junto com a sprint"

`crm-web/CLAUDE.md §4.16` e `crm-api/CLAUDE.md §23` (mesma regra, numeração
diferente) e a seção "Final de sessão" do `WORKFLOW.md` canônico passam a
dizer, em texto equivalente:

> Ao entregar (ou concluir parcialmente) uma sprint, atualizar o ROADMAP
> canônico em `crm-specs` **na mesma sessão** (sem deferir para depois). Como
> `crm-specs` não tem CI nem branch-protection, é commit/push direto na `main`
> do `crm-specs`. O SHA/link desse commit é citado na descrição do PR de
> código (`crm-web`/`crm-api`). Não abrir "PR de atualização de doc" separado
> e posterior.

Atualizar a memória `feedback_bundle_roadmap_sync_pr` para refletir o fluxo
cross-repo (substitui o "§4.16 mesmo PR" que valia quando ROADMAP era
intra-repo).

### F. Ordem de execução — 3 PRs sequenciais

Não existe PR cross-repo; cada repo tem seu PR, nesta ordem:

1. **`crm-specs`** — criar os 4 docs canônicos reconciliados (branch + PR;
   sem CI, review leve). **Tem de landar primeiro** para os ponteiros não
   nascerem quebrados.
2. **`crm-web`** — remover os 3 `.md`, criar stub `CONTRIBUTING.md`, bloco
   README, atualizar `CLAUDE.md` §2/§4.16/refs. PR próprio, referencia o PR do
   crm-specs.
3. **`crm-api`** — simétrico: remover os 3 `.md`, stub `CONTRIBUTING.md`,
   bloco README, atualizar `CLAUDE.md` §2/§23/refs. PR próprio, referencia os
   outros.

### G. Riscos e mitigações

- **Clone isolado de `crm-web`/`crm-api`** (contribuidor externo) não tem mais
  ROADMAP/ARCHITECTURE físicos → bloco README com URL pública do `crm-specs`
  (AGPLv3, acessível). Aceitável para projeto solo OSS.
- **Perda de conteúdo no merge do ROADMAP** → merge aditivo (base crm-api +
  fatia front preservada); revisável no diff do PR do `crm-specs` ANTES de
  remover dos outros repos.
- **`crm-specs` sem CI/branch-protection** → ROADMAP vira alvo de commit
  direto; risco baixo (docs) e é o que torna o §4.16 cross-repo leve.
- **Refs `ARCHITECTURE.md §N`** → estrutura de seções idêntica e preservada
  no merge; números não mudam. Único ajuste: corrigir a ref stale "seção 3"→
  "§4" no `crm-api/CLAUDE.md` (passo D).

## Verificação (sem testes — é docs/processo)

Por evidência, manual:

- `grep -rn "ROADMAP.md\|ARCHITECTURE.md\|WORKFLOW.md"` em `crm-web` e
  `crm-api` (fora de `CLAUDE.md`/`README.md`/docs de spec) → zero refs órfãs a
  arquivos removidos; refs restantes apontam para `../crm-specs/...` ou URL.
- Links do bloco README resolvem (URL pública do crm-specs).
- `../crm-specs/<arquivo>.md` existe e abre a partir de cada repo de código.
- CI de `crm-web` e `crm-api` segue verde — confirmado que **nenhum
  script/CI/package.json referencia esses `.md`** (só docs + CLAUDE.md).
- Diff do ROADMAP unificado no PR do `crm-specs` revisado para zero perda de
  informação (estado de sprints entregues preservado).

## Fora de escopo

- Migração para monorepo.
- Submodule/subtree.
- `CLAUDE.md`, `README.md` (conteúdo principal), `design-system.md`.
- Automação/CI no `crm-specs` (continua sem CI; commit direto na `main`).
