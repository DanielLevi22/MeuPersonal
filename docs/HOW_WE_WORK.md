# Como Trabalhamos — MeuPersonal

> Documento único de referência do fluxo de desenvolvimento.
> Se tiver dúvida sobre "qual é o próximo passo", a resposta está aqui.
> Última atualização: 2026-04-12

---

## Visão geral do ciclo

```
IDEIA → PRD → CÓDIGO → REVISÃO → MERGE → DOCUMENTADO
```

Nenhuma etapa é pulada. O sistema tem travas automáticas (git hooks) para garantir isso.

---

## Passo 1 — Ter uma ideia ou tarefa

Antes de qualquer coisa, responda mentalmente:

- **O quê** vou construir?
- **Por quê** isso precisa existir agora?
- **Como** vou saber que está pronto?

Se não conseguir responder as 3, a tarefa ainda não está madura. Não começa.

---

## Passo 2 — Criar a branch e o PRD juntos

**Nunca crie uma branch manualmente.** Use o script:

```bash
node scripts/new-feature.js <nome-da-feature>
```

**O que o script faz automaticamente:**
1. Atualiza `development` com `git pull`
2. Cria a branch `feature/<nome>`
3. Cria `docs/PRDs/<nome>.md` a partir do template
4. Adiciona o PRD na tabela de "PRDs ativos" do `docs/STATUS.md`

**Convenção de nomes** (sem espaço, só hífens, minúsculas):
```
nutrition-ai-agent
flat-monorepo-migration
student-profile-web
workout-session-logger
```

---

## Passo 3 — Preencher o PRD

Abrir `docs/PRDs/<nome>.md` e preencher **antes de codar**:

```
Status: draft → approved   ← só muda quando as 3 perguntas estiverem respondidas
```

**As 3 perguntas obrigatórias:**

| Pergunta | O que escrever |
|---|---|
| **O quê?** | 1-2 frases descrevendo o que será construído |
| **Por quê?** | Qual problema do usuário resolve. Qual o valor de negócio |
| **Como saberemos que está pronto?** | Lista de critérios verificáveis (checkboxes) |

**Também preencher:**
- Escopo (o que está incluído e o que está explicitamente fora)
- Fluxo de dados (quem chama quem, quais tabelas)
- Impacto em outros módulos

> ⛔ O hook pre-commit bloqueia qualquer commit enquanto o PRD estiver como `draft`.

---

## Passo 4 — Implementar

Com PRD aprovado, codar normalmente seguindo as convenções do `CLAUDE.md`.

**Regras durante a implementação:**
- Nenhuma adição de escopo não acordada no PRD
- Se surgir algo novo → pausar, amendar o PRD, retomar
- Commits frequentes e pequenos (não acumular dias de trabalho sem commitar)
- Cada commit passa no pre-commit hook (lint + typecheck + PRD check)

**Quando usar comentário no código:**
```ts
// ✅ Explica o PORQUÊ — motivo não-óbvio da decisão
// Filtramos aqui porque o Supabase retorna refeições vazias em LEFT JOIN.
const activeMeals = meals.filter(m => m.meal_foods?.length > 0);

// ❌ Explica o QUÊ — desnecessário, o código já diz isso
// Filtra as refeições ativas
const activeMeals = meals.filter(m => m.meal_foods?.length > 0);
```

---

## Passo 5 — Commitar

```bash
git add <arquivos específicos>
git commit -m "tipo(escopo): descrição em minúsculas"
```

**Tipos válidos:**

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `chore` | Infra, deps, configuração |
| `refactor` | Refatoração sem mudar comportamento |
| `test` | Adicionar ou corrigir testes |
| `docs` | Documentação |

**O hook pre-commit verifica automaticamente:**
- ✅ Biome lint passa (mobile + web)
- ✅ TypeScript sem erros (mobile + web)
- ✅ PRD existe para a branch atual
- ✅ PRD está como `approved` (não `draft`)
- ✅ Se PRD está `done`, spec técnica em `docs/features/` existe

Se qualquer verificação falhar, o commit é bloqueado com instrução do que fazer.

---

## Passo 6 — Abrir Pull Request

Ao finalizar a feature (antes de mergear):

```bash
git push -u origin feature/<nome>
# Abrir PR no GitHub: feature/<nome> → development
```

