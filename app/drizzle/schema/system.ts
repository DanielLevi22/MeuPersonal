import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'basic', 'pro', 'elite']);

// Flags para ligar/desligar módulos sem novo deploy
export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  flag_key: text('flag_key').notNull().unique(),
  is_enabled: boolean('is_enabled').notNull().default(false),
  rollout_percentage: integer('rollout_percentage').notNull().default(100),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Controle de acesso por tier de assinatura do profissional
// limit_value null = sem limite para aquele tier
export const featureAccess = pgTable(
  'feature_access',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscription_tier: subscriptionTierEnum('subscription_tier').notNull(),
    feature_key: text('feature_key').notNull(),
    is_enabled: boolean('is_enabled').notNull().default(true),
    limit_value: integer('limit_value'),
  },
  (table) => [unique().on(table.subscription_tier, table.feature_key)]
);
