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

  initializeSession: async (session) => {
    const state = get();
    // Prevent multiple initializations for the same user or if already loading
    if (state.isLoading && state.session?.user?.id === session?.user?.id) {
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
