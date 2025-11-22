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
            avatar_url,
            invite_code
          )
        `)
        .eq('personal_id', personalId);

      console.log('🔍 Linked Data:', JSON.stringify(linkedData, null, 2));
      if (linkedError) console.error('❌ Linked Error:', linkedError);

      const formattedLinkedStudents = (linkedData || []).map((item: any) => {
        if (!item.student) {
           console.warn('⚠️ Found link but no student profile:', item);
           return null;
        }
        return {
          ...item.student,
          status: item.status,
        };
      }).filter(Boolean);

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
      // 3. Merge lists and deduplicate
      // 3. Merge lists and deduplicate
      // Get all invite codes from linked students
      const linkedInviteCodes = new Set(
        formattedLinkedStudents
          .map((s: any) => s.invite_code)
          .filter(Boolean)
      );

      // Also get emails to match against generated invite emails
      const linkedEmails = new Set(
        formattedLinkedStudents
          .map((s: any) => s.email?.toLowerCase())
          .filter(Boolean)
      );

      // Also get normalized names for matching
      const linkedNames = new Set(
        formattedLinkedStudents
          .map((s: any) => s.full_name?.trim().toLowerCase())
          .filter(Boolean)
      );

      // Filter out invites that have already been used
      const uniqueInvites = formattedInvites.filter((invite: any) => {
        // Check by invite code
        if (linkedInviteCodes.has(invite.invite_code)) return false;
        
        // Check by generated email
        const generatedEmail = `aluno${invite.invite_code.toLowerCase()}@test.com`;
        if (linkedEmails.has(generatedEmail)) return false;

        // Check by name (heuristic for when code/email link is missing)
        if (invite.full_name && linkedNames.has(invite.full_name.trim().toLowerCase())) {
          return false;
        }

        return true;
      });

      const allStudents = [...uniqueInvites, ...formattedLinkedStudents];
      
      // Deduplicate by ID to ensure uniqueness and prevent UI warnings
      // This handles cases where multiple links might exist for the same student
      const uniqueStudentsMap = new Map();
      allStudents.forEach(student => {
        if (student.id && !uniqueStudentsMap.has(student.id)) {
          uniqueStudentsMap.set(student.id, student);
        }
      });
      
      set({ students: Array.from(uniqueStudentsMap.values()) });
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
      // 1. Delete assignments
      const { error: assignError } = await supabase
        .from('workout_assignments')
        .delete()
        .eq('student_id', studentId);
      
      if (assignError) console.error('Error deleting assignments:', assignError);

      // 2. Delete sessions (history)
      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('student_id', studentId);

      if (sessionError) console.error('Error deleting sessions:', sessionError);

      // 3. Delete physical assessments (if table exists)
      // We wrap in try/catch or just ignore error if table doesn't exist/has different name
      try {
        const { error: assessmentError } = await supabase
          .from('physical_assessments')
          .delete()
          .eq('student_id', studentId);
          
        if (assessmentError) console.error('Error deleting assessments:', assessmentError);
      } catch (e) {
        // Ignore if table doesn't exist
      }

      // 4. Finally delete the link
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
      Alert.alert('Erro', 'Não foi possível remover o aluno. Tente novamente.');
    }
  }
}));
