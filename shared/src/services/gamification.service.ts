import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Achievement,
  DailyGoal,
  LeaderboardEntry,
  StudentStreak,
} from "../types/gamification.types";

export const createGamificationService = (supabase: SupabaseClient) => ({
  getDailyGoal: async (date: string, studentId?: string): Promise<DailyGoal | null> => {
    let query = supabase.from("daily_goals").select("*").eq("date", date);
    if (studentId) query = query.eq("student_id", studentId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data as DailyGoal | null;
  },

  getWeeklyGoals: async (
    startDate: string,
    endDate: string,
    studentId?: string,
  ): Promise<DailyGoal[]> => {
    let query = supabase
      .from("daily_goals")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });
    if (studentId) query = query.eq("student_id", studentId);
    const { data, error } = await query;
    if (error) throw error;
    return (data as DailyGoal[]) ?? [];
  },

  getStreak: async (studentId?: string): Promise<StudentStreak | null> => {
    let query = supabase.from("student_streaks").select("*");
    if (studentId) query = query.eq("student_id", studentId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data as StudentStreak | null;
  },

  getAchievements: async (studentId?: string): Promise<Achievement[]> => {
    let query = supabase.from("achievements").select("*").order("earned_at", { ascending: false });
    if (studentId) query = query.eq("student_id", studentId);
    const { data, error } = await query;
    if (error) throw error;
    return (data as Achievement[]) ?? [];
  },

  updateMealProgress: async (goalId: string, completed: number): Promise<void> => {
    const { error } = await supabase
      .from("daily_goals")
      .update({ meals_completed: completed })
      .eq("id", goalId);
    if (error) throw error;
  },

  updateWorkoutProgress: async (goalId: string, completed: number): Promise<void> => {
    const { error } = await supabase
      .from("daily_goals")
      .update({ workout_completed: completed })
      .eq("id", goalId);
    if (error) throw error;
  },

  calculateDailyGoals: async (studentId: string, date: string): Promise<void> => {
    const { error } = await supabase
      .from("daily_goals")
      .upsert({ student_id: studentId, date }, { onConflict: "student_id,date", ignoreDuplicates: true });
    if (error) throw error;
  },

  useStreakFreeze: async (studentId: string): Promise<void> => {
    const { data: streak, error: fetchError } = await supabase
      .from("student_streaks")
      .select("*")
      .eq("student_id", studentId)
      .single();
    if (fetchError) throw fetchError;
    if (!streak || streak.freeze_available <= 0) throw new Error("No freeze available");

    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("student_streaks")
      .update({ freeze_available: streak.freeze_available - 1, last_freeze_date: today })
      .eq("id", streak.id);
    if (error) throw error;
  },

  fetchLeaderboard: async (
    startDate: string,
    scope: "global" | "my_students",
    specialistId?: string,
  ): Promise<LeaderboardEntry[]> => {
    if (scope === "my_students" && specialistId) {
      const { data: linkedData, error: linkError } = await supabase
        .from("coachings")
        .select(`client_id, student:profiles!client_id (id, full_name, avatar_url, phone)`)
        .eq("professional_id", specialistId)
        .eq("status", "active");
      if (linkError) throw linkError;
      if (!linkedData || linkedData.length === 0) return [];

      type StudentProfile = {
        id: string;
        full_name: string;
        avatar_url: string | null;
        phone: string | null;
      };
      const students = linkedData
        .map((d) => d.student as unknown as StudentProfile)
        .filter(Boolean);
      const studentIds = students.map((s) => s.id);

      const { data: scores, error: scoresError } = await supabase
        .from("ranking_scores")
        .select("student_id, points")
        .gte("week_start_date", startDate)
        .in("student_id", studentIds);
      if (scoresError) throw scoresError;

      const scoreMap = new Map<string, number>();
      scores?.forEach((s) => {
        scoreMap.set(s.student_id, (scoreMap.get(s.student_id) ?? 0) + s.points);
      });

      return students
        .map((s) => ({
          student_id: s.id,
          name: s.full_name || "Aluno",
          points: scoreMap.get(s.id) ?? 0,
          avatar_url: s.avatar_url ?? undefined,
          rank: 0,
          phone: s.phone ?? undefined,
        }))
        .sort((a, b) => b.points - a.points)
        .map((entry, i) => ({ ...entry, rank: i + 1 }));
    }

    // global
    const { data: scores, error: scoresError } = await supabase
      .from("ranking_scores")
      .select("student_id, points")
      .gte("week_start_date", startDate);
    if (scoresError) throw scoresError;
    if (!scores || scores.length === 0) return [];

    const scoreMap = new Map<string, number>();
    scores.forEach((s) => {
      scoreMap.set(s.student_id, (scoreMap.get(s.student_id) ?? 0) + s.points);
    });

    const sortedScores = Array.from(scoreMap.entries())
      .map(([student_id, points]) => ({ student_id, points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 50);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, phone")
      .in(
        "id",
        sortedScores.map((s) => s.student_id),
      );
    if (profilesError) throw profilesError;

    const profileMap = new Map(profiles?.map((p) => [p.id, p]));
    return sortedScores.map((score, i) => {
      const profile = profileMap.get(score.student_id);
      return {
        student_id: score.student_id,
        name: profile?.full_name || "Aluno",
        points: score.points,
        avatar_url: profile?.avatar_url ?? undefined,
        rank: i + 1,
        phone: profile?.phone ?? undefined,
      };
    });
  },
});
