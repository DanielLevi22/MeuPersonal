import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { profiles } from './auth';

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  muscle_group: text('muscle_group'),
  video_url: text('video_url'),
  is_verified: integer('is_verified').notNull().default(0), // 0=false, 1=true (compatível com SQLite se necessário)
  created_by: uuid('created_by').references(() => profiles.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const periodizations = pgTable('periodizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  professional_id: uuid('professional_id')
    .notNull()
    .references(() => profiles.id),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id),
  name: text('name').notNull(),
  objective: text('objective'),
  start_date: text('start_date'), // date como text — evita timezone issues no mobile
  end_date: text('end_date'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const trainingPlans = pgTable('training_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  periodization_id: uuid('periodization_id')
    .notNull()
    .references(() => periodizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phase: text('phase'),
  week_number: integer('week_number'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  training_plan_id: uuid('training_plan_id').references(() => trainingPlans.id),
  professional_id: uuid('professional_id')
    .notNull()
    .references(() => profiles.id),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id),
  name: text('name').notNull(),
  type: text('type'), // ex: "A", "B", "C" ou "musculação", "cardio"
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workout_id: uuid('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exercise_id: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id),
  sets: integer('sets'),
  reps: text('reps'), // ex: "8-12" ou "até a falha"
  rest_seconds: integer('rest_seconds'),
  order_index: integer('order_index').notNull().default(0),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Sessão = uma execução de treino pelo aluno
export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workout_id: uuid('workout_id')
    .notNull()
    .references(() => workouts.id),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id),
  started_at: timestamp('started_at', { withTimezone: true }).notNull(),
  finished_at: timestamp('finished_at', { withTimezone: true }),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Cada exercício executado dentro de uma sessão
// sets_data: [{set: 1, reps: 10, weight: 80, completed: true}, ...]
export const workoutSessionExercises = pgTable('workout_session_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  session_id: uuid('session_id')
    .notNull()
    .references(() => workoutSessions.id, { onDelete: 'cascade' }),
  workout_exercise_id: uuid('workout_exercise_id')
    .notNull()
    .references(() => workoutExercises.id),
  sets_data: jsonb('sets_data'), // [{set, reps, weight, completed}]
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
