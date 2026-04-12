import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { profiles } from './auth';

export const foods = pgTable('foods', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: text('category'),
  calories: numeric('calories'), // kcal por 100g
  protein: numeric('protein'), // g por 100g
  carbs: numeric('carbs'), // g por 100g
  fat: numeric('fat'), // g por 100g
  fiber: numeric('fiber'), // g por 100g
  serving_size: numeric('serving_size'), // gramas por porção padrão
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
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const dietMeals = pgTable('diet_meals', {
  id: uuid('id').primaryKey().defaultRandom(),
  diet_plan_id: uuid('diet_plan_id')
    .notNull()
    .references(() => dietPlans.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  time: text('time'), // ex: "08:00" — horário sugerido
  order_index: integer('order_index').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const dietMealItems = pgTable('diet_meal_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  diet_meal_id: uuid('diet_meal_id')
    .notNull()
    .references(() => dietMeals.id, { onDelete: 'cascade' }),
  food_id: uuid('food_id')
    .notNull()
    .references(() => foods.id),
  quantity: numeric('quantity').notNull(), // em gramas
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const mealLogs = pgTable('meal_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => profiles.id),
  diet_plan_id: uuid('diet_plan_id')
    .notNull()
    .references(() => dietPlans.id),
  diet_meal_id: uuid('diet_meal_id')
    .notNull()
    .references(() => dietMeals.id),
  logged_date: date('logged_date').notNull(),
  completed: boolean('completed').notNull().default(false),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
