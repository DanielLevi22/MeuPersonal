# PRD: student-web-dashboard

**Data de criação:** 2026-05-03
**Status:** approved
**Branch:** feature/student-web-dashboard
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Dashboard web do aluno — interface completa para `student` (consumo) e `member` (consumo + criação), com acesso controlado por role via CASL + RLS.

### Por quê?
Com o auto-cadastro do aluno implementado (auth-student-registration), o aluno chega na plataforma mas não tem uma experiência web definida. Sem um dashboard estruturado o produto está incompleto para alunos — que são o usuário final do serviço vendido pelo personal trainer.

### Como saberemos que está pronto?
- [ ] `student` consegue visualizar treinos, dieta e progresso atribuídos pelo profissional
- [ ] `student` NÃO vê ferramentas de criação (workout builder, diet planner)
- [ ] `member` consegue criar e gerenciar seus próprios planos de treino
- [ ] `member` consegue criar e gerenciar seus próprios planos alimentares
- [ ] AI coach está disponível para ambos os perfis como ferramenta opcional
- [ ] Rotas do profissional continuam inacessíveis para qualquer tipo de aluno
- [ ] CASL bloqueia UI + RLS bloqueia banco para ações não permitidas por role

---

## Contexto

O fluxo de registro do aluno (auth-student-registration) está implementado. Após login, o aluno é redirecionado para `/dashboard/coach` — que hoje é apenas o chat do AI coach. Não existe um dashboard estruturado para o aluno no web.

No mobile, o aluno gerenciado já tem acesso a treinos, dieta, progresso e gamificação (modo consumo). O aluno autônomo no mobile ainda não tem as ferramentas de criação. O web precisa contemplar ambos os perfis com a mesma lógica.

---

## Definição de perfis

### `student`
- Vinculado a um profissional
- O profissional cria e atribui seus planos (treino, dieta, avaliação)
- Aluno só executa e acompanha
- Sem acesso a ferramentas de criação

### `member`
- Sem vínculo com profissional
- Cria e gerencia seus próprios planos
- Pode usar AI coach como ferramenta de auxílio (opcional — não obrigatório)
- Acesso completo às ferramentas de criação, mas escopado para si mesmo

> **Regra central:** a distinção de acesso é feita 100% pelo role (`account_type`). Nenhuma pergunta no onboarding. O sistema detecta e libera/bloqueia automaticamente.

---

## Escopo

### Incluído

**Ambos os perfis:**
- Dashboard principal com resumo do dia (treino + alimentação)
- Visualização e execução de treinos
- Visualização do plano alimentar
- Progresso e métricas (peso, frequência, histórico)
- Gamificação (streaks, XP, badges)
- AI coach — chat disponível como ferramenta opcional
- Perfil e configurações

**Apenas `member`:**
- Workout builder — criar, editar e arquivar planos de treino
- Diet planner — criar, editar e arquivar planos alimentares
- Gestão de exercícios e refeições personalizados

### Fora do escopo (explicitamente)
- Fluxo de vinculação aluno ↔ profissional (feature separada)
- Aluno gerenciado criando planos (nunca — é restrição de negócio)
- Aprovação/moderação de cadastro
- Chat entre aluno e profissional (social-and-engagement)
- Notificações push (feature separada)
- Planos compartilháveis / templates públicos

---

## Estrutura de rotas (web)

```
/dashboard/student                    → resumo do dia (ambos)
/dashboard/student/workouts           → lista de treinos (ambos — visualização)
/dashboard/student/workouts/[id]      → detalhe e execução de treino (ambos)
/dashboard/student/workouts/new       → criar treino (member only)
/dashboard/student/workouts/[id]/edit → editar treino (member only)
/dashboard/student/nutrition          → plano alimentar (ambos — visualização)
/dashboard/student/nutrition/new      → criar plano (member only)
/dashboard/student/progress           → métricas e histórico (ambos)
/dashboard/student/coach              → AI coach chat (ambos — opcional)
/dashboard/student/profile            → perfil e configurações (ambos)
```

---

## Controle de acesso

