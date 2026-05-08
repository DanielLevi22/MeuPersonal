import { supabase } from '@elevapro/supabase';

export interface PhysicalAssessmentData {
  createdAt: string | null;
  weight: number | null;
  height: number | null;
  neck: number | null;
  shoulder: number | null;
  chest: number | null;
  waist: number | null;
  abdomen: number | null;
  hips: number | null;
  arm_right_relaxed: number | null;
  arm_left_relaxed: number | null;
  forearm_right: number | null;
  forearm_left: number | null;
  thigh_proximal_right: number | null;
  thigh_proximal_left: number | null;
  calf_right: number | null;
  calf_left: number | null;
  skinfold_triceps: number | null;
  skinfold_chest: number | null;
  skinfold_subscapular: number | null;
  skinfold_suprailiac: number | null;
  skinfold_abdominal: number | null;
  skinfold_thigh: number | null;
  notes: string | null;
  photo_front: string | null;
  photo_back: string | null;
  photo_side_right: string | null;
  photo_side_left: string | null;
}

export const PhysicalAssessmentService = {
  async getLatestAssessment(studentId: string): Promise<PhysicalAssessmentData | null> {
    const { data } = await supabase
      .from('physical_assessments')
      .select(
        'created_at, weight, height, neck, shoulder, chest, waist, abdomen, hips, arm_right_relaxed, arm_left_relaxed, forearm_right, forearm_left, thigh_proximal_right, thigh_proximal_left, calf_right, calf_left, skinfold_triceps, skinfold_chest, skinfold_subscapular, skinfold_suprailiac, skinfold_abdominal, skinfold_thigh, notes, photo_front, photo_back, photo_side_right, photo_side_left'
      )
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    const n = (v: unknown): number | null => (typeof v === 'number' && v > 0 ? v : null);

    return {
      createdAt: (data.created_at as string | null) ?? null,
      weight: n(data.weight),
      height: n(data.height),
      neck: n(data.neck),
      shoulder: n(data.shoulder),
      chest: n(data.chest),
      waist: n(data.waist),
      abdomen: n(data.abdomen),
      hips: n(data.hips),
      arm_right_relaxed: n(data.arm_right_relaxed),
      arm_left_relaxed: n(data.arm_left_relaxed),
      forearm_right: n(data.forearm_right),
      forearm_left: n(data.forearm_left),
      thigh_proximal_right: n(data.thigh_proximal_right),
      thigh_proximal_left: n(data.thigh_proximal_left),
      calf_right: n(data.calf_right),
      calf_left: n(data.calf_left),
      skinfold_triceps: n(data.skinfold_triceps),
      skinfold_chest: n(data.skinfold_chest),
      skinfold_subscapular: n(data.skinfold_subscapular),
      skinfold_suprailiac: n(data.skinfold_suprailiac),
      skinfold_abdominal: n(data.skinfold_abdominal),
      skinfold_thigh: n(data.skinfold_thigh),
      notes: (data.notes as string | null) ?? null,
      photo_front: (data.photo_front as string | null) ?? null,
      photo_back: (data.photo_back as string | null) ?? null,
      photo_side_right: (data.photo_side_right as string | null) ?? null,
      photo_side_left: (data.photo_side_left as string | null) ?? null,
    };
  },
};
