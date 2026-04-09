-- Migration to create the student_anamnesis table
-- Run this in your Supabase SQL Editor

-- Create the table if it doesn't exist
create table if not exists public.student_anamnesis (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references auth.users not null,
  responses jsonb not null default '{}'::jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id)
);

-- Enable RLS (safe to run multiple times)
alter table public.student_anamnesis enable row level security;

-- Policies (Drop first to avoid errors on re-run)

drop policy if exists "Users can view their own anamnesis" on public.student_anamnesis;
create policy "Users can view their own anamnesis"
on public.student_anamnesis for select
using (auth.uid() = student_id);

drop policy if exists "Users can insert their own anamnesis" on public.student_anamnesis;
create policy "Users can insert their own anamnesis"
on public.student_anamnesis for insert
with check (auth.uid() = student_id);

drop policy if exists "Users can update their own anamnesis" on public.student_anamnesis;
create policy "Users can update their own anamnesis"
on public.student_anamnesis for update
using (auth.uid() = student_id);

drop policy if exists "Coaches can view their students' anamnesis" on public.student_anamnesis;
create policy "Coaches can view their students' anamnesis"
on public.student_anamnesis for select
using (
  exists (
    select 1 from public.coachings c
    where c.client_id = student_anamnesis.student_id
    and c.professional_id = auth.uid()
    and c.status = 'active'
  )
);
