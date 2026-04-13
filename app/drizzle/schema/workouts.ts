import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { profiles } from './auth';

export const periodizationStatusEnum = pgEnum('periodization_status', [
  'planned',
  'active',
  'completed',
]);

// Catálogo de exercícios — globais (is_verified=true) ou criados por professionals
export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  muscle_group: text('muscle_group'),
  video_url: text('video_url'),
  is_verified: boolean('is_verified').notNull().default(false),
  created_by: uuid('created_by').references(() => profiles.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Macrociclo de treinamento (ex: "Projeto Verão 2026")
export const periodizations = pgTable('periodizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  professional_id: uuid('professional_id')
    .notNull()
    .references(() => profiles.id),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id),
  name: text('name').notNull(),
  objective: text('objective'), // hipertrofia, força, emagrecimento...
  status: periodizationStatusEnum('status').notNull().default('planned'),
  start_date: text('start_date'), // text evita timezone issues no mobile
  end_date: text('end_date'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Fase dentro de uma periodização (ex: "Fase de Adaptação")
export const trainingPlans = pgTable('training_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  periodization_id: uuid('periodization_id')
    .notNull()
    .references(() => periodizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order_index: integer('order_index').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Treino específico dentro de uma fase (ex: "Treino A — Peito e Tríceps")
export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  training_plan_id: uuid('training_plan_id')
    .notNull()
    .references(() => trainingPlans.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  day_of_week: text('day_of_week'), // ex: "monday" ou null = qualquer dia
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Prescrição de exercício dentro de um treino
export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workout_id: uuid('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exercise_id: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id),
  sets: integer('sets'),
  reps: text('reps'),           // "8-12", "AMRAP", "até a falha"
  rest_seconds: integer('rest_seconds'),
  order_index: integer('order_index').notNull().default(0),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Uma execução real de treino pelo aluno
export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id),
  workout_id: uuid('workout_id')
    .notNull()
    .references(() => workouts.id),
  started_at: timestamp('started_at', { withTimezone: true }).notNull(),
  finished_at: timestamp('finished_at', { withTimezone: true }),
  intensity: integer('intensity'), // percepção de esforço 1-10
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Exercícios executados na sessão
// sets_data: [{set: 1, reps: 10, weight: 80, completed: true}, ...]
export const workoutSessionExercises = pgTable('workout_session_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  session_id: uuid('session_id')
    .notNull()
    .references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exercise_id: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id),
  sets_data: jsonb('sets_data').notNull().default([]),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
