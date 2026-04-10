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
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(input),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível criar o aluno");
      }

      return result as { success: boolean; student_id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
