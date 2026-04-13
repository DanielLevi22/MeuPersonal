import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { profiles } from './auth';

export const messageTypeEnum = pgEnum('message_type', [
  'text',
  'image',
  'audio',
  'file',
]);

// Um canal por par profissional-aluno — sem duplicidade
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    professional_id: uuid('professional_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    student_id: uuid('student_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    last_message_at: timestamp('last_message_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.professional_id, table.student_id)]
);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversation_id: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  sender_id: uuid('sender_id')
    .notNull()
    .references(() => profiles.id),
  receiver_id: uuid('receiver_id')
    .notNull()
    .references(() => profiles.id),
  content: text('content').notNull(),
  message_type: messageTypeEnum('message_type').notNull().default('text'),
  media_url: text('media_url'),
  // null = não lida; preenchido = timestamp da leitura
  read_at: timestamp('read_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
