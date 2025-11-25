'use client';

import { ActivityFeed } from '@/dashboard';
import { QuickActions } from '@/dashboard';
import { StatCard } from '@/dashboard';
import { useDashboardStats } from '@/shared/hooks/useDashboardStats';
import { useRecentActivity } from '@/shared/hooks/useRecentActivity';
import { supabase } from '@meupersonal/supabase';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('');
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activities = [], isLoading: activitiesLoading } = useRecentActivity();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('❌ Error getting user:', userError);
          return;
        }
        
        if (user) {
          console.log('✅ User authenticated:', user.id, user.email);
          
          // Try to get full name from profiles
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.error('❌ Error fetching profile:', profileError);
            console.error('Error details:', {
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint,
              code: profileError.code
            });
          } else {
            console.log('✅ Profile loaded:', profile);
          }
          
          setUserName(profile?.full_name || user.email?.split('@')[0] || 'Profissional');
        }
      } catch (error) {
        console.error('❌ Unexpected error:', error);
      }
    };

    getUser();
  }, []);

  // Get current date formatted
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 relative">
      {/* Background Effects Removed */}

      {/* Header */}
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo de volta, <span className="text-foreground font-medium">{userName}</span>!
            </p>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{currentDate}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        <StatCard
          title="Total de Alunos"
          value={stats?.totalStudents ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="primary"
          loading={statsLoading}
        />

        <StatCard
          title="Treinos Criados"
          value={stats?.totalWorkouts ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          color="secondary"
          loading={statsLoading}
        />

        <StatCard
          title="Dietas Ativas"
          value={stats?.activeDiets ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          color="accent"
          loading={statsLoading}
        />

        <StatCard
          title="Treinos Completados"
          value={stats?.completedWorkoutsThisWeek ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="primary"
          loading={statsLoading}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* Activity Feed - 2/3 width */}
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} loading={activitiesLoading} />
        </div>

        {/* Quick Actions - 1/3 width */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

