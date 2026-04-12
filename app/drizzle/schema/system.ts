import { boolean, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

// Feature flags globais (ligado/desligado por chave)
export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  flag_key: text('flag_key').notNull().unique(),
  flag_name: text('flag_name').notNull(),
  description: text('description'),
  is_enabled: boolean('is_enabled').notNull().default(false),
  rollout_percentage: integer('rollout_percentage').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Controle de acesso por tier de assinatura
export const featureAccess = pgTable(
  'feature_access',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscription_tier: text('subscription_tier').notNull(), // ex: 'free', 'basic', 'pro'
    feature_key: text('feature_key').notNull(),
    is_enabled: boolean('is_enabled').notNull().default(true),
    limit_value: integer('limit_value'), // null = sem limite
  },
  (table) => ({
    unique_tier_feature: unique().on(table.subscription_tier, table.feature_key),
  })
);
