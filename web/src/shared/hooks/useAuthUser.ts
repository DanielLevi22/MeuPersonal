"use client";

import { supabase } from "@meupersonal/supabase";
import { useQuery } from "@tanstack/react-query";

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

      // Fetch profile with account_type and full_name
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, account_type, full_name")
        .eq("id", user.id)
        .single();

      if (!profile) return null;

      let services: string[] = [];

      if (profile.account_type === "specialist") {
        const { data: servicesData } = await supabase
          .from("professional_services")
          .select("service_category")
          .eq("user_id", user.id)
          .eq("is_active", true);

        services = servicesData?.map((s) => s.service_category) || [];
      }

      return {
        id: profile.id,
        accountType: profile.account_type,
        fullName: profile.full_name || "Profissional",
        services,
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour - user profile doesn't change often
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
