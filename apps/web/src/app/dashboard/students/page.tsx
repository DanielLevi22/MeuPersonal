'use client';

import { useStudents } from '@/shared/hooks/useStudents';
import Link from 'next/link';
import { useState } from 'react';
import { CreateStudentModal } from './components/CreateStudentModal';

export default function StudentsPage() {
  const { data: students = [], isLoading } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meus Alunos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus alunos e acompanhe o progresso deles.
          </p>
        </div>
        
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Aluno
        </button>
      </div>

      <CreateStudentModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      {/* Search and Filter */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg leading-5 bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Students Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-surface/50 animate-pulse rounded-xl border border-white/5" />
          ))}
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Link
              key={student.id}
              href={`/dashboard/students/${student.id}`}
              className="group bg-surface border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg group-hover:scale-110 transition-transform">
                  {student.full_name.charAt(0).toUpperCase()}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  student.status === 'pending' 
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {student.status === 'pending' ? 'Pendente' : 'Ativo'}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {student.full_name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 truncate">
                {student.email}
              </p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-white/5 pt-4">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Planos</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Treinos</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum aluno encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Tente buscar com outros termos.' : 'Comece adicionando seu primeiro aluno.'}
          </p>
        </div>
      )}
    </div>
  );
}
