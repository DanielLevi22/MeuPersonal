import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
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
      });

      if (authError || !authData.user) {
        console.error('Auth error:', authError);
        return { success: false, error: 'Erro ao criar acesso. Verifique se a confirmação de email está desabilitada no Supabase.' };
      }

      // 4. Update Profile with Invite Data
      // Wait a bit for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      console.log('📋 Existing profile:', existingProfile);
      
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

      if (updateError) {
        console.error('❌ Profile update error:', updateError);
      } else {
        console.log('✅ Profile updated successfully:', updatedProfile);
      }

      // 5. Link student to personal
      const { error: linkError } = await supabase
        .from('students_personals')
        .insert({
          student_id: authData.user.id,
          personal_id: invite.personal_id,
          status: 'active'
        });

      if (linkError) {
        console.error('Link error:', linkError);
      }

      // 6. Create Initial Assessment if data exists
      if (invite.initial_assessment) {
        const { error: assessmentError } = await supabase
          .from('physical_assessments')
          .insert({
            student_id: authData.user.id,
            personal_id: invite.personal_id,
            ...invite.initial_assessment
          });

        if (assessmentError) {
          console.error('Error creating initial assessment:', assessmentError);
        }
      }

      // 7. Delete the invite
      await supabase
        .from('student_invites')
        .delete()
        .eq('id', invite.id);

      return { success: true };
    } catch (error) {
      console.error('SignInWithCode error:', error);
      return { success: false, error: 'Erro inesperado ao entrar.' };
    }
  }
}));
