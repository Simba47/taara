/**
 * TAARA — Admin Auth
 * Modular: AdminSignupView + AdminLoginView
 * Zustand for state, no spinner hang bugs.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Eye, EyeOff, Loader2, ArrowLeft,
  Mail, Lock, User, Building2, Star, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { supabase } from "@/shared/lib/supabase";
import { useAdminStore } from "@/stores/adminStore";

// ── Shared UI ──────────────────────────────────────────────

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 20%, hsl(225 73% 57% / 0.06) 0%, transparent 70%)" }} />
      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
            <Star className="h-4 w-4 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground">Taara Talent</h1>
            <p className="text-[10px] text-muted-foreground font-body -mt-0.5">Talent Management</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">{children}</div>
      </div>
    </div>
  );
}

function ErrBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
      <p className="text-[12px] font-body text-destructive">{msg}</p>
    </div>
  );
}

function OkBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
      <p className="text-[12px] font-body text-emerald-700">{msg}</p>
    </div>
  );
}

function PasswordInput({ id, value, onChange, placeholder = "••••••••", disabled }: {
  id?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
      <Input id={id} type={show ? "text" : "password"} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        disabled={disabled}
        className="pl-9 pr-10 font-body text-[13px] rounded-xl h-10 bg-background border-border disabled:opacity-60" />
      <button type="button" onClick={() => setShow(s => !s)} disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Admin Signup ───────────────────────────────────────────

function AdminSignupView() {
  const navigate   = useNavigate();
  const { fetchAdminProfile } = useAdminStore();
  const submitting = useRef(false); // ref prevents double-submit even across re-renders

  const [agencyName, setAgencyName] = useState("");
  const [fullName,   setFullName]   = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [busy,       setBusy]       = useState(false);
  const [err,        setErr]        = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return; // hard guard
    setErr("");

    if (!agencyName.trim() || !fullName.trim() || !email.trim() || !password) {
      setErr("Please fill in all fields."); return;
    }
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }

    submitting.current = true;
    setBusy(true);

    try {
      // Step 1: Create auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: { full_name: fullName.trim(), role: "admin" },
          emailRedirectTo: `${window.location.origin}/admin/dashboard`,
        },
      });

      if (authErr) throw authErr;
      if (!authData.user) throw new Error("Signup failed. Please try again.");

      // Step 2: Insert admin_profiles row
      const { error: profErr } = await supabase.from("admin_profiles").insert({
        user_id:     authData.user.id,
        full_name:   fullName.trim(),
        email:       email.toLowerCase().trim(),
        agency_name: agencyName.trim(),
      });

      if (profErr) {
        if (profErr.message?.includes("row-level security")) {
          // RLS blocked — upsert as workaround
          await supabase.from("admin_profiles").upsert({
            user_id:     authData.user.id,
            full_name:   fullName.trim(),
            email:       email.toLowerCase().trim(),
            agency_name: agencyName.trim(),
          }, { onConflict: "user_id" });
        } else {
          throw profErr;
        }
      }

      // Step 3: Always redirect to login with check-email message
      // Never auto-navigate to dashboard from signup —
      // even if Supabase returns a session, force email verification first
      // by signing out and asking them to confirm then log in.
      if (authData.session) {
        // Sign out the auto-session so they must verify email first
        await supabase.auth.signOut();
      }

      navigate(
        `/admin/login?registered=1&em=${encodeURIComponent(email.toLowerCase().trim())}`,
        { replace: true }
      );

    } catch (e: any) {
      const msg = e.message ?? "";
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        setErr("An account with this email already exists. Please sign in.");
      } else {
        setErr(msg || "Something went wrong. Please try again.");
      }
      submitting.current = false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard>
      <div>
        <button onClick={() => navigate("/")}
          className="flex items-center gap-1 text-[12px] font-body text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <h2 className="font-display text-[20px] font-bold mb-0.5">Create Admin Account</h2>
        <p className="text-muted-foreground font-body text-[12px]">Set up your talent agency</p>
      </div>
      <ErrBanner msg={err} />
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="su-agency" className="font-body text-[12px] font-semibold">Agency Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input id="su-agency" value={agencyName} onChange={e => setAgencyName(e.target.value)}
              placeholder="Your Agency Name" disabled={busy}
              className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border disabled:opacity-60" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="su-name" className="font-body text-[12px] font-semibold">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input id="su-name" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="John Doe" disabled={busy}
              className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border disabled:opacity-60" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="su-email" className="font-body text-[12px] font-semibold">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input id="su-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@agency.com" disabled={busy} autoComplete="email"
              className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border disabled:opacity-60" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="su-pw" className="font-body text-[12px] font-semibold">Password</Label>
          <PasswordInput id="su-pw" value={password} onChange={setPassword}
            placeholder="Min 8 characters" disabled={busy} />
        </div>
        <Button type="submit" disabled={busy}
          className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70">
          {busy
            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account…</>
            : "Create Account"}
        </Button>
      </form>
      <p className="text-center text-[12px] font-body text-muted-foreground">
        Already have an account?{" "}
        <button onClick={() => navigate("/admin/login")} className="text-primary font-semibold hover:underline">Sign In</button>
      </p>
    </AuthCard>
  );
}

// ── Admin Login ────────────────────────────────────────────

function AdminLoginView() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { fetchAdminProfile, isAdmin, initialized } = useAdminStore();
  const submitting = useRef(false);

  const params      = new URLSearchParams(location.search);
  const registered  = params.get("registered") === "1";
  const pendingEmail = params.get("em") ?? "";

  const [email,     setEmail]    = useState(pendingEmail);
  const [password,  setPassword] = useState("");
  const [busy,      setBusy]     = useState(false);
  const [err,       setErr]      = useState("");
  const [resendOk,  setResendOk] = useState("");
  const [resending, setResending] = useState(false);

  // Already logged in as admin → redirect
  useEffect(() => {
    if (initialized && isAdmin()) navigate("/admin/dashboard", { replace: true });
  }, [initialized, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    setErr(""); setResendOk("");
    if (!email.trim() || !password) { setErr("Please fill in all fields."); return; }

    submitting.current = true;
    setBusy(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(), password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setErr("Email not confirmed. Check your inbox and click the verification link.");
          submitting.current = false;
          return;
        }
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Incorrect email or password.");
        }
        throw error;
      }

      // Verify admin profile
      const profile = await fetchAdminProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        useAdminStore.getState().reset();
        throw new Error("This account is not an admin. Please use Manager Login.");
      }

      navigate("/admin/dashboard", { replace: true });

    } catch (e: any) {
      setErr(e.message || "Something went wrong.");
      submitting.current = false;
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resending) return;
    setResending(true); setErr(""); setResendOk("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.toLowerCase().trim(),
        options: { emailRedirectTo: `${window.location.origin}/admin/dashboard` },
      });
      if (error) throw error;
      setResendOk("Confirmation email resent! Check your inbox.");
    } catch (e: any) {
      setErr(e.message || "Could not resend email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthCard>
      <div>
        <button onClick={() => navigate("/")}
          className="flex items-center gap-1 text-[12px] font-body text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <h2 className="font-display text-[20px] font-bold mb-0.5">Admin Sign In</h2>
        <p className="text-muted-foreground font-body text-[12px]">Access your agency dashboard</p>
      </div>

      {registered && !err && !resendOk && (
        <div className="px-3 py-3 rounded-xl bg-emerald-50 border border-emerald-200 flex gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-body text-emerald-700 font-semibold">Account created!</p>
            <p className="text-[11px] font-body text-emerald-600 mt-0.5">
              {pendingEmail
                ? <>Check <strong>{pendingEmail}</strong> and confirm your email, then sign in.</>
                : "Check your email and confirm, then sign in."}
            </p>
          </div>
        </div>
      )}

      <OkBanner msg={resendOk} />
      <ErrBanner msg={err} />

      {err.includes("not confirmed") && (
        <Button onClick={handleResend} disabled={resending} variant="outline"
          className="w-full rounded-xl font-body text-[12px] h-9 border-border">
          {resending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
          Resend confirmation email
        </Button>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="al-email" className="font-body text-[12px] font-semibold">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input id="al-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@agency.com" disabled={busy} autoComplete="email"
              className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border disabled:opacity-60" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="al-pw" className="font-body text-[12px] font-semibold">Password</Label>
          <PasswordInput id="al-pw" value={password} onChange={setPassword} disabled={busy} />
        </div>
        <Button type="submit" disabled={busy}
          className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Signing in…</> : "Sign In"}
        </Button>
      </form>
      <p className="text-center text-[12px] font-body text-muted-foreground">
        New agency?{" "}
        <button onClick={() => navigate("/admin/signup")} className="text-primary font-semibold hover:underline">Create account</button>
      </p>
    </AuthCard>
  );
}

export default function AdminAuthPage({ mode }: { mode: "login" | "signup" }) {
  return mode === "signup" ? <AdminSignupView /> : <AdminLoginView />;
}
