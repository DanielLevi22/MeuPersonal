import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  signInWithCode: (code: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session) => set({ session, user: session?.user ?? null, isLoading: false }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
    
    // CRITICAL: Clear all stores to prevent data leakage between users
    // Import stores dynamically to avoid circular dependencies
    const { useStudentStore } = await import('./studentStore');
    const { useNutritionStore } = await import('./nutritionStore');
    const { useWorkoutStore } = await import('./workoutStore');
    
    useStudentStore.getState().reset();
    useNutritionStore.getState().reset();
    useWorkoutStore.getState().reset();
    
    console.log('✅ All stores cleared on logout');
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
              .from('students_personals')
              .insert({
                student_id: signInData.session.user.id,
                personal_id: pendingInvite.personal_id,
                status: 'active'
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
            role: 'student',
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
              role: 'student',
              full_name: invite.name,
              phone: invite.phone,
              weight: invite.weight,
              height: invite.height,
              notes: invite.notes,
              invite_code: cleanCode
            })
            .eq('id', authData.user.id)
            .select()
            .single();

          if (!updateError && updatedProfile) {
            profileUpdated = true;
          }
        }

        if (!profileUpdated) {
           // Try upsert as last resort
           await supabase.from('profiles').upsert({ 
              id: authData.user.id,
              email: email,
              role: 'student',
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
          .from('students_personals')
          .insert({
            student_id: authData.user.id,
            personal_id: invite.personal_id,
            status: 'active'
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
