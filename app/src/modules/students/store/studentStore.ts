import { supabase } from '@meupersonal/supabase';
import { Alert } from 'react-native';
import { create } from 'zustand';

export interface Student {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: 'active' | 'pending' | 'inactive' | 'invited';
  is_invite?: boolean;
  phone?: string;
  weight?: string;
  height?: string;
  experience_level?: 'Iniciante' | 'Intermediário' | 'Avançado';
  notes?: string;
  assessment?: Partial<PhysicalAssessment>;
  created_at?: string;
}

export interface PhysicalAssessment {
  id: string;
  student_id: string;
  personal_id: string;
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
  // Photos
  photo_front: string | null;
  photo_back: string | null;
  photo_side_right: string | null;
  photo_side_left: string | null;
}

interface StudentState {
  students: Student[];
  totalCount: number;
  isLoading: boolean;
  fetchStudents: (
    personalId: string,
    params?: {
      page?: number;
      limit?: number;
      sortBy?: 'full_name' | 'created_at';
      sortOrder?: 'asc' | 'desc';
      search?: string;
      append?: boolean;
    }
  ) => Promise<void>;
  generateInviteCode: (userId: string, force?: boolean) => Promise<string | null>;
  createStudentInvite: (
    data: StudentInviteData
  ) => Promise<{ success: boolean; code?: string; error?: string }>;
  cancelInvite: (inviteId: string) => Promise<void>;
  linkStudent: (
    studentId: string,
    inviteCode: string
  ) => Promise<{ success: boolean; error?: string }>;
  removeStudent: (personalId: string, studentId: string) => Promise<void>;
  updateStudent: (
    studentId: string,
    data: Partial<StudentInviteData>
  ) => Promise<{ success: boolean; error?: string }>;
  fetchStudentHistory: (studentId: string) => Promise<void>;
  history: PhysicalAssessment[];
  addPhysicalAssessment: (
    studentId: string,
    data: Partial<PhysicalAssessment>
  ) => Promise<{ success: boolean; error?: string }>;
  reset: () => void; // Clear all state on logout
}

