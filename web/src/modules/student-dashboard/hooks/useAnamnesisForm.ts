"use client";

import { supabase } from "@elevapro/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AnamnesisResponseValue } from "@/modules/students/hooks/useStudentAnamnesis";

interface SaveAnamnesisInput {
  studentId: string;
  responses: Record<string, AnamnesisResponseValue>;
  completed: boolean;
}

export function useSavePersonaTrack() {
  return useMutation({
    mutationFn: async ({ studentId, track }: { studentId: string; track: string }) => {
      // Ignore errors — column may not exist in all environments
      await supabase.from("profiles").update({ persona_track: track }).eq("id", studentId);
    },
  });
}

export function useAnamnesisForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, responses, completed }: SaveAnamnesisInput) => {
      const payload: Record<string, unknown> = { student_id: studentId, responses };
      if (completed) payload.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from("student_anamnesis")
        .upsert(payload, { onConflict: "student_id" });

      if (error) throw new Error(error.message);
    },
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: ["student-anamnesis", studentId] });
    },
  });
}
