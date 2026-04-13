import {
  boolean,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { profiles, serviceTypeEnum } from './auth';

export const relationshipStatusEnum = pgEnum('relationship_status', [
  'pending',
  'active',
  'inactive',
]);

// Vínculo ativo entre profissional e aluno
// service_type define se é um personal ou nutricionista gerenciando o aluno
export const studentProfessionals = pgTable('student_professionals', {
  id: uuid('id').primaryKey().defaultRandom(),
  professional_id: uuid('professional_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  service_type: serviceTypeEnum('service_type').notNull(),
  status: relationshipStatusEnum('status').notNull().default('active'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Avaliação física — histórico temporal (múltiplas avaliações por aluno)
export const physicalAssessments = pgTable('physical_assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  professional_id: uuid('professional_id').references(() => profiles.id),
  // Biometria básica
  weight: numeric('weight'), // kg
  height: numeric('height'), // cm
  bmi: numeric('bmi'),
  bmr: numeric('bmr'),
  body_fat_percentage: numeric('body_fat_percentage'),
  // Circunferências (cm)
  neck: numeric('neck'),
  shoulder: numeric('shoulder'),
  chest: numeric('chest'),
  waist: numeric('waist'),
  abdomen: numeric('abdomen'),
  hip: numeric('hip'),
  arm_relaxed: numeric('arm_relaxed'),
  arm_contracted: numeric('arm_contracted'),
  forearm: numeric('forearm'),
  thigh_proximal: numeric('thigh_proximal'),
  thigh_medial: numeric('thigh_medial'),
  calf: numeric('calf'),
  // Dobras cutâneas (mm)
  skinfold_chest: numeric('skinfold_chest'),
  skinfold_abdominal: numeric('skinfold_abdominal'),
  skinfold_thigh: numeric('skinfold_thigh'),
  skinfold_triceps: numeric('skinfold_triceps'),
  skinfold_suprailiac: numeric('skinfold_suprailiac'),
  skinfold_subscapular: numeric('skinfold_subscapular'),
  skinfold_midaxillary: numeric('skinfold_midaxillary'),
  // Fotos de progresso (URLs do Supabase Storage)
  photo_front: text('photo_front'),
  photo_back: text('photo_back'),
  photo_left: text('photo_left'),
  photo_right: text('photo_right'),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Anamnese do aluno — respostas em JSONB para flexibilidade de perguntas
// Um registro único por aluno (upsert)
export const studentAnamnesis = pgTable('student_anamnesis', {
  id: uuid('id').primaryKey().defaultRandom(),
  student_id: uuid('student_id')
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  // Respostas salvas como { "pergunta": "resposta", ... }
  // Permite que o professional adicione perguntas sem mudar o schema
  responses: jsonb('responses').notNull().default({}),
  completed: boolean('completed').notNull().default(false),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
