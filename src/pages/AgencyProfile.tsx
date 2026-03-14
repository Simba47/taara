import { useParams } from "react-router-dom";
import { MapPin, Mail, Phone, Globe, Users, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusVariant } from "@/lib/helpers";
import { useAuth } from "@/contexts/AuthContext";
import { useActors } from "@/hooks/use-data";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

function useAgencyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["agency", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("agency_profile").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });
}

function useSaveAgencyProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: any) => {
      const { data, error } = await supabase.from("agency_profile").upsert({ ...profile, user_id: user!.id }, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agency"] }),
  });
}

const AgencyProfile = () => {
  const { data: agency, isLoading: agencyLoading } = useAgencyProfile();
  const { data: actors = [], isLoading: actorsLoading } = useActors();
  const saveProfile = useSaveAgencyProfile();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);

  const publicActors = actors.filter((a) => a.profile_visible);

  const [form, setForm] = useState({
    name: "", about: "", contact_email: "", contact_phone: "", website: "", location: "", founded_year: "",
  });

  const startEdit = () => {
    setForm({
      name: agency?.name || "",
      about: agency?.about || "",
      contact_email: agency?.contact_email || "",
      contact_phone: agency?.contact_phone || "",
      website: agency?.website || "",
      location: agency?.location || "",
      founded_year: agency?.founded_year ? String(agency.founded_year) : "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await saveProfile.mutateAsync({ ...form, founded_year: form.founded_year ? parseInt(form.founded_year) : null });
      toast({ title: "Profile saved!" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (agencyLoading) return (
    <div className="min-h-screen bg-background"><div className="max-w-[900px] mx-auto px-8 py-12 space-y-6">
      <Skeleton className="h-16 w-16 rounded-lg" /><Skeleton className="h-10 w-64" /><Skeleton className="h-24 w-full" />
    </div></div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[900px] mx-auto px-8 py-12 animate-fade-in">

        {/* Agency header */}
        <div className="mb-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-16 h-16 rounded-lg bg-card border border-border flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            {!editing && (
              <Button variant="outline" size="sm" className="h-9 text-[12px] font-body font-medium rounded-xl border-border" onClick={startEdit}>
                Edit Profile
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Agency Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
                <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Location</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
                <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Contact Email</Label>
                  <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
                <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Phone</Label>
                  <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
                <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Website</Label>
                  <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
                <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Founded Year</Label>
                  <Input type="number" value={form.founded_year} onChange={e => setForm(f => ({ ...f, founded_year: e.target.value }))} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
              </div>
              <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">About</Label>
                <Textarea value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} rows={4} className="font-body text-[13px] rounded-xl bg-background border-border resize-none" /></div>
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saveProfile.isPending} className="h-9 font-body text-[13px] font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">Save Profile</Button>
                <Button variant="outline" size="sm" className="h-9 font-body text-[13px] rounded-xl border-border" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : !agency ? (
            <div className="glass-card p-8 text-center">
              <p className="text-[13px] text-muted-foreground font-body mb-3">Set up your agency profile to showcase your talent.</p>
              <Button onClick={startEdit} className="h-9 font-body text-[13px] font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">Set Up Profile</Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-4xl font-bold tracking-tight mb-2">{agency.name}</h1>
              <div className="flex items-center gap-4 text-[13px] text-muted-foreground font-body mb-4">
                {agency.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {agency.location}</span>}
                {agency.founded_year && <span>Est. {agency.founded_year}</span>}
              </div>
              {agency.about && <p className="text-[14px] text-foreground/80 font-body leading-relaxed max-w-[600px]">{agency.about}</p>}
            </>
          )}
        </div>

        {/* Contact */}
        {agency && !editing && (
          <div className="bg-card border border-border rounded-lg p-5 mb-8">
            <h2 className="font-body text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Contact</h2>
            <div className="flex items-center gap-6 text-[13px] font-body flex-wrap">
              {agency.contact_email && <a href={`mailto:${agency.contact_email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"><Mail className="h-3.5 w-3.5" /> {agency.contact_email}</a>}
              {agency.contact_phone && <a href={`tel:${agency.contact_phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"><Phone className="h-3.5 w-3.5" /> {agency.contact_phone}</a>}
              {agency.website && <a href={agency.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"><Globe className="h-3.5 w-3.5" /> Website</a>}
            </div>
          </div>
        )}

        {/* Talent */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Our Talent</h2>
            <span className="text-[12px] text-muted-foreground font-body">{publicActors.length} profiles</span>
          </div>
          {actorsLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : publicActors.length === 0 ? (
            <p className="text-[13px] text-muted-foreground font-body">No public talent profiles yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {publicActors.map((actor) => (
                <a key={actor.id} href={`/profile/${actor.slug}`} className="bg-card border border-border rounded-lg p-5 hover:border-muted-foreground/30 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-[14px] font-display font-bold" style={{ backgroundColor: (actor.color || "#6366f1") + "20", color: actor.color || "#6366f1" }}>
                      {actor.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-body text-[14px] font-semibold">{actor.name}</h3>
                        <Badge variant={getStatusVariant(actor.status)} className="text-[9px]">{actor.status}</Badge>
                      </div>
                      <p className="text-[12px] text-muted-foreground font-body mb-2">{actor.age && `${actor.age}y · `}{actor.type}{actor.location && ` · ${actor.location}`}</p>
                      <div className="flex flex-wrap gap-1">
                        {(actor.skills || []).slice(0, 3).map((skill: string) => (
                          <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground font-body">{skill}</span>
                        ))}
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-[11px] text-muted-foreground font-body">Powered by TAARA</p>
        </div>
      </div>
    </div>
  );
};

export default AgencyProfile;
