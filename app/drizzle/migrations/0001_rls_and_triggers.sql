-- Migration: RLS + Triggers
-- Habilita Row Level Security em todas as tabelas e cria políticas base.
-- Trigger: cria profile automaticamente ao registrar no Supabase Auth.
-- Helper: is_professional_of() — usado nas policies de dados do aluno.

-- ============================================================
-- HELPER FUNCTION
-- ============================================================

create or replace function is_professional_of(student_uuid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from student_professionals
    where professional_id = auth.uid()
      and student_id = student_uuid
      and status = 'active'
  );
$$;

-- ============================================================
-- TRIGGER: criar profile ao registrar
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, full_name, account_type, account_status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(
      (new.raw_user_meta_data->>'account_type')::account_type,
      'managed_student'
    ),
    case
      when (new.raw_user_meta_data->>'account_type') = 'professional'
        then 'pending'::account_status
      else null
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- RLS: habilitar em todas as tabelas
-- ============================================================

alter table profiles                  enable row level security;
alter table professional_services     enable row level security;
alter table student_professionals     enable row level security;
alter table physical_assessments      enable row level security;
alter table student_anamnesis         enable row level security;
alter table foods                     enable row level security;
alter table diet_plans                enable row level security;
alter table diet_meals                enable row level security;
alter table diet_meal_items           enable row level security;
alter table meal_logs                 enable row level security;
alter table exercises                 enable row level security;
alter table periodizations            enable row level security;
alter table training_plans            enable row level security;
alter table workouts                  enable row level security;
alter table workout_exercises         enable row level security;
alter table workout_sessions          enable row level security;
alter table workout_session_exercises enable row level security;
alter table student_streaks           enable row level security;
alter table daily_goals               enable row level security;
alter table achievements              enable row level security;
alter table conversations             enable row level security;
alter table messages                  enable row level security;
alter table feature_flags             enable row level security;
alter table feature_access            enable row level security;

-- ============================================================
-- POLICIES: profiles
-- ============================================================

-- Usuário vê o próprio perfil
create policy "profiles: select own"
  on profiles for select
  using (auth.uid() = id);

-- Profissional vê perfis dos seus alunos
create policy "profiles: professional sees students"
  on profiles for select
  using (is_professional_of(id));

-- Admin vê todos
create policy "profiles: admin sees all"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and is_super_admin = true
    )
  );

-- Usuário atualiza o próprio perfil
create policy "profiles: update own"
  on profiles for update
  using (auth.uid() = id);

-- ============================================================
-- POLICIES: professional_services
-- ============================================================

create policy "professional_services: select own"
  on professional_services for select
  using (professional_id = auth.uid());

create policy "professional_services: manage own"
  on professional_services for all
  using (professional_id = auth.uid());

-- ============================================================
-- POLICIES: student_professionals
-- ============================================================

create policy "student_professionals: professional sees own"
  on student_professionals for select
  using (professional_id = auth.uid());

create policy "student_professionals: student sees own"
  on student_professionals for select
  using (student_id = auth.uid());

create policy "student_professionals: professional manages"
  on student_professionals for all
  using (professional_id = auth.uid());

-- ============================================================
-- POLICIES: physical_assessments
-- ============================================================

create policy "physical_assessments: professional manages"
  on physical_assessments for all
  using (is_professional_of(student_id));

create policy "physical_assessments: student reads own"
  on physical_assessments for select
  using (student_id = auth.uid());

-- ============================================================
-- POLICIES: student_anamnesis
-- ============================================================

create policy "student_anamnesis: professional manages"
  on student_anamnesis for all
  using (is_professional_of(student_id));

create policy "student_anamnesis: student manages own"
  on student_anamnesis for all
  using (student_id = auth.uid());

-- ============================================================
-- POLICIES: foods (catálogo global + alimentos customizados)
-- ============================================================

-- Todos leem alimentos globais
create policy "foods: anyone reads"
  on foods for select
  using (true);

-- Profissional gerencia os próprios alimentos customizados
create policy "foods: professional manages custom"
  on foods for all
  using (created_by = auth.uid());

-- ============================================================
-- POLICIES: diet_plans, diet_meals, diet_meal_items
-- ============================================================

create policy "diet_plans: professional manages"
  on diet_plans for all
  using (professional_id = auth.uid());

create policy "diet_plans: student reads own"
  on diet_plans for select
  using (student_id = auth.uid());

create policy "diet_meals: professional manages"
  on diet_meals for all
  using (
    exists (
      select 1 from diet_plans
      where id = diet_meals.diet_plan_id
        and professional_id = auth.uid()
    )
  );

create policy "diet_meals: student reads own"
  on diet_meals for select
  using (
    exists (
      select 1 from diet_plans
      where id = diet_meals.diet_plan_id
        and student_id = auth.uid()
    )
  );

create policy "diet_meal_items: professional manages"
  on diet_meal_items for all
  using (
    exists (
      select 1 from diet_meals dm
      join diet_plans dp on dp.id = dm.diet_plan_id
      where dm.id = diet_meal_items.diet_meal_id
        and dp.professional_id = auth.uid()
    )
  );

