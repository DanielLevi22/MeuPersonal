import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const userRoles = pgEnum('user_role', ['personal', 'student']);
export const inviteStatus = pgEnum('invite_status', ['active', 'pending', 'inactive']);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().notNull(), // References auth.users.id
  email: text('email').notNull(),
  fullName: text('full_name'),
  phone: text('phone'),
  inviteCode: text('invite_code'),
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

export const physicalAssessments = pgTable('physical_assessments', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  studentId: uuid('student_id').references(() => profiles.id).notNull(),
  personalId: uuid('personal_id').references(() => profiles.id).notNull(),
  weight: text('weight'), // Changed to text to match other numeric fields in schema if needed, but migration said numeric. Let's stick to numeric/decimal in DB but text in TS often easier for inputs. Actually migration used numeric. Drizzle 'decimal' or 'numeric' maps to string in JS usually to preserve precision. Let's use 'numeric'.
  height: text('height'),
  neck: text('neck'),
  shoulder: text('shoulder'),
  chest: text('chest'),
  armRightRelaxed: text('arm_right_relaxed'),
  armLeftRelaxed: text('arm_left_relaxed'),
  armRightContracted: text('arm_right_contracted'),
  armLeftContracted: text('arm_left_contracted'),
  forearm: text('forearm'),
  waist: text('waist'),
  abdomen: text('abdomen'),
  hips: text('hips'),
  thighProximal: text('thigh_proximal'),
  thighDistal: text('thigh_distal'),
  calf: text('calf'),
  skinfoldChest: text('skinfold_chest'),
  skinfoldAbdominal: text('skinfold_abdominal'),
  skinfoldThigh: text('skinfold_thigh'),
  skinfoldTriceps: text('skinfold_triceps'),
  skinfoldSuprailiac: text('skinfold_suprailiac'),
  skinfoldSubscapular: text('skinfold_subscapular'),
  skinfoldMidaxillary: text('skinfold_midaxillary'),
  notes: text('notes'),
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
  intensity: integer('intensity'),
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

export const workoutAssignments = pgTable('workout_assignments', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  workoutId: uuid('workout_id').references(() => workouts.id).notNull(),
  studentId: uuid('student_id').references(() => profiles.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

export const dailyGoals = pgTable('daily_goals', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  studentId: uuid('student_id').references(() => profiles.id).notNull(),
  date: timestamp('date', { mode: 'string' }).notNull(), // Using string for date to match service usage
  mealsTarget: integer('meals_target').default(4),
  mealsCompleted: integer('meals_completed').default(0),
  workoutTarget: integer('workout_target').default(1),
  workoutCompleted: integer('workout_completed').default(0),
  completed: boolean('completed').default(false),
  completionPercentage: integer('completion_percentage').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const achievements = pgTable('achievements', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  studentId: uuid('student_id').references(() => profiles.id).notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon'),
  earnedAt: timestamp('earned_at').defaultNow(),
  points: integer('points').default(0),
});

export const streaks = pgTable('streaks', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  studentId: uuid('student_id').references(() => profiles.id).notNull(),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastActivityDate: timestamp('last_activity_date', { mode: 'string' }),
  freezeAvailable: integer('freeze_available').default(0),
  lastFreezeDate: timestamp('last_freeze_date', { mode: 'string' }),
  updatedAt: timestamp('updated_at').defaultNow(),
});
