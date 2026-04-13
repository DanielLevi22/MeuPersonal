# System Mapping — Mapeamento Completo do Sistema

> **Objetivo:** Entender feature por feature o que existe, o que funciona, o que está quebrado e o que é código morto — antes de finalizar o schema do banco.
>
> **Regra:** Nunca presumir. Sempre perguntar. Avançar para o próximo módulo só quando o atual estiver com status `✅ Mapeado`.
>
> **Uso:** Atualizar este documento a cada sessão. É o ponto de partida obrigatório ao retomar o trabalho.

---

## Status geral

| Módulo | Status | Decisões tomadas | Código morto identificado |
|--------|--------|-----------------|--------------------------|
| **Auth** | ✅ Mapeado | Sim | Parcial (paths pendentes) |
| **Students** | 🔄 Em andamento | — | — |
| **Nutrition** | ⏳ Pendente | — | — |
| **Workouts** | ⏳ Pendente | — | — |
| **Assessment** | ⏳ Pendente | — | — |
| **Gamification** | ⏳ Pendente | — | — |
| **Chat** | ⏳ Pendente | — | — |

---

## Módulo: Auth

### Contexto levantado (conversa com Daniel)

**Fluxo original (abandonado):**
- Professional gerava um código → aluno entrava com o código
- Problema: Supabase exige email para auth
- Status: **abandonado** — provavelmente tem código morto

**Fluxo atual:**
- Professional cria conta do aluno (email + senha)
- Passa as credenciais manualmente ao aluno (WhatsApp etc.)
- Implementado via RPC com SECURITY DEFINER

**Tipos de profissional:**
- Hoje: personal trainer, nutricionista
- Futuro: outros tipos podem ser adicionados
- Um profissional pode ter **múltiplos tipos** (personal E nutricionista ao mesmo tempo)
- Permissões são baseadas nos tipos de serviço que o profissional tem

**Tipos de aluno:**
- `managed`: criado e gerenciado pelo profissional
- `autonomous`: se cadastra sozinho, monta seu próprio treino/dieta
- **Importante:** um aluno pode migrar de autonomous → managed e vice-versa
- O sistema precisa ser flexível para essa transição

**Documentos do profissional:**
- Colunas CREF/CRM existem no banco atual
- Provavelmente nunca foram usadas de verdade
- Precisam de query de auditoria para confirmar

**Aluno autônomo + IA:**
- Futuro — aluno autônomo usará IA para montar treino/dieta
- Não modelar agora, mas não criar constraints que impeçam isso

---

### Perguntas respondidas

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Personal e nutricionista têm permissões diferentes? | Sim — cada tipo tem seu conjunto de permissões. Um profissional pode ter os dois. |
| 2 | Aluno autônomo existe no código hoje? | Foi implementado mas removido — ainda faz parte do roadmap. |
| 3 | Documentos (CREF/CRM) são usados? | Existem no banco, provavelmente nunca usados — paths a confirmar na varredura. |
| 4 | O fluxo de convite por código existe no código? | Sim — foi implementado em web e mobile. É código morto hoje. |
| 5 | Aluno pode mudar de tipo (managed ↔ autonomous)? | Sim — o sistema precisa suportar essa transição. |
| P1 | Como o profissional indica os tipos de serviço? | Na hora do cadastro — ele escolhe quais profissões quer exercer. |
| P2 | Fluxo do aluno autônomo no mobile? | Fluxo foi removido — ainda é roadmap. Não existe hoje. |
| P3 | Aluno autônomo pode encontrar profissional (marketplace)? | Não existe ainda — faz parte do que precisa ser desenvolvido. |
| P4 | Profissional precisa de aprovação? | Sim — aprovação pelo admin antes de usar o sistema. |
| P5 | Existe admin? | Sim — Daniel (desenvolvedor) gerencia a plataforma como admin. |

---

### Perguntas pendentes — Auth

> ✅ Todas respondidas — módulo fechado

---

### Código morto identificado — Auth

| Arquivo | O que é | Ação |
|---------|---------|------|
| A identificar | Geração de invite code | Deletar |
| A identificar | Validação de invite code no signup | Deletar |
| A identificar | UI de entrada por código no mobile | Deletar |
| A identificar | UI de geração de código no web | Deletar |
| Coluna `cref` em profiles/users | Documento profissional — nunca usado | Avaliar (manter vazio ou dropar) |
| Coluna `crn` em profiles/users | Documento profissional — nunca usado | Avaliar (manter vazio ou dropar) |

> Preencher com paths reais após varredura do código

---

### Decisões de schema — Auth ✅