**O PR deve conter:**
- Título seguindo conventional commits: `feat(nutrition): adicionar agente de ia`
- Descrição com: o que foi feito, como testar, screenshots se for UI

**O pre-push hook verifica automaticamente:**
- ✅ Testes Jest passam (mobile)
- ✅ Testes Vitest passam (web)

Se os testes falharem, o push é bloqueado.

---

## Passo 7 — Documentar (obrigatório para fechar a feature)

Após o PR ser aprovado e antes de mergear, criar ou atualizar:

### 7a. Spec técnica da feature

```bash
cp docs/features/_template.md docs/features/<nome>.md
# Preencher o arquivo com o que foi implementado
```

O que a spec deve ter:
- O que é e por que existe
- Fluxo de dados real (como foi implementado)
- Tabelas do banco envolvidas
- Regras de negócio
- Divergências web ↔ mobile (idealmente: nenhuma)
- Decisões técnicas não-óbvias

### 7b. Atualizar STATUS.md

```
docs/STATUS.md → atualizar linha do módulo afetado
```

### 7c. Fechar o PRD

```
docs/PRDs/<nome>.md → mudar Status: in-progress → done
```

> ⛔ O hook pre-commit bloqueia commit com PRD `done` se `docs/features/<nome>.md` não existir.

---

## Passo 8 — Mergear

Com os 4 critérios de done cumpridos:

- [x] Código passou em lint + typecheck + testes
- [x] PR aprovado
- [x] `docs/features/<nome>.md` criado/atualizado
- [x] `docs/STATUS.md` atualizado

Mergear `feature/<nome>` → `development` no GitHub.

---

## Para decisões estruturais (fora do fluxo normal)

Quando a decisão afeta arquitetura, stack ou padrões do projeto:

```bash
# Criar um ADR (Architecture Decision Record)
cp docs/decisions/_template.md docs/decisions/00X-titulo-da-decisao.md
```

Exemplos do que merece um ADR:
- Trocar ou adicionar uma biblioteca principal
- Mudar estrutura de pastas
- Decidir sobre uma abordagem arquitetural (ex: flat monorepo, BFF)
- Qualquer coisa que, se revertida no futuro, teria custo alto

---

## Documentos que existem e para que servem

| Documento | Para que serve | Frequência de leitura |
|---|---|---|
| `docs/HOW_WE_WORK.md` | **Este arquivo** — fluxo completo passo a passo | Quando tiver dúvida sobre o processo |
| `docs/STATUS.md` | Estado atual de todos os módulos | Início de toda sessão |
| `docs/GLOSSARY.md` | Termos canônicos do domínio | Ao nomear qualquer coisa nova |
| `docs/PRDs/<feature>.md` | Contrato da feature em andamento | Durante toda a implementação |
| `docs/features/<feature>.md` | Spec técnica do que foi construído | Ao trabalhar num módulo existente |
| `docs/decisions/ADR-XXX.md` | Por que decisões estruturais foram tomadas | Ao questionar uma decisão de stack/arquitetura |
| `CLAUDE.md` | Regras de código, convenções, arquitetura | Referência durante implementação |
| `docs/archive/` | Documentação antiga — não usar como referência | Nunca (a não ser para recuperar contexto histórico) |

---

## Fluxo resumido em uma linha

```
node scripts/new-feature.js → preencher PRD → codar → commitar → PR → spec → STATUS → merge
```

---

## O que os hooks fazem automaticamente

### pre-commit (antes de cada commit)
```
1. Bloqueia commit direto em main ou development
2. Verifica se PRD existe para a branch feature/
3. Verifica se PRD não está como "draft"
4. Verifica se spec existe quando PRD está "done"
5. Roda biome lint (mobile + web)
6. Roda tsc --noEmit (mobile + web)
```

### pre-push (antes de cada push)
```
1. Bloqueia push direto em main
2. Roda Jest (mobile)
3. Roda Vitest (web)
```

---

## Papéis no processo

| Quem | Responsabilidade |
|---|---|
| **Daniel** | Define prioridade, aprova PRD, aprova PR, decide sobre escopo |
| **Agente (Claude)** | Propõe abordagem técnica, implementa, recusa implementação sem PRD aprovado |
| **Ambos** | Seguem este fluxo sem exceção |

> O agente não começa a codar se o PRD estiver em `draft` ou não existir.
> Se isso acontecer, o agente faz as 3 perguntas e aguarda o PRD ser aprovado.