export interface StudentInviteData {
  personal_id: string;
  name: string;
  email?: string;
  password?: string;
  phone?: string;
  weight?: string;
  height?: string;
  notes?: string;
  experience_level?: 'Iniciante' | 'Intermediário' | 'Avançado';
  initial_assessment?: Partial<PhysicalAssessment>;
  // Extended fields for editing
  neck?: string;
  shoulder?: string;
  chest?: string;
  arm_right_relaxed?: string;
  arm_left_relaxed?: string;
  arm_right_contracted?: string;
  arm_left_contracted?: string;
  forearm_right?: string;
  forearm_left?: string;
  waist?: string;
  abdomen?: string;
  hips?: string;
  thigh_proximal_right?: string;
  thigh_proximal_left?: string;
  thigh_medial_right?: string;
  thigh_medial_left?: string;
  calf_right?: string;
  calf_left?: string;
  skinfold_chest?: string;
  skinfold_abdominal?: string;
  skinfold_thigh?: string;
  skinfold_triceps?: string;
  skinfold_suprailiac?: string;
  skinfold_subscapular?: string;
  skinfold_midaxillary?: string;
  // Photos
  photo_front?: string;
  photo_back?: string;
  photo_side_right?: string;
  photo_side_left?: string;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  totalCount: 0,
  history: [],
  isLoading: false,
  fetchStudents: async (personalId, params = {}) => {
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
      console.log('📋 Fetching students with params:', { personalId, ...params });

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // 1. Fetch count and basic links
      let query = supabase
        .from('coachings')
        .select(
          `
          status,
          student:profiles!client_id (
            id,
            full_name,
            email,
            avatar_url,
            invite_code,
            phone,
            created_at
          )
        `,
          { count: 'exact' }
        )
        .eq('professional_id', personalId);

      // Search filter
      if (search) {
        query = query.ilike('student.full_name', `%${search}%`);
      }

      // Sorting
      if (sortBy === 'full_name') {
        query = query.order('student(full_name)', { ascending: sortOrder === 'asc' });
      } else {
        query = query.order('student(created_at)', { ascending: sortOrder === 'asc' });
      }

      // Pagination
      query = query.range(from, to);

      const { data: linkedData, error: linkedError, count } = await query;

      if (linkedError) throw linkedError;

      // 2. Fetch latest assessment for each student
      const studentIds = (linkedData || [])
        .flatMap((item: { student?: { id: string } | { id: string }[] | null }) => {
          const s = Array.isArray(item.student) ? item.student[0] : item.student;
          return s ? [s.id] : [];
        })
        .filter(Boolean) as string[];

      const assessmentsMap = new Map<string, PhysicalAssessment>();
      if (studentIds.length > 0) {
        try {
          const { data: assessmentsData, error: assessmentsError } = await supabase
            .from('physical_assessments')
            .select('*')
            .in('student_id', studentIds)
            .order('created_at', { ascending: false });

          if (assessmentsError) throw assessmentsError;

          if (assessmentsData) {
            assessmentsData.forEach((assessment: PhysicalAssessment) => {
              if (!assessmentsMap.has(assessment.student_id)) {
                assessmentsMap.set(assessment.student_id, assessment);
              }
            });
          }
        } catch (err) {
          console.warn('⚠️ Failed to fetch assessments:', err);
        }
      }

      const seenIds = new Set<string>();
      const formattedStudents = (linkedData || [])
        .map(
          (item: {
            status: string;
            student?: Omit<Student, 'status'> | Omit<Student, 'status'>[] | null;
          }) => {
            const student = Array.isArray(item.student) ? item.student[0] : item.student;
            if (!student || seenIds.has(student.id)) return null;
            seenIds.add(student.id);

            const assessment: PhysicalAssessment | undefined = assessmentsMap.get(student.id);
            const safeAssessment = assessment || ({} as Partial<PhysicalAssessment>);

            return {
              ...student,
              status: item.status,
              weight: safeAssessment.weight?.toString(),
              height: safeAssessment.height?.toString(),
              notes: safeAssessment.notes,
              assessment: assessment,
            };
          }
        )
        .filter(Boolean) as Student[];

      set((state) => {
        const updated = append ? [...state.students, ...formattedStudents] : formattedStudents;
        return { students: updated, totalCount: updated.length };
      });
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      if (!append) set({ students: [] });
    } finally {
      set({ isLoading: false });
    }
  },
  createStudentInvite: async (data: StudentInviteData) => {
    try {
      console.log('🚀 Creating student with auth user...');
      console.log('📋 Input data:', { name: data.name, email: data.email, phone: data.phone });

      // Call the RPC function to create student with auth user
      // Now accepts email and password
      const { data: result, error } = await supabase.rpc('create_student_with_auth', {
        p_professional_id: data.personal_id,
        p_full_name: data.name,
        p_email: data.email,
        p_password: data.password,
        p_phone: data.phone || null,
        p_weight: data.weight ? parseFloat(data.weight) : null,
        p_height: data.height ? parseFloat(data.height) : null,
        p_notes: data.notes || null,
        p_experience_level: data.experience_level || null,
        p_initial_assessment: data.initial_assessment || null,
      });

      if (error) {
        console.error('❌ RPC error:', error);
        throw error;
      }

      if (!result?.success) {
        console.error('❌ RPC returned error:', result?.error);
        throw new Error(result?.error || 'Failed to create student');
      }

      // MANUALLY INSERT PHYSICAL ASSESSMENT to ensure it's saved
      if (data.weight || data.height || data.initial_assessment) {
        console.log('📝 Saving initial assessment manually...');
        const assessmentData = {
          student_id: result.student_id,
          personal_id: data.personal_id,
          weight: data.weight ? parseFloat(data.weight) : null,
          height: data.height ? parseFloat(data.height) : null,
          notes: data.notes || null,
          // Map initial assessment fields if they exist
          neck: data.initial_assessment?.neck ?? null,
          shoulder: data.initial_assessment?.shoulder ?? null,
          chest: data.initial_assessment?.chest ?? null,
          arm_right_relaxed: data.initial_assessment?.arm_right_relaxed ?? null,
          arm_left_relaxed: data.initial_assessment?.arm_left_relaxed ?? null,
          arm_right_contracted: data.initial_assessment?.arm_right_contracted ?? null,
          arm_left_contracted: data.initial_assessment?.arm_left_contracted ?? null,
          forearm_right: data.initial_assessment?.forearm_right ?? null,
          forearm_left: data.initial_assessment?.forearm_left ?? null,
          waist: data.initial_assessment?.waist ?? null,
          abdomen: data.initial_assessment?.abdomen ?? null,
          hips: data.initial_assessment?.hips ?? null,
          thigh_proximal_right: data.initial_assessment?.thigh_proximal_right ?? null,
          thigh_proximal_left: data.initial_assessment?.thigh_proximal_left ?? null,
          thigh_medial_right: data.initial_assessment?.thigh_medial_right ?? null,
          thigh_medial_left: data.initial_assessment?.thigh_medial_left ?? null,
          calf_right: data.initial_assessment?.calf_right ?? null,
          calf_left: data.initial_assessment?.calf_left ?? null,
          skinfold_chest: data.initial_assessment?.skinfold_chest ?? null,
          skinfold_abdominal: data.initial_assessment?.skinfold_abdominal ?? null,
          skinfold_thigh: data.initial_assessment?.skinfold_thigh ?? null,
          skinfold_triceps: data.initial_assessment?.skinfold_triceps ?? null,
          skinfold_suprailiac: data.initial_assessment?.skinfold_suprailiac ?? null,
          skinfold_subscapular: data.initial_assessment?.skinfold_subscapular ?? null,
          skinfold_midaxillary: data.initial_assessment?.skinfold_midaxillary ?? null,
          // Photos
          photo_front: data.initial_assessment?.photo_front || null,
          photo_back: data.initial_assessment?.photo_back || null,
          photo_side_right: data.initial_assessment?.photo_side_right || null,
          photo_side_left: data.initial_assessment?.photo_side_left || null,
        };

        const { error: assessmentError } = await supabase
          .from('physical_assessments')
          .insert(assessmentData);

        if (assessmentError) {
          console.error('❌ Failed to save initial assessment:', assessmentError);
          // Not throwing here to avoid rolling back the student creation, but technically partial success
        } else {
          console.log('✅ Initial assessment saved successfully');
        }
      }

      console.log('✅ Student created successfully!');
      console.log('📦 Result:', result);

      const newStudent = {
        id: result.student_id,
        full_name: data.name,
        email: result.email,
        avatar_url: null,
        status: 'invited' as const,
        is_invite: true,
        phone: data.phone,
        weight: data.weight,
        height: data.height,
        notes: data.notes,
        experience_level: data.experience_level,
        assessment: data.initial_assessment,
      };

      console.log('🔄 Calling SET with new student:', newStudent);
      set((state) => {
        console.log('Inside SET updater. Current count:', state.students.length);
        return {
          students: [newStudent, ...state.students],
        };
      });
      console.log('✅ SET called.');

      return {
        success: true,
        code: result.invite_code,
        studentId: result.student_id,
        email: result.email,
        password: data.password, // Return the password used
      };
    } catch (error: unknown) {
      console.error('❌ Error creating student with auth:', error);
      let errorMessage = error instanceof Error ? error.message : String(error);

      // Check for duplicate email error
      if (
        errorMessage?.includes('users_email_partial_key') ||
        errorMessage?.includes('duplicate key value') ||
        errorMessage?.includes('User already registered')
      ) {
        errorMessage = 'Este e-mail já está cadastrado. Por favor, utilize outro e-mail.';
      }

      return { success: false, error: errorMessage };
    }
  },
  cancelInvite: async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', inviteId)
        .eq('account_type', 'student'); // Safety check

      if (error) throw error;

      // Update local state
      set((state) => ({
        students: state.students.filter((s) => s.id !== inviteId),
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
        .from('coachings')
        .select('id')
        .eq('client_id', studentId)
        .eq('professional_id', personal.id)
        .single();

      if (existing) {
        return { success: false, error: 'Você já está vinculado a este personal.' };
      }

      // Create link
      const { error: linkError } = await supabase.from('coachings').insert({
        client_id: studentId,
        professional_id: personal.id,
        status: 'active',
        service_type: 'personal_training',
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
      } catch (_e) {
        // Ignore if table doesn't exist
      }

      // 4. Finally delete the link
      const { error } = await supabase
        .from('coachings')
        .delete()
        .eq('professional_id', personalId)
        .eq('client_id', studentId);

      if (error) throw error;

      // Update local state
      const currentStudents = get().students;
      set({ students: currentStudents.filter((s) => s.id !== studentId) });
    } catch (error) {
      console.error('Error removing student:', error);
      Alert.alert('Erro', 'Não foi possível remover o aluno. Tente novamente.');
    }
  },
  updateStudent: async (studentId, data) => {
    try {
      const student = get().students.find((s) => s.id === studentId);
      if (!student) throw new Error('Student not found');

      // Check if it's a pending invite
      if (student.is_invite || student.status === 'invited') {
        // Update 'students' table directly
        // Update profiles table instead of students
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: data.name,
            phone: data.phone,
            weight: data.weight ? parseFloat(data.weight) : null,
            height: data.height ? parseFloat(data.height) : null,
            notes: data.notes,
            experience_level: data.experience_level,
            // initial_assessment is not directly on profiles, handled via physical_assessments or separate logic
            // For now, we update the main fields
          })
          .eq('id', studentId);

        // If there's assessment data, we should update/insert into physical_assessments
        if (!updateError && data.initial_assessment) {
          // Logic to update assessment would go here
        }

        if (updateError) throw updateError;
      } else {
        // It's a linked profile - Update Profile and Insert Assessment

        // 1. Update Profile (Basic Info)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: data.name,
            phone: data.phone,
            experience_level: data.experience_level,
          })
          .eq('id', studentId);

        if (profileError) throw profileError;

        // 2. Update or Insert Physical Assessment
        const { data: session } = await supabase.auth.getSession();
        const personalId = session.session?.user.id;

        if (personalId) {
          const { error: assessmentError } = await supabase.from('physical_assessments').insert({
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
            arm_right_contracted: data.arm_right_contracted
              ? parseFloat(data.arm_right_contracted)
              : null,
            arm_left_contracted: data.arm_left_contracted
              ? parseFloat(data.arm_left_contracted)
              : null,
            forearm_right: data.forearm_right ? parseFloat(data.forearm_right) : null,
            forearm_left: data.forearm_left ? parseFloat(data.forearm_left) : null,
            waist: data.waist ? parseFloat(data.waist) : null,
            abdomen: data.abdomen ? parseFloat(data.abdomen) : null,
            hips: data.hips ? parseFloat(data.hips) : null,
            thigh_proximal_right: data.thigh_proximal_right
              ? parseFloat(data.thigh_proximal_right)
              : null,
            thigh_proximal_left: data.thigh_proximal_left
              ? parseFloat(data.thigh_proximal_left)
              : null,
            thigh_medial_right: data.thigh_medial_right
              ? parseFloat(data.thigh_medial_right)
              : null,
            thigh_medial_left: data.thigh_medial_left ? parseFloat(data.thigh_medial_left) : null,
            calf_right: data.calf_right ? parseFloat(data.calf_right) : null,
            calf_left: data.calf_left ? parseFloat(data.calf_left) : null,
            skinfold_chest: data.skinfold_chest ? parseFloat(data.skinfold_chest) : null,
            skinfold_abdominal: data.skinfold_abdominal
              ? parseFloat(data.skinfold_abdominal)
              : null,
            skinfold_thigh: data.skinfold_thigh ? parseFloat(data.skinfold_thigh) : null,
            skinfold_triceps: data.skinfold_triceps ? parseFloat(data.skinfold_triceps) : null,
            skinfold_suprailiac: data.skinfold_suprailiac
              ? parseFloat(data.skinfold_suprailiac)
              : null,
            skinfold_subscapular: data.skinfold_subscapular
              ? parseFloat(data.skinfold_subscapular)
              : null,
            skinfold_midaxillary: data.skinfold_midaxillary
              ? parseFloat(data.skinfold_midaxillary)
              : null,
          });

          if (assessmentError) console.error('Error updating assessment:', assessmentError);
        }
      }

      // Prepare assessment update with parsed numbers
      const assessmentUpdate: Partial<PhysicalAssessment> = {};

      if (data.weight) assessmentUpdate.weight = parseFloat(data.weight);
      if (data.height) assessmentUpdate.height = parseFloat(data.height);
      if (data.neck) assessmentUpdate.neck = parseFloat(data.neck);
      if (data.shoulder) assessmentUpdate.shoulder = parseFloat(data.shoulder);
      if (data.chest) assessmentUpdate.chest = parseFloat(data.chest);
      if (data.waist) assessmentUpdate.waist = parseFloat(data.waist);
      if (data.abdomen) assessmentUpdate.abdomen = parseFloat(data.abdomen);
      if (data.hips) assessmentUpdate.hips = parseFloat(data.hips);
      if (data.arm_right_relaxed)
        assessmentUpdate.arm_right_relaxed = parseFloat(data.arm_right_relaxed);
      if (data.arm_left_relaxed)
        assessmentUpdate.arm_left_relaxed = parseFloat(data.arm_left_relaxed);
      if (data.arm_right_contracted)
        assessmentUpdate.arm_right_contracted = parseFloat(data.arm_right_contracted);
      if (data.arm_left_contracted)
        assessmentUpdate.arm_left_contracted = parseFloat(data.arm_left_contracted);
      if (data.forearm_right) assessmentUpdate.forearm_right = parseFloat(data.forearm_right);
      if (data.forearm_left) assessmentUpdate.forearm_left = parseFloat(data.forearm_left);
      if (data.thigh_proximal_right)
        assessmentUpdate.thigh_proximal_right = parseFloat(data.thigh_proximal_right);
      if (data.thigh_proximal_left)
        assessmentUpdate.thigh_proximal_left = parseFloat(data.thigh_proximal_left);
      if (data.thigh_medial_right)
        assessmentUpdate.thigh_medial_right = parseFloat(data.thigh_medial_right);
      if (data.thigh_medial_left)
        assessmentUpdate.thigh_medial_left = parseFloat(data.thigh_medial_left);
      if (data.calf_right) assessmentUpdate.calf_right = parseFloat(data.calf_right);
      if (data.calf_left) assessmentUpdate.calf_left = parseFloat(data.calf_left);

      // Skinfolds
      if (data.skinfold_chest) assessmentUpdate.skinfold_chest = parseFloat(data.skinfold_chest);
      if (data.skinfold_abdominal)
        assessmentUpdate.skinfold_abdominal = parseFloat(data.skinfold_abdominal);
      if (data.skinfold_thigh) assessmentUpdate.skinfold_thigh = parseFloat(data.skinfold_thigh);
      if (data.skinfold_triceps)
        assessmentUpdate.skinfold_triceps = parseFloat(data.skinfold_triceps);
      if (data.skinfold_suprailiac)
        assessmentUpdate.skinfold_suprailiac = parseFloat(data.skinfold_suprailiac);
      if (data.skinfold_subscapular)
        assessmentUpdate.skinfold_subscapular = parseFloat(data.skinfold_subscapular);
      if (data.skinfold_midaxillary)
        assessmentUpdate.skinfold_midaxillary = parseFloat(data.skinfold_midaxillary);

      // Pass through photos
      if (data.photo_front) assessmentUpdate.photo_front = data.photo_front;
      if (data.photo_back) assessmentUpdate.photo_back = data.photo_back;
      if (data.photo_side_right) assessmentUpdate.photo_side_right = data.photo_side_right;
      if (data.photo_side_left) assessmentUpdate.photo_side_left = data.photo_side_left;

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
                experience_level: data.experience_level,
                assessment: { ...s.assessment, ...assessmentUpdate }, // Update assessment cache
              }
            : s
        ),
      }));

      return { success: true };
    } catch (error: unknown) {
      console.error('Error updating student:', error);
      return { success: false, error: (error as Error).message };
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

  addPhysicalAssessment: async (studentId, data) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const personalId = session.session?.user.id;

      if (!personalId) throw new Error('Usuario não autenticado');

      const { error } = await supabase.from('physical_assessments').insert({
        student_id: studentId,
        personal_id: personalId,
        ...data,
        // Ensure optional fields are handled if passed directly
      });

      if (error) throw error;

      // Update local history if we are viewing this student
      // Simplest way is to refetch history
      await get().fetchStudentHistory(studentId);

      return { success: true };
    } catch (error: unknown) {
      console.error('Error adding assessment:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Reset all state on logout
  reset: () => {
    set({
      students: [],
      totalCount: 0,
      history: [],
      isLoading: false,
    });
  },
}));
