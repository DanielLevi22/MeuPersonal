import { supabase } from '@meupersonal/supabase';
import { Alert } from 'react-native';
import { create } from 'zustand';

interface Student {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: 'active' | 'pending' | 'inactive' | 'invited';
  is_invite?: boolean;
  phone?: string;
  weight?: string;
  height?: string;
  notes?: string;
  assessment?: any;
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
  updateStudent: (studentId: string, data: Partial<StudentInviteData>) => Promise<{ success: boolean; error?: string }>;
  history: any[];
  fetchStudentHistory: (studentId: string) => Promise<void>;
  reset: () => void; // Clear all state on logout
}

export interface StudentInviteData {
  personal_id: string;
  name: string;
  phone?: string;
  weight?: string;
  height?: string;
  notes?: string;
  initial_assessment?: any;
  // Extended fields for editing
  neck?: string;
  shoulder?: string;
  chest?: string;
  arm_right_relaxed?: string;
  arm_left_relaxed?: string;
  arm_right_contracted?: string;
  arm_left_contracted?: string;
  forearm?: string;
  waist?: string;
  abdomen?: string;
  hips?: string;
  thigh_proximal?: string;
  thigh_distal?: string;
  calf?: string;
  skinfold_chest?: string;
  skinfold_abdominal?: string;
  skinfold_thigh?: string;
  skinfold_triceps?: string;
  skinfold_suprailiac?: string;
  skinfold_subscapular?: string;
  skinfold_midaxillary?: string;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  history: [],
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
            invite_code,
            phone
          )
        `)
        .eq('personal_id', personalId);

      console.log('🔍 Linked Data:', JSON.stringify(linkedData, null, 2));
      if (linkedError) console.error('❌ Linked Error:', linkedError);

      // Fetch latest assessment for each student to get weight/height/etc
      let assessmentsMap = new Map();
      try {
        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('physical_assessments')
          .select('*')
          .eq('personal_id', personalId)
          .order('created_at', { ascending: false });

        if (assessmentsError) throw assessmentsError;

        if (assessmentsData) {
          assessmentsData.forEach((assessment: any) => {
            if (!assessmentsMap.has(assessment.student_id)) {
              assessmentsMap.set(assessment.student_id, assessment);
            }
          });
        }
      } catch (err) {
        console.warn('⚠️ Failed to fetch assessments:', err);
        // Continue without assessments
      }

      const formattedLinkedStudents = (linkedData || []).map((item: any) => {
        if (!item.student) {
           console.warn('⚠️ Found link but no student profile:', item);
           return null;
        }
        
        const assessment = assessmentsMap.get(item.student.id) || {};
        
        return {
          ...item.student,
          status: item.status,
          // Merge assessment data
          weight: assessment.weight,
          height: assessment.height,
          notes: assessment.notes, // Assessment notes might override or complement? Let's use assessment notes as the primary "notes" for now if available
          assessment: assessment // Keep full assessment object
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
        if (invite.invite_code) {
          const generatedEmail = `aluno${invite.invite_code.toLowerCase()}@test.com`;
          if (linkedEmails.has(generatedEmail)) return false;
        }

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
  },
  updateStudent: async (studentId, data) => {
    try {
      // 1. Update Profile (Basic Info)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.name,
          phone: data.phone,
        })
        .eq('id', studentId);

      if (profileError) throw profileError;

      // 2. Update or Insert Physical Assessment
      const { data: session } = await supabase.auth.getSession();
      const personalId = session.session?.user.id;

      if (personalId) {
        const { error: assessmentError } = await supabase
          .from('physical_assessments')
          .insert({
            student_id: studentId,
            personal_id: personalId,
            weight: data.weight ? parseFloat(data.weight) : null,
            height: data.height ? parseFloat(data.height) : null,
            notes: data.notes,
            // Add other fields
            neck: data.neck ? parseFloat(data.neck) : null,
            shoulder: data.shoulder ? parseFloat(data.shoulder) : null,
            chest: data.chest ? parseFloat(data.chest) : null,
            arm_right_relaxed: data.arm_right_relaxed ? parseFloat(data.arm_right_relaxed) : null,
            arm_left_relaxed: data.arm_left_relaxed ? parseFloat(data.arm_left_relaxed) : null,
            arm_right_contracted: data.arm_right_contracted ? parseFloat(data.arm_right_contracted) : null,
            arm_left_contracted: data.arm_left_contracted ? parseFloat(data.arm_left_contracted) : null,
            forearm: data.forearm ? parseFloat(data.forearm) : null,
            waist: data.waist ? parseFloat(data.waist) : null,
            abdomen: data.abdomen ? parseFloat(data.abdomen) : null,
            hips: data.hips ? parseFloat(data.hips) : null,
            thigh_proximal: data.thigh_proximal ? parseFloat(data.thigh_proximal) : null,
            thigh_distal: data.thigh_distal ? parseFloat(data.thigh_distal) : null,
            calf: data.calf ? parseFloat(data.calf) : null,
            skinfold_chest: data.skinfold_chest ? parseFloat(data.skinfold_chest) : null,
            skinfold_abdominal: data.skinfold_abdominal ? parseFloat(data.skinfold_abdominal) : null,
            skinfold_thigh: data.skinfold_thigh ? parseFloat(data.skinfold_thigh) : null,
            skinfold_triceps: data.skinfold_triceps ? parseFloat(data.skinfold_triceps) : null,
            skinfold_suprailiac: data.skinfold_suprailiac ? parseFloat(data.skinfold_suprailiac) : null,
            skinfold_subscapular: data.skinfold_subscapular ? parseFloat(data.skinfold_subscapular) : null,
            skinfold_midaxillary: data.skinfold_midaxillary ? parseFloat(data.skinfold_midaxillary) : null,
          });
          
         if (assessmentError) console.error('Error updating assessment:', assessmentError);
      }

      // Update local state
      set((state) => ({
        students: state.students.map((s) => 
          s.id === studentId 
            ? { 
                ...s, 
                full_name: data.name || s.full_name,
                phone: data.phone, // Update phone
                weight: data.weight, // Update displayed weight
                height: data.height, // Update displayed height
                notes: data.notes,
                assessment: { ...s.assessment, ...data } // Update assessment cache
              } 
            : s
        )
      }));

      return { success: true };
    } catch (error: any) {
      console.error('Error updating student:', error);
      return { success: false, error: error.message };
    }
  },
  fetchStudentHistory: async (studentId: string) => {
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
  
  // Reset all state on logout
  reset: () => {
    set({
      students: [],
      history: [],
      isLoading: false
    });
  }
}));
