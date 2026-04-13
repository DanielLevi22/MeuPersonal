import type { Session, User } from "@supabase/supabase-js";

export type AccountType = "admin" | "professional" | "managed_student" | "autonomous_student";

export type AccountStatus = "pending" | "active" | "inactive";

export type ServiceType = "personal_training" | "nutrition_consulting";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  account_type: AccountType;
  account_status: AccountStatus | null;
  is_super_admin: boolean;
  birth_date: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalService {
  id: string;
  professional_id: string;
  service_type: ServiceType;
  is_active: boolean;
  created_at: string;
}

export interface ProfileWithServices extends Profile {
  professional_services: ProfessionalService[];
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
}
