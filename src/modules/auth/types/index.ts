// ─────────────────────────────────────────────────────────────
// AUTH MODULE — Types
// All auth-related type definitions live here
// ─────────────────────────────────────────────────────────────

export type AuthMethod = "google" | "email";
export type AuthView = "login" | "signup" | "forgot-password" | "reset-password" | "verify-email";

export interface SignUpData {
  email: string;
  password: string;
  username?: string;  // optional — manager sets it later in profile settings
  fullName: string;
}

export interface SignInData {
  identifier: string; // email OR username
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
}

export interface AuthState {
  view: AuthView;
  loading: boolean;
  error: string | null;
}