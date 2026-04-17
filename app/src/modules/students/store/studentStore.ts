import { supabase } from '@meupersonal/supabase';
import { Alert } from 'react-native';
import { create } from 'zustand';

// Student derivado do join student_specialists → profiles
export interface Student {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  account_status: 'active' | 'inactive' | 'invited';
  service_type: 'personal_training' | 'nutrition_consulting';
  link_status: 'active' | 'inactive';
  link_created_at: string;
  // Assessment data cached from last physical_assessment
  assessment?: Partial<PhysicalAssessment>;
}

// PhysicalAssessment pertence ao módulo Assessment — mantido aqui
// temporariamente até o PR de assessment-schema-alignment
export interface PhysicalAssessment {
  id: string;
  student_id: string;
  specialist_id: string;
  created_at: string;
  weight: number | null;
  height: number | null;
  notes: string | null;
  neck: number | null;
  shoulder: number | null;
  chest: number | null;
  arm_right_relaxed: number | null;
  arm_left_relaxed: number | null;
  arm_right_contracted: number | null;
  arm_left_contracted: number | null;
  forearm_right: number | null;
  forearm_left: number | null;
  waist: number | null;
  abdomen: number | null;
  hips: number | null;
  thigh_proximal_right: number | null;
  thigh_proximal_left: number | null;
  thigh_medial_right: number | null;
  thigh_medial_left: number | null;
  calf_right: number | null;
  calf_left: number | null;
  skinfold_chest: number | null;
  skinfold_abdominal: number | null;
  skinfold_thigh: number | null;
  skinfold_triceps: number | null;
  skinfold_suprailiac: number | null;
  skinfold_subscapular: number | null;
  skinfold_midaxillary: number | null;
  photo_front: string | null;
  photo_back: string | null;
  photo_side_right: string | null;
  photo_side_left: string | null;
}

export interface CreateStudentData {
  specialist_id: string;
  full_name: string;
  email: string;
  password: string;
  service_type: 'personal_training' | 'nutrition_consulting';
}

interface StudentState {
  students: Student[];
  totalCount: number;
  history: PhysicalAssessment[];
  isLoading: boolean;

  fetchStudents: (
    specialistId: string,
    params?: {
      page?: number;
      limit?: number;
      sortBy?: 'full_name' | 'created_at';
      sortOrder?: 'asc' | 'desc';
      search?: string;
      append?: boolean;
    }
  ) => Promise<void>;

  generateLinkCode: (studentId: string) => Promise<string | null>;

  linkStudent: (
    specialistId: string,
    code: string
  ) => Promise<{ success: boolean; error?: string }>;

  removeStudent: (
    specialistId: string,
    studentId: string,
    serviceType: 'personal_training' | 'nutrition_consulting'
  ) => Promise<void>;

  fetchStudentHistory: (studentId: string) => Promise<void>;

  addPhysicalAssessment: (
    studentId: string,
    data: Partial<PhysicalAssessment>
  ) => Promise<{ success: boolean; error?: string }>;

  createStudent: (
    data: CreateStudentData
  ) => Promise<{ success: boolean; studentId?: string; error?: string }>;

  reset: () => void;
}

const initialState = {
  students: [],
  totalCount: 0,
  history: [],
  isLoading: false,
};

