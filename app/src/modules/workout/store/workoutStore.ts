import { supabase } from '@meupersonal/supabase';
import { create } from 'zustand';
import { useAuthStore } from '@/modules/auth/store/authStore';
import { AIWorkoutItem, WorkoutAIService } from '../services/WorkoutAIService';
import type { Exercise, Workout, WorkoutItem, WorkoutSession } from '../types';

// Re-export for backwards compatibility
export type { Exercise, Workout, WorkoutItem, WorkoutSession };

export interface SelectedExercise {
  id: string;
  name: string;
  muscle_group: string;
  sets: number;
  reps: number;
  weight: string;
  rest_seconds: number;
  video_url?: string;
}

export interface Periodization {
  id: string;
  name: string;
  student_id: string;
  personal_id: string;
  professional_id?: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed';
  type?: 'strength' | 'hypertrophy' | 'adaptation';
  notes?: string;
  student?: {
    full_name: string;
  };
}

export interface TrainingPlan {
  id: string;
  periodization_id: string;
  name: string;
  description?: string;
  training_split: string;
  weekly_frequency: number;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed';
  type?: 'strength' | 'hypertrophy' | 'adaptation';
  notes?: string;
}

interface WorkoutState {
  workouts: Workout[];
  libraryWorkouts: Workout[];
  periodizations: Periodization[];
  exercises: Exercise[];
  selectedExercises: SelectedExercise[];
  currentPeriodizationPhases: TrainingPlan[];
  isLoading: boolean;
  fetchWorkouts: (personalId: string) => Promise<void>;
  fetchWorkoutById: (id: string) => Promise<Workout | null>;
  fetchPeriodizations: (personalId: string) => Promise<void>;
  fetchPeriodizationPhases: (periodizationId: string) => Promise<void>;
  fetchExercises: () => Promise<void>;
  createExercise: (exercise: {
    name: string;
    muscle_group: string;
    video_url?: string;
  }) => Promise<void>;
  createPeriodization: (
    periodization: Omit<Periodization, 'id' | 'created_at' | 'student'>
  ) => Promise<Periodization>;
  updatePeriodization: (id: string, updates: Partial<Periodization>) => Promise<void>;
  createTrainingPlan: (plan: Omit<TrainingPlan, 'id' | 'created_at'>) => Promise<TrainingPlan>;
  updateTrainingPlan: (id: string, updates: Partial<TrainingPlan>) => Promise<void>;
  deleteTrainingPlan: (id: string) => Promise<void>;
  fetchWorkoutsForPhase: (trainingPlanId: string) => Promise<void>;
  addWorkoutItems: (workoutId: string, items: WorkoutItem[]) => Promise<void>;
  generateWorkoutsForPhase: (
    trainingPlanId: string,
    split: string,
    personalId: string
  ) => Promise<void>;
  generateWorkoutsForPeriodization: (
    periodizationId: string,
    phases: TrainingPlan[],
    split: string,
    personalId: string,
    agreedExercises?: string[]
  ) => Promise<void>;
  createWorkout: (workout: {
    training_plan_id: string;
    title: string;
    description?: string;
    muscle_group?: string;
    personal_id: string;
  }) => Promise<void>;
  activatePeriodization: (periodizationId: string) => Promise<Periodization>;
  saveWorkoutSession: (sessionData: {
    workoutId: string;
    studentId: string;
    startedAt: string;
    completedAt: string;
    items: {
      workoutItemId: string;
      setsCompleted: number;
    }[];
    intensity?: number;
    notes?: string;
  }) => Promise<string>;
  saveCardioSession: (sessionData: {
    studentId: string;
    exerciseName: string;
    durationSeconds: number;
    calories: number;
    startedAt: string;
    completedAt: string;
    intensity?: number;
    notes?: string;
  }) => Promise<void>;
  fetchLastWorkoutSession: (
    studentId: string
  ) => Promise<{ workout_id: string; completed_at: string } | null>;
  fetchWorkoutSessionDetails: (
    workoutId: string,
    studentId: string
  ) => Promise<WorkoutSession | null>;
  setSelectedExercises: (exercises: SelectedExercise[]) => void;
  clearSelectedExercises: () => void;
  duplicateWorkout: (workoutId: string, targetPlanId: string) => Promise<void>;
  saveGeneratedWorkouts: (
    trainingPlanId: string,
    aiWorkouts: { letter: string; focus?: string; exercises: AIWorkoutItem[] }[],
    personalId: string
  ) => Promise<void>;
  reset: () => void; // Clear all state on logout
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],
  libraryWorkouts: [],
  periodizations: [],
  exercises: [],
  selectedExercises: [],
  currentPeriodizationPhases: [],
  isLoading: false,

  fetchPeriodizationPhases: async (periodizationId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('periodization_id', periodizationId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      set({ currentPeriodizationPhases: data || [] });
    } catch (error) {
      console.error('Error fetching phases:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createTrainingPlan: async (plan) => {
    try {
      const { data, error } = await supabase.from('training_plans').insert(plan).select().single();

      if (error) throw error;

      set((state) => ({
        currentPeriodizationPhases: [...state.currentPeriodizationPhases, data],
      }));

      return data;
    } catch (error) {
      console.error('Error creating training plan:', error);
      throw error;
    }
  },

  fetchPeriodizations: async (userId) => {
    set({ isLoading: true });
    try {
      // Use authStore to respect masquerading
      const authState = useAuthStore.getState();

      const accountType = authState.accountType;

      if (!accountType) {
        // Fallback or early return if no account type
        console.warn('fetchPeriodizations: No account type found in authStore');
        set({ periodizations: [], isLoading: false });
        return;
      }

      // 1. Fetch periodizations based on account type
      let query = supabase
        .from('training_periodizations')
        .select('*')
        .order('created_at', { ascending: false });

      // If professional, fetch their created periodizations
      // If student, fetch periodizations assigned to them
      if (accountType === 'specialist') {
        query = query.eq('professional_id', userId);
      } else {
        query = query.eq('student_id', userId);
      }

      const { data: periodizations, error } = await query;

      if (error) throw error;

      if (!periodizations || periodizations.length === 0) {
        set({ periodizations: [] });
        return;
      }

      // 2. Fetch student profiles
      const studentIds = [...new Set(periodizations.map((p) => p.student_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      // 3. Fetch phases for each periodization
      const periodizationIds = periodizations.map((p) => p.id);
      const { data: allPhases } = await supabase
        .from('training_plans')
        .select('*')
        .in('periodization_id', periodizationIds);

      // 4. Create maps for easy lookup
      const studentMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);
      const phasesMap = new Map<string, TrainingPlan[]>();
      allPhases?.forEach((phase) => {
        if (!phasesMap.has(phase.periodization_id)) {
          phasesMap.set(phase.periodization_id, []);
        }
        phasesMap.get(phase.periodization_id)?.push(phase);
      });

      // 5. Merge all data
      const periodizationsWithData = periodizations.map((p) => ({
        ...p,
        student: { full_name: studentMap.get(p.student_id) || 'Aluno' },
        phases: phasesMap.get(p.id) || [],
      }));

      set({ periodizations: periodizationsWithData });
    } catch (error) {
      console.error('Error fetching periodizations:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  fetchWorkouts: async (personalId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('personal_id', personalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ libraryWorkouts: data });
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  fetchWorkoutById: async (id) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          items:workout_exercises(
            *,
            exercise:exercises(*)
          )
        `)
        .eq('id', id)
        .order('order', { foreignTable: 'workout_exercises', ascending: true })
        .single();

      if (error) throw error;

      // Update local state
      set((state) => {
        const exists = state.workouts.find((w) => w.id === id);
        if (exists) {
          return {
            workouts: state.workouts.map((w) => (w.id === id ? data : w)),
          };
        } else {
          return {
            workouts: [...state.workouts, data],
          };
        }
      });

      return data;
    } catch (error) {
      console.error('Error fetching workout by id:', error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  fetchExercises: async () => {
    try {
      const { data, error } = await supabase.from('exercises').select('*').order('name');

      if (error) throw error;
      set({ exercises: data });
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  },

  createExercise: async (exercise) => {
    try {
      const { error } = await supabase.from('exercises').insert(exercise);

      if (error) throw error;

      // Refresh exercises list
      await get().fetchExercises();
    } catch (error) {
      console.error('Error creating exercise:', error);
      throw error;
    }
  },

  createPeriodization: async (periodization) => {
    console.log('\n=== 📥 STORE: createPeriodization called ===');
    console.log('📋 Input parameters:', JSON.stringify(periodization, null, 2));

    try {
      // Map 'type' to 'objective' (DB column name)
      // We'll preserve strict type in notes for reference if needed, but 'objective' is the main column
      const { type, notes, ...dbData } = periodization;

      const payload = {
        ...dbData,
        notes: notes,
        objective: type || 'Hipertrofia', // Default to avoid not-null error if empty
      };

      console.log('💾 Inserting into database...');
      const { data, error } = await supabase
        .from('training_periodizations')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('❌ Database insert error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        throw error;
      }

      console.log('✅ Database insert successful!');
      console.log('📦 Inserted data:', JSON.stringify(data, null, 2));

      // Fetch student name for the local state update
      console.log('👤 Fetching student name for student_id:', periodization.student_id);
      let studentName = '';
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', periodization.student_id)
        .single();

      console.log('Profile query result:', profile);
      console.log('Profile query error:', profileError);

      if (profile) {
        studentName = profile.full_name;
        console.log('✅ Found student in profiles:', studentName);
      } else {
        console.log('⚠️ Student not found in profiles, checking profiles (managed)...');
        const { data: pending, error: pendingError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', periodization.student_id)
          .single();

        console.log('Students query result:', pending);
        console.log('Students query error:', pendingError);

        if (pending) {
          studentName = pending.full_name;
          console.log('✅ Found student in students table:', studentName);
        } else {
          console.log('⚠️ Student name not found in either table');
        }
      }

      const newPeriodizationWithStudent = {
        ...data,
        student: { full_name: studentName },
      };

      console.log('🔄 Updating local state...');
      console.log('New periodization with student:', newPeriodizationWithStudent);

      set((state) => {
        console.log('Current periodizations count:', state.periodizations.length);
        const updated = {
          periodizations: [newPeriodizationWithStudent, ...state.periodizations],
        };
        console.log('Updated periodizations count:', updated.periodizations.length);
        return updated;
      });

      console.log('✅ Local state updated successfully');
      console.log('🎉 Returning created periodization:', data);
      console.log('=== STORE: createPeriodization completed ===\n');

      return data;
    } catch (error) {
      console.error('❌ STORE ERROR creating periodization:', error);
      console.error('Error type:', typeof error);
      console.error('Error stringified:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  updatePeriodization: async (id, updates) => {
    try {
      const { error } = await supabase.from('training_periodizations').update(updates).eq('id', id);

      if (error) throw error;

      set((state) => ({
        periodizations: state.periodizations.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
    } catch (error) {
      console.error('Error updating periodization:', error);
      throw error;
    }
  },

  activatePeriodization: async (periodizationId: string) => {
    try {
      // 1. Get the periodization to find student_id
      const { data: periodization, error: fetchError } = await supabase
        .from('training_periodizations')
        .select('student_id')
        .eq('id', periodizationId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Deactivate other active periodizations for this student
      if (periodization) {
        await supabase
          .from('training_periodizations')
          .update({ status: 'completed' })
          .eq('student_id', periodization.student_id)
          .eq('status', 'active');
      }

      // 3. Activate the target periodization
      const { data, error } = await supabase
        .from('training_periodizations')
        .update({ status: 'active' })
        .eq('id', periodizationId)
        .select()
        .single();

      if (error) throw error;

      // 4. Update local state
      set((state) => ({
        periodizations: state.periodizations.map((p) =>
          p.id === periodizationId
            ? { ...p, status: 'active' }
            : p.student_id === periodization.student_id && p.status === 'active'
              ? { ...p, status: 'completed' }
              : p
        ),
      }));

      return data;
    } catch (error) {
      console.error('Error activating periodization:', error);
      throw error;
    }
  },
  updateTrainingPlan: async (id, updates) => {
    try {
      const { error } = await supabase.from('training_plans').update(updates).eq('id', id);

      if (error) throw error;

      set((state) => ({
        currentPeriodizationPhases: state.currentPeriodizationPhases.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }));
    } catch (error) {
      console.error('Error updating training plan:', error);
      throw error;
    }
  },

  deleteTrainingPlan: async (id) => {
    try {
      const { error } = await supabase.from('training_plans').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        currentPeriodizationPhases: state.currentPeriodizationPhases.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting training plan:', error);
      throw error;
    }
  },

  fetchWorkoutsForPhase: async (trainingPlanId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          items:workout_exercises(
            *,
            exercise:exercises(*)
          )
        `)
        .eq('training_plan_id', trainingPlanId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ workouts: data || [] });
    } catch (error) {
      console.error('Error fetching workouts for phase:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Save a pre-generated plan (e.g. from AI Modal)
  saveGeneratedWorkouts: async (trainingPlanId, aiWorkouts, personalId) => {
    try {
      set({ isLoading: true });
      const availableExercises = get().exercises;
      if (availableExercises.length === 0) await get().fetchExercises();

      // Delete old workouts
      const { error: deleteError } = await supabase
        .from('workouts')
        .delete()
        .eq('training_plan_id', trainingPlanId);

      if (deleteError) throw deleteError;

      if (aiWorkouts.length === 0) {
        await get().fetchWorkoutsForPhase(trainingPlanId);
        return;
      }

      // A. Bulk Create Workouts
      const workoutsToInsert = aiWorkouts.map((aiWorkout) => ({
        training_plan_id: trainingPlanId,
        title: `Treino ${aiWorkout.letter}`,
        description: aiWorkout.focus ? `Foco: ${aiWorkout.focus}` : '',
        personal_id: personalId,
        muscle_group: aiWorkout.focus,
      }));

      const { data: newWorkouts, error: workoutError } = await supabase
        .from('workouts')
        .insert(workoutsToInsert)
        .select();

      if (workoutError) throw workoutError;

      // B. Prepare Exercises for all workouts
      const itemsToInsert: {
        workout_id: string;
        exercise_id: string;
        sets: number;
        reps: string;
        rest_time: number;
        notes: string;
        order: number;
      }[] = [];
      aiWorkouts.forEach((aiWorkout, wIndex) => {
        // Find the matched workout from the DB insertions to get the valid UUID
        // Usually Supabase returns bulk inserts in the same order, but let's be safe
        const matchingTitle = `Treino ${aiWorkout.letter}`;
        const newWorkout =
          newWorkouts.find((w) => w.title === matchingTitle) || newWorkouts[wIndex];

        if (aiWorkout.exercises && aiWorkout.exercises.length > 0) {
          aiWorkout.exercises.forEach((item: AIWorkoutItem, index: number) => {
            const exercise = availableExercises.find(
              (e: Exercise) => e.name.toLowerCase() === item.exerciseName.toLowerCase()
            );

            if (exercise) {
              itemsToInsert.push({
                workout_id: newWorkout.id,
                exercise_id: exercise.id,
                sets: item.sets,
                reps: item.reps,
                rest_time: item.rest,
                notes: item.technique
                  ? item.technique +
                    (item.load_suggestion ? ` | Carga: ${item.load_suggestion}` : '')
                  : item.load_suggestion
                    ? `Carga: ${item.load_suggestion}`
                    : '',
                order: index,
              });
            }
          });
        }
      });

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('workout_exercises')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Refresh
      await get().fetchWorkoutsForPhase(trainingPlanId);
    } catch (error) {
      console.error('Error saving generated workouts:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  generateWorkoutsForPhase: async (trainingPlanId, split, personalId) => {
    try {
      // 1. Context: Get Plan Details & Exercises
      const { data: plan } = await supabase
        .from('training_plans')
        .select('type, description')
        .eq('id', trainingPlanId)
        .single();

      const goal = plan?.type || 'Hipertrofia'; // Default

      // Ensure exercises are loaded for the AI
      if (get().exercises.length === 0) {
        await get().fetchExercises();
      }
      const availableExercises = get().exercises;

      // 2. Call AI Service (or Fallback)
      const { plan: aiWorkouts } = await WorkoutAIService.generateWorkoutStructure(
        split,
        goal,
        'Intermediário', // scalable later
        availableExercises
      );

      // 3. Save via the new shared method
      await get().saveGeneratedWorkouts(trainingPlanId, aiWorkouts, personalId);
    } catch (error) {
      console.error('Error generating workouts:', error);
      throw error;
    }
  },

  generateWorkoutsForPeriodization: async (
    _periodizationId: string,
    phases: TrainingPlan[],
    split: string,
    personalId: string,
    agreedExercises?: string[]
  ) => {
    try {
      set({ isLoading: true });

      // 1. Prepare Data
      // Helper to map DB objectives to Portuguese for the AI (if needed) or keep as is
      // But AI prompt expects general goal. Use the one from Periodization if possible.
      // We'll use the first phase's type or fallback.
      const goal = phases[0]?.type || 'Hipertrofia';

      // Ensure exercises
      if (get().exercises.length === 0) {
        await get().fetchExercises();
      }
      const availableExercises = get().exercises;

      // 2. Prepare Phases for AI
      const aiPhases = phases.map((p) => ({
        name: p.name,
        focus: p.description || p.name,
        weeks:
          Math.round(
            (new Date(p.end_date).getTime() - new Date(p.start_date).getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          ) || 4,
      }));

      // 3. Call Batch AI
      const batchResult = await WorkoutAIService.generateBatchWorkoutPlan(
        aiPhases,
        split,
        goal,
        'Intermediário', // scalable later
        availableExercises,
        agreedExercises
          ? `Exercícios exigidos pelo aluno: ${agreedExercises.join(', ')}`
          : undefined
      );

      // 4. Save Each Result Concurrently
      const savePromises = phases.map((phase, i) => {
        const aiResponse = batchResult[i];
        if (aiResponse?.plan) {
          console.log(`💾 Saving generated workouts for phase ${i + 1}: ${phase.name}`);
          return get().saveGeneratedWorkouts(phase.id, aiResponse.plan, personalId);
        } else {
          console.warn(`⚠️ No AI plan generated for phase ${i} (${phase.name})`);
          return Promise.resolve();
        }
      });

      await Promise.all(savePromises);
    } catch (error) {
      console.error('Error in batch generation:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addWorkoutItems: async (workoutId, items) => {
    try {
      const itemsWithWorkoutId = items.map((item) => ({
        ...item,
        workout_id: workoutId,
      }));

      const { error } = await supabase.from('workout_exercises').insert(itemsWithWorkoutId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        workouts: state.workouts.map((w) => {
          if (w.id === workoutId) {
            // We need to fetch the exercises to have the full object locally or just append
            // For simplicity, we might want to refetch the workout or phase
            return w;
          }
          return w;
        }),
      }));

      // Refetch to get full data with relations (items and exercises)
      await get().fetchWorkoutById(workoutId);
    } catch (error) {
      console.error('Error adding workout items:', error);
      throw error;
    }
  },

  createWorkout: async (workout) => {
    try {
      const { data, error } = await supabase.from('workouts').insert(workout).select().single();

      if (error) throw error;

      console.log('Workout created', data);

      // Refresh workouts list
      await get().fetchWorkoutsForPhase(workout.training_plan_id);
    } catch (error) {
      console.error('Error creating workout:', error);
      throw error;
    }
  },

  saveWorkoutSession: async (sessionData) => {
    try {
      // Check for masquerade mode
      if (useAuthStore.getState().isMasquerading) {
        console.log('🎭 Masquerade Mode: Fake saving workout session', sessionData);
        // Return a fake ID
        return `masquerade-session-id-${Date.now()}`;
      }

      // 1. Create Workout Session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          workout_id: sessionData.workoutId,
          student_id: sessionData.studentId,
          started_at: sessionData.startedAt,
          completed_at: sessionData.completedAt,
          intensity: sessionData.intensity,
          notes: sessionData.notes,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 2. Create Session Items
      if (sessionData.items.length > 0) {
        const sessionItems = sessionData.items.map((item) => ({
          session_id: session.id,
          workout_item_id: item.workoutItemId,
          sets_completed: item.setsCompleted,
        }));

        const { error: itemsError } = await supabase
          .from('workout_session_items')
          .insert(sessionItems);

        if (itemsError) throw itemsError;
      }

      return session.id;
    } catch (error) {
      console.error('Error saving workout session:', error);
      throw error;
    }
  },

  saveCardioSession: async (sessionData: {
    studentId: string;
    exerciseName: string;
    durationSeconds: number;
    calories: number;
    startedAt: string;
    completedAt: string;
    intensity?: number;
    notes?: string;
  }) => {
    try {
      // Check for masquerade mode
      if (useAuthStore.getState().isMasquerading) {
        console.log('🎭 Masquerade Mode: Fake saving cardio session', sessionData);
        return;
      }

      // For now, we'll store cardio sessions in a separate table or reuse workout_sessions with null workout_id if allowed.
      // However, workout_sessions.workout_id is NOT NULL in schema.
      // So we should probably create a specific table for cardio logs or ad-hoc workouts.
      // Given the constraints and current schema, let's create a "Cardio" workout on the fly or use a specific table.
      // Checking schema... we don't have a 'cardio_logs' table.
      // Let's use 'diet_logs' for calories? No, that's for food.
      // Let's assume we need to create a `cardio_logs` table.
      // OR, we can insert into `workout_sessions` if we make workout_id nullable, but that's a schema change.

      // ALTERNATIVE: Create a "General Cardio" workout for the user if it doesn't exist, and log against it.
      // This keeps schema intact.

      // 1. Find or Create "Standalone Cardio" workout for this user
      let { data: cardioWorkout } = await supabase
        .from('workouts')
        .select('id')
        .eq('title', 'Treino Cardio Livre')
        .eq('student_id', sessionData.studentId)
        .single();

      if (!cardioWorkout) {
        // Create it
        // We need a personal_id. If student is autonomous, maybe they are their own personal?
        // Or we use a system ID? Or just use the student's ID if the schema allows (it references profiles).
        // Let's use the student's ID as personal_id for self-created workouts if allowed.

        const { data: newWorkout, error: createError } = await supabase
          .from('workouts')
          .insert({
            title: 'Treino Cardio Livre',
            student_id: sessionData.studentId,
            personal_id: sessionData.studentId, // Assuming student can be personal of themselves for this purpose
            description: 'Sessões de cardio avulsas',
          })
          .select()
          .single();

        if (createError) {
          // If FK fails (student not a personal), we might need a fallback.
          // But for now let's try this.
          console.error('Error creating cardio workout container:', createError);
          throw createError;
        }
        cardioWorkout = newWorkout;
      }

      // 2. Log the session
      if (!cardioWorkout) throw new Error('Failed to find or create cardio workout');

      const { error: sessionError } = await supabase.from('workout_sessions').insert({
        workout_id: cardioWorkout.id,
        student_id: sessionData.studentId,
        started_at: sessionData.startedAt,
        completed_at: sessionData.completedAt,
        intensity: sessionData.intensity,
        notes:
          sessionData.notes ||
          `${sessionData.exerciseName} - ${Math.floor(sessionData.durationSeconds / 60)}min - ${Math.round(sessionData.calories)}kcal`,
      });

      if (sessionError) throw sessionError;
    } catch (error) {
      console.error('Error saving cardio session:', error);
      throw error;
    }
  },

  fetchLastWorkoutSession: async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('workout_id, completed_at')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows found"
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching last workout session:', error);
      return null;
    }
  },

  fetchWorkoutSessionDetails: async (workoutId: string, studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          workout_id,
          student_id,
          started_at,
          completed_at,
          intensity,
          notes,
          items:workout_session_items(
            workout_item_id,
            sets_completed
          )
        `)
        .eq('workout_id', workoutId)
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows found"
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching workout session details:', error);
      return null;
    }
  },

  setSelectedExercises: (exercises) => {
    set({ selectedExercises: exercises });
  },
  clearSelectedExercises: () => {
    set({ selectedExercises: [] });
  },

  // Reset all state on logout
  duplicateWorkout: async (workoutId: string, targetPlanId: string) => {
    set({ isLoading: true });
    try {
      // 1. Fetch source workout with items
      const sourceWorkout = await get().fetchWorkoutById(workoutId);
      if (!sourceWorkout) throw new Error('Source workout not found');

      // 2. Create new workout
      const { data: newWorkout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          training_plan_id: targetPlanId,
          title: sourceWorkout.title,
          description: sourceWorkout.description,
          muscle_group: sourceWorkout.muscle_group,
          personal_id: sourceWorkout.personal_id,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // 3. Duplicate items
      if (sourceWorkout.items && sourceWorkout.items.length > 0) {
        const newItems = sourceWorkout.items.map((item) => ({
          workout_id: newWorkout.id,
          exercise_id: item.exercise_id,
          sets: item.sets,
          reps: item.reps,
          weight: item.weight,
          rest_time: item.rest_time,
          notes: item.notes,
        }));

        const { error: itemsError } = await supabase.from('workout_exercises').insert(newItems);

        if (itemsError) throw itemsError;
      }

      // 4. Refresh workouts for the phase
      await get().fetchWorkoutsForPhase(targetPlanId);
    } catch (error) {
      console.error('Error duplicating workout:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => {
    set({
      workouts: [],
      libraryWorkouts: [],
      periodizations: [],
      exercises: [],
      selectedExercises: [],
      currentPeriodizationPhases: [],
      isLoading: false,
    });
  },
}));
