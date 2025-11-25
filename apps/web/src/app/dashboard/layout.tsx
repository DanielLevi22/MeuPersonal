'use client';

import { supabase } from '@meupersonal/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useProfessionalServices } from '@/shared/hooks/useStudents';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { data: services = [] } = useProfessionalServices();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
      } else {
        setLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/auth/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const serviceLabels: Record<string, string> = {
    training: 'Personal Trainer',
    nutrition: 'Nutricionista',
    physiotherapy: 'Fisioterapeuta',
    psychology: 'Psicólogo'
  };

  const serviceColors: Record<string, string> = {
    training: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    nutrition: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    physiotherapy: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    psychology: 'bg-pink-500/10 text-pink-500 border-pink-500/20'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-border">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground">MeuPersonal</h1>
            <p className="text-sm text-muted-foreground mt-1">Dashboard</p>
            
            {/* Access Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {services.length > 0 ? (
                services.map(service => (
                  <span 
                    key={service}
                    className={`px-2 py-1 rounded-md text-xs font-medium border ${serviceColors[service] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}
                  >
                    {serviceLabels[service] || service}
                  </span>
                ))
              ) : (
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-500/10 text-gray-500 border border-gray-500/20">
                  Sem serviços ativos
                </span>
              )}
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            <a
              href="/dashboard"
              className="block px-4 py-3 text-muted-foreground hover:bg-surface-highlight hover:text-foreground rounded-lg transition-colors"
            >
              📊 Dashboard
            </a>
            <a
              href="/dashboard/periodizations"
              className="block px-4 py-3 text-muted-foreground hover:bg-surface-highlight hover:text-foreground rounded-lg transition-colors"
            >
              📅 Periodizações
            </a>
            <a
              href="/dashboard/students"
              className="block px-4 py-3 text-muted-foreground hover:bg-surface-highlight hover:text-foreground rounded-lg transition-colors"
            >
              👥 Alunos
            </a>
            <a
              href="/dashboard/workouts"
              className="block px-4 py-3 text-muted-foreground hover:bg-surface-highlight hover:text-foreground rounded-lg transition-colors"
            >
              💪 Treinos
            </a>
            <a
              href="/dashboard/nutrition"
              className="block px-4 py-3 text-muted-foreground hover:bg-surface-highlight hover:text-foreground rounded-lg transition-colors"
            >
              📊 Nutrição
            </a>
            <a
              href="/dashboard/diets"
              className="block px-4 py-3 text-muted-foreground hover:bg-surface-highlight hover:text-foreground rounded-lg transition-colors"
            >
              🥗 Dietas
            </a>
          </nav>

          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-muted-foreground hover:bg-surface-highlight hover:text-foreground rounded-lg transition-colors"
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
