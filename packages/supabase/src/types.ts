// Database types will be generated from Supabase schema
// For now, using placeholder types

export type Database = any;

// User roles
export type UserRole = 'personal' | 'student' | 'nutritionist';

// Common types
export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at: string;
  updated_at: string;
}
