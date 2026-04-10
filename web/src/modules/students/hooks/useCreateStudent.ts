"use client";

import { supabase } from "@meupersonal/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface CreateStudentInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  weight?: string;
  height?: string;
  notes?: string;
  experience_level?: "Iniciante" | "Intermediário" | "Avançado";
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.rpc("create_student_with_auth", {
        p_professional_id: user.id,
        p_full_name: input.fullName,
        p_email: input.email,
        p_password: input.password,
        p_phone: input.phone ?? null,
        p_weight: input.weight ? parseFloat(input.weight) : null,
        p_height: input.height ? parseFloat(input.height) : null,
        p_notes: input.notes ?? null,
        p_experience_level: input.experience_level ?? null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; student_id?: string };
      if (!result?.success) {
        throw new Error(result?.error ?? "Não foi possível criar o aluno");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
