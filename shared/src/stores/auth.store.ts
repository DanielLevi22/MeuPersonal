import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import type { Profile } from "../types/auth.types";

interface AuthStoreState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
}

interface AuthStoreActions {
  setSession: (session: Session | null, user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearSession: () => void;
}

export type AuthStore = AuthStoreState & AuthStoreActions;

// Estado inicial reutilizável
const initialState: AuthStoreState = {
  user: null,
  profile: null,
  session: null,
  isLoading: true,
};

// Factory para permitir persistência diferente por plataforma.
// Mobile: wrappa com persist + MMKV
// Web: wrappa com persist + localStorage (ou sem persist em server components)
export const createAuthStore = () =>
  create<AuthStore>((set) => ({
    ...initialState,

    setSession: (session, user) => set({ session, user }),

    setProfile: (profile) => set({ profile }),

    setLoading: (isLoading) => set({ isLoading }),

    clearSession: () => set(initialState),
  }));
