import { useState, useRef } from "react";
import { X, Plus, Upload, Loader2, Trash2, Save, Film, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUpdateActor, useCreateFilmographyEntry, useDeleteFilmographyEntry, useCreateWork, useDeleteWork } from "@/hooks/use-data";
import { useUpload } from "@/hooks/use-upload";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface EditActorModalProps {
  actor: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];
const FILM_TYPES = ["Film","TV Series","Short","Theatre","Web Series","Commercial"];
const WORK_STATUSES = ["Released","Post-Production","In Production","Upcoming"];

export function EditActorModal({ actor, open, onOpenChange }: EditActorModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const updateActor = useUpdateActor();
  const createFilmEntry = useCreateFilmographyEntry();
  const deleteFilmEntry = useDeleteFilmographyEntry();
  const createWork = useCreateWork();
  const deleteWork = useDeleteWork();
  const { upload: uploadHeadshot, uploading: uploadingHeadshot } = useUpload("headshots");
  const { upload: uploadPortfolio, uploading: uploadingPortfolio } = useUpload("portfolio");
  const headshotRef = useRef<HTMLInputElement>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);

  // Basic
  const [name, setName] = useState(actor.name || "");
  const [age, setAge] = useState(String(actor.age || ""));
  const [gender, setGender] = useState(actor.gender || "");
  const [type, setType] = useState(actor.type || "");
  const [status, setStatus] = useState(actor.status || "Available");
  const [location, setLocation] = useState(actor.location || "");
  const [color, setColor] = useState(actor.color || "#6366f1");
  const [profileVisible, setProfileVisible] = useState(actor.profile_visible ?? true);

  // Physical
  const [height, setHeight] = useState(actor.height || "");
  const [hair, setHair] = useState(actor.hair || "");
  const [eyes, setEyes] = useState(actor.eyes || "");

  // Bio
  const [bio, setBio] = useState(actor.bio || "");
  // Multiple reel URLs — use reel_urls array, fall back to reel_url for old data
  const [reelUrls, setReelUrls] = useState<string[]>(
    actor.reel_urls?.length > 0
      ? actor.reel_urls
      : actor.reel_url
      ? [actor.reel_url]
      : [""]
  );
  const addReelUrl = () => setReelUrls(prev => [...prev, ""]);
  const removeReelUrl = (i: number) => setReelUrls(prev => prev.filter((_, idx) => idx !== i));
  const updateReelUrl = (i: number, val: string) => setReelUrls(prev => prev.map((u, idx) => idx === i ? val : u));
  const [managerNotes, setManagerNotes] = useState(actor.manager_notes || "");

  // Tags
  const [languages, setLanguages] = useState<string[]>(actor.languages || []);
  const [skills, setSkills] = useState<string[]>(actor.skills || []);
  const [accents, setAccents] = useState<string[]>(actor.accents || []);
  const [langInput, setLangInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [accentInput, setAccentInput] = useState("");

  // Photos
  const [headshotUrl, setHeadshotUrl] = useState(actor.headshot_url || "");
  const [portfolio, setPortfolio] = useState<any[]>(actor.portfolio || []);

  // Filmography — live from actor.filmography
  const [filmography, setFilmography] = useState<any[]>(actor.filmography || []);
  const [newFilm, setNewFilm] = useState({ title: "", role: "", year: "", type: "Film" });
  const [addingFilm, setAddingFilm] = useState(false);

  // Works — live from actor.works
  const [works, setWorks] = useState<any[]>(actor.works || []);
  const [newWork, setNewWork] = useState({ project_name: "", role: "", director: "", year: "", type: "Film", status: "Upcoming", description: "" });
  const [addingWork, setAddingWork] = useState(false);

  const [contactPhone, setContactPhone] = useState(actor.contact_phone || "");
  const [contactEmail, setContactEmail] = useState(actor.contact_email || "");
  const [saving, setSaving] = useState(false);

  const addTag = (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
    const t = input.trim(); if (t && !list.includes(t)) setList([...list, t]); setInput("");
  };
  const removeTag = (list: string[], setList: (v: string[]) => void, item: string) => setList(list.filter(i => i !== item));

  const handleHeadshotUpload = async (file: File) => {
    try {
      const result = await uploadHeadshot(file);
      setHeadshotUrl(result.url);
      toast({ title: "Headshot uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const handlePortfolioUpload = async (file: File) => {
    const validTypes = ["image/jpeg","image/jpg","image/png","image/webp"];
    if (!validTypes.includes(file.type)) { toast({ title: "Only JPG, PNG, or WEBP allowed", variant: "destructive" }); return; }
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Max 10 MB", variant: "destructive" }); return; }
    try {
      const result = await uploadPortfolio(file);
      const newItem = { id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, ""), category: "Headshot", image_url: result.url, imageUrl: result.url };
      await supabase.from("portfolio").insert({ actor_id: actor.id, user_id: user!.id, title: newItem.title, category: newItem.category, image_url: result.url });
      setPortfolio(prev => [...prev, newItem]);
      toast({ title: "Photo added!" });
      qc.invalidateQueries({ queryKey: ["actor", actor.id] });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const removePortfolioItem = async (item: any) => {
    try {
      if (item.id) await supabase.from("portfolio").delete().eq("id", item.id);
      setPortfolio(prev => prev.filter(p => p.id !== item.id));
      qc.invalidateQueries({ queryKey: ["actor", actor.id] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddFilm = async () => {
    if (!newFilm.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setAddingFilm(true);
    try {
      const entry = await createFilmEntry.mutateAsync({
        actor_id: actor.id,
        title: newFilm.title,
        role: newFilm.role,
        year: newFilm.year ? parseInt(newFilm.year) : undefined,
        type: newFilm.type as any,
      });
      setFilmography(prev => [...prev, entry]);
      setNewFilm({ title: "", role: "", year: "", type: "Film" });
      toast({ title: "Filmography entry added!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setAddingFilm(false); }
  };

  const handleDeleteFilm = async (entry: any) => {
    try {
      await deleteFilmEntry.mutateAsync({ id: entry.id, actorId: actor.id });
      setFilmography(prev => prev.filter(f => f.id !== entry.id));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddWork = async () => {
    if (!newWork.project_name.trim()) { toast({ title: "Project name is required", variant: "destructive" }); return; }
    setAddingWork(true);
    try {
      const work = await createWork.mutateAsync({
        actor_id: actor.id,
        project_name: newWork.project_name,
        role: newWork.role,
        director: newWork.director,
        year: newWork.year ? parseInt(newWork.year) : undefined,
        type: newWork.type as any,
        status: newWork.status as any,
        description: newWork.description,
      });
      setWorks(prev => [...prev, work]);
      setNewWork({ project_name: "", role: "", director: "", year: "", type: "Film", status: "Upcoming", description: "" });
      toast({ title: "Work entry added!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setAddingWork(false); }
  };

  const handleDeleteWork = async (work: any) => {
    try {
      await deleteWork.mutateAsync({ id: work.id, actorId: actor.id });
      setWorks(prev => prev.filter(w => w.id !== work.id));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await updateActor.mutateAsync({
        id: actor.id, name, age: age ? parseInt(age) : undefined,
        gender: gender as any, type: type as any, status: status as any,
        location, height, hair, eyes, bio,
        reel_url: reelUrls.filter(Boolean)[0] || "", // keep first for backward compat
        reel_urls: reelUrls.filter(Boolean),
        profile_visible: profileVisible,
        headshot_url: headshotUrl, languages, skills, accents,
        manager_notes: managerNotes, color,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
      });
      toast({ title: "Profile saved!" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Edit — {actor.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-2">
          <TabsList className="w-full justify-start bg-accent/50 rounded-xl p-1 h-auto mb-4 flex-wrap gap-1">
            {[
              { value: "basic", label: "Basic Info" },
              { value: "appearance", label: "Appearance" },
              { value: "bio", label: "Bio & Skills" },
              { value: "photos", label: "Photos" },
              { value: "filmography", label: `Filmography (${filmography.length})` },
              { value: "works", label: `Works (${works.length})` },
              { value: "contact", label: "Contact" },
              { value: "notes", label: "Notes" },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value}
                className="font-body text-[12px] font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Basic ── */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Name *"><Input value={name} onChange={e => setName(e.target.value)} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
              <FieldGroup label="Age"><Input type="number" value={age} onChange={e => setAge(e.target.value)} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
              <FieldGroup label="Gender">
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Male","Female","Non-Binary"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Actor Type">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Lead","Character","Emerging","Supporting"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Status">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Available","Booked","On Hold"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Location"><Input value={location} onChange={e => setLocation(e.target.value)} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-border">
              <div>
                <p className="text-[13px] font-body font-semibold">Public profile</p>
                <p className="text-[11px] text-muted-foreground font-body">Visible via share link</p>
              </div>
              <Switch checked={profileVisible} onCheckedChange={setProfileVisible} />
            </div>
            <div>
              <Label className="font-body text-[12px] font-semibold block mb-2">Profile colour</Label>
              <div className="flex gap-2">{COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"}`} style={{ backgroundColor: c }} />)}</div>
            </div>
          </TabsContent>

          {/* ── Appearance ── */}
          <TabsContent value="appearance" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="Height"><Input value={height} onChange={e => setHeight(e.target.value)} placeholder="5'7&quot;" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
              <FieldGroup label="Hair"><Input value={hair} onChange={e => setHair(e.target.value)} placeholder="Black" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
              <FieldGroup label="Eyes"><Input value={eyes} onChange={e => setEyes(e.target.value)} placeholder="Brown" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
            </div>
            <TagInput label="Languages" tags={languages} input={langInput} setInput={setLangInput} onAdd={() => addTag(languages, setLanguages, langInput, setLangInput)} onRemove={t => removeTag(languages, setLanguages, t)} placeholder="e.g. Hindi" />
            <TagInput label="Skills" tags={skills} input={skillInput} setInput={setSkillInput} onAdd={() => addTag(skills, setSkills, skillInput, setSkillInput)} onRemove={t => removeTag(skills, setSkills, t)} placeholder="e.g. Classical Dance" />
            <TagInput label="Accents" tags={accents} input={accentInput} setInput={setAccentInput} onAdd={() => addTag(accents, setAccents, accentInput, setAccentInput)} onRemove={t => removeTag(accents, setAccents, t)} placeholder="e.g. British RP" />
          </TabsContent>

          {/* ── Bio ── */}
          <TabsContent value="bio" className="space-y-4">
            <FieldGroup label="Biography"><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={5} className="font-body text-[13px] rounded-xl bg-background border-border resize-none" /></FieldGroup>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-body text-[12px] font-semibold">Showreel / Demo Reel URLs</Label>
                <button type="button" onClick={addReelUrl} className="text-[11px] font-body text-primary hover:underline flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add another
                </button>
              </div>
              {reelUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={url}
                    onChange={e => updateReelUrl(i, e.target.value)}
                    placeholder={`https://vimeo.com/reel-${i + 1}`}
                    className="font-body text-[13px] rounded-xl h-10 bg-background border-border flex-1"
                  />
                  {reelUrls.length > 1 && (
                    <button type="button" onClick={() => removeReelUrl(i)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground font-body">YouTube, Vimeo, or any direct link. Add multiple reels.</p>
            </div>
          </TabsContent>

          {/* ── Photos ── */}
          <TabsContent value="photos" className="space-y-5">
            <div>
              <Label className="font-body text-[12px] font-semibold block mb-2">Headshot / Profile photo</Label>
              <input ref={headshotRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleHeadshotUpload(f); }} />
              {headshotUrl ? (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-border"><img src={headshotUrl} alt="Headshot" className="w-full h-full object-cover" /></div>
                  <div className="space-y-2">
                    <button onClick={() => headshotRef.current?.click()} disabled={uploadingHeadshot} className="text-[12px] font-body text-primary hover:underline block">{uploadingHeadshot ? "Uploading…" : "Change headshot"}</button>
                    <button onClick={() => setHeadshotUrl("")} className="text-[12px] font-body text-destructive hover:underline block">Remove</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => headshotRef.current?.click()} disabled={uploadingHeadshot} className="w-full border border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground">
                  {uploadingHeadshot ? <><Loader2 className="h-5 w-5 animate-spin" /><span className="text-[12px] font-body">Uploading…</span></> : <><Upload className="h-5 w-5" /><span className="text-[12px] font-body font-medium">Upload headshot from device</span><span className="text-[11px] font-body">JPG, PNG, WEBP · max 10 MB</span></>}
                </button>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="font-body text-[12px] font-semibold">Portfolio photos ({portfolio.length})</Label>
                <div>
                  <input ref={portfolioRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple className="hidden" onChange={e => { Array.from(e.target.files || []).forEach(f => handlePortfolioUpload(f)); }} />
                  <Button variant="outline" size="sm" onClick={() => portfolioRef.current?.click()} disabled={uploadingPortfolio} className="h-8 text-[12px] font-body rounded-xl border-border">
                    {uploadingPortfolio ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}Add photos
                  </Button>
                </div>
              </div>
              {portfolio.length === 0 ? (
                <button onClick={() => portfolioRef.current?.click()} className="w-full border border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground">
                  <Upload className="h-5 w-5" /><span className="text-[12px] font-body font-medium">Upload portfolio photos</span><span className="text-[11px] font-body">Select multiple photos at once</span>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {portfolio.map(item => (
                    <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border">
                      <img src={item.image_url || item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => removePortfolioItem(item)} className="p-1.5 rounded-lg bg-destructive text-white"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Filmography ── */}
          <TabsContent value="filmography" className="space-y-4">
            <p className="text-[12px] text-muted-foreground font-body">Add film, TV, theatre, and short credits. Each entry is saved immediately.</p>

            {/* Existing entries */}
            {filmography.length > 0 && (
              <div className="space-y-2">
                {filmography.map((entry: any) => (
                  <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border group">
                    <Clapperboard className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-body font-semibold truncate">{entry.title}</p>
                      <p className="text-[11px] text-muted-foreground font-body">{entry.role && `${entry.role} · `}{entry.year && `${entry.year} · `}{entry.type}</p>
                    </div>
                    <button onClick={() => handleDeleteFilm(entry)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new entry */}
            <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
              <p className="text-[12px] font-body font-semibold text-muted-foreground">Add new entry</p>
              <div className="grid grid-cols-2 gap-3">
                <Input value={newFilm.title} onChange={e => setNewFilm(f => ({ ...f, title: e.target.value }))} placeholder="Project title *" className="font-body text-[13px] rounded-xl h-9 bg-background border-border" />
                <Input value={newFilm.role} onChange={e => setNewFilm(f => ({ ...f, role: e.target.value }))} placeholder="Role" className="font-body text-[13px] rounded-xl h-9 bg-background border-border" />
                <Input value={newFilm.year} onChange={e => setNewFilm(f => ({ ...f, year: e.target.value }))} placeholder="Year" type="number" className="font-body text-[13px] rounded-xl h-9 bg-background border-border" />
                <Select value={newFilm.type} onValueChange={v => setNewFilm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="font-body text-[13px] rounded-xl h-9 bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{FILM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddFilm} disabled={addingFilm || !newFilm.title.trim()} size="sm" className="h-9 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                {addingFilm ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}Add Entry
              </Button>
            </div>
          </TabsContent>

          {/* ── Works ── */}
          <TabsContent value="works" className="space-y-4">
            <p className="text-[12px] text-muted-foreground font-body">Add notable projects with full credits. Each entry is saved immediately.</p>

            {/* Existing works */}
            {works.length > 0 && (
              <div className="space-y-2">
                {works.map((work: any) => (
                  <div key={work.id} className="flex items-start gap-3 p-3 rounded-xl bg-accent/30 border border-border group">
                    <Film className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-body font-semibold truncate">{work.project_name || work.projectName}</p>
                      <p className="text-[11px] text-muted-foreground font-body">{work.role && `${work.role} · `}{work.director && `Dir. ${work.director} · `}{work.year && `${work.year} · `}{work.status}</p>
                      {work.description && <p className="text-[11px] text-muted-foreground font-body mt-0.5 line-clamp-1">{work.description}</p>}
                    </div>
                    <button onClick={() => handleDeleteWork(work)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new work */}
            <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
              <p className="text-[12px] font-body font-semibold text-muted-foreground">Add new work</p>
              <div className="grid grid-cols-2 gap-3">
                <Input value={newWork.project_name} onChange={e => setNewWork(w => ({ ...w, project_name: e.target.value }))} placeholder="Project name *" className="font-body text-[13px] rounded-xl h-9 bg-background border-border" />
                <Input value={newWork.role} onChange={e => setNewWork(w => ({ ...w, role: e.target.value }))} placeholder="Role" className="font-body text-[13px] rounded-xl h-9 bg-background border-border" />
                <Input value={newWork.director} onChange={e => setNewWork(w => ({ ...w, director: e.target.value }))} placeholder="Director" className="font-body text-[13px] rounded-xl h-9 bg-background border-border" />
                <Input value={newWork.year} onChange={e => setNewWork(w => ({ ...w, year: e.target.value }))} placeholder="Year" type="number" className="font-body text-[13px] rounded-xl h-9 bg-background border-border" />
                <Select value={newWork.type} onValueChange={v => setNewWork(w => ({ ...w, type: v }))}>
                  <SelectTrigger className="font-body text-[13px] rounded-xl h-9 bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{FILM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={newWork.status} onValueChange={v => setNewWork(w => ({ ...w, status: v }))}>
                  <SelectTrigger className="font-body text-[13px] rounded-xl h-9 bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{WORK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Textarea value={newWork.description} onChange={e => setNewWork(w => ({ ...w, description: e.target.value }))} placeholder="Brief description (optional)" rows={2} className="font-body text-[13px] rounded-xl bg-background border-border resize-none" />
              <Button onClick={handleAddWork} disabled={addingWork || !newWork.project_name.trim()} size="sm" className="h-9 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                {addingWork ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}Add Work
              </Button>
            </div>
          </TabsContent>

          {/* ── Contact Info — manager only ── */}
          <TabsContent value="contact" className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-[12px] font-body text-amber-800">
              <span className="text-base leading-none mt-0.5">🔒</span>
              <span>Contact info is <strong>private</strong> — visible only to you. Never included in shared profile links or shortlists.</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Contact Phone">
                <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210" type="tel"
                  className="font-body text-[13px] rounded-xl h-10 bg-background border-border" />
              </FieldGroup>
              <FieldGroup label="Contact Email">
                <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                  placeholder="actor@email.com"
                  className="font-body text-[13px] rounded-xl h-10 bg-background border-border" />
              </FieldGroup>
            </div>
          </TabsContent>

          {/* ── Manager Notes ── */}
          <TabsContent value="notes" className="space-y-4">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-[12px] font-body text-muted-foreground">
              Private notes visible only to you — never shared via profile links.
            </div>
            <FieldGroup label="Manager notes">
              <Textarea value={managerNotes} onChange={e => setManagerNotes(e.target.value)} rows={6}
                placeholder="Internal notes, reminders, observations…"
                className="font-body text-[13px] rounded-xl bg-background border-border resize-none" />
            </FieldGroup>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 rounded-xl font-body text-[13px] border-border">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="h-10 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-body text-[12px] font-semibold text-foreground">{label}</Label>
      {children}
    </div>
  );
}

function TagInput({ label, tags, input, setInput, onAdd, onRemove, placeholder }: {
  label: string; tags: string[]; input: string; setInput: (v: string) => void;
  onAdd: () => void; onRemove: (t: string) => void; placeholder: string;
}) {
  return (
    <div>
      <Label className="font-body text-[12px] font-semibold block mb-2">{label}</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="text-[11px] px-3 py-1.5 rounded-full bg-primary/10 text-primary font-body font-medium flex items-center gap-1.5">
            {tag}<button onClick={() => onRemove(tag)}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), onAdd())} placeholder={placeholder} className="font-body text-[13px] rounded-xl h-9 bg-background border-border" />
        <Button variant="outline" size="sm" onClick={onAdd} className="h-9 rounded-xl border-border"><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
