import { supabase } from '@elevapro/supabase';

interface AssessmentPhotoPaths {
  front: string | null;
  back: string | null;
  side_right: string | null;
  side_left: string | null;
}

export const PhysicalAssessmentService = {
  async getLatestAssessmentPhotos(studentId: string): Promise<AssessmentPhotoPaths | null> {
    const { data } = await supabase
      .from('physical_assessments')
      .select('photo_front, photo_back, photo_side_right, photo_side_left')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return {
      front: (data.photo_front as string | null) ?? null,
      back: (data.photo_back as string | null) ?? null,
      side_right: (data.photo_side_right as string | null) ?? null,
      side_left: (data.photo_side_left as string | null) ?? null,
    };
  },
};
