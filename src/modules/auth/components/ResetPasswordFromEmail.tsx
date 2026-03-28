// ─────────────────────────────────────────────────────────────
// AUTH MODULE — Reset Password From Email
// Shown inside ProtectedRoute when PASSWORD_RECOVERY event fires
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/modules/auth/hooks/useAuthContext";

function PwInput({ id, value, onChange, placeholder }: {
  id: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
      <Input id={id} type={show ? "text" : "password"} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder || "••••••••"}
        autoComplete="new-password"
        className="pl-9 pr-10 font-body text-[13px] rounded-xl h-10 bg-background border-border" />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function ResetPasswordFromEmail({ onComplete }: { onComplete: () => void }) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setErr("Passwords do not match."); return; }
    setBusy(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(onComplete, 1500);
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <p className="font-display text-lg font-bold">Password updated!</p>
        <p className="text-[13px] text-muted-foreground font-body">Taking you to your dashboard…</p>
      </div>
    </div>
  );

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

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-display text-[18px] font-bold mb-0.5">Set new password</h2>
            <p className="text-muted-foreground font-body text-[12px]">
              Choose a strong new password for your account.
            </p>
          </div>

          {err && (
            <div className="px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-[12px] font-body text-destructive">{err}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="rp-pw" className="font-body text-[12px] font-semibold">New Password</Label>
              <PwInput id="rp-pw" value={password} onChange={setPassword} placeholder="Create a strong password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rp-confirm" className="font-body text-[12px] font-semibold">Confirm Password</Label>
              <PwInput id="rp-confirm" value={confirm} onChange={setConfirm} placeholder="Repeat new password" />
              {confirm && confirm !== password && (
                <p className="text-[11px] text-destructive font-body">Passwords do not match</p>
              )}
            </div>
            <Button type="submit" disabled={busy}
              className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}