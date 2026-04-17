import type { Config } from 'drizzle-kit';

export default {
  schema: '../shared/src/database/schema/index.ts',
  out: '../supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.EXPO_PUBLIC_DATABASE_URL as string,
  },
} satisfies Config;
