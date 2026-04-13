import {
  boolean,
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { profiles } from './auth';

export const dietPlanStatusEnum = pgEnum('diet_plan_status', ['draft', 'active', 'inactive']);

// Catálogo global de alimentos com macros por 100g
export const foods = pgTable('foods', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  calories: numeric('calories'), // kcal por 100g
  protein: numeric('protein'), // g por 100g
  carbs: numeric('carbs'), // g por 100g
  fat: numeric('fat'), // g por 100g
  fiber: numeric('fiber'), // g por 100g
  serving_size: numeric('serving_size'), // gramas por porção padrão
  is_custom: boolean('is_custom').notNull().default(false),
  // null = alimento global; preenchido = criado por profissional (uso privado)
  created_by: uuid('created_by').references(() => profiles.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const dietPlans = pgTable('diet_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  professional_id: uuid('professional_id')
    .notNull()
    .references(() => profiles.id),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id),
  name: text('name').notNull(),
  status: dietPlanStatusEnum('status').notNull().default('active'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Refeição dentro de um plano (café, almoço, lanche...)
export const dietMeals = pgTable('diet_meals', {
  id: uuid('id').primaryKey().defaultRandom(),
  diet_plan_id: uuid('diet_plan_id')
    .notNull()
    .references(() => dietPlans.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  meal_time: text('meal_time'), // ex: "08:00"
  day_of_week: text('day_of_week'), // ex: "monday" ou null = todos os dias
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Alimentos de cada refeição com quantidade em gramas
export const dietMealItems = pgTable('diet_meal_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  diet_meal_id: uuid('diet_meal_id')
    .notNull()
    .references(() => dietMeals.id, { onDelete: 'cascade' }),
  food_id: uuid('food_id')
    .notNull()
    .references(() => foods.id),
  quantity: numeric('quantity').notNull(), // gramas
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Registro diário do aluno — refeição X foi completada no dia Y
export const mealLogs = pgTable('meal_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id),
  diet_meal_id: uuid('diet_meal_id')
    .notNull()
    .references(() => dietMeals.id),
  logged_date: date('logged_date').notNull(),
  completed: boolean('completed').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