export const useStudentStore = create<StudentState>((set, get) => ({
  ...initialState,

  fetchStudents: async (specialistId, params = {}) => {
    const {
      page = 1,
      limit = 20,
      sortBy = 'full_name',
      sortOrder = 'asc',
      search = '',
      append = false,
    } = params;

    set({ isLoading: true });
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('student_specialists')
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
          { count: 'exact' }
        )
        .eq('specialist_id', specialistId)
        .eq('status', 'active')
        .range(from, to);

      if (sortBy === 'full_name') {
        query = query.order('student(full_name)', { ascending: sortOrder === 'asc' });
      } else {
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch latest assessment for each student
      const studentIds = (data || [])
        .map((item) => {
          const s = Array.isArray(item.student) ? item.student[0] : item.student;
          return s?.id;
        })
        .filter(Boolean) as string[];

      const assessmentsMap = new Map<string, PhysicalAssessment>();
      if (studentIds.length > 0) {
        const { data: assessments } = await supabase
          .from('physical_assessments')
          .select('*')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false });

        assessments?.forEach((a: PhysicalAssessment) => {
          if (!assessmentsMap.has(a.student_id)) assessmentsMap.set(a.student_id, a);
        });
      }

      const seen = new Set<string>();
      const formatted = (data || [])
        .map((item) => {
          const student = Array.isArray(item.student) ? item.student[0] : item.student;
          if (!student || seen.has(student.id)) return null;
          if (search && !student.full_name?.toLowerCase().includes(search.toLowerCase()))
            return null;
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
            assessment: assessmentsMap.get(student.id),
          } as Student;
        })
        .filter(Boolean) as Student[];

      set((state) => ({
        students: append ? [...state.students, ...formatted] : formatted,
        totalCount: formatted.length,
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      if (!append) set({ students: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  generateLinkCode: async (studentId) => {
    try {
      // Delete previous codes for this student
      await supabase.from('student_link_codes').delete().eq('student_id', studentId);

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('student_link_codes')
        .insert({ student_id: studentId, code, expires_at: expiresAt });

      if (error) throw error;
      return code;
    } catch (error) {
      console.error('Error generating link code:', error);
      return null;
    }
  },

  linkStudent: async (specialistId, code) => {
    try {
      const cleanCode = code.trim().toUpperCase();

      const { data: linkCode, error: codeError } = await supabase
        .from('student_link_codes')
        .select('student_id, expires_at')
        .eq('code', cleanCode)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (codeError || !linkCode) {
        return { success: false, error: 'Código inválido ou expirado.' };
      }

      // Get specialist's service type
      const { data: services } = await supabase
        .from('specialist_services')
        .select('service_type')
        .eq('specialist_id', specialistId)
        .limit(1)
        .single();

      if (!services) return { success: false, error: 'Especialista sem serviço cadastrado.' };

      // Check for existing active link for this service type
      const { data: existing } = await supabase
        .from('student_specialists')
        .select('id')
        .eq('student_id', linkCode.student_id)
        .eq('service_type', services.service_type)
        .eq('status', 'active')
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Aluno já vinculado a um especialista deste serviço.' };
      }

      const { error: linkError } = await supabase.from('student_specialists').insert({
        student_id: linkCode.student_id,
        specialist_id: specialistId,
        service_type: services.service_type,
        status: 'active',
      });

      if (linkError) throw linkError;

      // Delete used code
      await supabase.from('student_link_codes').delete().eq('code', cleanCode);

      return { success: true };
    } catch (error) {
      console.error('Error linking student:', error);
      return { success: false, error: 'Erro ao vincular aluno.' };
    }
  },

  removeStudent: async (specialistId, studentId, serviceType) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const endedBy = session.session?.user.id;

      const { error } = await supabase
        .from('student_specialists')
        .update({ status: 'inactive', ended_by: endedBy, ended_at: new Date().toISOString() })
        .eq('specialist_id', specialistId)
        .eq('student_id', studentId)
        .eq('service_type', serviceType)
        .eq('status', 'active');

      if (error) throw error;

      set((state) => ({
        students: state.students.filter(
          (s) => !(s.id === studentId && s.service_type === serviceType)
        ),
      }));
    } catch (error) {
      console.error('Error removing student:', error);
      Alert.alert('Erro', 'Não foi possível remover o aluno. Tente novamente.');
    }
  },

  fetchStudentHistory: async (studentId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('physical_assessments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ history: data || [] });
    } catch (error) {
      console.error('Error fetching student history:', error);
      set({ history: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addPhysicalAssessment: async (studentId, data) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const specialistId = session.session?.user.id;
      if (!specialistId) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('physical_assessments')
        .insert({ student_id: studentId, specialist_id: specialistId, ...data });

      if (error) throw error;

      await get().fetchStudentHistory(studentId);
      return { success: true };
    } catch (error: unknown) {
      console.error('Error adding assessment:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  createStudent: async (data) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('create-student', {
        body: data,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, studentId: result?.student_id };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  reset: () => set(initialState),
}));
