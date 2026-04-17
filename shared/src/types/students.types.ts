import type { ServiceType } from "./auth.types";

export type LinkStatus = "active" | "inactive";

export interface Student {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  account_status: "active" | "inactive" | "invited";
  service_type: ServiceType;
  link_status: LinkStatus;
  link_created_at: string;
}

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
  waist: number | null;
  abdomen: number | null;
  hips: number | null;
  arm_right_relaxed: number | null;
  arm_left_relaxed: number | null;
  arm_right_contracted: number | null;
  arm_left_contracted: number | null;
  forearm_right: number | null;
  forearm_left: number | null;
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

export interface FetchStudentsParams {
  page?: number;
  limit?: number;
  sortBy?: "full_name" | "created_at";
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface FetchStudentsResult {
  students: Student[];
  total: number;
}

export interface LinkStudentResult {
  success: boolean;
  error?: string;
}

export interface CreateStudentData {
  specialist_id: string;
  full_name: string;
  email: string;
  password: string;
  service_type: ServiceType;
}
