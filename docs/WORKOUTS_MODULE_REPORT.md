# Análise Completa: Módulo de Treinos (Workouts)

Este documento detalha a arquitetura de periodização, o motor de geração de treinos por IA e o mapeamento das tabelas de execução, identificando divergências críticas de nomenclatura no banco de dados.

---

## 🛠️ Visão Técnica e Arquitetura

O módulo de treinos é estruturado em uma hierarquia de quatro níveis para permitir um planejamento de longo prazo (Periodização).

### 1. A Hierarquia de Planejamento
- **Nível 1: Periodização (`training_periodizations`)**: O macrociclo (ex: "Projeto Verão 2026"). Define o objetivo (Força, Hipertrofia, etc.) e as datas de início/fim.
- **Nível 2: Fase/Plano de Treino (`training_plans`)**: Sub-divisões do ciclo (ex: "Fase de Adaptação", "Fase de Ganho de Força").
- **Nível 3: Treino (`workouts`)**: A rotina diária (ex: "Treino A - Peito e Tríceps").
- **Nível 4: Exercício do Treino (`workout_exercises`)**: A prescrição técnica (séries, repetições, descanso e notas).

### 2. Motor de Geração por IA
O sistema integra o `WorkoutAIService`, que utiliza modelos de linguagem para:
- Gerar divisões de treino (Splits) automáticas com base no objetivo e frequência semanal.
- Sugerir exercícios, cargas e técnicas avançadas (Rest-pause, Drop-set) automaticamente.
- Criar periodizações completas com fases logicamente encadeadas.

### 3. Execução e Logs (Logs de Treino)
Quando um aluno executa o treino no mobile:
1. Uma **Sessão (`workout_sessions`)** é aberta.
2. Cada exercício realizado gera um registro em **`workout_session_exercises`**.
3. Os dados de carga e repetições reais são salvos em um campo **JSONB (`sets_data`)**, permitindo flexibilidade para registrar múltiplas séries com variabilidade.

---

## ⚠️ Análise: Legado vs. Ativo (KEEP or DROP)

### 1. Divergência de Nomenclatura (CRÍTICO)
- **LEGADO/PROPOSTO ⚠️: `periodizations`**: Este é o nome que consta no Schema do Drizzle e nas migrações iniciais.
- **ATIVO ✅: `training_periodizations`**: Este é o nome que **todo o código** (Web e Mobile) utiliza para realizar as consultas no Supabase. 
- **Ação**: O schema do Drizzle precisa ser atualizado para refletir o nome real do banco de produção.

### 2. Gestão de Exercícios
- **ATIVO ✅: `exercises`**: Catálogo global de exercícios. Possui flag `is_verified` (0/1) para diferenciar exercícios oficiais de exercícios criados por usuários.
- **DICA DE LIMPEZA 🧹**: Existem campos duplicados de peso/altura que circulam entre as tabelas de `profiles` e as de `periodizations`. A recomendação é centralizar medidas biométricas apenas no módulo de **Students** (`physical_assessments`).

---

## 📊 Mapeamento do Banco de Dados

### Tabela: `training_periodizations` (Macro)
| Coluna | Tipo | Status |
| :--- | :--- | :--- |
| `id` | uuid | **Ativo** |
| `student_id` | uuid | FK para `profiles` |
| `professional_id` | uuid | FK para `profiles` |
| `objective` | text | Hipertrofia, Força, etc. |
| `status` | text | `planned`, `active`, `completed`. |

### Tabela: `workout_sessions` (Execução)
| Coluna | Tipo | Função |
| :--- | :--- | :--- |
| `id` | uuid | PK da sessão de hoje. |
| `workout_id` | uuid | Qual treino foi executado. |
| `started_at` | timestamp | Início cronometrado. |
| `finished_at` | timestamp | Fim da execução. |
| `intensity` | integer | Percepção de esforço (1-10). |

---

## 🔍 Queries SQL para Auditoria (Supabase)

```sql
-- 1. Ver a hierarquia completa de uma periodização específica
SELECT 
    tp.name as Ciclo, 
    p.name as Fase, 
    w.title as Treino,
    count(we.id) as total_exercicios
FROM training_periodizations tp
JOIN training_plans p ON p.periodization_id = tp.id
JOIN workouts w ON w.training_plan_id = p.id
LEFT JOIN workout_exercises we ON we.workout_id = w.id
GROUP BY tp.name, p.name, w.title;

-- 2. Exercícios mais populares (Catalog vs Uso)
SELECT 
    e.name, 
    count(we.id) as vezes_prescrito
FROM exercises e
JOIN workout_exercises we ON we.exercise_id = e.id
GROUP BY e.name
ORDER BY vezes_prescrito DESC;

-- 3. Verificar sessões de treino sem exercícios logados (Erro de UX)
SELECT s.id, s.started_at, p.full_name
FROM workout_sessions s
JOIN profiles p ON s.student_id = p.id
LEFT JOIN workout_session_exercises se ON se.session_id = s.id
WHERE se.id IS NULL;
```

---
*Documento gerado como parte do mapeamento técnico do sistema MeuPersonal.*
