'use client';

import { supabase } from '@meupersonal/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
