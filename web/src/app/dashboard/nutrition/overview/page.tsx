'use client';

import { useDietPlans, useStudentNutritionStats } from '@/shared/hooks/useNutrition';
import { useStudents } from '@/shared/hooks/useStudents';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function NutritionOverviewPage() {
  const router = useRouter();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const [sortBy, setSortBy] = useState<'name' | 'adherence' | 'weight'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get all students with their nutrition data
  const studentsWithData = useMemo(() => {
    return students.map(student => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { data: plans = [] } = useDietPlans(student.id);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { data: stats } = useStudentNutritionStats(student.id);
      
      const activePlan = plans.find(p => p.status === 'active');
      
      return {
        ...student,
        activePlan,
        stats,
      };
    });
  }, [students]);

  // Sort students
  const sortedStudents = useMemo(() => {
    const sorted = [...studentsWithData].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name);
          break;
        case 'adherence':
          comparison = (a.stats?.adherenceRate || 0) - (b.stats?.adherenceRate || 0);
          break;
        case 'weight':
          comparison = (a.stats?.latestWeight || 0) - (b.stats?.latestWeight || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [studentsWithData, sortBy, sortOrder]);

  const toggleSort = (column: 'name' | 'adherence' | 'weight') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (studentsLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Visão Geral - Nutrição
        </h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe o progresso nutricional de todos os seus alunos
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Alunos</p>
              <p className="text-3xl font-bold text-foreground">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Com Plano Ativo</p>
              <p className="text-3xl font-bold text-foreground">
                {studentsWithData.filter(s => s.activePlan).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aderência Média</p>
              <p className="text-3xl font-bold text-foreground">
                {Math.round(
                  studentsWithData.reduce((sum, s) => sum + (s.stats?.adherenceRate || 0), 0) / 
                  (studentsWithData.filter(s => s.stats).length || 1)
                )}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-surface border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th 
                  className="text-left p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Aluno
                    {sortBy === 'name' && (
                      <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Plano Ativo
                </th>
                <th 
                  className="text-left p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('adherence')}
                >
                  <div className="flex items-center gap-2">
                    Aderência
                    {sortBy === 'adherence' && (
                      <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('weight')}
                >
                  <div className="flex items-center gap-2">
                    Peso Atual
                    {sortBy === 'weight' && (
                      <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">
                          {student.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {student.activePlan ? (
                      <div>
                        <p className="text-sm text-foreground">{student.activePlan.name}</p>
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Ativo
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem plano ativo</span>
                    )}
                  </td>
                  <td className="p-4">
                    {student.stats ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${student.stats.adherenceRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground min-w-[3rem] text-right">
                          {Math.round(student.stats.adherenceRate)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-foreground">
                      {student.stats?.latestWeight ? `${student.stats.latestWeight}kg` : '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => router.push(`/dashboard/students/${student.id}/nutrition`)}
                      className="text-sm text-primary hover:underline"
                    >
                      Ver Progresso
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {students.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Nenhum aluno cadastrado
          </h3>
          <p className="text-muted-foreground">
            Cadastre alunos para começar a gerenciar suas dietas
          </p>
        </div>
      )}
    </div>
  );
}
