"use client";

import { supabase } from "@meupersonal/supabase";
import { useQuery } from "@tanstack/react-query";

export type AnamnesisResponseValue = string | number | string[] | boolean;

export interface AnamnesisEntry {
  questionId: string;
  value: AnamnesisResponseValue;
}

export interface StudentAnamnesisData {
  id: string;
  student_id: string;
  responses: Record<string, AnamnesisEntry>;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useStudentAnamnesis(studentId: string | null) {
  return useQuery({
    queryKey: ["student-anamnesis", studentId],
    queryFn: async (): Promise<StudentAnamnesisData | null> => {
      if (!studentId) return null;

      const { data, error } = await supabase
        .from("student_anamnesis")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle();

      if (error) throw new Error(error.message);

      return data as StudentAnamnesisData | null;
    },
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5,
  });
}
