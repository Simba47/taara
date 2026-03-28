// ─────────────────────────────────────────────────────────────
// AUTH MODULE — Google Profile Setup
// CRITICAL: Card, ErrBanner, PasswordInput all defined OUTSIDE
// the main component to prevent remount on every keystroke
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { Building2, Phone, Loader2, Check, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveManagerProfile } from "@/modules/manager/hooks/useManagerProfile";
import { useAuth } from "@/modules/auth/hooks/useAuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  userName: string;
  userEmail: string;
  onComplete: () => void;
}

// ── All sub-components defined at module level — never remounted ──

function SetupCard({ userEmail, children }: { userEmail: string; children: React.ReactNode }) {
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
          <p className="text-muted-foreground font-body text-[12px]">Signed in as {userEmail}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
      <p className="text-[12px] font-body text-destructive">{msg}</p>
    </div>
  );
}

function PwInput({ value, onChange, id, placeholder }: {
  value: string; onChange: (v: string) => void; id: string; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || "••••••••"}
        autoComplete={id === "gp-pw" ? "new-password" : "new-password"}
        className="pl-9 pr-10 font-body text-[13px] rounded-xl h-10 bg-background border-border"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Step 1 — Profile details ──────────────────────────────────
function ProfileStep({ userName, userEmail, onNext }: {
  userName: string; userEmail: string; onNext: (agency: string, phone: string) => Promise<void>;
}) {
  const [agencyName, setAgencyName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try { await onNext(agencyName, phone); }
    catch (ex: any) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  return (
    <SetupCard userEmail={userEmail}>
      <div>
        <h2 className="font-display text-[18px] font-bold mb-0.5">
          Welcome, {userName.split(" ")[0]}!
        </h2>
        <p className="text-muted-foreground font-body text-[12px]">
          Complete your profile to get started
        </p>
      </div>
      <ErrMsg msg={err} />
      <form onSubmit={handle} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="gs-agency" className="font-body text-[12px] font-semibold">
            Agency / Company Name
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input
              id="gs-agency"
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              placeholder="TAARA Talent Management"
              className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gs-phone" className="font-body text-[12px] font-semibold">Phone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input
              id="gs-phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border"
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Next →
        </Button>
      </form>
    </SetupCard>
  );
}

// ── Step 2 — Set password (REQUIRED, no skip) ─────────────────
function PasswordStep({ userEmail, onDone }: {
  userEmail: string; onDone: (pw: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setErr("Passwords do not match."); return; }
    setBusy(true);
    try { await onDone(password); }
    catch (ex: any) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  return (
    <SetupCard userEmail={userEmail}>
      <div>
        <h2 className="font-display text-[18px] font-bold mb-0.5">Set a password</h2>
        <p className="text-muted-foreground font-body text-[12px]">
          Create a password so you can log in with your email too — not just Google.
          <br />
          <span className="text-primary font-semibold">This is required.</span>
        </p>
      </div>
      <ErrMsg msg={err} />
      <form onSubmit={handle} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="gp-pw" className="font-body text-[12px] font-semibold">Password</Label>
          <PwInput id="gp-pw" value={password} onChange={setPassword} placeholder="Create a strong password" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gp-confirm" className="font-body text-[12px] font-semibold">Confirm Password</Label>
          <PwInput id="gp-confirm" value={confirm} onChange={setConfirm} placeholder="Repeat password" />
          {confirm && confirm !== password && (
            <p className="text-[11px] text-destructive font-body">Passwords do not match</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {busy
            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
            : <Check className="h-4 w-4 mr-2" />
          }
          Set Password & Continue
        </Button>
      </form>
    </SetupCard>
  );
}

// ── Main orchestrator ─────────────────────────────────────────
export function GoogleProfileSetup({ userName, userEmail, onComplete }: Props) {
  const save = useSaveManagerProfile();
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"profile" | "password">("profile");

  // Store profile data from step 1 to save after password is set
  const [pendingProfile, setPendingProfile] = useState<{ agencyName: string; phone: string } | null>(null);

  const handleProfileNext = async (agencyName: string, phone: string) => {
    // Just store the data and move to password step
    // Do NOT save to DB yet — the foreign key may fail before password is set
    setPendingProfile({ agencyName, phone });
    setStep("password");
  };

  const handlePasswordDone = async (password: string) => {
    // Set password first
    await updatePassword(password);

    // Now save profile — user session is fully established after updatePassword
    try {
      await save.mutateAsync({
        full_name: userName,
        agency_name: pendingProfile?.agencyName || undefined,
        phone: pendingProfile?.phone || undefined,
      });
    } catch (err) {
      // Profile save failed but password is set — not critical, they can fill profile later
      console.warn("Profile save after password set failed:", err);
    }

    toast({ title: "Password set! You can now log in with email + password." });
    onComplete();
  };

  if (step === "profile") {
    return (
      <ProfileStep
        userName={userName}
        userEmail={userEmail}
        onNext={handleProfileNext}
      />
    );
  }

  return (
    <PasswordStep
      userEmail={userEmail}
      onDone={handlePasswordDone}
    />
  );
}