"use client";

import { supabase } from "@elevapro/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StudentMeasurements } from "./useStudentDetails";

export interface UpdateStudentInput {
  studentId: string;
  full_name?: string;
  measurements?: Partial<StudentMeasurements>;
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateStudentInput) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      const { studentId, ...body } = input;

      const response = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível atualizar o aluno");
      }

      return result as { success: boolean };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-details", variables.studentId] });
    },
  });
}
