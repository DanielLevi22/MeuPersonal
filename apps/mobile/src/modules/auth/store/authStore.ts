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
  abilities: null,
  isLoading: true,

  initializeSession: async (session) => {
    set({ isLoading: true });
    try {
      if (!session?.user) {
        set({ session: null, user: null, accountType: null, abilities: null, isLoading: false });
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
        set({ session, user, isLoading: false });
      }
    } catch (error) {
       console.error('Error initializing session:', error);
       set({ isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, accountType: null, abilities: null });
    
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
      const password = `senha${cleanCode}2024`;

      // 1. Try to login first (Returning Student)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInData?.session) {
        // Check if there's a pending invite for this code (recovery flow)
        const { data: pendingInvite } = await supabase
          .from('student_invites')
          .select('*')
          .eq('invite_code', cleanCode)
          .single();

        if (pendingInvite) {
          console.log('🔄 Found pending invite for existing user, consuming via RPC...');
          
          const { data: rpcResult, error: rpcError } = await supabase
            .rpc('consume_invite', { p_invite_code: cleanCode });
            
          if (rpcError || (rpcResult && !rpcResult.success)) {
             console.error('❌ Error consuming invite (returning user - RPC failed):', rpcError || rpcResult?.error);
             
             // Fallback for returning user
             // 1. Link
             const { error: linkError } = await supabase
              .from('client_professional_relationships')
              .insert({
                client_id: signInData.session.user.id,
                professional_id: pendingInvite.personal_id,
                service_category: 'training', // Default to training for now
                relationship_status: 'active',
                invited_by: pendingInvite.personal_id
              });
              
             // 2. Delete Invite (only if link succeeded or was duplicate)
             if (!linkError || linkError.code === '23505') {
               await supabase
                .from('student_invites')
                .delete()
                .eq('id', pendingInvite.id);
                
               console.log('✅ Invite consumed via Fallback (Returning User)');
             }
          }
        }
        
        return { success: true };
      }

      // 2. If login fails, check invite and register
      const { data: inviteData, error: inviteError } = await supabase
        .rpc('get_student_invite_by_code', { p_code: cleanCode });

      if (inviteError || !inviteData || inviteData.length === 0) {
        return { success: false, error: 'Código inválido ou não encontrado.' };
      }

      const invite = inviteData[0];

      // 3. Register new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: invite.name,
            account_type: 'managed_student',
            phone: invite.phone,
            invite_code: cleanCode
          }
        }
      });

      if (authError || !authData.user) {
        console.error('Auth error:', authError);
        return { success: false, error: 'Erro ao criar acesso. Verifique se a confirmação de email está desabilitada no Supabase.' };
      }

      // 4. Update Profile with Invite Data
      // 4. Consume Invite (Atomic RPC)
      // This handles profile update, linking, and invite deletion safely on the server
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('consume_invite', { p_invite_code: cleanCode });

      if (rpcError || (rpcResult && !rpcResult.success)) {
        console.error('❌ Error consuming invite (RPC failed, using fallback):', rpcError || rpcResult?.error);
        
        // Fallback: Manual execution
        // 1. Update Profile
        let profileUpdated = false;
        let attempts = 0;
        while (!profileUpdated && attempts < 3) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));

          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ 
              account_type: 'managed_student',
              full_name: invite.name,
              // phone: invite.phone, // Add these columns to profiles if needed or keep in students
              // weight: invite.weight,
              // height: invite.height,
              // notes: invite.notes,
              // invite_code: cleanCode
            })
            .eq('id', authData.user.id)
            .select()
            .single();
            
          // Also create student record
          await supabase.from('students').insert({
             id: authData.user.id, // Same ID as profile/user
             personal_id: invite.personal_id,
             email: email,
             full_name: invite.name,
             phone: invite.phone,
             weight: invite.weight,
             height: invite.height,
             notes: invite.notes,
             invite_code: cleanCode
          });

          if (!updateError && updatedProfile) {
            profileUpdated = true;
          }
        }

        if (!profileUpdated) {
           // Try upsert as last resort
           await supabase.from('profiles').upsert({ 
              id: authData.user.id,
              email: email,
              account_type: 'managed_student',
              full_name: invite.name,
            });
            
           await supabase.from('students').upsert({
             id: authData.user.id,
             personal_id: invite.personal_id,
             email: email,
             full_name: invite.name,
             phone: invite.phone,
             weight: invite.weight,
             height: invite.height,
             notes: invite.notes,
             invite_code: cleanCode
           });
        }

        // 2. Link Student
        const { error: linkError } = await supabase
          .from('client_professional_relationships')
          .insert({
            client_id: authData.user.id,
            professional_id: invite.personal_id,
            service_category: 'training',
            relationship_status: 'active',
            invited_by: invite.personal_id
          });
          
        if (linkError && linkError.code !== '23505') {
             console.error('Link error (fallback):', linkError);
        }

        // 3. Delete Invite
        await supabase
          .from('student_invites')
          .delete()
          .eq('id', invite.id);
          
        console.log('✅ Invite consumed successfully via Fallback');
      } else {
        console.log('✅ Invite consumed successfully via RPC');
      }

      return { success: true };
    } catch (error) {
      console.error('SignInWithCode error:', error);
      return { success: false, error: 'Erro inesperado ao entrar.' };
    }
  }
}));
