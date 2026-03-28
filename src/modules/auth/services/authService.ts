// ─────────────────────────────────────────────────────────────
// AUTH MODULE — Manager Sign In Service
// Blocks admins from logging in as managers.
// ─────────────────────────────────────────────────────────────

import { supabase } from "@/shared/lib/supabase";
import type { SignUpData, SignInData } from "../types";

export const authService = {

  async signInWithGoogle(redirectTo: string) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
  },

  async signUp({ email, password, fullName }: Omit<SignUpData, "username"> & { username?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;

    if (data.user) {
      await supabase.from("manager_profiles").upsert({
        user_id:    data.user.id,
        email:      email.toLowerCase().trim(),
        full_name:  fullName,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
    return data;
  },

  async signIn({ identifier, password }: SignInData) {
    let emailToUse = identifier.trim();

    // Username → email lookup
    if (!emailToUse.includes("@")) {
      const { data: profile } = await supabase
        .from("manager_profiles")
        .select("email")
        .eq("username", emailToUse.toLowerCase())
        .maybeSingle();
      if (profile?.email) {
        emailToUse = profile.email;
      } else {
        throw new Error("No account found with this username. Please use your email.");
      }
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        throw new Error("Email not confirmed. Check your inbox for a verification link.");
      }
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Incorrect email or password. Please try again.");
      }
      throw new Error(error.message);
    }

    // Block admins from logging in as managers
    // Use metadata role (set at signup) — no DB query needed
    const userRole = data.user.user_metadata?.role;
    if (userRole === "admin") {
      await supabase.auth.signOut();
      throw new Error("This is an admin account. Please use Admin Login instead.");
    }

    // Verify this user is an active talent manager
    const { data: tm, error: tmErr } = await supabase
      .from("talent_managers")
      .select("id, is_active")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (tmErr) {
      // RLS or table issue — allow through, ProtectedRoute will handle it
      console.warn("talent_managers check failed:", tmErr.message);
      return data;
    }

    if (!tm) {
      await supabase.auth.signOut();
      throw new Error("No manager account found. Ask your admin to add you.");
    }

    if (!tm.is_active) {
      await supabase.auth.signOut();
      throw new Error("Your account has been deactivated. Contact your admin.");
    }

    return data;
  },

  async sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async resendVerification(email: string) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/verify` },
    });
    if (error) throw error;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
