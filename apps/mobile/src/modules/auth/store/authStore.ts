import {
  AccountType,
  AppAbility,
  defineAbilitiesFor,
  getUserContextJWT
} from '@meupersonal/supabase';
import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';

export interface AuthState {
  session: Session | null;
  user: User | null;
  accountType: AccountType | null;
  accountStatus: 'pending' | 'active' | 'rejected' | 'suspended' | null;
  abilities: AppAbility | null;
  isLoading: boolean;
  
  // Masquerade Mode
  originalUser: User | null;
  originalAccountType: AccountType | null;
  originalAccountStatus: 'pending' | 'active' | 'rejected' | 'suspended' | null;
  originalAbilities: AppAbility | null;
  isMasquerading: boolean;
  enterStudentView: (student: any) => Promise<void>;
  exitStudentView: () => Promise<void>;
  
  initializeSession: (session: Session | null) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, role: AccountType, metadata?: any) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  accountType: null,
  accountStatus: null,
  abilities: null,
  isLoading: true,
  originalUser: null,
  originalAccountType: null,
  originalAccountStatus: null,
  originalAbilities: null,
  isMasquerading: false,

  enterStudentView: async (student) => {
    const state = get();
    if (state.isMasquerading) return;

    console.log('🎭 Entering Student View as:', student.full_name);

    try {
      // Fetch the actual context for this student to ensure we have correct permissions
      // This is critical for autonomous students who rely on feature flags
      const context = await getUserContextJWT(student.id);
      console.log('🎭 Student context loaded:', context);

      // CRITICAL: Reset domain stores to ensure clean state for the student
      // This forces the UI to re-fetch data for the student ID
      const { useNutritionStore } = await import('../../nutrition/store/nutritionStore');
      const { useWorkoutStore } = await import('../../workout/store/workoutStore');
      
      useNutritionStore.getState().reset();
      useWorkoutStore.getState().reset();
      console.log('🧹 Domain stores reset for student view');

      set({
        originalUser: state.user,
        originalAccountType: state.accountType,
        originalAccountStatus: state.accountStatus, // Save original status
        originalAbilities: state.abilities, // Save original abilities
        isMasquerading: true,
        user: {
          ...state.user,
          id: student.id,
          email: student.email,
          user_metadata: { ...state.user?.user_metadata, full_name: student.full_name }
        } as User,
        accountType: context.accountType,
        accountStatus: context.accountStatus,
        abilities: defineAbilitiesFor(context)
      });
    } catch (error) {
       console.error('❌ Error entering student view:', error);
       // Fallback to basic student view if context fetch fails, but log error
       set({
        originalUser: state.user,
        originalAccountType: state.accountType,
        originalAccountStatus: state.accountStatus,
        originalAbilities: state.abilities,
        isMasquerading: true,
        user: {
          ...state.user,
          id: student.id,
          email: student.email,
          user_metadata: { ...state.user?.user_metadata, full_name: student.full_name }
        } as User,
        accountType: 'managed_student', // Safe default
        abilities: defineAbilitiesFor({ accountType: 'managed_student', isSuperAdmin: false, accountStatus: 'active' })
      });
    }
  },

  exitStudentView: async () => {
    const state = get();
    if (!state.isMasquerading || !state.originalUser) return;

    console.log('🎭 Exiting Student View');

    // 1. Reset domain stores to clear student data
    const { useNutritionStore } = await import('../../nutrition/store/nutritionStore');
    const { useWorkoutStore } = await import('../../workout/store/workoutStore');
    
    useNutritionStore.getState().reset();
    useWorkoutStore.getState().reset();
    console.log('🧹 Domain stores reset for exit student view');

    // 2. Instant/Optimistic Restore
    const restoredAccountStatus = state.originalAccountStatus || state.accountStatus || 'active';
    
    // Fallback: If originalAbilities wasn't saved (legacy state), reconstruct it.
    // Ideally originalAbilities is present.
    const restoredAbilities = state.originalAbilities || defineAbilitiesFor({ 
        accountType: state.originalAccountType as AccountType, 
        isSuperAdmin: false, 
        accountStatus: restoredAccountStatus
    });

    set({
      user: state.originalUser,
      accountType: state.originalAccountType,
      accountStatus: restoredAccountStatus,
      abilities: restoredAbilities,
      originalUser: null,
      originalAccountType: null,
      originalAccountStatus: null,
      originalAbilities: null,
      isMasquerading: false,
    });
    
    console.log('✅ Instant restore completed. Skipping re-init to avoid flicker.');
    
    // 3. OPTIONAL: We intentionally DO NOT call initializeSession here.
    // Calling it causes a 2s delay where loading content might flash or permission checks might run against empty state.
    // We trust the original state we just restored.
  },

  initializeSession: async (session) => {
    const state = get();
    
    // Create a stable check for masquerading to prevent overwrites
    if (state.isMasquerading) {
        console.log('🎭 Skipping session init during masquerade');
        return;
    }

    // Prevent multiple initializations for the same user or if already loading
    if (state.isLoading && session && state.session?.user?.id === session.user.id) {
      console.log('⏭️ Already initializing session for this user, skipping...');
      return;
    }

    set({ isLoading: true });
    try {
      if (!session?.user) {
        set({ session: null, user: null, accountType: null, accountStatus: null, abilities: null, isLoading: false });
        return;
      }

      const user = session.user;
      
      try {
        // Fetch context and define abilities (using JWT version for admin)
        console.log('🔄 Fetching user context for:', user.id);
        const context = await getUserContextJWT(user.id);
        console.log('📊 User context loaded:', context);
        
        const abilities = defineAbilitiesFor(context);
        
        // Log admin access
        if (context.accountType === 'admin') {
          console.log('🔐 Admin access granted:', {
            isSuperAdmin: context.isSuperAdmin,
            userId: user.id,
            email: user.email
          });
        }
        
        console.log('✅ Setting accountType to:', context.accountType);
        set({ 
          session, 
          user, 
          accountType: context.accountType, 
          accountStatus: context.accountStatus || 'active',
          abilities, 
          isLoading: false 
        });
        console.log('✅ AuthStore updated. Current state:', {
          accountType: context.accountType,
          hasAbilities: !!abilities
        });
      } catch (error) {
        console.error('Error loading user context:', error);
        // If profile doesn't exist or error, set basic session but no role/abilities
        set({ session, user, accountStatus: null, isLoading: false });
      }
    } catch (error) {
       console.error('Error initializing session:', error);
       set({ isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, accountType: null, accountStatus: null, abilities: null });
    
    // CRITICAL: Clear all stores to prevent data leakage between users
    // Import stores dynamically to avoid circular dependencies
    const { useStudentStore } = await import('../../students/store/studentStore');
    const { useNutritionStore } = await import('../../nutrition/store/nutritionStore');
    const { useWorkoutStore } = await import('../../workout/store/workoutStore');
    
    useStudentStore.getState().reset();
    useNutritionStore.getState().reset();
    useWorkoutStore.getState().reset();
    
    console.log('✅ All stores cleared on logout');
  },

  signIn: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('SignIn error:', error);
      return { success: false, error: error.message || 'Erro ao entrar.' };
    }
  },

  signUp: async (email, password, role, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            account_type: role, // Pass to trigger if exists, or for client-side use
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile if not created by trigger
        // Note: Ideally a trigger handles this, but we can do it here for safety
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email,
            account_type: role,
            full_name: metadata.full_name,
            ...metadata
          });
          
        if (profileError) console.error('Error creating profile:', profileError);
      }

      return { success: true };
    } catch (error: any) {
      console.error('SignUp error:', error);
      return { success: false, error: error.message || 'Erro ao criar conta.' };
    }
  },

  signInWithCode: async (code: string) => {
    try {
      const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      if (!cleanCode || cleanCode.length < 3) {
        return { success: false, error: 'Código inválido.' };
      }

      // Use a simple, deterministic email format
      const email = `aluno${cleanCode.toLowerCase()}@test.com`;
      const password = cleanCode;

      // 1. Try to login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('SignInWithCode error:', error);
        return { success: false, error: 'Código inválido ou não encontrado.' };
      }

      return { success: true };
    } catch (error) {
      console.error('SignInWithCode error:', error);
      return { success: false, error: 'Erro inesperado ao entrar.' };
    }
  }

}));
