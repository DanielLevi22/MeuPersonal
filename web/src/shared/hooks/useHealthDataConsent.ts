"use client";

import { supabase } from "@elevapro/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthUser } from "./useAuthUser";

const POLICY_VERSION = "1.0";

export function useHealthDataConsent() {
  const { data: authUser } = useAuthUser();

  return useQuery({
    queryKey: ["health_data_consent", authUser?.id],
    queryFn: async () => {
      if (!authUser) return null;
      const { data, error } = await supabase
        .from("student_consents")
        .select("id, given_at, revoked_at")
        .eq("student_id", authUser.id)
        .eq("consent_type", "health_data_collection")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!authUser,
    staleTime: 1000 * 60 * 10,
  });
}

export function useGrantHealthDataConsent() {
  const queryClient = useQueryClient();
  const { data: authUser } = useAuthUser();

  return useMutation({
    mutationFn: async () => {
      if (!authUser) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("student_consents").upsert(
        {
          student_id: authUser.id,
          consent_type: "health_data_collection",
          given_at: new Date().toISOString(),
          revoked_at: null,
          policy_version: POLICY_VERSION,
        },
        { onConflict: "student_id,consent_type" },
      );
      if (error) throw error;
    },
    onSuccess: (_, __, _ctx) =>
      queryClient.invalidateQueries({ queryKey: ["health_data_consent", authUser?.id] }),
  });
}
