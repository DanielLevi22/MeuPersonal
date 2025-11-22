-- Migration: Nutrition Module - Database Schema
-- Creates all tables needed for the nutrition/diet management system

-- ============================================
-- 1. FOODS TABLE (Banco de Alimentos)
-- ============================================
CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT, -- Proteína, Carboidrato, Gordura, Vegetal, Fruta, Laticínio, etc.
  serving_size NUMERIC DEFAULT 100, -- Tamanho da porção padrão (geralmente 100g)
  serving_unit TEXT DEFAULT 'g', -- g, ml, unidade, colher, xícara
  
  -- Macronutrientes (por serving_size)
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  fiber NUMERIC DEFAULT 0,
  
  -- Metadados
  source TEXT DEFAULT 'TBCA', -- TBCA, USDA, Manual
  is_custom BOOLEAN DEFAULT false, -- Alimento customizado pelo personal
  created_by UUID REFERENCES profiles(id), -- Se custom, quem criou
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Índices para busca
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', name)) STORED
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_search ON foods USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_foods_custom ON foods(created_by) WHERE is_custom = true;

-- ============================================
-- 2. DIET PLANS TABLE (Planos de Dieta)
-- ============================================
CREATE TABLE IF NOT EXISTS diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Informações do plano
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Metas diárias
  target_calories NUMERIC NOT NULL,
  target_protein NUMERIC NOT NULL,
  target_carbs NUMERIC NOT NULL,
  target_fat NUMERIC NOT NULL,
  
  -- Controle de versão
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  notes TEXT, -- Notas sobre mudanças nesta versão
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_diet_plans_student ON diet_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_personal ON diet_plans(personal_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_active ON diet_plans(student_id, is_active) WHERE is_active = true;

-- ============================================
-- 3. DIET MEALS TABLE (Refeições do Plano)
-- ============================================
CREATE TABLE IF NOT EXISTS diet_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
  
  -- Quando e qual refeição
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Domingo, 6=Sábado
  meal_type TEXT NOT NULL, -- 'breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack'
  meal_order INTEGER NOT NULL, -- Ordem de exibição
  
  -- Informações da refeição
  name TEXT, -- Nome customizado (opcional)
  target_calories NUMERIC, -- Meta de calorias desta refeição
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_diet_meals_plan ON diet_meals(diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_diet_meals_day ON diet_meals(diet_plan_id, day_of_week);

-- ============================================
-- 4. DIET MEAL ITEMS TABLE (Alimentos em cada Refeição)
-- ============================================
CREATE TABLE IF NOT EXISTS diet_meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_meal_id UUID NOT NULL REFERENCES diet_meals(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id),
  
  -- Quantidade
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL, -- g, ml, unidade, etc.
  
  -- Ordem de exibição
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_diet_meal_items_meal ON diet_meal_items(diet_meal_id);
CREATE INDEX IF NOT EXISTS idx_diet_meal_items_food ON diet_meal_items(food_id);

-- ============================================
-- 5. DIET LOGS TABLE (Registro do que o aluno comeu)
-- ============================================
CREATE TABLE IF NOT EXISTS diet_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  diet_plan_id UUID REFERENCES diet_plans(id),
  diet_meal_id UUID REFERENCES diet_meals(id),
  
  -- Data do registro
  logged_date DATE NOT NULL,
  
  -- Status
  completed BOOLEAN DEFAULT false,
  
  -- Itens realmente consumidos (pode ser diferente do planejado)
  actual_items JSONB, -- [{food_id, quantity, unit}, ...]
  
  -- Observações
  notes TEXT,
  photo_url TEXT, -- Foto do prato (futuro)
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_diet_logs_student ON diet_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_diet_logs_date ON diet_logs(student_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_diet_logs_meal ON diet_logs(diet_meal_id);

-- ============================================
-- 6. NUTRITION PROGRESS TABLE (Progresso Nutricional)
-- ============================================
CREATE TABLE IF NOT EXISTS nutrition_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Data da medição
  recorded_date DATE NOT NULL,
  
  -- Peso e composição corporal
  weight NUMERIC,
  body_fat_percentage NUMERIC,
  
  -- Circunferências (em cm)
  waist_cm NUMERIC,
  chest_cm NUMERIC,
  arm_left_cm NUMERIC,
  arm_right_cm NUMERIC,
  thigh_left_cm NUMERIC,
  thigh_right_cm NUMERIC,
  hip_cm NUMERIC,
  
  -- Fotos de progresso
  photo_front_url TEXT,
  photo_side_url TEXT,
  photo_back_url TEXT,
  
  -- Observações
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Garantir apenas um registro por aluno por dia
  UNIQUE(student_id, recorded_date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_nutrition_progress_student ON nutrition_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_progress_date ON nutrition_progress(student_id, recorded_date DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- FOODS: Todos podem ler, apenas personals podem criar custom foods
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view foods"
ON foods FOR SELECT
USING (true);

CREATE POLICY "Personals can create custom foods"
ON foods FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'personal'
  )
);

-- DIET PLANS: Personal pode gerenciar, aluno pode ver os seus
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personals can manage their diet plans"
ON diet_plans FOR ALL
USING (personal_id = auth.uid())
WITH CHECK (personal_id = auth.uid());

CREATE POLICY "Students can view their diet plans"
ON diet_plans FOR SELECT
USING (student_id = auth.uid());

-- DIET MEALS: Herda permissões do diet_plan
ALTER TABLE diet_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access via diet plan"
ON diet_meals FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM diet_plans
    WHERE diet_plans.id = diet_meals.diet_plan_id
    AND (diet_plans.personal_id = auth.uid() OR diet_plans.student_id = auth.uid())
  )
);

-- DIET MEAL ITEMS: Herda permissões do diet_meal
ALTER TABLE diet_meal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access via diet meal"
ON diet_meal_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM diet_meals dm
    JOIN diet_plans dp ON dp.id = dm.diet_plan_id
    WHERE dm.id = diet_meal_items.diet_meal_id
    AND (dp.personal_id = auth.uid() OR dp.student_id = auth.uid())
  )
);

-- DIET LOGS: Aluno pode gerenciar seus próprios, personal pode visualizar
ALTER TABLE diet_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own logs"
ON diet_logs FOR ALL
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Personals can view their students logs"
ON diet_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students_personals sp
    WHERE sp.student_id = diet_logs.student_id
    AND sp.personal_id = auth.uid()
    AND sp.status = 'active'
  )
);

-- NUTRITION PROGRESS: Aluno pode gerenciar seus próprios, personal pode visualizar
ALTER TABLE nutrition_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own progress"
ON nutrition_progress FOR ALL
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Personals can view their students progress"
ON nutrition_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students_personals sp
    WHERE sp.student_id = nutrition_progress.student_id
    AND sp.personal_id = auth.uid()
    AND sp.status = 'active'
  )
);
