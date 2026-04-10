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

export interface StudentMeasurements {
  neck: number | null;
  shoulder: number | null;
  chest: number | null;
  waist: number | null;
  abdomen: number | null;
  hips: number | null;
  arm_right_relaxed: number | null;
  arm_left_relaxed: number | null;
  arm_right_contracted: number | null;
  arm_left_contracted: number | null;
  thigh_proximal: number | null;
  thigh_distal: number | null;
  calf: number | null;
}

export interface StudentDetails {
  profile: StudentProfile;
  measurements: StudentMeasurements | null;
}

export function useStudentDetails(studentId: string | null) {
  return useQuery({
    queryKey: ["student-details", studentId],
    queryFn: async (): Promise<StudentDetails> => {
      if (!studentId) throw new Error("studentId is required");

      const [profileResult, assessmentResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, phone, weight, height, notes")
          .eq("id", studentId)
          .single(),
        supabase
          .from("physical_assessments")
          .select(
            "neck, shoulder, chest, waist, abdomen, hips, arm_right_relaxed, arm_left_relaxed, arm_right_contracted, arm_left_contracted, thigh_proximal, thigh_distal, calf",
          )
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileResult.error) throw profileResult.error;

      return {
        profile: profileResult.data as StudentProfile,
        measurements: (assessmentResult.data as StudentMeasurements | null) ?? null,
      };
    },
    enabled: !!studentId,
    staleTime: 1000 * 60 * 2,
  });
}