create policy "diet_meal_items: student reads own"
  on diet_meal_items for select
  using (
    exists (
      select 1 from diet_meals dm
      join diet_plans dp on dp.id = dm.diet_plan_id
      where dm.id = diet_meal_items.diet_meal_id
        and dp.student_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES: meal_logs
-- ============================================================

create policy "meal_logs: student manages own"
  on meal_logs for all
  using (student_id = auth.uid());

create policy "meal_logs: professional reads"
  on meal_logs for select
  using (is_professional_of(student_id));

-- ============================================================
-- POLICIES: exercises (catálogo)
-- ============================================================

create policy "exercises: anyone reads"
  on exercises for select
  using (true);

create policy "exercises: professional manages own"
  on exercises for all
  using (created_by = auth.uid());

-- ============================================================
-- POLICIES: periodizations, training_plans, workouts, workout_exercises
-- ============================================================

create policy "periodizations: professional manages"
  on periodizations for all
  using (professional_id = auth.uid());

create policy "periodizations: student reads own"
  on periodizations for select
  using (student_id = auth.uid());

create policy "training_plans: professional manages"
  on training_plans for all
  using (
    exists (
      select 1 from periodizations
      where id = training_plans.periodization_id
        and professional_id = auth.uid()
    )
  );

create policy "training_plans: student reads"
  on training_plans for select
  using (
    exists (
      select 1 from periodizations
      where id = training_plans.periodization_id
        and student_id = auth.uid()
    )
  );

create policy "workouts: professional manages"
  on workouts for all
  using (
    exists (
      select 1 from training_plans tp
      join periodizations p on p.id = tp.periodization_id
      where tp.id = workouts.training_plan_id
        and p.professional_id = auth.uid()
    )
  );

create policy "workouts: student reads"
  on workouts for select
  using (
    exists (
      select 1 from training_plans tp
      join periodizations p on p.id = tp.periodization_id
      where tp.id = workouts.training_plan_id
        and p.student_id = auth.uid()
    )
  );

create policy "workout_exercises: professional manages"
  on workout_exercises for all
  using (
    exists (
      select 1 from workouts w
      join training_plans tp on tp.id = w.training_plan_id
      join periodizations p on p.id = tp.periodization_id
      where w.id = workout_exercises.workout_id
        and p.professional_id = auth.uid()
    )
  );

create policy "workout_exercises: student reads"
  on workout_exercises for select
  using (
    exists (
      select 1 from workouts w
      join training_plans tp on tp.id = w.training_plan_id
      join periodizations p on p.id = tp.periodization_id
      where w.id = workout_exercises.workout_id
        and p.student_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES: workout_sessions, workout_session_exercises
-- ============================================================

create policy "workout_sessions: student manages own"
  on workout_sessions for all
  using (student_id = auth.uid());

create policy "workout_sessions: professional reads"
  on workout_sessions for select
  using (is_professional_of(student_id));

create policy "workout_session_exercises: student manages"
  on workout_session_exercises for all
  using (
    exists (
      select 1 from workout_sessions
      where id = workout_session_exercises.session_id
        and student_id = auth.uid()
    )
  );

create policy "workout_session_exercises: professional reads"
  on workout_session_exercises for select
  using (
    exists (
      select 1 from workout_sessions ws
      where ws.id = workout_session_exercises.session_id
        and is_professional_of(ws.student_id)
    )
  );

-- ============================================================
-- POLICIES: gamification
-- ============================================================

create policy "student_streaks: student manages own"
  on student_streaks for all
  using (student_id = auth.uid());

create policy "student_streaks: professional reads"
  on student_streaks for select
  using (is_professional_of(student_id));

create policy "daily_goals: student manages own"
  on daily_goals for all
  using (student_id = auth.uid());

create policy "daily_goals: professional reads"
  on daily_goals for select
  using (is_professional_of(student_id));

create policy "achievements: student reads own"
  on achievements for select
  using (student_id = auth.uid());

create policy "achievements: professional reads"
  on achievements for select
  using (is_professional_of(student_id));

-- ============================================================
-- POLICIES: chat
-- ============================================================

create policy "conversations: participants select"
  on conversations for select
  using (
    professional_id = auth.uid() or student_id = auth.uid()
  );

create policy "conversations: professional creates"
  on conversations for insert
  with check (professional_id = auth.uid());

create policy "messages: participants select"
  on messages for select
  using (
    sender_id = auth.uid() or receiver_id = auth.uid()
  );

create policy "messages: sender inserts"
  on messages for insert
  with check (sender_id = auth.uid());

-- ============================================================
-- POLICIES: system (somente admin)
-- ============================================================

create policy "feature_flags: admin manages"
  on feature_flags for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and is_super_admin = true
    )
  );

create policy "feature_flags: anyone reads"
  on feature_flags for select
  using (true);

create policy "feature_access: admin manages"
  on feature_access for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and is_super_admin = true
    )
  );

create policy "feature_access: anyone reads"
  on feature_access for select
  using (true);
