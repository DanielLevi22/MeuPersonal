import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, ProfileWithServices, ServiceType } from "../types/auth.types";

export interface SignUpProfessionalParams {
  email: string;
  password: string;
  full_name: string;
  service_types: ServiceType[];
}

export interface SignUpStudentParams {
  email: string;
  password: string;
  full_name: string;
  professional_id: string;
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

  signUpProfessional: async (params: SignUpProfessionalParams) => {
    return supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.full_name,
          account_type: "professional",
          service_types: params.service_types,
        },
      },
    });
  },

  // Criação de aluno gerenciado via RPC SECURITY DEFINER
  createManagedStudent: async (params: SignUpStudentParams) => {
    return supabase.rpc("create_student_account", {
      p_email: params.email,
      p_password: params.password,
      p_full_name: params.full_name,
      p_professional_id: params.professional_id,
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
      .select("*, professional_services(*)")
      .eq("id", userId)
      .single();

    if (error) return null;
    return data as ProfileWithServices;
  },
});

export type AuthService = ReturnType<typeof createAuthService>;
