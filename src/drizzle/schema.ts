import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const userRoles = pgEnum('user_role', ['personal', 'student']);
export const inviteStatus = pgEnum('invite_status', ['active', 'pending', 'inactive']);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().notNull(), // References auth.users.id
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: userRoles('role').default('student'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const studentsPersonals = pgTable('students_personals', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  personalId: uuid('personal_id').references(() => profiles.id).notNull(),
  studentId: uuid('student_id').references(() => profiles.id).notNull(),
  status: inviteStatus('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const exercises = pgTable('exercises', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group'),
  videoUrl: text('video_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workouts = pgTable('workouts', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  personalId: uuid('personal_id').references(() => profiles.id).notNull(),
  studentId: uuid('student_id').references(() => profiles.id), // Nullable if it's a template
  title: text('title').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workoutItems = pgTable('workout_items', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  workoutId: uuid('workout_id').references(() => workouts.id).notNull(),
  exerciseId: uuid('exercise_id').references(() => exercises.id).notNull(),
  sets: integer('sets'),
  reps: text('reps'),
  weight: text('weight'),
  restTime: integer('rest_time'), // in seconds
  notes: text('notes'),
  order: integer('order').default(0),
});

export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  workoutId: uuid('workout_id').references(() => workouts.id).notNull(),
  studentId: uuid('student_id').references(() => profiles.id).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
});

export const workoutSessionItems = pgTable('workout_session_items', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  sessionId: uuid('session_id').references(() => workoutSessions.id).notNull(),
  workoutItemId: uuid('workout_item_id').references(() => workoutItems.id).notNull(),
  setsCompleted: integer('sets_completed').default(0),
  actualWeight: text('actual_weight'),
  actualReps: text('actual_reps'),
  notes: text('notes'),
});
