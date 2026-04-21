import { supabase } from '@elevapro/supabase';
import { AnamnesisResponse, StudentAnamnesis } from '../types/assessment';

export const AnamnesisService = {
  /**
   * Saves or updates the student's anamnesis responses.
   * @param studentId The ID of the student (auth user ID).
   * @param responses The complete object of responses.
   * @param isComplete Whether the anamnesis is fully completed.
   */
  async saveAnamnesis(
    studentId: string,
    responses: Record<string, AnamnesisResponse>,
    isComplete: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('student_anamnesis').upsert(
        {
          student_id: studentId,
          responses: responses,
          completed_at: isComplete ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id' }
      );

      if (error) {
        console.error('Error saving anamnesis to Supabase:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      console.error('Unexpected error saving anamnesis:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  /**
   * Fetches the existing anamnesis for a student.
   * @param studentId The ID of the student.
   */
  async getAnamnesis(studentId: string): Promise<StudentAnamnesis | null> {
    try {
      const { data, error } = await supabase
        .from('student_anamnesis')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (error) {
        // If simply not found, return null without error
        if (error.code === 'PGRST116') return null;

        console.error('Error fetching anamnesis:', error);
        throw error;
      }

      return {
        studentId: data.student_id,
        completedAt: data.completed_at,
        responses: data.responses,
      } as StudentAnamnesis;
    } catch (err) {
      console.error('Unexpected error fetching anamnesis:', err);
      return null;
    }
  },
};
