-- RLS for nutrition tables: diet_plans, diet_meals, diet_meal_items, meal_logs, foods
-- Base legal: Tutela da Saúde (Art. 11, II, f) + Consentimento (Art. 11, I) — LGPD
-- Specialist desvinculado perde acesso automaticamente via student_specialists.status.

-- ── diet_plans ────────────────────────────────────────────────────────────────

ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;

-- Student/member reads all their own plans (specialist-created or self-created)
CREATE POLICY "student_read_own_diet_plans" ON diet_plans
  FOR SELECT USING (student_id = auth.uid());

-- Member manages their own self-created plans (specialist_id IS NULL)
CREATE POLICY "member_manage_own_diet_plans" ON diet_plans
  FOR ALL USING (student_id = auth.uid() AND specialist_id IS NULL);

-- Specialist has full access to plans they created
CREATE POLICY "specialist_manage_own_diet_plans" ON diet_plans
  FOR ALL USING (specialist_id = auth.uid());

-- ── diet_meals ────────────────────────────────────────────────────────────────

ALTER TABLE diet_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diet_meals_access" ON diet_meals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM diet_plans dp
      WHERE dp.id = diet_meals.diet_plan_id
        AND (dp.student_id = auth.uid() OR dp.specialist_id = auth.uid())
    )
  );

-- ── diet_meal_items ───────────────────────────────────────────────────────────

ALTER TABLE diet_meal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diet_meal_items_access" ON diet_meal_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM diet_meals dm
      JOIN diet_plans dp ON dp.id = dm.diet_plan_id
      WHERE dm.id = diet_meal_items.diet_meal_id
        AND (dp.student_id = auth.uid() OR dp.specialist_id = auth.uid())
    )
  );

-- ── meal_logs ─────────────────────────────────────────────────────────────────

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

-- Student manages their own logs (INSERT/UPDATE/SELECT/DELETE)
CREATE POLICY "student_own_meal_logs" ON meal_logs
  FOR ALL USING (student_id = auth.uid());

-- Specialist reads logs of active linked students (read-only — specialist cannot log on behalf of student)
CREATE POLICY "specialist_read_linked_meal_logs" ON meal_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM student_specialists ss
      WHERE ss.student_id = meal_logs.student_id
        AND ss.specialist_id = auth.uid()
        AND ss.status = 'active'
    )
  );

-- ── foods ─────────────────────────────────────────────────────────────────────

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all foods (public database + custom foods from others)
CREATE POLICY "foods_read_all" ON foods
  FOR SELECT USING (true);

-- Users can create their own custom foods
CREATE POLICY "foods_insert_own" ON foods
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update and delete only their own custom foods
CREATE POLICY "foods_update_own" ON foods
  FOR UPDATE USING (created_by = auth.uid() AND is_custom = true);

CREATE POLICY "foods_delete_own" ON foods
  FOR DELETE USING (created_by = auth.uid() AND is_custom = true);
