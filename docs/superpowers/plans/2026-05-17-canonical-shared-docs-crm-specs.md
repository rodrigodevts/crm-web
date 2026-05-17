# Docs canônicos no crm-specs (fonte única, ponteiro) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar a duplicação manual de `ROADMAP.md`/`ARCHITECTURE.md`/`WORKFLOW.md`/`CONTRIBUTING.md` entre `crm-web` e `crm-api`, tornando o `crm-specs` a fonte única canônica e os repos de código apontando por link.

**Architecture:** 3 fases sequenciais, uma por repo (PRs independentes — não há PR cross-repo). Fase 1 cria os 4 docs canônicos reconciliados no `crm-specs` (precisa landar primeiro). Fases 2 e 3 removem as cópias de `crm-web`/`crm-api` e as substituem por ponteiros (README + stub CONTRIBUTING + CLAUDE.md re-apontado).

**Tech Stack:** Markdown, git, `gh` CLI. Sem código/testes — verificação é por `grep`/diff/manual.

**Spec:** `docs/superpowers/specs/2026-05-17-canonical-shared-docs-crm-specs-design.md` (no `crm-web`).

**Repos & paths:**

- `crm-specs` = `/home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs` (remote `git@github.com:rodrigodevts/crm-specs.git`, branch `main`, sem CI/branch-protection)
- `crm-web` = `/home/rodrigo-digigov/dev-space/digigov/digichat/crm-web` (branch protegida `main`)
- `crm-api` = `/home/rodrigo-digigov/dev-space/digigov/digichat/crm-api` (branch protegida `main`)

**Regras de branch (CLAUDE.md §4):** nunca commitar direto em `main` dos repos de código; branch a partir de `origin/main` atualizado; PR via `gh`; sem `--force`/`--no-verify`. **Não dar `git push` sem confirmação do humano** (memória `feedback_no_push_until_validated`): cada fase para no "push + PR" e pede OK.

---

## File Structure

**crm-specs (Fase 1 — criar):**

- `crm-specs/ARCHITECTURE.md` — cópia verbatim do `crm-api/ARCHITECTURE.md` (superset canônico)
- `crm-specs/ROADMAP.md` — base `crm-api/ROADMAP.md` + seção "Fatia Frontend (crm-web)" dobrada
- `crm-specs/WORKFLOW.md` — base `crm-web/WORKFLOW.md` (mais recente) + callouts por stack
- `crm-specs/CONTRIBUTING.md` — base `crm-web/CONTRIBUTING.md` + callout por stack no gerador

**crm-web (Fase 2 — remover/substituir):**

- Remove: `crm-web/ROADMAP.md`, `crm-web/ARCHITECTURE.md`, `crm-web/WORKFLOW.md`
- Substitui: `crm-web/CONTRIBUTING.md` → stub 3 linhas
- Modifica: `crm-web/README.md` (bloco "Documentação canônica"), `crm-web/CLAUDE.md` (§2 reading-list, §4.16, frase "cópia")

**crm-api (Fase 3 — remover/substituir):**

- Remove: `crm-api/ROADMAP.md`, `crm-api/ARCHITECTURE.md`, `crm-api/WORKFLOW.md`
- Substitui: `crm-api/CONTRIBUTING.md` → stub 3 linhas
- Modifica: `crm-api/README.md` (bloco "Documentação canônica"), `crm-api/CLAUDE.md` (§2 reading-list, §23, ref "seção 3"→§4)

**Pós:** atualizar memória `feedback_bundle_roadmap_sync_pr`.

---

## FASE 1 — crm-specs: criar os 4 docs canônicos

### Task 1: Branch no crm-specs

**Files:** nenhum (setup).

- [ ] **Step 1: Criar branch a partir de origin/main**

