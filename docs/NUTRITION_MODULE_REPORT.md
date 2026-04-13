# Análise Completa: Módulo de Nutrição (Nutrition)

Este documento detalha a arquitetura de planos alimentares, o catálogo de alimentos e o sistema de registro de refeições, identificando divergências críticas de nomenclatura entre o código e o banco de dados.

---

## 🛠️ Visão Técnica e Arquitetura

O módulo de nutrição organiza a alimentação do aluno em planos estruturados por dias da semana e horários, integrando cálculos de macros e calorias.

### 1. A Hierarquia Alimentar
- **Nível 1: Plano de Nutrição (`nutrition_plans`)**: Define o nome do plano (ex: "Bulking Limpo") e o período de vigência.
- **Nível 2: Refeição (`meals`)**: Organizadas por `day_of_week` (0-6) e `meal_time`. Ex: Café da Manhã, Almoço.
- **Nível 3: Item da Refeição (`meal_foods`)**: Vínculo entre a refeição e o alimento, definindo a quantidade (ex: 200g de Frango).
- **Nível 4: Alimento (`foods`)**: Catálogo global com os valores de Calorias, Proteínas, Carboidratos, Gorduras e Fibras por 100g.

### 2. Registro e Gamificação
- **Meal Logs (`meal_logs`)**: Quando um aluno marca uma refeição como concluída, um registro é criado vinculando o aluno, o plano e a refeição específica naquela data.
- **Integração**: O ato de completar refeições dispara gatilhos no `GamificationStore` para atualizar o progresso diário e as sequências (streaks).

### 3. Operações em Lote
- **Copy/Paste Day**: O sistema utiliza uma RPC (`paste_diet_day`) para permitir que um profissional copie todas as refeições de um dia (segunda-feira) para outro (terça-feira) em uma única operação atômica.

---

## ⚠️ Análise: Legado vs. Ativo (KEEP or DROP)

### 1. Divergência de Nomenclatura (MUITO CRÍTICO)
Este módulo sofre da maior dessincronização entre o Drizzle e o Banco Real:
- **Drizzle Schema ❌**: Tenta usar `diet_plans`, `diet_meals`, `diet_meal_items`.
- **Produção (Supabase) ✅**: Usa **`nutrition_plans`**, **`meals`**, **`meal_foods`**.
- **Ação**: O schema do Drizzle precisa ser renomeado urgentemente para `nutrition_` para que migrações futuras não criem tabelas duplicadas.

### 2. Funcionalidade Desativada
- **Notificações de Refeição**: O código contém uma lógica complexa para agendar notificações no celular do aluno, mas foi desativada por uma "Opção Nuclear" (Kill Switch) a pedido do usuário, devido a problemas de spam/performance.

---

## 📊 Mapeamento do Banco de Dados

### Tabela: `foods` (Catálogo)
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `name` | text | Nome do alimento (ex: Arroz Branco). |
| `calories` | numeric | kcal por 100g. |
| `protein` / `carbs` / `fat` | numeric | Gramas por 100g. |
| `is_custom` | boolean | Se foi criado pelo profissional para uso privado. |

### Tabela: `meal_logs` (Histórico)
| Coluna | Tipo | Função |
| :--- | :--- | :--- |
| `student_id` | uuid | Quem comeu. |
| `diet_meal_id` | uuid | Qual refeição. |
| `logged_date` | date | Em que dia. |
| `completed` | boolean | Se foi concluído. |

---

## 🔍 Queries SQL para Auditoria (Supabase)

```sql
-- 1. Ver o total de Macros de um Plano Ativo (para validar cálculos)
SELECT 
    np.name as Plano,
    m.name as Refeicao,
    sum(f.protein * (mf.quantity / 100)) as proteina_total,
    sum(f.carbs * (mf.quantity / 100)) as carbo_total,
    sum(f.calories * (mf.quantity / 100)) as calorias_totais
FROM nutrition_plans np
JOIN meals m ON m.diet_plan_id = np.id
JOIN meal_foods mf ON mf.diet_meal_id = m.id
JOIN foods f ON mf.food_id = f.id
WHERE np.status = 'active'
GROUP BY np.name, m.name;

-- 2. Alimentos mais usados em todas as dietas
SELECT f.name, count(mf.id) as popularidade
FROM foods f
JOIN meal_foods mf ON mf.food_id = f.id
GROUP BY f.name
ORDER BY popularidade DESC;

-- 3. Auditoria de Logs: Alunos que completaram todas as refeições hoje
SELECT p.full_name, count(ml.id) as refeicoes_feitas
FROM profiles p
JOIN meal_logs ml ON ml.student_id = p.id
WHERE ml.logged_date = current_date AND ml.completed = true
GROUP BY p.full_name;
```

---
*Documento gerado como parte do mapeamento técnico do sistema MeuPersonal.*
