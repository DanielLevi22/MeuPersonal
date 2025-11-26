-- Create Workout Feedback System
-- This migration creates tables for students to provide detailed feedback after workouts

-- Workout feedback table
create table if not exists workout_feedback (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid references workout_logs(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete cascade not null,
  
  -- Ratings (1-5 scale)
  difficulty_rating int check (difficulty_rating between 1 and 5),
  energy_level int check (energy_level between 1 and 5),
  satisfaction_rating int check (satisfaction_rating between 1 and 5),
  
  -- Mood/Feeling
  mood text check (mood in ('great', 'good', 'ok', 'tired', 'exhausted')),
  
  -- Comments
  notes text,
  exercises_notes jsonb default '{}'::jsonb, -- { "exercise_id": "note" }
  
  -- Metrics
  perceived_exertion int check (perceived_exertion between 1 and 10), -- RPE scale (Rate of Perceived Exertion)
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure one feedback per workout log
  unique(workout_log_id)
);

-- Indexes for performance
create index if not exists idx_workout_feedback_log on workout_feedback(workout_log_id);
create index if not exists idx_workout_feedback_student on workout_feedback(student_id);
create index if not exists idx_workout_feedback_created on workout_feedback(created_at desc);

-- Enable Row Level Security
alter table workout_feedback enable row level security;

-- RLS Policies
create policy "Students can view their own feedback"
  on workout_feedback for select
  using (auth.uid() = student_id);

create policy "Professionals can view feedback from their students"
  on workout_feedback for select
  using (
    exists (
      select 1 from workout_logs wl
      join workouts w on w.id = wl.workout_id
      where wl.id = workout_feedback.workout_log_id
      and w.personal_id = auth.uid()
    )
  );

create policy "Students can create feedback for their workouts"
  on workout_feedback for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from workout_logs wl
      where wl.id = workout_log_id
      and wl.student_id = auth.uid()
    )
  );

create policy "Students can update their feedback within 24 hours"
  on workout_feedback for update
  using (
    auth.uid() = student_id
    and created_at > now() - interval '24 hours'
  )
  with check (
    auth.uid() = student_id
    and created_at > now() - interval '24 hours'
  );

-- Function to update updated_at timestamp
create or replace function update_workout_feedback_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update timestamp
drop trigger if exists on_workout_feedback_updated on workout_feedback;
create trigger on_workout_feedback_updated
  before update on workout_feedback
  for each row
  execute function update_workout_feedback_timestamp();

-- Function to get average feedback ratings for a student
create or replace function get_student_feedback_averages(p_student_id uuid)
returns table (
  avg_difficulty numeric,
  avg_energy numeric,
  avg_satisfaction numeric,
  avg_perceived_exertion numeric,
  total_feedbacks bigint
) as $$
begin
  return query
  select 
    round(avg(difficulty_rating), 2) as avg_difficulty,
    round(avg(energy_level), 2) as avg_energy,
    round(avg(satisfaction_rating), 2) as avg_satisfaction,
    round(avg(perceived_exertion), 2) as avg_perceived_exertion,
    count(*) as total_feedbacks
  from workout_feedback
  where student_id = p_student_id;
end;
$$ language plpgsql security definer;

-- Function to get feedback trends over time
create or replace function get_feedback_trends(
  p_student_id uuid,
  p_days int default 30
)
returns table (
  date date,
  avg_difficulty numeric,
  avg_energy numeric,
  avg_satisfaction numeric,
  feedback_count bigint
) as $$
begin
  return query
  select 
    date_trunc('day', wf.created_at)::date as date,
    round(avg(wf.difficulty_rating), 2) as avg_difficulty,
    round(avg(wf.energy_level), 2) as avg_energy,
    round(avg(wf.satisfaction_rating), 2) as avg_satisfaction,
    count(*) as feedback_count
  from workout_feedback wf
  where wf.student_id = p_student_id
    and wf.created_at > now() - (p_days || ' days')::interval
  group by date_trunc('day', wf.created_at)
  order by date desc;
end;
$$ language plpgsql security definer;

-- Function to get most common moods
create or replace function get_mood_distribution(p_student_id uuid)
returns table (mood text, count bigint, percentage numeric) as $$
begin
  return query
  with mood_counts as (
    select 
      wf.mood,
      count(*) as cnt
    from workout_feedback wf
    where wf.student_id = p_student_id
      and wf.mood is not null
    group by wf.mood
  ),
  total as (
    select sum(cnt) as total_count from mood_counts
  )
  select 
    mc.mood,
    mc.cnt as count,
    round((mc.cnt::numeric / t.total_count * 100), 2) as percentage
  from mood_counts mc, total t
  order by mc.cnt desc;
end;
$$ language plpgsql security definer;

-- Enable realtime for workout_feedback
alter publication supabase_realtime add table workout_feedback;

-- Comments
comment on table workout_feedback is 'Stores detailed feedback from students after completing workouts';
comment on function get_student_feedback_averages is 'Returns average ratings across all feedback for a student';
comment on function get_feedback_trends is 'Returns feedback trends over a specified time period';
comment on function get_mood_distribution is 'Returns distribution of moods reported by a student';
