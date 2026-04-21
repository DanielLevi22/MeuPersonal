"use client";

import { supabase } from "@elevapro/supabase";
import { useQuery } from "@tanstack/react-query";
import type { HistoryEvent } from "@/app/api/students/[id]/history/route";

export type { HistoryEvent };

export function useStudentHistory(studentId: string | null) {
  return useQuery({
    queryKey: ["student-history", studentId],
    queryFn: async (): Promise<HistoryEvent[]> => {
      if (!studentId) return [];

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      const response = await fetch(`/api/students/${studentId}/history`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível carregar o histórico");
      }

      return (result as { events: HistoryEvent[] }).events;
    },
    enabled: !!studentId,
    staleTime: 1000 * 60 * 2,
  });
}
