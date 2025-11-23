-- Verificar se existe algum plano (ativo ou não) para este aluno
-- Execute como PERSONAL (não como student)

-- 1. Ver todos os planos deste aluno
SELECT 
  id,
  name,
  plan_type,
  status,
  is_active,
  start_date,
  end_date,
  created_at
FROM diet_plans
WHERE student_id = 'e2f93d9d-f21f-4fa4-b240-cf7e9b47ac59'
ORDER BY created_at DESC;

-- 2. Se não existir nenhum plano, você precisa:
--    a) Fazer login como PERSONAL
--    b) Ir em: Alunos -> [Selecionar este aluno] -> Nutrição -> Criar Plano
--    c) Preencher os dados e criar o plano

-- 3. Verificar se as refeições foram criadas
SELECT 
  dm.id,
  dm.day_of_week,
  dm.meal_type,
  dm.name,
  COUNT(dmi.id) as num_items
FROM diet_meals dm
LEFT JOIN diet_meal_items dmi ON dmi.diet_meal_id = dm.id
WHERE dm.diet_plan_id IN (
  SELECT id FROM diet_plans 
  WHERE student_id = 'e2f93d9d-f21f-4fa4-b240-cf7e9b47ac59'
)
GROUP BY dm.id, dm.day_of_week, dm.meal_type, dm.name
ORDER BY dm.day_of_week, dm.meal_order;
