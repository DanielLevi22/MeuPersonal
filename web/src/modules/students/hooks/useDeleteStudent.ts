"use client";

import { supabase } from "@elevapro/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível remover o aluno");
      }

      return result as { success: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
