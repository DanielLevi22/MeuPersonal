'use client';

import { useStudents } from '@/shared/hooks/useStudents';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const { data: students = [], isLoading } = useStudents();
  
  const student = students.find(s => s.id === studentId);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-foreground mb-2">Aluno não encontrado</h3>
        <button
          onClick={() => router.push('/dashboard/students')}
          className="text-primary hover:underline"
        >
          Voltar para lista de alunos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {student.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{student.full_name}</h1>
              <p className="text-muted-foreground">{student.email}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-surface border border-white/10 text-foreground font-medium rounded-lg hover:bg-white/5 transition-colors">
            Editar Perfil
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
            Nova Avaliação
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-white/10 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-lg font-bold text-foreground">Ativo</span>
          </div>
        </div>
        <div className="bg-surface border border-white/10 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Plano Atual</p>
          <p className="text-lg font-bold text-foreground">Hipertrofia</p>
        </div>
        <div className="bg-surface border border-white/10 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Próximo Treino</p>
          <p className="text-lg font-bold text-foreground">Hoje, 18:00</p>
        </div>
        <div className="bg-surface border border-white/10 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Última Presença</p>
          <p className="text-lg font-bold text-foreground">Ontem</p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nutrition Module */}
        <Link 
          href={`/dashboard/students/${studentId}/nutrition`}
          className="group bg-surface border border-white/10 rounded-2xl p-6 hover:border-secondary/50 transition-all hover:shadow-lg hover:shadow-secondary/5"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-xl bg-secondary/10 text-secondary group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-muted-foreground group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
              Ver Detalhes
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Nutrição</h3>
          <p className="text-muted-foreground mb-4">
            Gerencie dietas, acompanhe refeições e visualize o progresso nutricional.
          </p>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div className="bg-secondary h-full w-3/4" />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">75% da meta diária</p>
        </Link>

        {/* Workouts Module */}
        <Link 
          href={`/dashboard/students/${studentId}/workouts`}
          className="group bg-surface border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              Ver Detalhes
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Treinos</h3>
          <p className="text-muted-foreground mb-4">
            Crie fichas de treino, acompanhe a frequência e evolução de cargas.
          </p>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-full w-1/2" />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">3 treinos essa semana</p>
        </Link>
      </div>
    </div>
  );
}
