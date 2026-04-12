import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.EXPO_PUBLIC_DATABASE_URL as string,
  },
} satisfies Config;
