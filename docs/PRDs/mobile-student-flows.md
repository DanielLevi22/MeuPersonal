# PRD: mobile-student-flows

**Data de criação:** 2026-05-04
**Status:** approved
**Branch:** feature/mobile-student-flows
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Ajustar o app mobile para que alunos autônomos (member) possam criar e gerenciar planos de treino e nutrição, e adicionar a opção "Sou Membro" no registro.

### Por quê?
O fluxo de member foi implementado no web dashboard mas o mobile não acompanhou: abilities CASL do member são mínimas, o registro não oferece a opção de conta autônoma, e as telas de treino/nutrição não têm CTAs de criação para member.

### Como saberemos que está pronto?
- [ ] RegisterScreen exibe três opções: Sou Especialista, Sou Aluno (managed), Sou Membro (autônomo)
- [ ] Registro de member cria conta com `account_type: "member"` no Supabase
- [ ] Member consegue criar periodização/plano de treino no mobile
- [ ] Member consegue criar plano nutricional no mobile
- [ ] CASL do member inclui manage para Workout, Diet, Periodization, Exercise, Food
- [ ] Telas de treino e nutrição do member exibem banner de progresso por etapas

---

## Contexto

O web dashboard recebeu um fluxo completo de member (aluno autônomo) para treinos e nutrição na branch `feature/student-web-dashboard`. O mobile precisa oferecer a mesma capacidade: o member deve conseguir cadastrar-se e operar de forma autônoma sem depender de um especialista.

Estado atual:
- `abilities.ts`: member tem apenas `can('read', 'Profile')` e `can('update', 'Profile')`
- `RegisterScreen.tsx`: só `specialist` e `student` (managed)
- `shared/src/services/auth.service.ts`: `signUpStudent` hardcoda `account_type: "student"`
- Telas de treino/nutrição do student: read-only, sem create flow para member

## Escopo

### Incluído
- Abilities CASL para member: manage Workout, Diet, Periodization, Exercise, Food
- RegisterScreen: terceira opção "Sou Membro (aluno autônomo)"
- `signUpMember` no auth service (ou parâmetro `account_type` em `signUpStudent`)
- CTA "Criar periodização" visível para member em `PeriodizationsScreen`
- CTA "Criar plano alimentar" visível para member em `StudentNutritionScreen`
- Banner de progresso por etapas (workout e nutrition) para member no mobile

### Fora do escopo (explicitamente)
- Redesign das telas existentes de treino/nutrição
- Execução de treinos (workout tracking)
- Registro de refeições / diet logs
- Convite de alunos (fluxo specialist → student)

---

## Fluxo de dados

```
[Registro: usuário escolhe "Sou Membro"]
  → RegisterScreen (AccountRole = 'member')
  → signUpMember() em auth.service.ts
  → Supabase Auth + profiles.account_type = "member"

[Member cria periodização]
  → PeriodizationsScreen (can('create', 'Periodization'))
  → CreatePeriodizationModal
  → workouts.service.createPeriodization()
  → periodizations INSERT

[Member cria plano nutricional]
  → StudentNutritionScreen (isMember check)
  → DietCreatorScreen (shared com specialist)
  → nutrition.service.createDietPlan()
  → diet_plans INSERT
```

## Tabelas do banco envolvidas

| Tabela | Operação | Observação |
|--------|----------|------------|
| `profiles` | SELECT / UPDATE | account_type = "member" |
| `periodizations` | INSERT | member como owner (student_id = member.id) |
| `diet_plans` | INSERT | member como owner |

## Impacto em outros módulos

- `app/src/packages/supabase/abilities.ts` — adicionar abilities de member
- `app/src/modules/auth/screens/RegisterScreen.tsx` — terceira role option
- `shared/src/services/auth.service.ts` — novo signUpMember ou parâmetro
- `app/src/modules/workouts/` — condicional isMember para create CTA
- `app/src/modules/nutrition/` — condicional isMember para create CTA

---

## Decisões técnicas

- Reutilizar screens existentes (PeriodizationsScreen, StudentNutritionScreen) com condicionais `isMember` — não criar telas paralelas
- `signUpMember` como função separada em auth.service para clareza, espelhando `signUpStudent`
- Banner de progresso: mesmo padrão do `WelcomeBanner` do web, componente nativo NativeWind

---

## Checklist de done

- [ ] Código funciona e passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/mobile-student-flows.md` criado ou atualizado
- [ ] `docs/STATUS.md` atualizado