| Recurso | student | member | Mecanismo |
|---|---|---|---|
| Ver treinos atribuídos | ✅ | ✅ (próprios) | RLS `student_id = auth.uid()` |
| Criar treino | ❌ | ✅ | CASL ability + RLS |
| Editar treino | ❌ | ✅ (próprios) | CASL ability + RLS |
| Ver plano alimentar | ✅ | ✅ (próprio) | RLS `student_id = auth.uid()` |
| Criar plano alimentar | ❌ | ✅ | CASL ability + RLS |
| AI coach | ✅ | ✅ | Sem restrição |
| Progresso / métricas | ✅ | ✅ | RLS `student_id = auth.uid()` |
| Gamificação | ✅ | ✅ | RLS `user_id = auth.uid()` |
| Rotas do profissional | ❌ | ❌ | Guard no layout |

---

## Tabelas do banco envolvidas

| Tabela | Operação | Perfil | Observação |
|--------|----------|--------|------------|
| `workout_plans` | SELECT | ambos | managed: planos do profissional · autonomous: próprios |
| `workout_plans` | INSERT / UPDATE / DELETE | member | escopado para `student_id = auth.uid()` |
| `workout_sessions` | SELECT / INSERT | ambos | registro de execução |
| `diet_plans` | SELECT | ambos | managed: do profissional · autonomous: próprios |
| `diet_plans` | INSERT / UPDATE / DELETE | member | escopado para `student_id = auth.uid()` |
| `profiles` | SELECT / UPDATE | ambos | dados do próprio perfil |
| `gamification_profiles` | SELECT | ambos | XP, level, streaks |
| `achievements` | SELECT | ambos | badges conquistados |

> **LGPD:** `workout_sessions` e `diet_plans` contêm dados de saúde — requer `/lgpd-check` antes da implementação.

---

## Decisões técnicas

- **Role detection por `account_type`:** nenhuma flag adicional. `student` e `member` são os valores canônicos em `profiles.account_type`.
- **CASL como fonte da verdade na UI:** os abilities são definidos centralmente em `@elevapro/shared` e consumidos por ambas as plataformas.
- **RLS como última linha de defesa:** mesmo que o CASL falhe ou seja bypassado, o banco rejeita operações não autorizadas.
- **Rotas sob `/dashboard/student/`:** separadas de `/dashboard/` (profissional) para evitar conflito de layouts e guards.
- **AI coach é ferramenta, não modo:** disponível em `/dashboard/student/coach` para ambos os perfis. Não há "modo IA" no onboarding.
- **Autonomous student cria planos para si mesmo:** as tabelas são as mesmas do profissional, mas `student_id = auth.uid()` e `professional_id = null`.

---

## Impacto em outros módulos

- **Auth:** guard no layout `/dashboard/student` verifica `account_type` ∈ `{student, member}`
- **Workouts:** service existente precisa suportar `student_id` como owner (além de `professional_id`)
- **Nutrition:** idem workouts
- **Gamification:** sem impacto — já usa `user_id`
- **AI coach:** sem impacto — já está implementado em `/dashboard/coach`
- **CASL:** novos abilities para `member` (create workout_plan, create diet_plan)

---

## Decisões tomadas em discussão

- [x] **Mesma tabela para aluno autônomo:** `workout_plans` e `diet_plans` são compartilhadas. O que distingue é `student_id = auth.uid()` + `professional_id = null`. Sem tabela separada.

- [x] **Web = informação, execução fica no mobile:** o dashboard web do aluno espelha os dados do mobile (treino do dia, plano alimentar, progresso, gamificação) mas sem camada executiva. Registrar séries, marcar refeições e iniciar sessão são ações exclusivas do mobile.

- [x] **Empty state do `member`:** quando o aluno autônomo não tem nenhum plano, o dashboard exibe duas opções:
  - **"Criar com IA"** → abre o fluxo do AI coach que guia a criação do plano
  - **"Criar você mesmo"** → navega para as telas de workout builder / criação de exercícios
  O `student` não tem esse empty state — se não há plano atribuído, exibe mensagem passiva: *"Seu personal trainer ainda não criou um plano para você."* Sem CTA, sem ação possível.

- [x] **Métricas do `student`:** por ora, o aluno gerenciado só preenche a anamnese. Métricas como peso e medidas são inseridas pelo profissional. No futuro, pode-se liberar o auto-preenchimento — mas fora do escopo desta feature.

## Perguntas em aberto

> Todas as questões foram resolvidas. PRD pode ser movido para `approved`.

---

## Checklist de done

> Só muda o Status para `done` quando TODOS estão marcados.

- [ ] Código funciona e passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/student-web-dashboard.md` criado ou atualizado
- [ ] `docs/STATUS.md` atualizado
- [ ] `/lgpd-check` executado para tabelas de saúde envolvidas
