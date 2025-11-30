-- Migration: Allow pending students in diet_plans and periodizations
-- Description: Drops the foreign key constraint to profiles table for student_id to allow referencing pending students from the students table.
-- Date: 2025-11-27

DO $$
BEGIN
  -- Diet Plans
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'diet_plans_student_id_fkey' AND table_name = 'diet_plans') THEN
    ALTER TABLE diet_plans DROP CONSTRAINT diet_plans_student_id_fkey;
  END IF;

  -- Periodizations
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'periodizations_student_id_fkey' AND table_name = 'periodizations') THEN
    ALTER TABLE periodizations DROP CONSTRAINT periodizations_student_id_fkey;
  END IF;
  
  -- Workout Assignments (if applicable, good measure)
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'workout_assignments_student_id_fkey' AND table_name = 'workout_assignments') THEN
    ALTER TABLE workout_assignments DROP CONSTRAINT workout_assignments_student_id_fkey;
  END IF;

  -- Daily Goals (CRITICAL for gamification triggers)
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'daily_goals_student_id_fkey' AND table_name = 'daily_goals') THEN
    ALTER TABLE daily_goals DROP CONSTRAINT daily_goals_student_id_fkey;
  END IF;

  -- Leaderboard Scores
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leaderboard_scores_student_id_fkey' AND table_name = 'leaderboard_scores') THEN
    ALTER TABLE leaderboard_scores DROP CONSTRAINT leaderboard_scores_student_id_fkey;
  END IF;

  -- Student Streaks
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_streaks_student_id_fkey' AND table_name = 'student_streaks') THEN
    ALTER TABLE student_streaks DROP CONSTRAINT student_streaks_student_id_fkey;
  END IF;

  -- Achievements
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'achievements_student_id_fkey' AND table_name = 'achievements') THEN
    ALTER TABLE achievements DROP CONSTRAINT achievements_student_id_fkey;
  END IF;

END $$;