Run:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs
git fetch origin main
git switch -c docs/canonical-shared-docs origin/main
git status --porcelain && echo "(limpo se vazio)"
```

Expected: branch criada, working tree limpo.

---

### Task 2: ARCHITECTURE.md canônico (cópia verbatim do crm-api)

**Files:**

- Create: `crm-specs/ARCHITECTURE.md`

Contexto: os dois `ARCHITECTURE.md` têm estrutura de seções **idêntica**; o do `crm-api` (1131 linhas) é o superset canônico (o próprio CLAUDE.md diz que o do crm-web "é cópia da do crm-api"). O do `crm-web` (1047 linhas) está atrás (drift). Canônico = o do `crm-api` verbatim.

- [ ] **Step 1: Copiar o do crm-api como canônico**

Run:

```bash
cp /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api/ARCHITECTURE.md \
   /home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs/ARCHITECTURE.md
```

- [ ] **Step 2: Verificar que nada único do crm-web se perde**

Run:

```bash
diff /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web/ARCHITECTURE.md \
     /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api/ARCHITECTURE.md | grep '^<' | head -60
```

Inspecionar as linhas `<` (presentes só no crm-web). Esperado: são versões mais antigas de conteúdo que o crm-api já tem mais completo (drift), **não** informação única. Se aparecer algum bloco substantivo que só existe no crm-web (ex.: uma decisão frontend não refletida no crm-api), **incorporá-lo** na seção correspondente do `crm-specs/ARCHITECTURE.md` preservando a numeração de seções. Caso contrário, seguir (cópia verbatim é suficiente).

- [ ] **Step 3: Sanidade de estrutura**

Run:

```bash
grep -nE '^#{1,2} ' /home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs/ARCHITECTURE.md | head
```

Expected: contém `## 1. O produto` … `## 4. Stack técnica` (com "Backend (`crm-api`)" e "Frontend (`crm-web`)") … `## 5. Estrutura dos repositórios` — numeração intacta (refs `§4`/`§5` continuam válidas).

---

### Task 3: ROADMAP.md canônico (base crm-api + fatia frontend dobrada)

**Files:**

- Create: `crm-specs/ROADMAP.md`

Contexto: `crm-api/ROADMAP.md` (921 linhas) já é o plano canônico do produto e seu §6 é "documento canônico de planejamento da Fase 1". `crm-web/ROADMAP.md` (303 linhas) é a fatia frontend com detalhe que **não** existe no do crm-api: §2 (critério "fase pronta" frontend), §5.1 (sprints 1.4 Fase B / 1.4 Fase C / 1.6 Fase B / 1.8 Fase B granulares com estado `[x]`), §6 (tabela de rastreamento frontend), §11 (limitação `pnpm build` local). O merge é **aditivo** — nada do estado já registrado pode se perder.

- [ ] **Step 1: Copiar o do crm-api como base canônica**

Run:

```bash
cp /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api/ROADMAP.md \
   /home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs/ROADMAP.md
```

- [ ] **Step 2: Dobrar a fatia frontend como seção explícita**

Editar `crm-specs/ROADMAP.md`: adicionar **uma seção de topo nova** ao final do documento (antes de qualquer apêndice, ou como última `##`), com este cabeçalho exato:

```markdown
## Fatia Frontend (`crm-web`)

> Detalhe frontend pareado com o plano acima. O plano de fases canônico é o deste documento; esta seção registra o estado e as particularidades da fatia `crm-web`.
```

Sob essa seção, **colar o conteúdo** das seguintes seções do arquivo `/home/rodrigo-digigov/dev-space/digigov/digichat/crm-web/ROADMAP.md`, preservando texto e checkboxes `[x]` exatamente como estão:

- O critério "fase pronta" frontend (a lista numerada de "## 2. Critério de 'fase pronta' (frontend)").
- O detalhe de sprints da "### 5.1 Fase 1 — Tela de canal Gupshup" (incluindo as sub-sprints 1.4 Fase B, 1.4 Fase C, 1.6 Fase B, 1.8 Fase B com seus checkboxes e a nota cross-repo §6.4 item 10).
- A tabela de rastreamento frontend (linha "Fase 1 ... em andamento ...").
- A subseção de limitação conhecida do `pnpm build` local (a "§11" do crm-web/ROADMAP.md, com os links das issues do Next.js).

Ajustar apenas referências internas que apontem para "raiz crm-web" → texto neutro (ex.: "ver `CLAUDE.md` do `crm-web` §11" continua válido pois §11 vira parte desta seção; manter o texto da limitação como está).

