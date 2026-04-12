-- ============================================================
-- TRIGGER: auto-criar profile quando usuário se cadastra
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================

alter table profiles                 enable row level security;
alter table student_professionals    enable row level security;
alter table student_invites          enable row level security;
alter table physical_assessments     enable row level security;
alter table foods                    enable row level security;
alter table diet_plans               enable row level security;
alter table diet_meals               enable row level security;
alter table diet_meal_items          enable row level security;
alter table meal_logs                enable row level security;
alter table exercises                enable row level security;
alter table periodizations           enable row level security;
alter table training_plans           enable row level security;
alter table workouts                 enable row level security;
alter table workout_exercises        enable row level security;
alter table workout_sessions         enable row level security;
alter table workout_session_exercises enable row level security;
alter table achievements             enable row level security;
alter table student_streaks          enable row level security;
alter table daily_goals              enable row level security;
alter table feature_flags            enable row level security;
alter table feature_access           enable row level security;

-- ============================================================
-- HELPER: verifica se o usuário autenticado é professional do aluno
-- ============================================================

create or replace function public.is_professional_of(student uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from student_professionals
    where professional_id = auth.uid()
      and student_id = student
      and status = 'active'
  );
$$;

-- ============================================================
-- PROFILES
-- ============================================================

-- Vê o próprio perfil ou perfis dos seus alunos/personal
create policy "profiles: select own and related"
  on profiles for select
  using (
    id = auth.uid()
    or is_professional_of(id)
    or exists (
      select 1 from student_professionals
      where student_id = auth.uid()
        and professional_id = profiles.id
        and status = 'active'
    )
  );

-- Só o próprio usuário atualiza seu perfil
create policy "profiles: update own"
  on profiles for update
  using (id = auth.uid());

-- ============================================================
-- STUDENT_PROFESSIONALS
-- ============================================================

create policy "student_professionals: professional sees all"
  on student_professionals for select
  using (
    professional_id = auth.uid()
    or student_id = auth.uid()
  );

create policy "student_professionals: professional inserts"
  on student_professionals for insert
  with check (professional_id = auth.uid());

create policy "student_professionals: professional updates"
  on student_professionals for update
  using (professional_id = auth.uid());

-- ============================================================
-- STUDENT_INVITES
-- ============================================================

create policy "student_invites: professional manages"
  on student_invites for select
  using (professional_id = auth.uid());

create policy "student_invites: professional inserts"
  on student_invites for insert
  with check (professional_id = auth.uid());

create policy "student_invites: professional updates"
  on student_invites for update
  using (professional_id = auth.uid());

-- ============================================================
-- PHYSICAL_ASSESSMENTS
-- ============================================================

create policy "physical_assessments: select"
  on physical_assessments for select
  using (
    professional_id = auth.uid()
    or student_id = auth.uid()
  );

create policy "physical_assessments: professional inserts"
  on physical_assessments for insert
  with check (professional_id = auth.uid());

create policy "physical_assessments: professional updates"
  on physical_assessments for update
  using (professional_id = auth.uid());

create policy "physical_assessments: professional deletes"
  on physical_assessments for delete
  using (professional_id = auth.uid());

-- ============================================================
-- FOODS (catálogo compartilhado)
-- ============================================================

-- Todos os usuários autenticados podem ver alimentos
create policy "foods: authenticated can select"
  on foods for select
  using (auth.uid() is not null);

-- Qualquer usuário autenticado pode criar alimentos
create policy "foods: authenticated can insert"
  on foods for insert
  with check (auth.uid() is not null);

-- Só o criador atualiza
create policy "foods: creator updates"
  on foods for update
  using (created_by = auth.uid());

-- ============================================================
-- DIET_PLANS
-- ============================================================

create policy "diet_plans: select"
  on diet_plans for select
  using (
    professional_id = auth.uid()
    or student_id = auth.uid()
  );

create policy "diet_plans: professional inserts"
  on diet_plans for insert
  with check (professional_id = auth.uid());

create policy "diet_plans: professional updates"
  on diet_plans for update
  using (professional_id = auth.uid());

