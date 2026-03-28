// ─────────────────────────────────────────────────────────────
// MANAGER MODULE — Profile Page
// /settings or /profile route
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import {
  User, Camera, Building2, MapPin, Phone, Mail, Globe,
  Instagram, Linkedin, Save, Loader2, Edit2, AtSign, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/modules/auth/hooks/useAuthContext";
import { useManagerProfile, useSaveManagerProfile, useUploadAvatar } from "../hooks/useManagerProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/shared/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ManagerProfileUpdate } from "../types";

const SPECIALISATIONS = ["Film", "TV Series", "OTT / Web Series", "Theatre", "Commercial", "Music Videos", "Mixed"];

export function ManagerProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useManagerProfile();
  const saveProfile = useSaveManagerProfile();
  const uploadAvatar = useUploadAvatar();
  const { toast } = useToast();
  const avatarRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state — initialised from profile
  const [form, setForm] = useState<ManagerProfileUpdate>({});
  const f = (key: keyof ManagerProfileUpdate) =>
    (key in form ? form[key] : profile?.[key]) as string || "";

  const set = (key: keyof ManagerProfileUpdate, val: string | number) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const startEditing = () => {
    setForm({
      full_name: profile?.full_name || user?.user_metadata?.full_name || "",
      username: profile?.username || user?.user_metadata?.username || "",
      phone: profile?.phone || "",
      agency_name: profile?.agency_name || "",
      agency_location: profile?.agency_location || "",
      bio: profile?.bio || "",
      website: profile?.website || "",
      instagram: profile?.instagram || "",
      linkedin: profile?.linkedin || "",
      years_experience: profile?.years_experience,
      specialisation: profile?.specialisation || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.full_name?.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await saveProfile.mutateAsync(form);
      toast({ title: "Profile saved!" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Avatar must be under 5 MB", variant: "destructive" });
      return;
    }
    try {
      await uploadAvatar.mutateAsync(file);
      toast({ title: "Photo updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Manager";
  const displayUsername = profile?.username || user?.user_metadata?.username;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  if (isLoading) return (
    <div className="max-w-[720px] mx-auto px-8 py-10 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">My Profile</h1>
          <p className="text-muted-foreground font-body text-sm">Your manager account and workspace details</p>
        </div>
        {!editing ? (
          <Button onClick={startEditing} variant="outline" className="h-9 rounded-xl font-body text-[13px] border-border">
            <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => { setEditing(false); setForm({}); }} variant="outline"
              className="h-9 rounded-xl font-body text-[13px] border-border">Cancel</Button>
            <Button onClick={handleSave} disabled={saving}
              className="h-9 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* ── Avatar + Name card ─────────────────────────────── */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            {profile?.avatar_url ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-border">
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center ring-2 ring-border">
                <span className="font-display text-2xl font-bold text-primary">{initials}</span>
              </div>
            )}
            <button onClick={() => avatarRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm">
              {uploadAvatar.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Camera className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Name + meta */}
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-body text-[11px] font-semibold text-muted-foreground">Full Name *</Label>
                  <Input value={f("full_name")} onChange={e => set("full_name", e.target.value)}
                    className="font-body text-[13px] rounded-xl h-9 bg-background border-border" />
                </div>
                <div className="space-y-1">
                  <Label className="font-body text-[11px] font-semibold text-muted-foreground">Username</Label>
                  <div className="relative">
                    <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                    <Input value={f("username")} onChange={e => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      maxLength={20} className="pl-8 font-body text-[13px] rounded-xl h-9 bg-background border-border" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-display text-xl font-bold">{displayName}</h2>
                {displayUsername && (
                  <p className="text-[13px] text-muted-foreground font-body flex items-center gap-1 mt-0.5">
                    <AtSign className="h-3.5 w-3.5" />{displayUsername}
                  </p>
                )}
                {profile?.specialisation && (
                  <p className="text-[12px] text-muted-foreground font-body mt-1">{profile.specialisation} Talent Manager</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Account Info (read-only) ───────────────────────── */}
      <div className="glass-card overflow-hidden mb-6">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="font-display text-base font-bold">Account</h3>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground font-body">Email</p>
              <p className="text-[13px] font-body font-medium">{user?.email}</p>
            </div>
            <span className="ml-auto text-[10px] font-body px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Verified</span>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <AtSign className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground font-body">Login ID / Username</p>
              <p className="text-[13px] font-body font-medium">{displayUsername || "Not set"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Professional Details ───────────────────────────── */}
      <div className="glass-card overflow-hidden mb-6">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="font-display text-base font-bold">Professional Details</h3>
        </div>
        {editing ? (
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label className="font-body text-[12px] font-semibold">Agency / Company Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input value={f("agency_name")} onChange={e => set("agency_name", e.target.value)}
                  placeholder="TAARA Talent Management"
                  className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-[12px] font-semibold">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input value={f("agency_location")} onChange={e => set("agency_location", e.target.value)}
                  placeholder="Mumbai, India"
                  className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-[12px] font-semibold">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input value={f("phone")} onChange={e => set("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-[12px] font-semibold">Years of Experience</Label>
              <Input type="number" min={0} max={50}
                value={f("years_experience")} onChange={e => set("years_experience", parseInt(e.target.value) || 0)}
                placeholder="5" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-[12px] font-semibold">Specialisation</Label>
              <Select value={f("specialisation")} onValueChange={v => set("specialisation", v)}>
                <SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>{SPECIALISATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="font-body text-[12px] font-semibold">Bio</Label>
              <Textarea value={f("bio")} onChange={e => set("bio", e.target.value)}
                rows={3} placeholder="Tell clients a bit about yourself and your agency…"
                className="font-body text-[13px] rounded-xl bg-background border-border resize-none" />
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {[
              { icon: Building2, label: "Agency", value: profile?.agency_name },
              { icon: MapPin, label: "Location", value: profile?.agency_location },
              { icon: Phone, label: "Phone", value: profile?.phone },
              { icon: Briefcase, label: "Specialisation", value: profile?.specialisation },
              { icon: User, label: "Experience", value: profile?.years_experience ? `${profile.years_experience} years` : null },
            ].map(({ icon: Icon, label, value }) => value ? (
              <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground font-body">{label}</p>
                  <p className="text-[13px] font-body font-medium">{value}</p>
                </div>
              </div>
            ) : null)}
            {profile?.bio && (
              <div className="px-5 py-4">
                <p className="text-[11px] text-muted-foreground font-body mb-1">Bio</p>
                <p className="text-[13px] font-body leading-relaxed text-foreground/80">{profile.bio}</p>
              </div>
            )}
            {!profile?.agency_name && !profile?.phone && !profile?.bio && !editing && (
              <div className="px-5 py-8 text-center">
                <p className="text-[13px] text-muted-foreground font-body mb-2">No professional details added yet.</p>
                <Button onClick={startEditing} size="sm" variant="outline" className="h-8 rounded-xl font-body text-[12px] border-border">
                  <Edit2 className="h-3 w-3 mr-1.5" /> Add details
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Online Presence ────────────────────────────────── */}
      <div className="glass-card overflow-hidden mb-6">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="font-display text-base font-bold">Online Presence</h3>
        </div>
        {editing ? (
          <div className="p-5 space-y-3">
            <div className="space-y-1.5">
              <Label className="font-body text-[12px] font-semibold">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input value={f("website")} onChange={e => set("website", e.target.value)}
                  placeholder="https://youragency.com"
                  className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-[12px] font-semibold">Instagram</Label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input value={f("instagram")} onChange={e => set("instagram", e.target.value)}
                  placeholder="@youragency"
                  className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-[12px] font-semibold">LinkedIn</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input value={f("linkedin")} onChange={e => set("linkedin", e.target.value)}
                  placeholder="linkedin.com/in/yourname"
                  className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border" />
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {[
              { icon: Globe, label: "Website", value: profile?.website, href: profile?.website },
              { icon: Instagram, label: "Instagram", value: profile?.instagram },
              { icon: Linkedin, label: "LinkedIn", value: profile?.linkedin },
            ].map(({ icon: Icon, label, value, href }) => value ? (
              <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground font-body">{label}</p>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer"
                      className="text-[13px] font-body font-medium text-primary hover:underline">{value}</a>
                  ) : (
                    <p className="text-[13px] font-body font-medium">{value}</p>
                  )}
                </div>
              </div>
            ) : null)}
            {!profile?.website && !profile?.instagram && !profile?.linkedin && !editing && (
              <div className="px-5 py-6 text-center">
                <p className="text-[13px] text-muted-foreground font-body">No social links added yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Join Agency Request ── */}
      <JoinAgencySection user={user} profile={profile} />

    </div>
  );
}

// ── Join Agency Section ────────────────────────────────────────
// Shown when manager is not under any active agency (removed),
// lets them request to join another agency by entering admin email.

function JoinAgencySection({ user, profile }: { user: any; profile: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [adminEmail, setAdminEmail] = useState("");
  const [message,    setMessage]    = useState("");
  const [busy,       setBusy]       = useState(false);
  const [err,        setErr]        = useState("");
  const [ok,         setOk]         = useState("");

  // Check if this manager is under an active agency
  const { data: tmRecord } = useQuery({
    queryKey: ["my-tm-record", user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data } = await supabase
        .from("talent_managers")
        .select("id, is_active, admin_id")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  // My existing pending/approved requests
  const { data: myRequests = [] } = useQuery({
    queryKey: ["my-join-requests", user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await supabase
        .from("join_requests")
        .select("id, status, target_admin_id, created_at")
        .eq("manager_user_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setOk("");
    if (!adminEmail.trim()) { setErr("Enter the admin's email."); return; }
    setBusy(true);
    try {
      // Look up admin by email
      const { data: adminProf } = await supabase
        .from("admin_profiles")
        .select("id, agency_name")
        .eq("email", adminEmail.toLowerCase().trim())
        .maybeSingle();

      if (!adminProf) throw new Error("No admin found with that email. Ask your agency admin for their registered email.");

      // Check for duplicate pending request
      const alreadySent = myRequests.some(
        (r: any) => r.target_admin_id === adminProf.id && r.status === "pending"
      );
      if (alreadySent) throw new Error("You already have a pending request to this agency.");

      const { error } = await supabase.from("join_requests").insert({
        manager_user_id: user.id,
        manager_name:    profile?.full_name || user.email,
        manager_email:   user.email,
        manager_phone:   profile?.phone || null,
        target_admin_id: adminProf.id,
        message:         message.trim() || null,
        status:          "pending",
      });
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ["my-join-requests", user?.id] });
      setOk(`Request sent to ${adminProf.agency_name}! They will review and approve it.`);
      setAdminEmail(""); setMessage("");
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong.");
    } finally { setBusy(false); }
  };

  // Only show this section if manager has no active agency
  const hasActiveAgency = tmRecord?.is_active === true;
  if (hasActiveAgency) return null;

  return (
    <div className="glass-card overflow-hidden mt-4">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-display text-base font-bold">Request to Join an Agency</h3>
        <p className="text-[12px] text-muted-foreground font-body mt-0.5">
          Enter the admin's email to send a join request to their agency.
        </p>
      </div>

      {/* Existing requests */}
      {myRequests.length > 0 && (
        <div className="px-5 py-3 border-b border-border space-y-2">
          <p className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wide">Your Requests</p>
          {myRequests.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between">
              <span className="text-[12px] font-body text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
              <span className={`text-[11px] font-body font-semibold px-2.5 py-0.5 rounded-full ${
                r.status === "pending"  ? "bg-amber-100 text-amber-700" :
                r.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                "bg-muted text-muted-foreground"
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleRequest} className="px-5 py-4 space-y-3">
        {err && (
          <div className="px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
            <p className="text-[12px] font-body text-destructive">{err}</p>
          </div>
        )}
        {ok && (
          <div className="px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-[12px] font-body text-emerald-700">{ok}</p>
          </div>
        )}
        <div className="space-y-1.5">
          <label className="font-body text-[12px] font-semibold">Admin Email</label>
          <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
            placeholder="admin@agency.com" type="email"
            className="w-full h-10 px-3 rounded-xl border border-border bg-background font-body text-[13px] outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="space-y-1.5">
          <label className="font-body text-[12px] font-semibold">Message (optional)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Briefly introduce yourself…" rows={2}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background font-body text-[13px] outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
        </div>
        <button type="submit" disabled={busy}
          className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-body text-[13px] font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
          {busy && <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
          Send Join Request
        </button>
      </form>
    </div>
  );
}