- [ ] **Step 3: Revisão obrigatória de zero-perda**

Run:

```bash
echo "--- seções do crm-web/ROADMAP que precisam estar refletidas no canônico ---"
grep -nE '^#{2,4} |Sprint 1\.|§6\.4|pnpm build' /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web/ROADMAP.md
echo "--- presença no canônico ---"
grep -nE 'Fatia Frontend|Sprint 1\.8 Fase B|§6\.4 item 10|pnpm build' /home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs/ROADMAP.md
```

Conferir manualmente: cada sprint frontend entregue (1.4b, 1.4c, 1.6b, 1.8b) e seu estado `[x]`, a nota "§6.4 item 10 fechado", e a limitação `pnpm build` aparecem no canônico. Se faltar algo, voltar ao Step 2 e incluir. **Não prosseguir com perda de informação.**

---

### Task 4: WORKFLOW.md canônico (base crm-web + callouts por stack)

**Files:**

- Create: `crm-specs/WORKFLOW.md`

Contexto: `crm-web/WORKFLOW.md` é a versão mais recente (recebeu o update do PR #42). Divergências reais vs `crm-api/WORKFLOW.md` (do `diff`): comandos de verificação por stack, `pnpm test:e2e`, a linha de fatiamento de sprint, e citações de "CLAUDE.md §4 regra 16/23/24" (numeração que difere por repo).

- [ ] **Step 1: Copiar o do crm-web como base**

Run:

```bash
cp /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web/WORKFLOW.md \
   /home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs/WORKFLOW.md
```

- [ ] **Step 2: Substituir o bloco de verificação local por callout por stack**

Em `crm-specs/WORKFLOW.md`, localizar o bloco que hoje diz (versão crm-web):

```
Antes de declarar pronto, **rodar comandos** localmente:

- `pnpm test` — todos passam
- `pnpm test:e2e` — todos passam (quando configurado)
- `pnpm lint` — sem erro
- `pnpm typecheck` — sem erro
- `pnpm format:check` — sem erro

`pnpm build` fica a cargo do CI (limitação conhecida — ver `CLAUDE.md` §11).
```

Substituir por:

```
Antes de declarar pronto, **rodar comandos** localmente:

- `pnpm test` — todos passam
- `pnpm lint` — sem erro
- `pnpm typecheck` — sem erro

> **Frontend (`crm-web`):** também `pnpm format:check`. `pnpm build` fica a cargo do CI (limitação conhecida — ver `CLAUDE.md` do `crm-web` §11). `pnpm test:e2e` quando estiver configurado.
> **Backend (`crm-api`):** também `pnpm build` (compila) e `pnpm test:e2e` (todos passam).
```

Fazer o ajuste equivalente no bloco de comandos em "fence" (o que lista `pnpm test` / `pnpm lint` / etc. num bloco ` ``` `): deixar os comuns no fence e mover os stack-específicos (`pnpm format:check`, `pnpm build`, `pnpm test:e2e`) para os callouts acima.

- [ ] **Step 3: Garantir a linha de fatiamento de sprint + referência por nome**

Em `crm-specs/WORKFLOW.md`, na subseção que lista o que acontece quando "uma sprint do ROADMAP cai aqui", garantir que existe a linha (presente só no crm-api hoje):

```
- **Sprint do ROADMAP que cai aqui é fatiada em sub-sprints (`X.Ya`, `X.Yb`, …) antes do brainstorm**, registrando o fatiamento no ROADMAP canônico no mesmo ciclo. Vide a regra de fatiamento de sprints densas no `CLAUDE.md` do repo.
```

E substituir **todas** as ocorrências de "CLAUDE.md §4 regra 16", "regra 23", "regra 24", "tabela §17" por referência **por tópico**:

- "regra 16"/"regra 23" → "a regra de ROADMAP-no-mesmo-ciclo do `CLAUDE.md` do repo"
- "regra 24" → "a regra de fatiamento de sprints densas do `CLAUDE.md` do repo"
- "tabela §17" → "a tabela de rastreamento do `ROADMAP.md` canônico"

Run (verificar que não sobrou número):

```bash
grep -nE 'regra (16|23|24)|§17|§4 regra' /home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs/WORKFLOW.md || echo "OK — sem refs numéricas a regra do CLAUDE"
```

Expected: `OK — sem refs numéricas...`

- [ ] **Step 4: Atualizar "Final de sessão" para o fluxo cross-repo**

Em `crm-specs/WORKFLOW.md`, na seção "### Final de sessão", substituir a linha sobre atualizar o ROADMAP por:

```
- **Atualize o `ROADMAP.md` canônico (`crm-specs`) na MESMA sessão da sprint** (checkboxes com data/PR, tabela de rastreamento, versão e data no cabeçalho). Como `crm-specs` não tem CI/branch-protection, é commit/push direto na `main` do `crm-specs`; cite o SHA/link na descrição do PR de código. Sem PR de "atualização de doc" separado e posterior. Vide a regra de ROADMAP-no-mesmo-ciclo do `CLAUDE.md` do repo.
```

---

### Task 5: CONTRIBUTING.md canônico (base crm-web + callout no gerador)

**Files:**

- Create: `crm-specs/CONTRIBUTING.md`

- [ ] **Step 1: Copiar base e ajustar fim-de-arquivo**

Run:

```bash
cp /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web/CONTRIBUTING.md \
   /home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs/CONTRIBUTING.md
printf '\n' >> /home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs/CONTRIBUTING.md
```

(O `printf` corrige o "No newline at end of file" que o crm-web tem.)

- [ ] **Step 2: Callout por stack no gerador de boilerplate**

Em `crm-specs/CONTRIBUTING.md`, localizar a linha:

```
Use `pnpm nest g feature <nome>` (gerador customizado da Fase 0) para criar estrutura.
```

Substituir por:

```
Para criar a estrutura de uma feature:

> **Frontend (`crm-web`):** `pnpm nest g feature <nome>` (gerador customizado da Fase 0).
> **Backend (`crm-api`):** `pnpm g:feature <nome>` (gerador local em `schematics/feature/`) — evita drift do padrão de 3 camadas e atualiza `app.module.ts` automaticamente.
```

- [ ] **Step 3: Reconciliar drift menor restante**

Run:

```bash
diff /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api/CONTRIBUTING.md \
     /home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs/CONTRIBUTING.md
```

Inspecionar: os únicos `>`/`<` restantes devem ser linhas em branco/espaçamento. Não há outro conteúdo substantivo divergente (confirmado no recon). Nenhuma ação se só espaçamento.

---

### Task 6: Commit + push + PR do crm-specs

**Files:** nenhum (entrega).

- [ ] **Step 1: Commit**

Run:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs
git add ARCHITECTURE.md ROADMAP.md WORKFLOW.md CONTRIBUTING.md
git commit -m "docs: docs canônicos do produto (ARCHITECTURE/ROADMAP/WORKFLOW/CONTRIBUTING)

Fonte única dos docs antes duplicados em crm-web e crm-api. ROADMAP =
plano canônico (crm-api) + fatia frontend dobrada. WORKFLOW/CONTRIBUTING
com callouts por stack. Pareado com PRs de remoção em crm-web/crm-api."
git log --oneline -1
```

- [ ] **Step 2: PARAR — pedir confirmação do humano antes do push**

Reportar ao humano: branch `docs/canonical-shared-docs` no `crm-specs` pronta, resumo do diff. **Não dar push sem OK** (memória `feedback_no_push_until_validated`).

- [ ] **Step 3: Após OK — push + PR**

Run (só após confirmação):

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs
git push -u origin docs/canonical-shared-docs
gh pr create --base main --head docs/canonical-shared-docs \
  --title "docs: docs canônicos do produto (fonte única)" \
  --body "Cria ARCHITECTURE/ROADMAP/WORKFLOW/CONTRIBUTING canônicos. crm-web e crm-api passarão a apontar pra cá (PRs pareados a seguir). Spec/plan em crm-web/docs/superpowers/."
```

**Esta PR deve ser mergeada antes das Fases 2 e 3** (senão os ponteiros nascem quebrados). Confirmar merge com o humano antes de seguir.

---

## FASE 2 — crm-web: remover cópias, apontar por ponteiro

> Pré-condição: PR da Fase 1 mergeada no `crm-specs` (docs canônicos vivos em `crm-specs/main`).

### Task 7: Branch + remoção dos 3 .md no crm-web

**Files:**

- Delete: `crm-web/ROADMAP.md`, `crm-web/ARCHITECTURE.md`, `crm-web/WORKFLOW.md`

- [ ] **Step 1: Branch a partir de origin/main**

Run:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web
git fetch origin main
git switch -c docs/point-to-canonical-specs origin/main
```

- [ ] **Step 2: Remover os 3 arquivos duplicados**

Run:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web
git rm ROADMAP.md ARCHITECTURE.md WORKFLOW.md
```

Expected: 3 arquivos staged para remoção.

---

### Task 8: Stub CONTRIBUTING.md + bloco README no crm-web

**Files:**

- Modify (substituir conteúdo): `crm-web/CONTRIBUTING.md`
- Modify: `crm-web/README.md`

- [ ] **Step 1: Substituir CONTRIBUTING.md por stub**

Sobrescrever `crm-web/CONTRIBUTING.md` com exatamente:

```markdown
# Contribuindo

As diretrizes de contribuição são **canônicas no repositório `crm-specs`**:

- https://github.com/rodrigodevts/crm-specs/blob/main/CONTRIBUTING.md

No setup de desenvolvimento o `crm-specs` é clonado como sibling (`../crm-specs/CONTRIBUTING.md`).
```

- [ ] **Step 2: Adicionar bloco "Documentação canônica" no README**

Em `crm-web/README.md`, adicionar (logo após o título/descrição principal, antes da primeira seção de setup) o bloco:

```markdown
## Documentação canônica

Plano, arquitetura, workflow e contribuição vivem no repositório de docs `crm-specs` (fonte única — não duplicar aqui):

- [ROADMAP](https://github.com/rodrigodevts/crm-specs/blob/main/ROADMAP.md)
- [ARCHITECTURE](https://github.com/rodrigodevts/crm-specs/blob/main/ARCHITECTURE.md)
- [WORKFLOW](https://github.com/rodrigodevts/crm-specs/blob/main/WORKFLOW.md)
- [CONTRIBUTING](https://github.com/rodrigodevts/crm-specs/blob/main/CONTRIBUTING.md)

No setup de dev o `crm-specs` é clonado como sibling, então localmente: `../crm-specs/<arquivo>.md`.
```

---

### Task 9: Re-apontar crm-web/CLAUDE.md (§2, §4.16, frase "cópia")

**Files:**

- Modify: `crm-web/CLAUDE.md`

- [ ] **Step 1: Reading-list §2**

Em `crm-web/CLAUDE.md`, substituir as 4 linhas atuais da lista §2:

```
2. **`ROADMAP.md`** raiz crm-web — confirme em qual fase/sprint estamos
3. **`ARCHITECTURE.md`** raiz crm-web — fundação técnica do projeto inteiro (cópia da do crm-api, serve como referência canônica)
4. **`design-system.md`** raiz crm-web — cores, tipografia, espaçamento, componentes
5. **`WORKFLOW.md`** raiz crm-web — workflow Superpowers
```

por:

```
2. **`../crm-specs/ROADMAP.md`** (canônico) — confirme em qual fase/sprint estamos
3. **`../crm-specs/ARCHITECTURE.md`** (canônico) — fundação técnica do projeto inteiro
4. **`design-system.md`** raiz crm-web — cores, tipografia, espaçamento, componentes
5. **`../crm-specs/WORKFLOW.md`** (canônico) — workflow Superpowers
```

- [ ] **Step 2: Reescrever a regra §4.16 para o fluxo cross-repo**

Em `crm-web/CLAUDE.md`, localizar o bloco da regra 16 ("### ROADMAP atualizado na mesma PR" + item `16.` + sub-bullets) e substituí-lo por:

```markdown
### ROADMAP atualizado no mesmo ciclo (canônico em crm-specs)

16. **Toda PR que entrega (ou conclui parcialmente) uma sprint atualiza o `ROADMAP.md` canônico em `../crm-specs` na MESMA sessão.** Sem deferir, sem PR de "atualização de doc" depois.
    - Marcar checkboxes concluídos (`[x]`) com data e número da PR.
    - Atualizar a tabela de rastreamento (status, notas) e a versão/data do cabeçalho.
    - Como `crm-specs` não tem CI/branch-protection: commit/push direto na `main` do `crm-specs`; cite o SHA/link desse commit na descrição do PR de código.
```

- [ ] **Step 3: Remover qualquer "cópia da do crm-api" remanescente**

Run:

```bash
grep -n "cópia da do crm-api\|raiz crm-web.*ROADMAP\|raiz crm-web.*ARCHITECTURE\|raiz crm-web.*WORKFLOW" /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web/CLAUDE.md || echo "OK — sem refs antigas"
```

Expected: `OK — sem refs antigas` (se aparecer algo, ajustar o texto remanescente para apontar `../crm-specs/...`).

---

### Task 10: Verificação + commit + PR do crm-web

**Files:** nenhum (verificação/entrega).

- [ ] **Step 1: Sem refs órfãs aos arquivos removidos**

Run:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web
grep -rnE '\b(ROADMAP|ARCHITECTURE|WORKFLOW)\.md' \
  --include='*.md' --include='*.ts' --include='*.json' --include='*.yml' --include='*.yaml' \
  . | grep -v '^\./docs/superpowers/' | grep -v 'crm-specs' | grep -v 'node_modules' || echo "OK — nenhuma ref órfã"
```

Expected: `OK — nenhuma ref órfã`. Qualquer ref restante (fora de `docs/superpowers/`) deve apontar para `../crm-specs/...` ou URL do crm-specs — se apontar para arquivo-raiz removido, corrigir.

- [ ] **Step 2: CI não depende dos .md (confirmação)**

Run:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web
grep -rn 'ROADMAP\|ARCHITECTURE\|WORKFLOW' .github package.json 2>/dev/null || echo "OK — CI/package não referencia"
```

Expected: `OK — CI/package não referencia`.

- [ ] **Step 3: Commit**

Run:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web
git add -A
git commit -m "docs: aponta para docs canônicos no crm-specs (remove cópias locais)

Remove ROADMAP/ARCHITECTURE/WORKFLOW (agora canônicos em crm-specs);
CONTRIBUTING vira stub-ponteiro; README ganha bloco de docs canônica;
CLAUDE.md §2/§4.16 re-apontados para ../crm-specs. Pareado com crm-specs."
git log --oneline -1
```

- [ ] **Step 4: PARAR — confirmação do humano antes do push**

Reportar diff/resumo. **Não push sem OK.** Após OK:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web
git push -u origin docs/point-to-canonical-specs
gh pr create --base main --head docs/point-to-canonical-specs \
  --title "docs: aponta para docs canônicos no crm-specs" \
  --body "Remove as cópias de ROADMAP/ARCHITECTURE/WORKFLOW; CONTRIBUTING vira stub; README+CLAUDE.md apontam para o crm-specs (canônico). Pareado com o PR do crm-specs (já mergeado) e o do crm-api."
```

---

## FASE 3 — crm-api: remover cópias, apontar por ponteiro

> Pré-condição: PR da Fase 1 mergeada no `crm-specs`.

### Task 11: Branch + remoção dos 3 .md no crm-api

**Files:**

- Delete: `crm-api/ROADMAP.md`, `crm-api/ARCHITECTURE.md`, `crm-api/WORKFLOW.md`

- [ ] **Step 1: Branch a partir de origin/main**

Run:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api
git fetch origin main
git switch -c docs/point-to-canonical-specs origin/main
```

- [ ] **Step 2: Remover os 3 arquivos duplicados**

Run:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api
git rm ROADMAP.md ARCHITECTURE.md WORKFLOW.md
```

---

### Task 12: Stub CONTRIBUTING.md + bloco README no crm-api

**Files:**

- Modify (substituir conteúdo): `crm-api/CONTRIBUTING.md`
- Modify: `crm-api/README.md`

- [ ] **Step 1: Substituir CONTRIBUTING.md por stub**

Sobrescrever `crm-api/CONTRIBUTING.md` com exatamente:

```markdown
# Contribuindo

As diretrizes de contribuição são **canônicas no repositório `crm-specs`**:

- https://github.com/rodrigodevts/crm-specs/blob/main/CONTRIBUTING.md

No setup de desenvolvimento o `crm-specs` é clonado como sibling (`../crm-specs/CONTRIBUTING.md`).
```

- [ ] **Step 2: Adicionar bloco "Documentação canônica" no README**

Em `crm-api/README.md`, adicionar (logo após o título/descrição, antes da primeira seção de setup) exatamente o mesmo bloco da Task 8 Step 2:

```markdown
## Documentação canônica

Plano, arquitetura, workflow e contribuição vivem no repositório de docs `crm-specs` (fonte única — não duplicar aqui):

- [ROADMAP](https://github.com/rodrigodevts/crm-specs/blob/main/ROADMAP.md)
- [ARCHITECTURE](https://github.com/rodrigodevts/crm-specs/blob/main/ARCHITECTURE.md)
- [WORKFLOW](https://github.com/rodrigodevts/crm-specs/blob/main/WORKFLOW.md)
- [CONTRIBUTING](https://github.com/rodrigodevts/crm-specs/blob/main/CONTRIBUTING.md)

No setup de dev o `crm-specs` é clonado como sibling, então localmente: `../crm-specs/<arquivo>.md`.
```

---

### Task 13: Re-apontar crm-api/CLAUDE.md (§2, §23, ref "seção 3"→§4)

**Files:**

- Modify: `crm-api/CLAUDE.md`

- [ ] **Step 1: Reading-list §2**

Em `crm-api/CLAUDE.md`, substituir as 3 linhas atuais da lista §2:

```
2. **`ROADMAP.md`** — confirme em qual fase estamos. NUNCA implemente algo de fase futura sem autorização explícita.
3. **`WORKFLOW.md`** — como trabalhamos com Superpowers
4. **`ARCHITECTURE.md`** — fundação técnica do projeto
```

por:

```
2. **`../crm-specs/ROADMAP.md`** (canônico) — confirme em qual fase estamos. NUNCA implemente algo de fase futura sem autorização explícita.
3. **`../crm-specs/WORKFLOW.md`** (canônico) — como trabalhamos com Superpowers
4. **`../crm-specs/ARCHITECTURE.md`** (canônico) — fundação técnica do projeto
```

- [ ] **Step 2: Reescrever a regra §23 para o fluxo cross-repo**

Em `crm-api/CLAUDE.md`, localizar o bloco da regra 23 ("### ROADMAP atualizado na mesma PR" + item `23.` + sub-bullets) e substituí-lo por:

```markdown
### ROADMAP atualizado no mesmo ciclo (canônico em crm-specs)

23. **Toda PR que entrega (ou conclui parcialmente) uma sprint atualiza o `ROADMAP.md` canônico em `../crm-specs` na MESMA sessão.** Sem deferir, sem PR de "atualização de doc" depois.
    - Marcar checkboxes concluídos (`[x]`) com data e número da PR.
    - Atualizar a tabela de rastreamento (status, notas) e a versão/data do cabeçalho.
    - Como `crm-specs` não tem CI/branch-protection: commit/push direto na `main` do `crm-specs`; cite o SHA/link desse commit na descrição do PR de código.
```

- [ ] **Step 3: Corrigir a ref stale "ARCHITECTURE.md seção 3"→§4**

Em `crm-api/CLAUDE.md`, localizar a linha sobre libs aprovadas:

```
4. **Adicionar lib não-aprovada.** Use só o que está em `ARCHITECTURE.md` seção 3.
```

Substituir por:

```
4. **Adicionar lib não-aprovada.** Use só o que está em `../crm-specs/ARCHITECTURE.md` §4 (Stack técnica).
```

Run (verificar nenhuma ref stale restante):

```bash
grep -nE 'ARCHITECTURE\.md.*(seção 3|seçao 3)|`ROADMAP\.md`|`WORKFLOW\.md`|`ARCHITECTURE\.md`' /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api/CLAUDE.md | grep -v 'crm-specs' || echo "OK — refs re-apontadas"
```

Expected: `OK — refs re-apontadas` (qualquer match restante sem `crm-specs` deve ser corrigido para `../crm-specs/...`).

---

### Task 14: Verificação + commit + PR do crm-api

**Files:** nenhum.

- [ ] **Step 1: Sem refs órfãs**

Run:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api
grep -rnE '\b(ROADMAP|ARCHITECTURE|WORKFLOW)\.md' \
  --include='*.md' --include='*.ts' --include='*.json' --include='*.yml' --include='*.yaml' \
  . | grep -v 'crm-specs' | grep -v 'node_modules' | grep -v '/docs/' || echo "OK — nenhuma ref órfã"
```

Expected: `OK — nenhuma ref órfã` (refs restantes apontam `../crm-specs/...` ou URL).

- [ ] **Step 2: CI/package não referencia**

Run:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api
grep -rn 'ROADMAP\|ARCHITECTURE\|WORKFLOW' .github package.json 2>/dev/null || echo "OK — CI/package não referencia"
```

Expected: `OK`.

- [ ] **Step 3: Commit + PARAR p/ confirmação + push/PR após OK**

Run:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api
git add -A
git commit -m "docs: aponta para docs canônicos no crm-specs (remove cópias locais)

Remove ROADMAP/ARCHITECTURE/WORKFLOW; CONTRIBUTING vira stub-ponteiro;
README+CLAUDE.md (§2, regra 23, ref de libs) re-apontados para ../crm-specs."
git log --oneline -1
```

Reportar diff. **Não push sem OK.** Após OK:

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-api
git push -u origin docs/point-to-canonical-specs
gh pr create --base main --head docs/point-to-canonical-specs \
  --title "docs: aponta para docs canônicos no crm-specs" \
  --body "Simétrico ao PR do crm-web. Remove cópias; aponta para o crm-specs canônico (PR já mergeado)."
```

---

## FASE 4 — Memória

### Task 15: Atualizar memória do fluxo de ROADMAP

**Files:**

- Modify: `/home/rodrigo-digigov/.claude/projects/-home-rodrigo-digigov-dev-space-digigov-digichat-crm-web/memory/feedback_bundle_roadmap_sync_pr.md`
- Modify: `.../memory/MEMORY.md` (linha-ponteiro)

- [ ] **Step 1: Reescrever a memória para o fluxo cross-repo**

Atualizar `feedback_bundle_roadmap_sync_pr.md`: o ROADMAP agora é canônico em `crm-specs` (não mais intra-repo). Regra vigente: ao entregar/concluir parcialmente uma sprint, atualizar `crm-specs/ROADMAP.md` na MESMA sessão (commit/push direto na `main` do `crm-specs`, sem CI/branch-protection), citando o SHA na descrição do PR de código; sem PR de doc separado. Manter o link `[[feedback_no_push_until_validated]]`. Ajustar o `description:` do frontmatter e a linha correspondente em `MEMORY.md` para refletir "ROADMAP canônico em crm-specs, atualizado no mesmo ciclo da sprint".

- [ ] **Step 2: Sem commit de memória** (memória é fora de git do projeto — apenas salvar o arquivo).

---

## Notas de execução

- **Sem TDD/testes** — é docs/processo. "Verificação" = `grep`/`diff`/revisão manual conforme cada Task.
- **Ordem obrigatória:** Fase 1 mergeada antes de Fases 2 e 3 (senão ponteiros quebram). Fases 2 e 3 são independentes entre si (podem ir em qualquer ordem após a 1).
- **3 PRs separados** (um por repo); cada um referencia os outros na descrição.
- **Nunca push sem confirmação do humano** (memória `feedback_no_push_until_validated`): cada fase para antes do push.
- **Não editar `crm-specs` via worktree do crm-web** — `crm-specs` é repo próprio; operar no path `/home/rodrigo-digigov/dev-space/digigov/digichat/crm-specs`.
- Reviewers/subagentes: **read-only no git** (memória `feedback_review_subagent_readonly_git`) — só `git show/diff/log`, nunca `stash/checkout/reset`.
