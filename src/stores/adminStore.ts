/**
 * TAARA — Admin Store (Zustand)
 * Single source of truth for admin auth state.
 * Separate from manager AuthContext by design.
 */
import { create } from "zustand";
import { supabase } from "@/shared/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export interface AdminProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  agency_name: string;
  created_at: string;
  updated_at: string;
}

interface AdminState {
  user:         User | null;
  session:      Session | null;
  adminProfile: AdminProfile | null;
  loading:      boolean;
  initialized:  boolean;

  isAdmin:           () => boolean;
  initialize:        () => Promise<void>;
  fetchAdminProfile: (userId: string) => Promise<AdminProfile | null>;
  signOut:           () => Promise<void>;
  reset:             () => void;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  user:         null,
  session:      null,
  adminProfile: null,
  loading:      true,
  initialized:  false,

  isAdmin: () => !!get().adminProfile,

  initialize: async () => {
    if (get().initialized) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null });
      // Only fetch admin profile if there's an active session
      if (session?.user) {
        await get().fetchAdminProfile(session.user.id);
      }
    } catch {
      // Silently ignore - not every user is an admin
    } finally {
      set({ loading: false, initialized: true });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        await get().fetchAdminProfile(session.user.id);
      } else {
        set({ adminProfile: null });
      }
      set({ loading: false });
    });
  },

  fetchAdminProfile: async (userId: string) => {
    try {
      const { data } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      // maybeSingle returns null if no row — no error for non-admins
      const profile = (data as AdminProfile) ?? null;
      set({ adminProfile: profile });
      return profile;
    } catch {
      // Silently ignore errors — user is just not an admin
      set({ adminProfile: null });
      return null;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, adminProfile: null, initialized: false });
  },

  reset: () => set({
    user: null, session: null, adminProfile: null,
    loading: false, initialized: false,
  }),
}));
