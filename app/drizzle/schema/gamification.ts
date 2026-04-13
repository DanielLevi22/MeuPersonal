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

// Um registro único por aluno — atualizado a cada atividade
export const studentStreaks = pgTable('student_streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  student_id: uuid('student_id')
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  current_streak: integer('current_streak').notNull().default(0),
  longest_streak: integer('longest_streak').notNull().default(0),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  last_activity_at: date('last_activity_at'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Metas diárias — um registro por (aluno, data) via upsert
export const dailyGoals = pgTable(
  'daily_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    student_id: uuid('student_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    water_target: integer('water_target').notNull().default(2000), // ml
    water_completed: integer('water_completed').notNull().default(0),
    meals_completed: integer('meals_completed').notNull().default(0),
    workout_completed: boolean('workout_completed').notNull().default(false),
    completed: boolean('completed').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.student_id, table.date)]
);

export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  points: integer('points').notNull().default(0),
  unlocked_at: timestamp('unlocked_at', { withTimezone: true }).defaultNow(),
});
