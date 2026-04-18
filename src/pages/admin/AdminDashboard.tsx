/**
 * TAARA — Admin Dashboard
 * Zustand (admin session) + React Query (server data)
 * Tabs: Talent Managers | Join Requests | Work Logs
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Activity, UserCheck, ClipboardList,
  Plus, Trash2, LogOut, Phone, Mail, Calendar,
  Eye, EyeOff, Loader2, X, Star, Building2,
  UserPlus, Check, XCircle,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase }      from "@/shared/lib/supabase";
import { useAdminStore } from "@/stores/adminStore";
import { useToast }      from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────

interface TalentManager {
  id: string; user_id: string; admin_id: string;
  full_name: string; email: string; phone?: string;
  is_active: boolean; created_at: string;
}

interface JoinRequest {
  id: string; manager_user_id: string;
  manager_name: string; manager_email: string; manager_phone?: string;
  target_admin_id: string; status: "pending" | "approved" | "rejected";
  message?: string; created_at: string;
}

interface WorkLog {
  id: string; manager_user_id: string; action: string;
  details?: string; created_at: string; managerName?: string;
}

// ── Hooks ──────────────────────────────────────────────────────

function useManagers(adminId: string) {
  return useQuery({
    queryKey: ["admin-managers", adminId],
    enabled: !!adminId,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_managers").select("*")
        .eq("admin_id", adminId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TalentManager[];
    },
  });
}

function useManagerActorCounts(userIds: string[]) {
  return useQuery({
    queryKey: ["manager-actor-counts", ...userIds],
    enabled: userIds.length > 0,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const result: Record<string, number> = {};
      await Promise.all(userIds.map(async uid => {
        const { count } = await supabase
          .from("actors").select("id", { count: "exact", head: true }).eq("user_id", uid);
        result[uid] = count ?? 0;
      }));
      return result;
    },
  });
}

function useJoinRequests(adminId: string) {
  return useQuery({
    queryKey: ["join-requests", adminId],
    enabled: !!adminId,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("join_requests").select("*")
        .eq("target_admin_id", adminId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as JoinRequest[];
    },
  });
}

function useWorkLogs(adminId: string, managerList: TalentManager[]) {
  return useQuery({
    queryKey: ["admin-work-logs", adminId],
    enabled: !!adminId && managerList.length > 0,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const uids = managerList.map(m => m.user_id);
      if (!uids.length) return [] as WorkLog[];
      const { data, error } = await supabase
        .from("work_logs").select("*")
        .in("manager_user_id", uids)
        .order("created_at", { ascending: false }).limit(60);
      if (error) throw error;
      return ((data ?? []) as WorkLog[]).map(log => ({
        ...log,
        managerName: managerList.find(m => m.user_id === log.manager_user_id)?.full_name ?? "Unknown",
      }));
    },
  });
}

// ── Add Manager Modal ──────────────────────────────────────────

function AddManagerModal({ adminId, onClose }: { adminId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");
  const [done,     setDone]     = useState(false); // success state — prevents re-submit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Hard guard — if already busy or done, do nothing
    if (busy || done) return;

    setErr("");
    if (!fullName.trim() || !email.trim() || !password) {
      setErr("Full name, email and password are required."); return;
    }
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }

    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("create_manager_account", {
        p_email:     email.toLowerCase().trim(),
        p_password:  password,
        p_full_name: fullName.trim(),
        p_phone:     phone.trim(),
        p_admin_id:  adminId,
      });

      if (error) {
        // Surface a clean error message
        const msg = error.message ?? "";
        if (msg.includes("gen_salt") || msg.includes("pgcrypto")) {
          throw new Error("Database function not ready. Please run fix-manager-final.sql in Supabase SQL Editor.");
        }
        if (msg.includes("already exists") || msg.includes("unique")) {
          throw new Error("A manager with this email already exists.");
        }
        throw new Error(msg || "Something went wrong. Please try again.");
      }

      if (!data?.success) {
        throw new Error(data?.error ?? "Failed to create manager. Please try again.");
      }

      // Send confirmation email via Supabase resend API
      await supabase.auth.resend({
        type: "signup",
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/manager/login`,
        },
      });

      // Success
      setDone(true);
      qc.invalidateQueries({ queryKey: ["admin-managers", adminId] });
      toast({ title: "Manager created!", description: `Confirmation email sent to ${email}. They must verify before logging in.` });

      setTimeout(() => onClose(), 800);
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-display text-lg font-bold">Add Talent Manager</h2>
          {/* Block closing while request is in-flight */}
          <button onClick={() => { if (!busy) onClose(); }}
            className={`transition-colors p-1 rounded-lg hover:bg-accent ${busy ? "opacity-30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground"}`}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Success state */}
          {done && (
            <div className="px-3 py-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[12px] font-body text-emerald-700 font-semibold">Manager created successfully!</p>
            </div>
          )}

          {/* Error */}
          {err && !done && (
            <div className="px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-[12px] font-body text-destructive">{err}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="font-body text-[12px] font-semibold">Full Name <span className="text-destructive">*</span></Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name"
              disabled={busy || done}
              className="font-body text-[13px] rounded-xl h-10 bg-background border-border disabled:opacity-60" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-[12px] font-semibold">Email <span className="text-destructive">*</span></Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@agency.com"
              disabled={busy || done}
              className="font-body text-[13px] rounded-xl h-10 bg-background border-border disabled:opacity-60" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-[12px] font-semibold">Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210"
              disabled={busy || done}
              className="font-body text-[13px] rounded-xl h-10 bg-background border-border disabled:opacity-60" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-[12px] font-semibold">Temporary Password <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Set a password for them"
                disabled={busy || done}
                className="pr-10 font-body text-[13px] rounded-xl h-10 bg-background border-border disabled:opacity-60" />
              <button type="button" onClick={() => setShowPw(s => !s)} disabled={busy || done}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground font-body">Share these credentials with the manager directly.</p>
          </div>

          <Button type="submit" disabled={busy || done}
            className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70">
            {busy
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account…</>
              : done
              ? "✓ Created!"
              : "Create Manager Account"
            }
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────

function StatCard({ icon: Icon, value, label, color }: {
  icon: React.ElementType; value: number; label: string; color: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
        <span className="text-[12px] text-muted-foreground font-body font-medium">{label}</span>
      </div>
      <p className="text-4xl font-display font-extrabold">{value}</p>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { adminProfile, signOut } = useAdminStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab,    setActiveTab]    = useState<"managers" | "requests" | "logs">("managers");
  const [showAddModal, setShowAddModal] = useState(false);

  const adminId = adminProfile?.id ?? "";

  const { data: managers = [],  isLoading: mgLoading }   = useManagers(adminId);
  const { data: actorCounts = {} }                        = useManagerActorCounts(managers.map(m => m.user_id));
  const { data: joinRequests = [], isLoading: jrLoading } = useJoinRequests(adminId);
  const { data: logs = [],       isLoading: logsLoading } = useWorkLogs(adminId, managers);

  const pendingRequests = joinRequests.filter(r => r.status === "pending").length;
  const activeCount     = managers.filter(m => m.is_active).length;
  const totalActors     = Object.values(actorCounts).reduce((a, b) => a + b, 0);
  const todayLogs       = logs.filter(l => l.created_at?.startsWith(new Date().toISOString().split("T")[0])).length;

  const handleDeleteManager = async (m: TalentManager) => {
    if (!confirm(`Remove ${m.full_name} from your agency? They can request to re-join later.`)) return;
    try {
      const { error } = await supabase
        .from("talent_managers")
        .delete()
        .eq("user_id", m.user_id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["admin-managers", adminId] });
      qc.invalidateQueries({ queryKey: ["admin-work-logs", adminId] });
      toast({ title: "Manager removed", description: `${m.full_name} has been removed from your agency.` });
    } catch (e: any) {
      toast({ title: "Could not remove manager", description: e.message, variant: "destructive" });
    }
  };

  const handleApproveRequest = async (req: JoinRequest) => {
    try {
      const { data, error } = await supabase.rpc("approve_join_request", { p_request_id: req.id });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error);
      qc.invalidateQueries({ queryKey: ["join-requests", adminId] });
      qc.invalidateQueries({ queryKey: ["admin-managers", adminId] });
      toast({ title: "Request approved!", description: `${req.manager_name} has been added to your team.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleRejectRequest = async (req: JoinRequest) => {
    try {
      const { error } = await supabase.from("join_requests")
        .update({ status: "rejected" }).eq("id", req.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["join-requests", adminId] });
      toast({ title: "Request rejected", description: `${req.manager_name}'s request has been declined.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <Star className="h-4 w-4 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-display text-base font-bold tracking-tight">Taara Talent</h1>
              <p className="text-[10px] text-muted-foreground font-body -mt-0.5">
                {adminProfile?.agency_name ?? "Admin Dashboard"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-[11px] font-display font-bold text-primary">
                  {adminProfile?.full_name?.[0]?.toUpperCase() ?? "A"}
                </span>
              </div>
              <span className="text-[12px] font-body text-muted-foreground">{adminProfile?.full_name}</span>
            </div>
            <Button onClick={async () => { await signOut(); navigate("/", { replace: true }); }}
              variant="ghost" size="sm"
              className="text-[12px] font-body text-muted-foreground hover:text-foreground gap-1.5">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        {/* Title */}
        <div className="mb-8">
          <h2 className="font-display text-3xl font-extrabold tracking-tight mb-1">Admin Dashboard</h2>
          <p className="text-muted-foreground font-body text-sm flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />{adminProfile?.agency_name}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users}         value={managers.length} label="Total Managers"  color="bg-blue-100 text-blue-600" />
          <StatCard icon={Activity}      value={activeCount}     label="Active Managers" color="bg-emerald-100 text-emerald-600" />
          <StatCard icon={UserCheck}     value={totalActors}     label="Total Actors"    color="bg-orange-100 text-orange-600" />
          <StatCard icon={ClipboardList} value={todayLogs}       label="Today's Logs"   color="bg-purple-100 text-purple-600" />
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["managers", "requests", "logs"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-1.5 rounded-lg text-[12px] font-body font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {tab === "managers" ? "Talent Managers" : tab === "requests" ? "Join Requests" : "Work Logs"}
                {tab === "requests" && pendingRequests > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {pendingRequests}
                  </span>
                )}
              </button>
            ))}
          </div>
          {activeTab === "managers" && (
            <Button onClick={() => setShowAddModal(true)} size="sm"
              className="rounded-xl font-body text-[12px] font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" /> Add Manager
            </Button>
          )}
        </div>

        {/* ── Managers Tab ── */}
        {activeTab === "managers" && (
          <div className="glass-card divide-y divide-border overflow-hidden">
            {mgLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-3 w-40" /><Skeleton className="h-2.5 w-56" /></div>
                </div>
              ))
            ) : managers.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground">No talent managers yet.</p>
                <p className="font-body text-[12px] text-muted-foreground/60 mt-1">Click "Add Manager" to get started.</p>
              </div>
            ) : managers.map(m => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-display text-sm font-bold text-primary">{m.full_name?.[0]?.toUpperCase() ?? "M"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-body font-semibold text-[13px] text-foreground truncate">{m.full_name}</span>
                    <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      m.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                    }`}>{m.is_active ? "active" : "inactive"}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground font-body">
                    <span className="flex items-center gap-1 min-w-0"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{m.email}</span></span>
                    {m.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{m.phone}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3 shrink-0" />Joined {fmtDate(m.created_at)}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3 shrink-0" />{actorCounts[m.user_id] ?? 0} actors</span>
                  </div>
                </div>
                <button onClick={() => handleDeleteManager(m)}
                  className="p-2 text-muted-foreground/40 hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Join Requests Tab ── */}
        {activeTab === "requests" && (
          <div className="glass-card divide-y divide-border overflow-hidden">
            {jrLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-3 w-40" /><Skeleton className="h-2.5 w-56" /></div>
                </div>
              ))
            ) : joinRequests.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <UserPlus className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground">No join requests yet.</p>
                <p className="font-body text-[12px] text-muted-foreground/60 mt-1">
                  Managers who were removed can send requests to join your agency.
                </p>
              </div>
            ) : joinRequests.map(req => (
              <div key={req.id} className="flex items-start gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-display text-sm font-bold text-primary">{req.manager_name?.[0]?.toUpperCase() ?? "M"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-body font-semibold text-[13px] text-foreground">{req.manager_name}</span>
                    <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      req.status === "pending"  ? "bg-amber-100 text-amber-700" :
                      req.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                      "bg-muted text-muted-foreground"
                    }`}>{req.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground font-body">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{req.manager_email}</span>
                    {req.manager_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{req.manager_phone}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(req.created_at)}</span>
                  </div>
                  {req.message && (
                    <p className="text-[11px] font-body text-muted-foreground mt-1 italic">"{req.message}"</p>
                  )}
                </div>
                {req.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleApproveRequest(req)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors text-[11px] font-body font-semibold">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => handleRejectRequest(req)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-[11px] font-body font-semibold">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Work Logs Tab ── */}
        {activeTab === "logs" && (
          <div className="glass-card divide-y divide-border overflow-hidden">
            {logsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-4 space-y-2 animate-pulse">
                  <Skeleton className="h-3 w-48" /><Skeleton className="h-2.5 w-72" />
                </div>
              ))
            ) : logs.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <ClipboardList className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground">No work logs yet.</p>
                <p className="font-body text-[12px] text-muted-foreground/60 mt-1">Manager activity appears here automatically.</p>
              </div>
            ) : logs.map((log: WorkLog) => (
              <div key={log.id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                <div>
                  <p className="font-body text-[13px] font-semibold text-foreground">{log.managerName}</p>
                  <p className="font-body text-[12px] text-muted-foreground mt-0.5">{log.action}</p>
                  {log.details && <p className="font-body text-[11px] text-muted-foreground/60 mt-0.5">{log.details}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-body text-[11px] text-muted-foreground">{fmtDate(log.created_at)}</p>
                  <p className="font-body text-[10px] text-muted-foreground/60">{fmtTime(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showAddModal && <AddManagerModal adminId={adminId} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
