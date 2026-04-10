"use client";

import { supabase } from "@meupersonal/supabase";
import { useQuery } from "@tanstack/react-query";

export interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  weight: number | null;
  height: number | null;
  notes: string | null;
}

export function useStudentDetails(studentId: string | null) {
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, weight, height, notes")
        .eq("id", studentId!)
        .single();

      if (error) throw error;
      return data as StudentProfile;
    },
    enabled: !!studentId,
  });
}