create policy "diet_plans: professional deletes"
  on diet_plans for delete
  using (professional_id = auth.uid());

-- ============================================================
-- DIET_MEALS (acesso via plano)
-- ============================================================

create policy "diet_meals: select via plan"
  on diet_meals for select
  using (
    exists (
      select 1 from diet_plans
      where id = diet_meals.diet_plan_id
        and (professional_id = auth.uid() or student_id = auth.uid())
    )
  );

create policy "diet_meals: professional inserts"
  on diet_meals for insert
  with check (
    exists (
      select 1 from diet_plans
      where id = diet_meals.diet_plan_id
        and professional_id = auth.uid()
    )
  );

create policy "diet_meals: professional updates"
  on diet_meals for update
  using (
    exists (
      select 1 from diet_plans
      where id = diet_meals.diet_plan_id
        and professional_id = auth.uid()
    )
  );

create policy "diet_meals: professional deletes"
  on diet_meals for delete
  using (
    exists (
      select 1 from diet_plans
      where id = diet_meals.diet_plan_id
        and professional_id = auth.uid()
    )
  );

-- ============================================================
-- DIET_MEAL_ITEMS (acesso via refeição → plano)
-- ============================================================

create policy "diet_meal_items: select via meal"
  on diet_meal_items for select
  using (
    exists (
      select 1 from diet_meals dm
      join diet_plans dp on dp.id = dm.diet_plan_id
      where dm.id = diet_meal_items.diet_meal_id
        and (dp.professional_id = auth.uid() or dp.student_id = auth.uid())
    )
  );

create policy "diet_meal_items: professional inserts"
  on diet_meal_items for insert
  with check (
    exists (
      select 1 from diet_meals dm
      join diet_plans dp on dp.id = dm.diet_plan_id
      where dm.id = diet_meal_items.diet_meal_id
        and dp.professional_id = auth.uid()
    )
  );

create policy "diet_meal_items: professional deletes"
  on diet_meal_items for delete
  using (
    exists (
      select 1 from diet_meals dm
      join diet_plans dp on dp.id = dm.diet_plan_id
      where dm.id = diet_meal_items.diet_meal_id
        and dp.professional_id = auth.uid()
    )
  );

-- ============================================================
-- MEAL_LOGS
-- ============================================================

create policy "meal_logs: select"
  on meal_logs for select
  using (
    student_id = auth.uid()
    or is_professional_of(student_id)
  );

create policy "meal_logs: student inserts own"
  on meal_logs for insert
  with check (student_id = auth.uid());

create policy "meal_logs: student updates own"
  on meal_logs for update
  using (student_id = auth.uid());

create policy "meal_logs: student deletes own"
  on meal_logs for delete
  using (student_id = auth.uid());

-- ============================================================
-- EXERCISES (catálogo compartilhado)
-- ============================================================

create policy "exercises: authenticated can select"
  on exercises for select
  using (auth.uid() is not null);

create policy "exercises: professional inserts"
  on exercises for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'professional'
    )
  );

create policy "exercises: creator updates"
  on exercises for update
  using (created_by = auth.uid());

-- ============================================================
-- PERIODIZATIONS
-- ============================================================

create policy "periodizations: select"
  on periodizations for select
  using (
    professional_id = auth.uid()
    or student_id = auth.uid()
  );

create policy "periodizations: professional inserts"
  on periodizations for insert
  with check (professional_id = auth.uid());

create policy "periodizations: professional updates"
  on periodizations for update
  using (professional_id = auth.uid());

create policy "periodizations: professional deletes"
  on periodizations for delete
  using (professional_id = auth.uid());

-- ============================================================
-- TRAINING_PLANS (acesso via periodização)
-- ============================================================

create policy "training_plans: select via periodization"
  on training_plans for select
  using (
    exists (
      select 1 from periodizations
      where id = training_plans.periodization_id
        and (professional_id = auth.uid() or student_id = auth.uid())
    )
  );

create policy "training_plans: professional inserts"
  on training_plans for insert
  with check (
    exists (
      select 1 from periodizations
      where id = training_plans.periodization_id
        and professional_id = auth.uid()
    )
  );

