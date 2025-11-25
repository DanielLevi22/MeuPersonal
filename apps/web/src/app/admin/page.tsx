'use client';

import { supabase } from '@meupersonal/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProfessionals: number;
  totalStudents: number;
  recentUsers: Array<{
    id: string;
    email: string;
    full_name: string | null;
    account_type: string;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setIsLoading(true);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', sevenDaysAgo.toISOString());

      // Get professionals count
      const { count: totalProfessionals } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_type', 'professional');

      // Get students count (both types)
      const { count: totalStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('account_type', ['managed_student', 'autonomous_student']);

      // Get recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, email, full_name, account_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalProfessionals: totalProfessionals || 0,
        totalStudents: totalStudents || 0,
        recentUsers: recentUsers || [],
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const getAccountTypeBadge = (accountType: string) => {
    const badges = {
      admin: { label: 'Admin', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
      professional: { label: 'Profissional', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
      managed_student: { label: 'Aluno (Gerenciado)', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
      autonomous_student: { label: 'Aluno (Autônomo)', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
    };

    const badge = badges[accountType as keyof typeof badges] || { label: accountType, color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
          Dashboard Administrativo
        </h1>
        <p className="text-muted-foreground">
          Visão geral e gerenciamento do sistema
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats?.totalUsers || 0}</p>
          <p className="text-sm text-muted-foreground">Total de Usuários</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats?.activeUsers || 0}</p>
          <p className="text-sm text-muted-foreground">Usuários Ativos (7d)</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <span className="text-2xl">💼</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats?.totalProfessionals || 0}</p>
          <p className="text-sm text-muted-foreground">Profissionais</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats?.totalStudents || 0}</p>
          <p className="text-sm text-muted-foreground">Alunos</p>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Usuários Recentes</h2>
          <button
            onClick={() => router.push('/admin/users')}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            Ver Todos →
          </button>
        </div>

        <div className="space-y-4">
          {stats?.recentUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => router.push(`/admin/users/${user.id}`)}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{user.full_name || 'No name'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {getAccountTypeBadge(user.account_type)}
                <p className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}

          {stats?.recentUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário ainda</p>
          )}
        </div>
      </div>
    </div>
  );
}
