import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import { create } from 'zustand';

interface Student {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: 'active' | 'pending' | 'inactive' | 'invited';
  is_invite?: boolean;
}

interface StudentState {
  students: Student[];
  isLoading: boolean;
  fetchStudents: (personalId: string) => Promise<void>;
  generateInviteCode: (userId: string, force?: boolean) => Promise<string | null>;
  createStudentInvite: (data: StudentInviteData) => Promise<{ success: boolean; code?: string; error?: string }>;
  cancelInvite: (inviteId: string) => Promise<void>;
  linkStudent: (studentId: string, inviteCode: string) => Promise<{ success: boolean; error?: string }>;
  removeStudent: (personalId: string, studentId: string) => Promise<void>;
}

export interface StudentInviteData {
  personal_id: string;
  name: string;
  phone?: string;
  weight?: string;
  height?: string;
  notes?: string;
  initial_assessment?: any;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  isLoading: false,
  fetchStudents: async (personalId) => {
    set({ isLoading: true });
    try {
      // 1. Fetch linked students
      const { data: linkedData, error: linkedError } = await supabase
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

      if (linkedError) throw linkedError;

      const formattedLinkedStudents = linkedData.map((item: any) => ({
        ...item.student,
        status: item.status,
      }));

      // 2. Fetch pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('student_invites')
        .select('id, name, invite_code, created_at')
        .eq('personal_id', personalId);

      if (invitesError) throw invitesError;

      const formattedInvites = invitesData.map((invite: any) => ({
        id: invite.id,
        full_name: invite.name,
        email: `Código: ${invite.invite_code}`,
        avatar_url: null,
        status: 'invited', // New status for invites not yet accepted
        is_invite: true
      }));

      // 3. Merge lists
      set({ students: [...formattedInvites, ...formattedLinkedStudents] });
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  createStudentInvite: async (data: StudentInviteData) => {
    try {
      // Generate a unique code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { error } = await supabase
        .from('student_invites')
        .insert({
          personal_id: data.personal_id,
          invite_code: code,
          name: data.name,
          phone: data.phone,
          weight: data.weight ? parseFloat(data.weight) : null,
          height: data.height ? parseFloat(data.height) : null,
          notes: data.notes,
          initial_assessment: data.initial_assessment
        });

      if (error) throw error;
      return { success: true, code };
    } catch (error: any) {
      console.error('Error creating student invite:', error);
      return { success: false, error: error.message };
    }
  },
  cancelInvite: async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('student_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        students: state.students.filter((s) => s.id !== inviteId)
      }));
    } catch (error) {
      console.error('Error canceling invite:', error);
      Alert.alert('Erro', 'Não foi possível cancelar o convite.');
    }
  },
  generateInviteCode: async (userId, force = false) => {
    try {
      // If not forced, check if user already has a code
      if (!force) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('invite_code')
          .eq('id', userId)
          .single();

        if (profile?.invite_code) {
          return profile.invite_code;
        }
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