create policy "training_plans: professional updates"
  on training_plans for update
  using (
    exists (
      select 1 from periodizations
      where id = training_plans.periodization_id
        and professional_id = auth.uid()
    )
  );

-- ============================================================
-- WORKOUTS
-- ============================================================

create policy "workouts: select"
  on workouts for select
  using (
    professional_id = auth.uid()
    or student_id = auth.uid()
  );

create policy "workouts: professional inserts"
  on workouts for insert
  with check (professional_id = auth.uid());

create policy "workouts: professional updates"
  on workouts for update
  using (professional_id = auth.uid());

create policy "workouts: professional deletes"
  on workouts for delete
  using (professional_id = auth.uid());

-- ============================================================
-- WORKOUT_EXERCISES (acesso via treino)
-- ============================================================

create policy "workout_exercises: select via workout"
  on workout_exercises for select
  using (
    exists (
      select 1 from workouts
      where id = workout_exercises.workout_id
        and (professional_id = auth.uid() or student_id = auth.uid())
    )
  );

create policy "workout_exercises: professional inserts"
  on workout_exercises for insert
  with check (
    exists (
      select 1 from workouts
      where id = workout_exercises.workout_id
        and professional_id = auth.uid()
    )
  );

create policy "workout_exercises: professional updates"
  on workout_exercises for update
  using (
    exists (
      select 1 from workouts
      where id = workout_exercises.workout_id
        and professional_id = auth.uid()
    )
  );

-- ============================================================
-- WORKOUT_SESSIONS
-- ============================================================

create policy "workout_sessions: select"
  on workout_sessions for select
  using (
    student_id = auth.uid()
    or is_professional_of(student_id)
  );

create policy "workout_sessions: student inserts own"
  on workout_sessions for insert
  with check (student_id = auth.uid());

create policy "workout_sessions: student updates own"
  on workout_sessions for update
  using (student_id = auth.uid());

-- ============================================================
-- WORKOUT_SESSION_EXERCISES (acesso via sessão)
-- ============================================================

create policy "workout_session_exercises: select via session"
  on workout_session_exercises for select
  using (
    exists (
      select 1 from workout_sessions
      where id = workout_session_exercises.session_id
        and (
          student_id = auth.uid()
          or is_professional_of(student_id)
        )
    )
  );

create policy "workout_session_exercises: student inserts via session"
  on workout_session_exercises for insert
  with check (
    exists (
      select 1 from workout_sessions
      where id = workout_session_exercises.session_id
        and student_id = auth.uid()
    )
  );

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================

create policy "achievements: select"
  on achievements for select
  using (
    student_id = auth.uid()
    or is_professional_of(student_id)
  );

-- Inserção via service role (lógica de negócio server-side)
create policy "achievements: service role inserts"
  on achievements for insert
  with check (auth.uid() is not null);

-- ============================================================
-- STUDENT_STREAKS
-- ============================================================

create policy "student_streaks: select"
  on student_streaks for select
  using (
    student_id = auth.uid()
    or is_professional_of(student_id)
  );

create policy "student_streaks: student manages own"
  on student_streaks for insert
  with check (student_id = auth.uid());

create policy "student_streaks: student updates own"
  on student_streaks for update
  using (student_id = auth.uid());

-- ============================================================
-- DAILY_GOALS
-- ============================================================

create policy "daily_goals: select"
  on daily_goals for select
  using (
    student_id = auth.uid()
    or is_professional_of(student_id)
  );

create policy "daily_goals: student inserts own"
  on daily_goals for insert
  with check (student_id = auth.uid());

create policy "daily_goals: student updates own"
  on daily_goals for update
  using (student_id = auth.uid());

-- ============================================================
-- FEATURE_FLAGS e FEATURE_ACCESS (somente leitura via anon/user)
-- ============================================================

create policy "feature_flags: authenticated can select"
  on feature_flags for select
  using (auth.uid() is not null);

create policy "feature_access: authenticated can select"
  on feature_access for select
  using (auth.uid() is not null);
