'use client';

import { supabase } from '@meupersonal/supabase';
import { useEffect, useState } from 'react';

interface AnalyticsData {
  userMetrics: {
    totalUsers: number;
    newUsersThisMonth: number;
    activeUsersLast7Days: number;
    activeUsersLast30Days: number;
    usersByType: {
      admin: number;
      professional: number;
      managed_student: number;
      autonomous_student: number;
    };
  };
  growthMetrics: {
    dailyGrowth: Array<{ date: string; count: number }>;
    monthlyGrowth: Array<{ month: string; count: number }>;
  };
  engagementMetrics: {
    totalWorkouts: number;
    totalDietPlans: number;
    avgWorkoutsPerProfessional: number;
    avgStudentsPerProfessional: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    try {
      setIsLoading(true);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get new users this month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString());

      // Get active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: activeUsersLast7Days } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', sevenDaysAgo.toISOString());

      // Get active users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsersLast30Days } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', thirtyDaysAgo.toISOString());

      // Get users by type
      const { count: adminCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_type', 'admin');

      const { count: professionalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_type', 'professional');

      const { count: managedStudentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_type', 'managed_student');

      const { count: autonomousStudentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_type', 'autonomous_student');

      // Get workout and diet plan counts
      const { count: totalWorkouts } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true });

      const { count: totalDietPlans } = await supabase
        .from('diet_plans')
        .select('*', { count: 'exact', head: true });

      setData({
        userMetrics: {
          totalUsers: totalUsers || 0,
          newUsersThisMonth: newUsersThisMonth || 0,
          activeUsersLast7Days: activeUsersLast7Days || 0,
          activeUsersLast30Days: activeUsersLast30Days || 0,
          usersByType: {
            admin: adminCount || 0,
            professional: professionalCount || 0,
            managed_student: managedStudentCount || 0,
            autonomous_student: autonomousStudentCount || 0,
          },
        },
        growthMetrics: {
          dailyGrowth: [],
          monthlyGrowth: [],
        },
        engagementMetrics: {
          totalWorkouts: totalWorkouts || 0,
          totalDietPlans: totalDietPlans || 0,
          avgWorkoutsPerProfessional: professionalCount ? Math.round((totalWorkouts || 0) / professionalCount) : 0,
          avgStudentsPerProfessional: professionalCount ? Math.round((managedStudentCount || 0) / professionalCount) : 0,
        },
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  const calculateGrowthPercentage = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Métricas e insights da plataforma
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        {(['7d', '30d', '90d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === range
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-muted-foreground hover:bg-muted border border-border'
            }`}
          >
            {range === '7d' ? 'Últimos 7 dias' : range === '30d' ? 'Últimos 30 dias' : 'Últimos 90 dias'}
          </button>
        ))}
      </div>

      {/* User Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Métricas de Usuários</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{data?.userMetrics.totalUsers || 0}</p>
            <p className="text-sm text-muted-foreground">Total de Usuários</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{data?.userMetrics.newUsersThisMonth || 0}</p>
            <p className="text-sm text-muted-foreground">Novos este Mês</p>
            <p className="text-xs text-green-400 mt-2">
              +{calculateGrowthPercentage(data?.userMetrics.newUsersThisMonth || 0, data?.userMetrics.totalUsers || 0)}% do total
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{data?.userMetrics.activeUsersLast7Days || 0}</p>
            <p className="text-sm text-muted-foreground">Ativos (7d)</p>
            <p className="text-xs text-blue-400 mt-2">
              {calculateGrowthPercentage(data?.userMetrics.activeUsersLast7Days || 0, data?.userMetrics.totalUsers || 0)}% do total
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{data?.userMetrics.activeUsersLast30Days || 0}</p>
            <p className="text-sm text-muted-foreground">Ativos (30d)</p>
            <p className="text-xs text-purple-400 mt-2">
              {calculateGrowthPercentage(data?.userMetrics.activeUsersLast30Days || 0, data?.userMetrics.totalUsers || 0)}% do total
            </p>
          </div>
        </div>
      </div>

      {/* User Distribution */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Distribuição de Usuários</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface border border-purple-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-xl">👑</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Admins</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">{data?.userMetrics.usersByType.admin || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {calculateGrowthPercentage(data?.userMetrics.usersByType.admin || 0, data?.userMetrics.totalUsers || 0)}% do total
            </p>
          </div>

          <div className="bg-surface border border-orange-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-xl">💼</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Profissionais</span>
            </div>
            <p className="text-3xl font-bold text-orange-400">{data?.userMetrics.usersByType.professional || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {calculateGrowthPercentage(data?.userMetrics.usersByType.professional || 0, data?.userMetrics.totalUsers || 0)}% do total
            </p>
          </div>

          <div className="bg-surface border border-blue-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-xl">🎓</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Alunos Gerenciados</span>
            </div>
            <p className="text-3xl font-bold text-blue-400">{data?.userMetrics.usersByType.managed_student || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {calculateGrowthPercentage(data?.userMetrics.usersByType.managed_student || 0, data?.userMetrics.totalUsers || 0)}% do total
            </p>
          </div>

          <div className="bg-surface border border-green-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-xl">🚀</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Alunos Autônomos</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{data?.userMetrics.usersByType.autonomous_student || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {calculateGrowthPercentage(data?.userMetrics.usersByType.autonomous_student || 0, data?.userMetrics.totalUsers || 0)}% do total
            </p>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Métricas de Engajamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-2xl">💪</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{data?.engagementMetrics.totalWorkouts || 0}</p>
            <p className="text-sm text-muted-foreground">Total de Treinos</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl">🥗</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{data?.engagementMetrics.totalDietPlans || 0}</p>
            <p className="text-sm text-muted-foreground">Total de Dietas</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{data?.engagementMetrics.avgWorkoutsPerProfessional || 0}</p>
            <p className="text-sm text-muted-foreground">Média Treinos/Prof</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">👨‍🎓</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{data?.engagementMetrics.avgStudentsPerProfessional || 0}</p>
            <p className="text-sm text-muted-foreground">Média Alunos/Prof</p>
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">Saúde da Plataforma</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Taxa de Engajamento de Usuários</span>
              <span className="text-sm font-bold text-foreground">
                {calculateGrowthPercentage(data?.userMetrics.activeUsersLast7Days || 0, data?.userMetrics.totalUsers || 0)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all"
                style={{ width: `${calculateGrowthPercentage(data?.userMetrics.activeUsersLast7Days || 0, data?.userMetrics.totalUsers || 0)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Atividade dos Profissionais</span>
              <span className="text-sm font-bold text-foreground">
                {data?.engagementMetrics.avgWorkoutsPerProfessional || 0} treinos/prof
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((data?.engagementMetrics.avgWorkoutsPerProfessional || 0) * 10, 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Taxa de Crescimento (Este Mês)</span>
              <span className="text-sm font-bold text-foreground">
                {calculateGrowthPercentage(data?.userMetrics.newUsersThisMonth || 0, data?.userMetrics.totalUsers || 0)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${calculateGrowthPercentage(data?.userMetrics.newUsersThisMonth || 0, data?.userMetrics.totalUsers || 0)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
