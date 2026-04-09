import {
  AccountType,
  AppAbility,
  defineAbilitiesFor,
  getUserContextJWT,
  supabase
} from '@meupersonal/supabase';
import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

export interface AuthState {
  session: Session | null;
  user: User | null;
  accountType: AccountType | null;
  accountStatus: 'pending' | 'active' | 'rejected' | 'suspended' | null;
  abilities: AppAbility | null;
  services: string[];
  isLoading: boolean;
  
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateSession: (session: Session | null) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  accountType: null,
  accountStatus: null,
  abilities: null,
  services: [],
  isLoading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await get().updateSession(session);
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false });
    }
  },

  updateSession: async (session) => {
    const state = get();
    
    // Prevent duplicate initialization
    if (state.isLoading && state.session?.user?.id === session?.user?.id) {
      console.log('⏭️ Already initializing session for this user, skipping...');
      return;
    }

    set({ isLoading: true });
    
    try {
      if (!session?.user) {
        set({ 
          session: null, 
          user: null, 
          accountType: null, 
          accountStatus: null, 
          abilities: null,
          services: [],
          isLoading: false 
        });
        return;
      }

      const user = session.user;
      
      try {
        console.log('🔄 Fetching user context for:', user.id);
        const context = await getUserContextJWT(user.id);
        console.log('📊 User context loaded:', context);
        
        const abilities = defineAbilitiesFor(context);
        
        // Fetch professional services
        const { data: servicesData } = await supabase
          .from('professional_services')
          .select('service_category')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        const services = servicesData?.map(s => s.service_category) || [];
        
        // Log admin access
        if (context.accountType === 'admin') {
          console.log('🔐 Admin access granted:', {
            isSuperAdmin: context.isSuperAdmin,
            userId: user.id,
            email: user.email
          });
        }
        
        set({ 
          session, 
          user, 
          accountType: context.accountType, 
          accountStatus: context.accountStatus || 'active',
          abilities,
          services,
          isLoading: false 
        });
        
        console.log('✅ AuthStore updated:', {
          accountType: context.accountType,
          services,
          hasAbilities: !!abilities
        });
      } catch (error) {
        console.error('Error loading user context:', error);
        set({ session, user, accountStatus: null, services: [], isLoading: false });
      }
    } catch (error) {
      console.error('Error updating session:', error);
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check account status
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type, account_status')
          .eq('id', data.user.id)
          .single();

        if (profile?.account_status === 'pending') {
          await supabase.auth.signOut();
          return { success: false, error: 'pending_approval' };
        }

        if (profile?.account_status === 'rejected' || profile?.account_status === 'suspended') {
          await supabase.auth.signOut();
          return { success: false, error: 'account_suspended' };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('SignIn error:', error);
      return { success: false, error: error.message || 'Erro ao fazer login' };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ 
      session: null, 
      user: null, 
      accountType: null, 
      accountStatus: null, 
      abilities: null,
      services: []
    });
  },
}));
