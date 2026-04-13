import {
  boolean,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const accountTypeEnum = pgEnum('account_type', [
  'admin',
  'professional',
  'managed_student',
  'autonomous_student',
]);

// Aprovação só se aplica a professionals — null para students e admin
export const accountStatusEnum = pgEnum('account_status', [
  'pending',
  'active',
  'inactive',
]);

export const serviceTypeEnum = pgEnum('service_type', [
  'personal_training',
  'nutrition_consulting',
]);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // = auth.users.id
  email: text('email').notNull(),
  full_name: text('full_name'),
  avatar_url: text('avatar_url'),
  account_type: accountTypeEnum('account_type').notNull(),
  account_status: accountStatusEnum('account_status'),
  is_super_admin: boolean('is_super_admin').notNull().default(false),
  birth_date: date('birth_date'),
  gender: text('gender'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Tipos de serviço que o profissional oferece — escolhidos no cadastro
// Tabela separada porque um profissional pode ter personal_training E nutrition_consulting
export const professionalServices = pgTable('professional_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  professional_id: uuid('professional_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  service_type: serviceTypeEnum('service_type').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
