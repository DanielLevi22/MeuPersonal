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
  generateInviteCode: () => Promise<string | null>;
}

export const useStudentStore = create<StudentState>((set) => ({
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
  generateInviteCode: async () => {
    // Placeholder for invite code generation logic
    // In a real app, this might call an Edge Function or generate a unique link
    return "123456"; 
  },
}));