**Profiles — campos necessários:**
```
id, email, full_name, avatar_url
role: enum('professional', 'student', 'admin')
  ← admin adicionado: Daniel gerencia a plataforma
student_type: enum('managed', 'autonomous') | null
  ← null para professionals e admins
  ← autonomous existe no schema mas o fluxo de cadastro é roadmap
approval_status: enum('pending', 'approved', 'rejected') | null
  ← null para students e admins
  ← professional fica 'pending' após cadastro até admin aprovar
created_at, updated_at
```

**Professional services — tabela separada (confirmado):**
```
professional_services
  id
  professional_id → profiles
  service_type: enum('personal_training', 'nutrition_consulting', ...)
  is_active: boolean
```
Criada no momento do cadastro — profissional já escolhe os tipos na tela de signup.
Motivo da tabela separada: profissional pode ter múltiplos tipos simultaneamente.

**Documentos do profissional (CREF/CRM):**
- Aprovação é feita pelo admin → admin precisa ver o documento para aprovar
- Decisão: campo genérico `professional_document jsonb` em profiles
  - Flexível para CREF, CRM e outros tipos futuros
  - Ex: `{"type": "CREF", "number": "123456-G/SP"}`
- Colunas fixas `cref`/`crn` no banco atual: dropar e substituir por `professional_document`

**Fluxo de aprovação (novo — P4):**
```
Professional se cadastra → approval_status = 'pending'
    → envia professional_document (CREF/CRM)
    → admin visualiza no painel
    → admin aprova → approval_status = 'approved'
    → profissional ganha acesso às features
```
Implicação de RLS: professional com status != 'approved' não pode criar alunos/planos.

---

## Módulo: Students

### Contexto levantado

**Vínculo aluno-profissional:**
- Tabela `student_professionals` (era `coachings`) — vínculo ativo entre aluno e professional
- Status: `pending`, `active`, `inactive`
- Um profissional cria a conta do aluno via RPC → vínculo já nasce `active`

**Tipos de aluno:**
- `managed`: criado pelo profissional, gerenciado por ele
- `autonomous`: se cadastra sozinho — fluxo removido, é roadmap
- Transição managed ↔ autonomous: precisa ser suportada

**Physical assessments:**
- Tabela `physical_assessments` existe — peso, altura, % gordura, fotos
- Feita pelo profissional ou pelo próprio aluno?

### Perguntas pendentes — Students

- [ ] **P1:** Quem preenche a avaliação física — o profissional, o aluno ou os dois?
- [ ] **P2:** Um aluno pode ter vínculo com mais de um profissional ao mesmo tempo? (ex: um personal E um nutricionista)
- [ ] **P3:** Quando o profissional "inativa" um aluno, o aluno ainda consegue ver seus dados históricos (treinos, dieta)?
- [ ] **P4:** Existe algum fluxo de "solicitação de vínculo" — aluno pede para ser gerenciado por um profissional? Ou sempre é o profissional que adiciona?

---

## Módulo: Nutrition

> ⏳ Aguardando Auth e Students serem fechados

---

## Módulo: Workouts

> ⏳ Aguardando Auth e Students serem fechados

---

## Módulo: Assessment

> ⏳ Pendente

---

## Módulo: Gamification

> ⏳ Pendente
> Nota prévia: `streaks` no banco mas código usa `student_streaks` — bug confirmado

---

## Módulo: Chat

> ⏳ Pendente
> Nota prévia: conversations/messages existem no banco mas UI incompleta. Ver PRD social-and-engagement.

---

## Código morto — lista consolidada

> Preencher durante o mapeamento de cada módulo

| Módulo | Arquivo | Descrição | Ação |
|--------|---------|-----------|------|
| Auth | A identificar | Fluxo de invite code (web + mobile) | Deletar |
| Workouts | A identificar | `workout_logs` table e código relacionado | Deletar migration + código |
| Workouts | A identificar | `workout_executions` duplicado | Consolidar |
| Nutrition | A identificar | Referências a tabelas antigas (meals, nutrition_plans) | Atualizar para novo schema |

---

## Decisões de schema — pendentes de mapeamento

> Não aplicar nenhuma migration até este checklist estar completo

- [x] Auth: confirmar estrutura de roles e professional_services
- [x] Auth: decisão sobre documentos do profissional (CREF/CRM)
- [ ] Students: confirmar fluxo managed ↔ autonomous
- [ ] Workouts: confirmar qual sistema de execução é o ativo
- [ ] Gamification: confirmar o que funciona de fato
- [ ] Chat: confirmar o que vai para o PRD social vs o que fica no core

---

## Como usar este documento

1. **Início de sessão:** ler este arquivo antes de qualquer coisa
2. **Durante:** preencher perguntas respondidas, adicionar código morto identificado
3. **Fim de sessão:** atualizar status da tabela geral + commitar
4. **Avançar de módulo:** só quando todas as perguntas do módulo atual estiverem respondidas
