import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, ProfileWithServices, ServiceType } from "../types/auth.types";

export interface SignUpSpecialistParams {
  email: string;
  password: string;
  full_name: string;
  service_types: ServiceType[];
}

export interface CreateStudentParams {
  email: string;
  password: string;
  full_name: string;
  specialist_id: string;
  service_type: ServiceType;
}

export const createAuthService = (supabase: SupabaseClient) => ({
  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  },

  signOut: async () => {
    return supabase.auth.signOut();
  },

  getSession: async () => {
    return supabase.auth.getSession();
  },

  resetPassword: async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email);
  },

  signUpSpecialist: async (params: SignUpSpecialistParams) => {
    return supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.full_name,
          account_type: "specialist",
          service_types: params.service_types,
        },
      },
    });
  },

  // Criação de aluno via RPC SECURITY DEFINER — specialist não pode inserir em auth.users diretamente
  createStudent: async (params: CreateStudentParams) => {
    return supabase.rpc("create_student_account", {
      p_email: params.email,
      p_password: params.password,
      p_full_name: params.full_name,
      p_specialist_id: params.specialist_id,
      p_service_type: params.service_type,
    });
  },

  getProfile: async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) return null;
    return data as Profile;
  },

  getProfileWithServices: async (userId: string): Promise<ProfileWithServices | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, specialist_services(*)")
      .eq("id", userId)
      .single();

    if (error) return null;
    return data as ProfileWithServices;
  },
});

export type AuthService = ReturnType<typeof createAuthService>;
