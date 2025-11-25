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

}
