// ─────────────────────────────────────────────────────────────
// AUTH MODULE — Login Page
// Each view is a SEPARATE component to prevent state reset on typing
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, Mail, Lock, User, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/modules/auth/hooks/useAuthContext";
import type { AuthView } from "@/modules/auth/types";

// ── Shared sub-components (defined OUTSIDE to avoid remount) ──
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Stable password input — defined outside ALL view components
function PasswordInput({ value, onChange, placeholder = "••••••••", id }: {
  value: string; onChange: (v: string) => void; placeholder?: string; id?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
      <Input id={id} type={show ? "text" : "password"} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="pl-9 pr-10 font-body text-[13px] rounded-xl h-10 bg-background border-border" />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { label: "8+ chars", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["bg-destructive", "bg-amber-400", "bg-emerald-500"];
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i < score ? colors[score-1] : "bg-border"}`} />)}</div>
      <div className="flex gap-3">{checks.map(c => <span key={c.label} className={`text-[10px] font-body ${c.ok ? "text-emerald-600" : "text-muted-foreground/40"}`}>{c.ok ? "✓" : "·"} {c.label}</span>)}</div>
    </div>
  );
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[380px] animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="font-display text-primary-foreground text-sm font-bold">T</span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight uppercase">Taara</h1>
          </div>
          <p className="text-muted-foreground font-body text-[12px]">Talent management, refined.</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">{children}</div>
      </div>
    </div>
  );
}

function ErrBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div className="px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20"><p className="text-[12px] font-body text-destructive">{msg}</p></div>;
}
function OkBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div className="px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200"><p className="text-[12px] font-body text-emerald-700">{msg}</p></div>;
}

// ═══════════════════════════════════════════════════════════
// SEPARATE VIEW COMPONENTS — each has its own isolated state
// This prevents typing from losing focus
// ═══════════════════════════════════════════════════════════

function LoginView({ goTo }: { goTo: (v: AuthView) => void }) {
  const { signInWithGoogle, signIn, loading, resendVerification } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [resending, setResending] = useState(false);
  const [resendOk, setResendOk] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setResendOk("");
    if (!identifier.trim() || !password) { setErr("Please fill in all fields."); return; }
    setBusy(true);
    try { await signIn({ identifier, password }); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleResendVerification = async () => {
    const email = identifier.trim();
    if (!email || !email.includes("@")) {
      setErr("Enter your email address above first."); return;
    }
    setResending(true); setErr(""); setResendOk("");
    try {
      await resendVerification(email);
      setResendOk("Verification email resent! Check your inbox and click the link.");
    } catch (e: any) {
      setErr(e.message || "Could not resend email.");
    } finally { setResending(false); }
  };

  return (
    <AuthCard>
      <div>
        <a href="/" className="flex items-center gap-1 text-[12px] font-body text-muted-foreground hover:text-foreground mb-3 transition-colors w-fit">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </a>
        <h2 className="font-display text-[18px] font-bold mb-0.5">Manager Sign In</h2>
        <p className="text-muted-foreground font-body text-[12px]">Sign in to your workspace</p>
      </div>
      {resendOk && (
        <div className="px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-[12px] font-body text-emerald-700">{resendOk}</p>
        </div>
      )}
      <ErrBanner msg={err} />
      {err.toLowerCase().includes("not confirmed") && (
        <Button onClick={handleResendVerification} disabled={resending} variant="outline"
          className="w-full rounded-xl font-body text-[12px] h-9 border-border gap-2">
          {resending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Resend verification email
        </Button>
      )}
      <Button onClick={() => signInWithGoogle()} variant="outline" disabled={loading || busy} className="w-full rounded-xl font-body text-[13px] h-10 flex items-center gap-3 border-border"><GoogleIcon /> Continue with Google</Button>
      <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-[11px] text-muted-foreground font-body">or</span><div className="flex-1 h-px bg-border" /></div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="identifier" className="font-body text-[12px] font-semibold">Email or Username</Label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input id="identifier" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="your@email.com or username" className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border" autoComplete="username" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-pw" className="font-body text-[12px] font-semibold">Password</Label>
            <button type="button" onClick={() => goTo("forgot-password")} className="text-[11px] font-body text-primary hover:underline">Forgot password?</button>
          </div>
          <PasswordInput id="login-pw" value={password} onChange={setPassword} />
        </div>
        <Button type="submit" disabled={busy} className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Sign In
        </Button>
      </form>
      <p className="text-center text-[12px] font-body text-muted-foreground">Manager accounts are created by your agency admin.</p>
    </AuthCard>
  );
}

function SignupView({ goTo }: { goTo: (v: AuthView) => void }) {
  const { signUp, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!fullName || !email || !password || !confirm) { setErr("Please fill in all fields."); return; }
    if (password !== confirm) { setErr("Passwords do not match."); return; }
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setBusy(true);
    try { await signUp({ email, password, fullName }); goTo("verify-email"); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthCard>
      <div><button onClick={() => goTo("login")} className="flex items-center gap-1 text-[12px] font-body text-muted-foreground hover:text-foreground mb-2"><ArrowLeft className="h-3.5 w-3.5" /> Back</button><h2 className="font-display text-[18px] font-bold mb-0.5">Create account</h2><p className="text-muted-foreground font-body text-[12px]">Set up your Taara workspace</p></div>
      <ErrBanner msg={err} />
      <Button onClick={() => signInWithGoogle()} variant="outline" disabled={busy}
        className="w-full rounded-xl font-body text-[13px] h-10 flex items-center gap-3 border-border">
        <GoogleIcon /> Sign up with Google
      </Button>
      <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-[11px] text-muted-foreground font-body">or create with email</span><div className="flex-1 h-px bg-border" /></div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5"><Label htmlFor="su-name" className="font-body text-[12px] font-semibold">Full Name</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" /><Input id="su-name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Priya Sharma" className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border" autoComplete="name" /></div></div>
        <div className="space-y-1.5"><Label htmlFor="su-email" className="font-body text-[12px] font-semibold">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" /><Input id="su-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border" autoComplete="email" /></div></div>
        <div className="space-y-1.5"><Label htmlFor="su-pw" className="font-body text-[12px] font-semibold">Password</Label><PasswordInput id="su-pw" value={password} onChange={setPassword} placeholder="Create a strong password" /><PasswordStrength password={password} /></div>
        <div className="space-y-1.5"><Label htmlFor="su-confirm" className="font-body text-[12px] font-semibold">Confirm Password</Label><PasswordInput id="su-confirm" value={confirm} onChange={setConfirm} placeholder="Repeat your password" />{confirm && confirm !== password && <p className="text-[11px] text-destructive font-body">Passwords do not match</p>}</div>
        <p className="text-[11px] text-muted-foreground font-body">You can set a login username later from your profile settings.</p>
        <Button type="submit" disabled={busy} className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create Account
        </Button>
      </form>
      <p className="text-center text-[12px] font-body text-muted-foreground">Already have an account?{" "}<button onClick={() => goTo("login")} className="text-primary font-semibold hover:underline">Sign in</button></p>
    </AuthCard>
  );
}

function VerifyView({ goTo }: { goTo: (v: AuthView) => void }) {
  const { resendVerification } = useAuth();
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const email = sessionStorage.getItem("taara_pending_email") || "";

  const handleResend = async () => {
    if (!email) return;
    setBusy(true);
    try { await resendVerification(email); setOk("Verification email resent!"); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthCard>
      <div className="text-center py-2 space-y-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><Mail className="h-7 w-7 text-primary" /></div>
        <div><h2 className="font-display text-[18px] font-bold mb-1">Check your email</h2><p className="text-[13px] text-muted-foreground font-body leading-relaxed">We sent a verification link to <strong className="text-foreground">{email || "your email"}</strong>. Click it to activate your account.</p></div>
        <ErrBanner msg={err} /><OkBanner msg={ok} />
        <Button onClick={handleResend} variant="outline" disabled={busy} className="w-full rounded-xl font-body text-[13px] h-10 border-border">{busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Resend verification email</Button>
        <button onClick={() => goTo("login")} className="text-[12px] font-body text-muted-foreground hover:text-foreground">Back to sign in</button>
      </div>
    </AuthCard>
  );
}

function ForgotView({ goTo }: { goTo: (v: AuthView) => void }) {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!email.trim()) { setErr("Please enter your email address."); return; }
    setBusy(true);
    try { await sendPasswordReset(email); setSent(true); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  if (sent) return (
    <AuthCard>
      <div className="text-center py-2 space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><CheckCircle2 className="h-7 w-7 text-emerald-600" /></div>
        <div><h2 className="font-display text-[18px] font-bold mb-1">Reset link sent!</h2><p className="text-[13px] text-muted-foreground font-body">Check <strong className="text-foreground">{email}</strong> for the reset link. It expires in 1 hour.</p></div>
        <button onClick={() => goTo("login")} className="text-[12px] font-body text-primary font-semibold hover:underline">Back to sign in</button>
      </div>
    </AuthCard>
  );

  return (
    <AuthCard>
      <div><button onClick={() => goTo("login")} className="flex items-center gap-1 text-[12px] font-body text-muted-foreground hover:text-foreground mb-2"><ArrowLeft className="h-3.5 w-3.5" /> Back</button><h2 className="font-display text-[18px] font-bold mb-0.5">Forgot password?</h2><p className="text-muted-foreground font-body text-[12px]">Enter your registered email and we'll send a reset link.</p></div>
      <ErrBanner msg={err} />
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5"><Label htmlFor="fp-email" className="font-body text-[12px] font-semibold">Email address</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" /><Input id="fp-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border" autoComplete="email" /></div></div>
        <Button type="submit" disabled={busy} className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">{busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Send reset link</Button>
      </form>
    </AuthCard>
  );
}

function ResetView() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!password || !confirm) { setErr("Please fill in both fields."); return; }
    if (password !== confirm) { setErr("Passwords do not match."); return; }
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setBusy(true);
    try { await updatePassword(password); setDone(true); setTimeout(() => navigate("/dashboard", { replace: true }), 2000); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  if (done) return (
    <AuthCard>
      <div className="text-center py-2 space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><CheckCircle2 className="h-7 w-7 text-emerald-600" /></div>
        <h2 className="font-display text-[18px] font-bold">Password updated!</h2>
        <p className="text-[13px] text-muted-foreground font-body">Redirecting to dashboard…</p>
      </div>
    </AuthCard>
  );

  return (
    <AuthCard>
      <div><h2 className="font-display text-[18px] font-bold mb-0.5">Set new password</h2><p className="text-muted-foreground font-body text-[12px]">Choose a strong new password.</p></div>
      <ErrBanner msg={err} />
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5"><Label htmlFor="rp-pw" className="font-body text-[12px] font-semibold">New Password</Label><PasswordInput id="rp-pw" value={password} onChange={setPassword} placeholder="New password" /><PasswordStrength password={password} /></div>
        <div className="space-y-1.5"><Label htmlFor="rp-confirm" className="font-body text-[12px] font-semibold">Confirm Password</Label><PasswordInput id="rp-confirm" value={confirm} onChange={setConfirm} placeholder="Repeat new password" />{confirm && confirm !== password && <p className="text-[11px] text-destructive font-body">Passwords do not match</p>}</div>
        <Button type="submit" disabled={busy} className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">{busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Update Password</Button>
      </form>
    </AuthCard>
  );
}


function SetPasswordView({ onDone }: { onDone: () => void }) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!password || !confirm) { setErr("Please fill in both fields."); return; }
    if (password !== confirm) { setErr("Passwords do not match."); return; }
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setBusy(true);
    try { await updatePassword(password); onDone(); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthCard>
      <div>
        <h2 className="font-display text-[18px] font-bold mb-0.5">Set your password</h2>
        <p className="text-muted-foreground font-body text-[12px]">Create a password so you can also log in with your email and username.</p>
      </div>
      <ErrBanner msg={err} />
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="sp-pw" className="font-body text-[12px] font-semibold">Password</Label>
          <PasswordInput id="sp-pw" value={password} onChange={setPassword} placeholder="Create a strong password" />
          <PasswordStrength password={password} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-confirm" className="font-body text-[12px] font-semibold">Confirm Password</Label>
          <PasswordInput id="sp-confirm" value={confirm} onChange={setConfirm} placeholder="Repeat password" />
          {confirm && confirm !== password && <p className="text-[11px] text-destructive font-body">Passwords do not match</p>}
        </div>
        <Button type="submit" disabled={busy} className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Set Password
        </Button>
      </form>
      <button onClick={onDone} className="w-full text-center text-[12px] font-body text-muted-foreground hover:text-foreground transition-colors">
        Skip for now
      </button>
    </AuthCard>
  );
}

// ═══════════════════════════════════════════════════════════
// ROUTER — only view state lives here, nothing else
// ═══════════════════════════════════════════════════════════
const LoginPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<AuthView>("login");

  const goTo = (v: AuthView) => setView(v);

  // Detect reset / verify redirects from email links
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setView("reset-password");
    if (hash.includes("type=signup")) setView("verify-email");
  }, []);

  // Redirect if already logged in — BUT NOT if this is a password recovery link
  useEffect(() => {
    const hash = window.location.hash;
    const isRecovery = hash.includes("type=recovery");
    if (isRecovery) return;
    if (!loading && user) {
      // If admin is logged in, send to admin dashboard not manager workspace
      const role = user.user_metadata?.role;
      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  // Store email for verify screen
  const handleGoToVerify = (v: AuthView) => {
    setView(v);
  };

  if (view === "login")           return <LoginView goTo={goTo} />;
  if (view === "signup")          return <SignupView goTo={goTo} />;
  if (view === "verify-email")    return <VerifyView goTo={goTo} />;
  if (view === "forgot-password") return <ForgotView goTo={goTo} />;
  if (view === "reset-password")  return <ResetView />;
  if (view === "set-password")    return <SetPasswordView onDone={() => navigate("/dashboard", { replace: true })} />;
  return null;
};

export default LoginPage;