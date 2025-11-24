'use client';

import { CreateWorkoutModal } from '@/components/workouts/CreateWorkoutModal';
import { DeleteConfirmModal } from '@/components/workouts/DeleteConfirmModal';
import { WorkoutCard } from '@/components/workouts/WorkoutCard';
import { useDeleteWorkout } from '@/lib/hooks/useWorkoutMutations';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { defineAbilitiesFor, supabase } from '@meupersonal/supabase';
import { useEffect, useState } from 'react';

export default function WorkoutsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | undefined>();
  const [deletingWorkout, setDeletingWorkout] = useState<{ id: string; title: string } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const { data: workouts = [], isLoading } = useWorkouts();
  const deleteMutation = useDeleteWorkout();

  // Get user role for CASL
  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };

    getRole();
  }, []);

  // Check if user can create workouts - default to true while loading
  const canCreateWorkout = userRole ? defineAbilitiesFor(userRole as any).can('create', 'Workout') : true;

  // Filter workouts by search query
  const filteredWorkouts = workouts.filter((workout) =>
    workout.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workout.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id: string) => {
    setEditingWorkoutId(id);
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const workout = workouts.find((w) => w.id === id);
    if (workout) {
      setDeletingWorkout({ id, title: workout.title });
    }
  };

  const confirmDelete = async () => {
    if (!deletingWorkout) return;

    try {
      await deleteMutation.mutateAsync(deletingWorkout.id);
      setDeletingWorkout(null);
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingWorkoutId(undefined);
  };

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Treinos
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie seus treinos personalizados
            </p>
          </div>

          {canCreateWorkout && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/50 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Criar Treino
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar treinos..."
            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 pl-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-3/4 mb-4" />
              <div className="h-4 bg-white/10 rounded w-full mb-2" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery ? 'Nenhum treino encontrado' : 'Nenhum treino criado'}
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {searchQuery
              ? 'Tente buscar com outros termos'
              : 'Crie seu primeiro treino personalizado para seus alunos'}
          </p>
          {canCreateWorkout && !searchQuery && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Criar Primeiro Treino
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {filteredWorkouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateWorkoutModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        workoutId={editingWorkoutId}
      />

      <DeleteConfirmModal
        isOpen={!!deletingWorkout}
        onClose={() => setDeletingWorkout(null)}
        onConfirm={confirmDelete}
        workoutTitle={deletingWorkout?.title || ''}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
