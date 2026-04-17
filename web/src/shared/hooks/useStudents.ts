"use client";

import { createStudentsService } from "@meupersonal/shared";
import { supabase } from "@meupersonal/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export type { Student } from "@meupersonal/shared";

const studentsService = createStudentsService(supabase);

export function useStudents() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  return useQuery({
    queryKey: ["students", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { students } = await studentsService.fetchStudents(userId, { limit: 200 });
      return students;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });
}

export function useSpecialistServices() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  return useQuery({
    queryKey: ["specialist_services", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("specialist_services")
        .select("service_type")
        .eq("specialist_id", userId);

      if (error) throw error;
      return data.map((s) => s.service_type);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}

// Fluxo B: aluno existente fornece código ao especialista
export function useFindStudentByCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from("student_link_codes")
        .select("student_id, expires_at, student:profiles!student_id(id, full_name, email)")
        .eq("code", code.trim().toUpperCase())
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !data) return null;

      const student = Array.isArray(data.student) ? data.student[0] : data.student;
      return student as { id: string; full_name: string | null; email: string } | null;
    },
  });
}

// Vincula aluno ao especialista usando código de vínculo
export function useLinkStudentByCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      serviceType,
    }: {
      code: string;
      serviceType: "personal_training" | "nutrition_consulting";
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: linkCode, error: codeError } = await supabase
        .from("student_link_codes")
        .select("student_id")
        .eq("code", code.trim().toUpperCase())
        .gt("expires_at", new Date().toISOString())
        .single();

      if (codeError || !linkCode) throw new Error("Código inválido ou expirado");

      const { data: existing } = await supabase
        .from("student_specialists")
        .select("id")
        .eq("student_id", linkCode.student_id)
        .eq("service_type", serviceType)
        .eq("status", "active")
        .maybeSingle();

      if (existing) throw new Error("Aluno já vinculado a um especialista deste serviço");

      const { error: linkError } = await supabase.from("student_specialists").insert({
        student_id: linkCode.student_id,
        specialist_id: user.id,
        service_type: serviceType,
        status: "active",
      });

      if (linkError) throw linkError;

      await supabase.from("student_link_codes").delete().eq("code", code.trim().toUpperCase());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

/** @deprecated renamed to useSpecialistServices */
export const useProfessionalServices = useSpecialistServices;
