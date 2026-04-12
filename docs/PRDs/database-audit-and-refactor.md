# PRD: database-audit-and-refactor

**Data de criação:** 2026-04-12
**Status:** approved
**Branch:** feature/database-audit-and-refactor
**Autor:** Daniel Levi

---

## As 3 perguntas obrigatórias

### O quê?
Auditar o banco de dados real (Supabase), mapear o que existe vs o que o código usa, e refatorar para ter uma schema limpa, versionada e documentada — sem tabelas mortas, sem schemas duplicadas, sem migrações faltando.

### Por quê?
O banco acumulou meses de iterações rápidas e hoje tem:
- Tabelas criadas direto no Supabase (fora do controle de migrations)
- Duas schemas de nutrição convivendo (antiga: `meals/nutrition_plans`, nova: `diet_plans/diet_meals`)
- `meal_logs` sem nenhuma migration — se recriar o banco do zero, o sistema quebra
- `workout_logs` completamente morta (0 referências no código)
- `diet_logs` referenciando tabelas que podem não existir mais (`nutrition_plans`, `meals`)
- Incerteza sobre o que o banco real tem vs o que as migrations definem

Isso é risco de perda de dados, bugs silenciosos e impossibilidade de recriar o ambiente do zero.

### Como saberemos que está pronto?
- [ ] Existe um documento com o mapa completo: tabelas reais no banco vs migrations vs código
- [ ] Toda tabela usada pelo código tem migration versionada no repositório
- [ ] Não existe tabela morta (0 referências) no banco
- [ ] Não existe schema duplicada para o mesmo domínio
- [ ] É possível recriar o banco do zero rodando apenas as migrations e o sistema funciona
- [ ] `docs/features/` tem spec técnica de cada domínio documentando o schema

---

## Contexto técnico levantado

### Tabelas identificadas nas migrations
`profiles`, `diet_plans`, `diet_meals`, `diet_meal_items`, `diet_logs`, `foods`, `meal_logs`(?), `nutrition_progress`, `periodizations`, `training_plans`, `workouts`, `workout_items`, `workout_sessions`, `workout_session_items`, `exercises`, `physical_assessments`, `students_personals`, `student_invites`, `achievements`, `streaks`, `daily_goals`, `workout_assignments`, `workout_exercise_logs`, `workout_logs`

### Problemas identificados no código

| Problema | Detalhe |
|---|---|
| `meal_logs` sem migration | Usada pelo `nutritionStore` mas não existe em nenhum `.sql` |
| `diet_logs` referencia tabelas antigas | FK para `nutrition_plans(id)` e `meals(id)` — podem não existir |
| `workout_logs` morta | 0 referências em todo o código |
| Duas schemas de nutrição | `migration-nutrition-schema.sql` cria `diet_*`, `update-nutrition-schema.sql` altera `meals` |
| `diet_plans/diet_meals` aparecem como 0 no grep web | Pode estar usando nome diferente ou path de busca diferente |
| 60+ arquivos de migration | Inclui fixes avulsos, scripts de teste, seeds — misturado com migrations reais |

### Próximo passo acordado
Rodar queries de auditoria no Supabase Dashboard para mapear o **estado real** do banco antes de qualquer decisão de refactor.

---

## Escopo (a definir após auditoria)

### Provável incluído
- Migration para `meal_logs` (versionamento do que já existe)
- Drop de tabelas mortas (`workout_logs` e outras confirmadas)
- Consolidar schema de nutrição em uma única versão canônica
- Limpar migrations avulsas — separar migrations reais de scripts de suporte

### Fora do escopo (nesta fase)
- Mudanças no código da aplicação (só schema por agora)
- Migração de dados (só depois da auditoria confirmar o que existe)

---

## Checklist de done

- [ ] Auditoria real do banco executada e documentada
- [ ] PRD atualizado com escopo definitivo e aprovado
- [ ] Código passou em lint + typecheck + testes
- [ ] PR mergeado em `development`
- [ ] `docs/features/database-schema.md` criado com schema canônica documentada
- [ ] `docs/STATUS.md` atualizado
