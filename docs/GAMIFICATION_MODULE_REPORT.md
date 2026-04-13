# Análise Completa: Módulo de Gamificação

Este documento detalha o motor de engajamento do sistema, focado em hábitos diários e recompensas.

---

## 🛠️ Visão Técnica e Arquitetura

A gamificação não é apenas cosmética; ela está profundamente ligada aos hábitos reais do aluno, consumindo dados dos módulos de Treino e Nutrição.

### 1. Metas Diárias (`daily_goals`)
O sistema cria (ou faz upsert) de um registro diário por aluno para monitorar:
- **Água**: Registrada em ML. É um dos poucos dados inseridos manualmente pelo aluno fora do planejamento do Personal.
- **Nutrição**: Integrada com `meal_logs`. O contador de `meals_completed` é atualizado via trigger ou store assim que o aluno marca uma refeição.
- **Treinos**: Integrada com `workout_sessions`. Quando um treino é finalizado, a meta de treino do dia é batida.

### 2. Retenção (Streaks)
A tabela `student_streaks` é o "termômetro" do app.
- **Lógica**: Se o aluno interage (registra água, comida ou treino) hoje, o streak é mantido ou incrementado. Se passa um dia sem atividade, o streak reseta para 0.
- **XP**: O acúmulo de XP (níveis) é baseado na conclusão dessas metas diárias e no desbloqueio de conquistas.

---

## ⚠️ Análise: Legado vs. Ativo

- **ATIVO ✅**: `daily_goals`, `student_streaks`, `achievements`.
- **DICA 🧹**: O campo `water_target` no `daily_goals` tem um valor padrão de 2000ml. Seria interessante permitir que o Personal ajuste esse valor individualmente (atualmente o ajuste parece ser apenas manual pelo aluno).

---

## 📊 Mapeamento do Banco de Dados

### Tabela: `daily_goals`
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `student_id` | uuid | FK do Aluno. |
| `date` | date | Data do registro. |
| `water_target` | integer | Meta de água (ml). |
| `water_completed`| integer | Água consumida. |
| `meals_completed` | integer | Refeições feitas (via Log). |
| `completed` | boolean | Se bateu 100% das metas do dia. |

---

## 🔍 SQL para Auditoria
```sql
-- Ranking de "Bebedores de Água"
SELECT p.full_name, sum(water_completed) as total_ml
FROM daily_goals dg
JOIN profiles p ON dg.student_id = p.id
GROUP BY p.full_name
ORDER BY total_ml DESC;
```

---
*Documento gerado como parte do mapeamento técnico do sistema MeuPersonal.*
