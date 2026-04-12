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
| **Auth** | 🔄 Em andamento | Parcial | Parcial |
| **Students** | ⏳ Aguardando Auth | — | — |
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
| 2 | Aluno autônomo existe no código hoje? | Sim — mobile foi projetado com signup de aluno autônomo |
| 3 | Documentos (CREF/CRM) são usados? | Existem no banco, provavelmente nunca usados. Precisam de auditoria. |
| 4 | O fluxo de convite por código existe no código? | Sim — foi implementado em web e mobile. É código morto hoje. |
| 5 | Aluno pode mudar de tipo (managed ↔ autonomous)? | Sim — o sistema precisa suportar essa transição |

---

### Perguntas pendentes — Auth

> Responder antes de fechar o mapeamento deste módulo

- [ ] **P1:** Como o profissional indica que tipo de serviço oferece? Na hora do cadastro ou configurável depois?
- [ ] **P2:** Quando o aluno autônomo se cadastra sozinho no mobile, qual é o fluxo? Ele escolhe ser "autônomo" ou isso é automático por não ter profissional?
- [ ] **P3:** Um aluno autônomo pode encontrar um profissional dentro do app (marketplace)? Ou o profissional sempre precisa adicioná-lo manualmente?
- [ ] **P4:** O profissional precisa de aprovação/verificação antes de usar o sistema? (Ex: validar CREF)
- [ ] **P5:** Existe admin no sistema? Quem gerencia a plataforma?

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

### Decisões de schema — Auth (rascunho, sujeito a revisão)

> Não finalizar até fechar as perguntas pendentes

**Profiles — campos necessários:**
```
id, email, full_name, avatar_url
role: enum('professional', 'student')   ← simples, tipo de conta
student_type: enum('managed', 'autonomous') | null  ← null para professionals
created_at, updated_at
```

**Professional services — tabela separada:**
```
professional_services
  id
  professional_id → profiles
  service_type: enum('personal_training', 'nutrition_consulting', ...)
  is_active: boolean
```
Motivo: um profissional pode ter múltiplos tipos. Enum no profiles limitaria isso.

**Documentos do profissional:**
- Decisão pendente até P4 ser respondida (aprovação/verificação necessária?)
- Proposta: campo genérico `professional_document jsonb` em vez de colunas fixas (CREF, CRM)

---

## Módulo: Students

> ⏳ Aguardando Auth ser fechado

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

- [ ] Auth: confirmar estrutura de roles e professional_services
- [ ] Auth: decisão sobre documentos do profissional (CREF/CRM)
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
