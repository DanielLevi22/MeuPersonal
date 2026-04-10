"use client";

import { supabase } from "@meupersonal/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface UpdateStudentInput {
  studentId: string;
  fullName?: string;
  phone?: string;
  notes?: string;
  measurements?: {
    weight?: string;
    height?: string;
    neck?: string;
    shoulder?: string;
    chest?: string;
    waist?: string;
    abdomen?: string;
    hips?: string;
    armRightRelaxed?: string;
    armLeftRelaxed?: string;
    thighRight?: string;
    thighLeft?: string;
    calfRight?: string;
    calfLeft?: string;
  };
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, ...data }: UpdateStudentInput) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      const response = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível atualizar o aluno");
      }

      return result as { success: boolean };
    },
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
    },
  });
}
