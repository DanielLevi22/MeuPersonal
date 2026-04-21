"use client";

import { createAuthService } from "@elevapro/shared";
import { supabase } from "@elevapro/supabase";
import { useQuery } from "@tanstack/react-query";

const authService = createAuthService(supabase);

export interface AuthProfile {
  id: string;
  accountType: string;
  fullName: string;
  services: string[];
}

export function useAuthUser() {
  return useQuery({
    queryKey: ["auth_user"],
    queryFn: async (): Promise<AuthProfile | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const profile = await authService.getProfileWithServices(user.id);
      if (!profile) return null;

      const services =
        profile.account_type === "specialist"
          ? profile.specialist_services.map((s) => s.service_type)
          : [];

      return {
        id: profile.id,
        accountType: profile.account_type,
        fullName: profile.full_name ?? "Profissional",
        services,
      };
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
