import { supabase } from '@/lib/supabase';
import { create } from 'zustand';

interface Student {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: 'active' | 'pending' | 'inactive';
}

interface StudentState {
  students: Student[];
  isLoading: boolean;
  fetchStudents: (personalId: string) => Promise<void>;
  generateInviteCode: (userId: string) => Promise<string | null>;
  linkStudent: (studentId: string, inviteCode: string) => Promise<{ success: boolean; error?: string }>;
  removeStudent: (personalId: string, studentId: string) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  isLoading: false,
  fetchStudents: async (personalId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('students_personals')
        .select(`
          status,
          student:profiles!student_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('personal_id', personalId);

      if (error) throw error;

      const formattedStudents = data.map((item: any) => ({
        ...item.student,
        status: item.status,
      }));

      set({ students: formattedStudents });
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  generateInviteCode: async (userId) => {
    try {
      // First check if user already has a code
      const { data: profile } = await supabase
        .from('profiles')
        .select('invite_code')
        .eq('id', userId)
        .single();

      if (profile?.invite_code) {
        return profile.invite_code;
      }

      // Generate new code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { error } = await supabase
        .from('profiles')
        .update({ invite_code: code })
        .eq('id', userId);

      if (error) throw error;
      return code;
    } catch (error) {
      console.error('Error generating invite code:', error);
      return null;
    }
  },
  linkStudent: async (studentId, inviteCode) => {
    try {
      // Find personal by invite code
      const { data: personal, error: personalError } = await supabase
        .from('profiles')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('role', 'personal')
        .single();

      if (personalError || !personal) {
        return { success: false, error: 'Código inválido ou personal não encontrado.' };
      }

      // Check if already linked
      const { data: existing } = await supabase
        .from('students_personals')
        .select('id')
        .eq('student_id', studentId)
        .eq('personal_id', personal.id)
        .single();

      if (existing) {
        return { success: false, error: 'Você já está vinculado a este personal.' };
      }

      // Create link
      const { error: linkError } = await supabase
        .from('students_personals')
        .insert({
          student_id: studentId,
          personal_id: personal.id,
          status: 'active'
        });

      if (linkError) throw linkError;

      return { success: true };
    } catch (error) {
      console.error('Error linking student:', error);
      return { success: false, error: 'Erro ao vincular personal.' };
    }
  },
  removeStudent: async (personalId, studentId) => {
    try {
      const { error } = await supabase
        .from('students_personals')
        .delete()
        .eq('personal_id', personalId)
        .eq('student_id', studentId);

      if (error) throw error;

      // Update local state
      const currentStudents = get().students;
      set({ students: currentStudents.filter(s => s.id !== studentId) });
    } catch (error) {
      console.error('Error removing student:', error);
    }
  }
}));
