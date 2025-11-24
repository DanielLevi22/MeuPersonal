'use client';

import { ProgressCharts } from '@/components/nutrition/ProgressCharts';
import { useDietPlans, useStudentNutritionStats } from '@/lib/hooks/useNutrition';
import { useStudents } from '@/lib/hooks/useStudents';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NutritionDashboardPage() {
  const router = useRouter();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Calculate date range
  const getDateRange = () => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date();
    
    switch (dateRange) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case 'all':
        return { startDate: undefined, endDate: end };
    }
    
    return { startDate: start.toISOString().split('T')[0], endDate: end };
  };

  const { startDate, endDate } = getDateRange();

  if (studentsLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  const selectedStudent = selectedStudentId === 'all' ? null : students.find(s => s.id === selectedStudentId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Dashboard de Nutrição
          </h1>
          <p className="text-muted-foreground mt-2">
            {selectedStudent 
              ? `Acompanhamento de ${selectedStudent.full_name}`
              : 'Visão geral de todos os alunos'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent min-w-[200px]"
          >
            <option value="all">Todos os Alunos</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {range === '7d' && '7d'}
                {range === '30d' && '30d'}
                {range === '90d' && '90d'}
                {range === 'all' && 'Tudo'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content based on selection */}
      {selectedStudent ? (
        <StudentView 
          student={selectedStudent}
          startDate={startDate}
          endDate={endDate}
        />
      ) : (
        <AllStudentsView students={students} />
      )}

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

// Component for individual student view
function StudentView({ student, startDate, endDate }: { student: any; startDate?: string; endDate?: string }) {
  const { data: plans = [] } = useDietPlans(student.id);
  const { data: stats } = useStudentNutritionStats(student.id);
  
  const activePlan = plans.find(p => p.status === 'active');

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plano Ativo</p>
              <p className="text-3xl font-bold text-foreground">{activePlan ? 'Sim' : 'Não'}</p>
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
              <p className="text-sm text-muted-foreground">Aderência</p>
              <p className="text-3xl font-bold text-foreground">{Math.round(stats?.adherenceRate || 0)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Refeições Registradas</p>
              <p className="text-3xl font-bold text-foreground">{stats?.totalLogs || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Peso Atual</p>
              <p className="text-3xl font-bold text-foreground">
                {stats?.latestWeight ? `${stats.latestWeight}kg` : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <ProgressCharts 
        studentId={student.id} 
        startDate={startDate}
        endDate={endDate}
      />
    </>
  );
}

// Component for all students view
function AllStudentsView({ students }: { students: any[] }) {
  return (
    <>
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

        <AllStudentsStats students={students} />
      </div>

      {/* Students Table */}
      <div className="bg-surface border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-foreground">Todos os Alunos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Aluno
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Plano Ativo
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Aderência
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Peso Atual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map((student) => (
                <StudentRow key={student.id} student={student} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// Component for stats cards in all students view
function AllStudentsStats({ students }: { students: any[] }) {
  // Fetch stats for all students
  const statsArray = students.map(student => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: plans = [] } = useDietPlans(student.id);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: stats } = useStudentNutritionStats(student.id);
    return { plans, stats };
  });

  const activePlansCount = statsArray.filter(s => s.plans.some(p => p.status === 'active')).length;
  const studentsWithStats = statsArray.filter(s => s.stats);
  const avgAdherence = studentsWithStats.length > 0
    ? Math.round(studentsWithStats.reduce((sum, s) => sum + (s.stats?.adherenceRate || 0), 0) / studentsWithStats.length)
    : 0;

  return (
    <>
      <div className="bg-surface border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Planos Ativos</p>
            <p className="text-3xl font-bold text-foreground">{activePlansCount}</p>
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
            <p className="text-3xl font-bold text-foreground">{avgAdherence}%</p>
          </div>
        </div>
      </div>
    </>
  );
}

// Component for each student row
function StudentRow({ student }: { student: any }) {
  const { data: plans = [] } = useDietPlans(student.id);
  const { data: stats } = useStudentNutritionStats(student.id);
  
  const activePlan = plans.find(p => p.status === 'active');

  return (
    <tr className="hover:bg-white/5 transition-colors">
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
        {activePlan ? (
          <div>
            <p className="text-sm text-foreground">{activePlan.name}</p>
            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Ativo
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Sem plano ativo</span>
        )}
      </td>
      <td className="p-4">
        {stats ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden max-w-[100px]">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${stats.adherenceRate}%` }}
              />
            </div>
            <span className="text-sm font-medium text-foreground min-w-[3rem] text-right">
              {Math.round(stats.adherenceRate)}%
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </td>
      <td className="p-4">
        <span className="text-sm text-foreground">
          {stats?.latestWeight ? `${stats.latestWeight}kg` : '-'}
        </span>
      </td>
    </tr>
  );
}
