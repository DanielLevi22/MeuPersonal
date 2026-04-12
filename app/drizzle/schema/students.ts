import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { profiles } from './auth';

export const relationshipStatusEnum = pgEnum('relationship_status', [
  'pending',
  'active',
  'inactive',
]);

export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'expired']);

// Vínculo entre personal e aluno
export const studentProfessionals = pgTable('student_professionals', {
  id: uuid('id').primaryKey().defaultRandom(),
  professional_id: uuid('professional_id')
    .notNull()
    .references(() => profiles.id),
  student_id: uuid('student_id').references(() => profiles.id), // nullable: convite pendente sem conta
  status: relationshipStatusEnum('status').notNull().default('pending'),
  invited_by: uuid('invited_by').references(() => profiles.id),
  started_at: timestamp('started_at', { withTimezone: true }).defaultNow(),
  ended_at: timestamp('ended_at', { withTimezone: true }),
  ended_reason: text('ended_reason'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Convites enviados por email
export const studentInvites = pgTable('student_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  professional_id: uuid('professional_id')
    .notNull()
    .references(() => profiles.id),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  status: inviteStatusEnum('status').notNull().default('pending'),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Avaliação física
export const physicalAssessments = pgTable('physical_assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  professional_id: uuid('professional_id')
    .notNull()
    .references(() => profiles.id),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id),
  assessed_at: timestamp('assessed_at', { withTimezone: true }).notNull(),
  weight: text('weight'), // em kg, text para preservar precisão do input
  height: text('height'), // em cm
  body_fat: text('body_fat'),
  muscle_mass: text('muscle_mass'),
  notes: text('notes'),
  photos: text('photos').array(), // array de URLs do Supabase Storage
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
