import { supabase } from '@meupersonal/supabase';
import { create } from 'zustand';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  video_url: string | null;
}

export interface WorkoutItem {
  id?: string;
  exercise_id: string;
  exercise?: Exercise;
  sets: number;
  reps: string;
  weight: string;
  rest_time: number;
  notes: string;
}

export interface Workout {
  id: string;
  training_plan_id: string;
  title: string;
  description: string | null;
  created_at: string;
  items?: WorkoutItem[];
}



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
  notes?: string;
}

interface WorkoutState {
  workouts: Workout[];
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
  createExercise: (exercise: { name: string; muscle_group: string; video_url?: string }) => Promise<void>;
  createPeriodization: (periodization: Omit<Periodization, 'id' | 'created_at' | 'student'>) => Promise<Periodization>;
  updatePeriodization: (id: string, updates: Partial<Periodization>) => Promise<void>;
  createTrainingPlan: (plan: Omit<TrainingPlan, 'id' | 'created_at'>) => Promise<TrainingPlan>;
  updateTrainingPlan: (id: string, updates: Partial<TrainingPlan>) => Promise<void>;
  deleteTrainingPlan: (id: string) => Promise<void>;
  fetchWorkoutsForPhase: (trainingPlanId: string) => Promise<void>;
  addWorkoutItems: (workoutId: string, items: WorkoutItem[]) => Promise<void>;
  generateWorkoutsForPhase: (trainingPlanId: string, split: string, personalId: string) => Promise<void>;
  createWorkout: (workout: { training_plan_id: string; title: string; description?: string; personal_id: string }) => Promise<void>;
  activatePeriodization: (periodizationId: string) => Promise<any>;
  setSelectedExercises: (exercises: SelectedExercise[]) => void;
  clearSelectedExercises: () => void;
  reset: () => void; // Clear all state on logout
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],
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
      const { data, error } = await supabase
        .from('training_plans')
        .insert(plan)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        currentPeriodizationPhases: [...state.currentPeriodizationPhases, data]
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
      // Get user metadata to determine account type
      const { data: { user } } = await supabase.auth.getUser();
      let accountType = user?.user_metadata?.account_type;
      
      // Fallback: check profile table if metadata doesn't have account_type
      if (!accountType) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', userId)
          .single();
        accountType = profile?.account_type;
      }
      
      // 1. Fetch periodizations based on account type
      let query = supabase
        .from('periodizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If professional, fetch their created periodizations
      // If student, fetch periodizations assigned to them
      if (accountType === 'professional') {
        query = query.eq('professional_id', userId);
      } else {
        query = query.eq('student_id', userId);
      }
      
      const { data: periodizations, error } = await query;

      // Debug: try to fetch all periodizations this user can see
      const { data: allPeriodizations, error: allError } = await supabase
        .from('periodizations')
        .select('*');

      if (error) throw error;

      console.log('fetchPeriodizations - User metadata:', user?.user_metadata);
      console.log('fetchPeriodizations - Account Type:', accountType);
      console.log('fetchPeriodizations - User ID:', userId);
      console.log('fetchPeriodizations - Query field:', accountType === 'professional' ? 'professional_id' : 'student_id');
      console.log('fetchPeriodizations - Filtered Results:', periodizations);
      console.log('fetchPeriodizations - ALL accessible periodizations:', allPeriodizations);
      console.log('fetchPeriodizations - RLS Error?:', allError);

      if (!periodizations || periodizations.length === 0) {
        set({ periodizations: [] });
        return;
      }

      // 2. Extract unique student IDs
      const studentIds = [...new Set(periodizations.map(p => p.student_id))];

      // 3. Fetch student details (Active & Pending)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      const { data: pendingStudents } = await supabase
        .from('students')
        .select('id, full_name')
        .in('id', studentIds);

      // 4. Create a map of ID -> Name
      const studentMap = new Map<string, { full_name: string }>();
      
      profiles?.forEach(p => studentMap.set(p.id, { full_name: p.full_name }));
      pendingStudents?.forEach(p => studentMap.set(p.id, { full_name: p.full_name }));

      // 5. Merge data
      const periodizationsWithStudent = periodizations.map(p => ({
        ...p,
        student: studentMap.get(p.student_id)
      }));

      set({ periodizations: periodizationsWithStudent });
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
      set({ workouts: data });
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
          items:workout_items(
            *,
            exercise:exercises(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Update local state
      set((state) => {
        const exists = state.workouts.find(w => w.id === id);
        if (exists) {
          return {
            workouts: state.workouts.map(w => w.id === id ? data : w)
          };
        } else {
          return {
            workouts: [...state.workouts, data]
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
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ exercises: data });
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  },

  createExercise: async (exercise) => {
    try {
      const { error } = await supabase
        .from('exercises')
        .insert(exercise);

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
      console.log('💾 Inserting into database...');
      const { data, error } = await supabase
        .from('periodizations')
        .insert(periodization)
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
        console.log('⚠️ Student not found in profiles, checking students table...');
        const { data: pending, error: pendingError } = await supabase
          .from('students')
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
        student: { full_name: studentName }
      };

      console.log('🔄 Updating local state...');
      console.log('New periodization with student:', newPeriodizationWithStudent);

      set((state) => {
        console.log('Current periodizations count:', state.periodizations.length);
        const updated = {
          periodizations: [newPeriodizationWithStudent, ...state.periodizations]
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
      const { error } = await supabase
        .from('periodizations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        periodizations: state.periodizations.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
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
        .from('periodizations')
        .select('student_id')
        .eq('id', periodizationId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Deactivate other active periodizations for this student
      if (periodization) {
        await supabase
          .from('periodizations')
          .update({ status: 'completed' })
          .eq('student_id', periodization.student_id)
          .eq('status', 'active');
      }

      // 3. Activate the target periodization
      const { data, error } = await supabase
        .from('periodizations')
        .update({ status: 'active' })
        .eq('id', periodizationId)
        .select()
        .single();

      if (error) throw error;

      // 4. Update local state
      set((state) => ({
        periodizations: state.periodizations.map(p => 
          p.id === periodizationId 
            ? { ...p, status: 'active' }
            : (p.student_id === periodization.student_id && p.status === 'active' ? { ...p, status: 'completed' } : p)
        )
      }));

      return data;
    } catch (error) {
      console.error('Error activating periodization:', error);
      throw error;
    }
  },
  updateTrainingPlan: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('training_plans')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        currentPeriodizationPhases: state.currentPeriodizationPhases.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
      }));
    } catch (error) {
      console.error('Error updating training plan:', error);
      throw error;
    }
  },

  deleteTrainingPlan: async (id) => {
    try {
      const { error } = await supabase
        .from('training_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        currentPeriodizationPhases: state.currentPeriodizationPhases.filter(p => p.id !== id)
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
          items:workout_items(
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

  generateWorkoutsForPhase: async (trainingPlanId, split, personalId) => {
    try {
      // Delete all existing workouts for this phase to avoid inconsistencies
      const { error: deleteError } = await supabase
        .from('workouts')
        .delete()
        .eq('training_plan_id', trainingPlanId);

      if (deleteError) throw deleteError;

      // Generate new workouts based on the split
      const letters = split.split('');
      const workoutsToCreate = letters.map(letter => ({
        training_plan_id: trainingPlanId,
        title: `Treino ${letter}`,
        description: '',
        personal_id: personalId
      }));

      const { error: insertError } = await supabase
        .from('workouts')
        .insert(workoutsToCreate);

      if (insertError) throw insertError;

      // Refresh workouts
      await get().fetchWorkoutsForPhase(trainingPlanId);
      
      // Also update the phase training_split
      await get().updateTrainingPlan(trainingPlanId, { training_split: split });

    } catch (error) {
      console.error('Error generating workouts:', error);
      throw error;
    }
  },

  addWorkoutItems: async (workoutId, items) => {
    try {
      const itemsWithWorkoutId = items.map(item => ({
        ...item,
        workout_id: workoutId
      }));

      const { error } = await supabase
        .from('workout_items')
        .insert(itemsWithWorkoutId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        workouts: state.workouts.map(w => {
          if (w.id === workoutId) {
            // We need to fetch the exercises to have the full object locally or just append
            // For simplicity, we might want to refetch the workout or phase
            return w; 
          }
          return w;
        })
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
      const { data, error } = await supabase
        .from('workouts')
        .insert(workout)
        .select()
        .single();

      if (error) throw error;

      console.log("Workout created", data);
      
      // Refresh workouts list
      await get().fetchWorkoutsForPhase(workout.training_plan_id);
    } catch (error) {
      console.error('Error creating workout:', error);
      throw error;
    }
  },
  setSelectedExercises: (exercises) => {
    set({ selectedExercises: exercises });
  },
  clearSelectedExercises: () => {
    set({ selectedExercises: [] });
  },
  
  // Reset all state on logout
  reset: () => {
    set({
      workouts: [],
      periodizations: [],
      exercises: [],
      selectedExercises: [],
      currentPeriodizationPhases: [],
      isLoading: false
    });
  }
}));
