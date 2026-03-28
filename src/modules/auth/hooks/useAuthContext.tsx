import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { authService } from "../services/authService";
import type { SignUpData, SignInData } from "../types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPasswordRecovery: boolean;  // true when opened via reset-password email link
  signInWithGoogle: () => Promise<void>;
  signUp: (data: Omit<SignUpData, "username"> & { username?: string }) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Get initial session
    authService.getSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(((event: string, session: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Mark recovery mode — ProtectedRoute will redirect to reset-password page
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }
    }) as any);

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle(`${window.location.origin}/dashboard`);
  };

  const signUp = async (data: Omit<SignUpData, "username"> & { username?: string }) => {
    await authService.signUp(data as any);
  };

  const signIn = async (data: SignInData) => {
    await authService.signIn(data);
  };

  const sendPasswordReset = async (email: string) => {
    await authService.sendPasswordReset(email);
  };

  const updatePassword = async (password: string) => {
    await authService.updatePassword(password);
  };

  const resendVerification = async (email: string) => {
    await authService.resendVerification(email);
  };

  const signOut = async () => {
    await authService.signOut();
  };

  const clearPasswordRecovery = () => setIsPasswordRecovery(false);

  return (
    <AuthContext.Provider value={{
      user, session, loading, isPasswordRecovery,
      signInWithGoogle, signUp, signIn,
      sendPasswordReset, updatePassword,
      resendVerification, signOut,
      clearPasswordRecovery,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}