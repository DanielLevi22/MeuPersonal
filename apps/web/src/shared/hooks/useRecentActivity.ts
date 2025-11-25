'use client';

import type { Activity } from '@/dashboard';
import { supabase } from '@meupersonal/supabase';
import { useQuery } from '@tanstack/react-query';

async function fetchRecentActivity(): Promise<Activity[]> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const activities: Activity[] = [];

  // Fetch completed workout sessions (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: workoutSessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      completed_at,
      student_id,
      workout_id,
      workouts!inner(personal_id, title),
      profiles!workout_sessions_student_id_fkey(full_name)
    `)
    .eq('workouts.personal_id', user.id)
    .not('completed_at', 'is', null)
    .gte('completed_at', oneWeekAgo.toISOString())
    .order('completed_at', { ascending: false })
    .limit(5);

  if (workoutSessions) {
    workoutSessions.forEach((session: any) => {
      activities.push({
        id: `workout-${session.id}`,
        type: 'workout_completed',
        studentName: session.profiles?.full_name || 'Aluno',
        description: `Completou o treino "${session.workouts?.title || 'Treino'}"`,
        timestamp: new Date(session.completed_at),
      });
    });
  }

  // Fetch new students (last 7 days)
  const { data: newStudents } = await supabase
    .from('students_personals')
    .select(`
      id,
      created_at,
      profiles!students_personals_student_id_fkey(full_name)
    `)
    .eq('personal_id', user.id)
    .gte('created_at', oneWeekAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(3);

  if (newStudents) {
    newStudents.forEach((student: any) => {
      activities.push({
        id: `student-${student.id}`,
        type: 'student_added',
        studentName: student.profiles?.full_name || 'Novo Aluno',
        description: 'Foi adicionado como aluno',
        timestamp: new Date(student.created_at),
      });
    });
  }

  // Fetch new diet plans (last 7 days)
  const { data: dietPlans } = await supabase
    .from('diet_plans')
    .select(`
      id,
      created_at,
      profiles!diet_plans_student_id_fkey(full_name)
    `)
    .eq('personal_id', user.id)
    .gte('created_at', oneWeekAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(3);

  if (dietPlans) {
    dietPlans.forEach((plan: any) => {
      activities.push({
        id: `diet-${plan.id}`,
        type: 'diet_created',
        studentName: plan.profiles?.full_name || 'Aluno',
        description: 'Recebeu um novo plano de dieta',
        timestamp: new Date(plan.created_at),
      });
    });
  }

  // Sort all activities by timestamp (most recent first)
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Return top 10 activities
  return activities.slice(0, 10);
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: fetchRecentActivity,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}
