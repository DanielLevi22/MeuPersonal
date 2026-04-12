import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { profiles } from './auth';

export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon'),
  points: integer('points').notNull().default(0),
  earned_at: timestamp('earned_at', { withTimezone: true }).defaultNow(),
});

// Um registro por aluno — atualizado a cada atividade
export const studentStreaks = pgTable('student_streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id)
    .unique(),
  current_streak: integer('current_streak').notNull().default(0),
  longest_streak: integer('longest_streak').notNull().default(0),
  last_activity: date('last_activity'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Metas diárias do aluno — um registro por (aluno, data)
export const dailyGoals = pgTable(
  'daily_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    student_id: uuid('student_id')
      .notNull()
      .references(() => profiles.id),
    date: date('date').notNull(),
    meals_target: integer('meals_target').notNull().default(4),
    meals_completed: integer('meals_completed').notNull().default(0),
    workout_target: integer('workout_target').notNull().default(1),
    workout_completed: integer('workout_completed').notNull().default(0),
    water_target: integer('water_target').notNull().default(2000), // ml
    water_completed: integer('water_completed').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    unique_student_date: unique().on(table.student_id, table.date),
  })
);
