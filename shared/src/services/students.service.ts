import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateStudentData,
  FetchStudentsParams,
  FetchStudentsResult,
  LinkStudentResult,
  PhysicalAssessment,
  Student,
} from "../types/students.types";

export const createStudentsService = (supabase: SupabaseClient) => ({
  fetchStudents: async (
    specialistId: string,
    params: FetchStudentsParams = {},
  ): Promise<FetchStudentsResult> => {
    const { page = 1, limit = 20, sortBy = "full_name", sortOrder = "asc", search = "" } = params;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("student_specialists")
      .select(
        `
        id,
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
      `,
        { count: "exact" },
      )
      .eq("specialist_id", specialistId)
      .eq("status", "active")
      .range(from, to);

    if (sortBy === "full_name") {
      query = query.order("student(full_name)", { ascending: sortOrder === "asc" });
    } else {
      query = query.order("created_at", { ascending: sortOrder === "asc" });
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const seen = new Set<string>();
    const students = (data ?? [])
      .map((item) => {
        const profile = Array.isArray(item.student) ? item.student[0] : item.student;
        if (!profile || seen.has(profile.id)) return null;
        if (search && !profile.full_name?.toLowerCase().includes(search.toLowerCase())) return null;
        seen.add(profile.id);

        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          account_status: profile.account_status,
          service_type: item.service_type,
          link_status: item.status,
          link_created_at: item.created_at,
        } as Student;
      })
      .filter((s): s is Student => s !== null);

    return { students, total: count ?? students.length };
  },

  fetchStudentDetails: async (studentId: string): Promise<PhysicalAssessment | null> => {
    const { data, error } = await supabase
      .from("physical_assessments")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as PhysicalAssessment | null;
  },

  fetchStudentHistory: async (studentId: string): Promise<PhysicalAssessment[]> => {
    const { data, error } = await supabase
      .from("physical_assessments")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as PhysicalAssessment[];
  },

  generateLinkCode: async (studentId: string): Promise<string> => {
    await supabase.from("student_link_codes").delete().eq("student_id", studentId);

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("student_link_codes")
      .insert({ student_id: studentId, code, expires_at: expiresAt });

    if (error) throw error;
    return code;
  },

  linkStudent: async (specialistId: string, code: string): Promise<LinkStudentResult> => {
    const cleanCode = code.trim().toUpperCase();

    const { data: linkCode, error: codeError } = await supabase
      .from("student_link_codes")
      .select("student_id, expires_at")
      .eq("code", cleanCode)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (codeError || !linkCode) {
      return { success: false, error: "Código inválido ou expirado." };
    }

    const { data: services } = await supabase
      .from("specialist_services")
      .select("service_type")
      .eq("specialist_id", specialistId)
      .limit(1)
      .single();

    if (!services) {
      return { success: false, error: "Especialista sem serviço cadastrado." };
    }

    const { data: existing } = await supabase
      .from("student_specialists")
      .select("id")
      .eq("student_id", linkCode.student_id)
      .eq("service_type", services.service_type)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Aluno já vinculado a um especialista deste serviço." };
    }

    const { error: linkError } = await supabase.from("student_specialists").insert({
      student_id: linkCode.student_id,
      specialist_id: specialistId,
      service_type: services.service_type,
      status: "active",
    });

    if (linkError) throw linkError;

    await supabase.from("student_link_codes").delete().eq("code", cleanCode);

    return { success: true };
  },

  removeStudent: async (
    specialistId: string,
    studentId: string,
    serviceType: string,
    endedBy: string,
  ): Promise<void> => {
    const { error } = await supabase
      .from("student_specialists")
      .update({ status: "inactive", ended_by: endedBy, ended_at: new Date().toISOString() })
      .eq("specialist_id", specialistId)
      .eq("student_id", studentId)
      .eq("service_type", serviceType)
      .eq("status", "active");

    if (error) throw error;
  },

  addPhysicalAssessment: async (
    studentId: string,
    specialistId: string,
    data: Partial<PhysicalAssessment>,
  ): Promise<void> => {
    const { error } = await supabase
      .from("physical_assessments")
      .insert({ student_id: studentId, specialist_id: specialistId, ...data });

    if (error) throw error;
  },

  createStudent: async (
    data: CreateStudentData,
  ): Promise<{ success: boolean; studentId?: string; error?: string }> => {
    const { data: result, error } = await supabase.functions.invoke("create-student", {
      body: data,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, studentId: result?.student_id };
  },
});

export type StudentsService = ReturnType<typeof createStudentsService>;
