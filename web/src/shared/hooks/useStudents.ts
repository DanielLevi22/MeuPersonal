"use client";

import { supabase } from "@meupersonal/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export interface Student {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  account_status: "active" | "inactive" | "invited";
  service_type: "personal_training" | "nutrition_consulting";
  link_status: "active" | "inactive";
  link_created_at: string;
}

export function useStudents() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  return useQuery({
    queryKey: ["students", userId],
    queryFn: async (): Promise<Student[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("student_specialists")
        .select(`
          service_type,
          status,
          created_at,
          student:profiles!student_id (
            id,
            full_name,
            email,
            avatar_url,
            account_status
          )
        `)
        .eq("specialist_id", userId)
        .eq("status", "active");

      if (error) throw error;

      const seen = new Set<string>();
      return (data ?? [])
        .map((item) => {
          const student = Array.isArray(item.student) ? item.student[0] : item.student;
          if (!student || seen.has(student.id)) return null;
          seen.add(student.id);
          return {
            id: student.id,
            full_name: student.full_name,
            email: student.email,
            avatar_url: student.avatar_url,
            account_status: student.account_status,
            service_type: item.service_type,
            link_status: item.status,
            link_created_at: item.created_at,
          } as Student;
        })
        .filter((s): s is Student => s !== null);
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

      // Check no active link already exists for this service type
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

      // Delete used code
      await supabase.from("student_link_codes").delete().eq("code", code.trim().toUpperCase());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

/** @deprecated useProfessionalServices renamed to useSpecialistServices */
export const useProfessionalServices = useSpecialistServices;
