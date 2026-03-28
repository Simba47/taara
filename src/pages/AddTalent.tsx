// ─────────────────────────────────────────────────────────────
// ADD TALENT — Full step-by-step form matching the invite flow
// Manager-side: includes contact info, photo upload, filmography
// ─────────────────────────────────────────────────────────────
import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, X, Save, Loader2, ChevronRight, ChevronLeft,
  User, Ruler, Languages, FileText, Camera, Clapperboard,
  Phone, CheckCircle2, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useCreateActor, useCreateFilmographyEntry } from "@/hooks/use-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

const steps = [
  { id: "basic",       label: "Basic Info",        icon: User },
  { id: "physical",    label: "Appearance",         icon: Ruler },
  { id: "skills",      label: "Skills & Languages", icon: Languages },
  { id: "bio",         label: "Bio & Reels",        icon: FileText },
  { id: "contact",     label: "Contact",            icon: Phone },
  { id: "filmography", label: "Filmography",        icon: Clapperboard },
  { id: "photos",      label: "Photos",             icon: Camera },
];

interface FilmEntry { id: string; title: string; role: string; year: string; type: string; }
interface PhotoEntry { id: string; imageUrl: string; uploading: boolean; }

const AddTalent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const createActor = useCreateActor();
  const createFilm = useCreateFilmographyEntry();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Basic
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("Available");
  const [location, setLocation] = useState("");
  const [profileVisible, setProfileVisible] = useState(true);

  // Physical
  const [height, setHeight] = useState("");
  const [hair, setHair] = useState("");
  const [eyes, setEyes] = useState("");

  // Skills
  const [languages, setLanguages] = useState<string[]>([]);
  const [langInput, setLangInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [accents, setAccents] = useState<string[]>([]);
  const [accentInput, setAccentInput] = useState("");

  // Bio
  const [bio, setBio] = useState("");
  const [reelUrls, setReelUrls] = useState<string[]>([""]);

  // Contact (manager-private)
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [managerNotes, setManagerNotes] = useState("");

  // Filmography
  const [filmography, setFilmography] = useState<FilmEntry[]>([]);

  // Photos
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [headshot, setHeadshot] = useState<string>("");
  const [headshotUploading, setHeadshotUploading] = useState(false);

  // ── Helpers ──────────────────────────────────────────────
  const addTag = (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
    const t = input.trim();
    if (t && !list.includes(t)) setList([...list, t]);
    setInput("");
  };
  const removeTag = (list: string[], setList: (v: string[]) => void, item: string) =>
    setList(list.filter(i => i !== item));

  const addFilm = () => setFilmography(f => [...f, { id: crypto.randomUUID(), title: "", role: "", year: "", type: "Film" }]);
  const updateFilm = (id: string, k: keyof FilmEntry, v: string) =>
    setFilmography(f => f.map(e => e.id === id ? { ...e, [k]: v } : e));
  const removeFilm = (id: string) => setFilmography(f => f.filter(e => e.id !== id));

  const uploadImage = async (file: File, bucket: "headshots" | "portfolio"): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const handleHeadshotUpload = async (file: File) => {
    setHeadshotUploading(true);
    try {
      const url = await uploadImage(file, "headshots");
      setHeadshot(url);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setHeadshotUploading(false); }
  };

  const addPhoto = () => setPhotos(p => [...p, { id: crypto.randomUUID(), imageUrl: "", uploading: false }]);
  const removePhoto = (id: string) => setPhotos(p => p.filter(e => e.id !== id));

  const handlePhotoUpload = async (id: string, file: File) => {
    setPhotos(p => p.map(e => e.id === id ? { ...e, uploading: true } : e));
    try {
      const url = await uploadImage(file, "portfolio");
      setPhotos(p => p.map(e => e.id === id ? { ...e, imageUrl: url, uploading: false } : e));
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
      setPhotos(p => p.map(e => e.id === id ? { ...e, uploading: false } : e));
    }
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim() || !gender || !type) {
      toast({ title: "Name, gender and type are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const actor = await createActor.mutateAsync({
        name: name.trim(),
        age: age ? parseInt(age) : undefined,
        gender: gender as any,
        type: type as any,
        status: status as any,
        location: location || undefined,
        height: height || undefined,
        hair: hair || undefined,
        eyes: eyes || undefined,
        bio: bio || undefined,
        reel_url: reelUrls.find(u => u.trim()) || undefined,
        reel_urls: reelUrls.filter(u => u.trim()),
        headshot_url: headshot || undefined,
        profile_visible: profileVisible,
        languages,
        skills,
        accents,
        manager_notes: managerNotes || undefined,
        contact_phone: contactPhone || undefined,
        contact_email: contactEmail || undefined,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        profile_completeness: 50,
      });
      
      if (!actor?.id) throw new Error("Actor was not saved correctly. Please try again.");

      // Insert filmography entries one by one
      for (const f of filmography.filter(f => f.title.trim())) {
        try {
          await createFilm.mutateAsync({
            actor_id: actor.id,
            title: f.title.trim(),
            role: f.role || undefined,
            year: f.year ? parseInt(f.year) : undefined,
            type: f.type || "Film",
          });
        } catch (filmErr: any) {
          console.warn("Filmography entry failed:", filmErr.message);
        }
      }

      // Insert portfolio photos
      const validPhotos = photos.filter(p => p.imageUrl.trim());
      if (validPhotos.length > 0) {
        const portfolioRows = validPhotos.map((p, i) => ({
          actor_id: actor.id,
          user_id: user!.id,
          title: `Photo ${i + 1}`,
          category: "Headshot",   // DB CHECK constraint: must be one of Headshot/Behind the Scenes/Editorial/Character Look
          image_url: p.imageUrl,
        }));
        const { error: portfolioError } = await supabase
          .from("portfolio")
          .insert(portfolioRows);
        if (portfolioError) {
          toast({
            title: `${name} added! But portfolio photos had an issue`,
            description: portfolioError.message,
            variant: "destructive",
          });
          navigate("/roster");
          return;
        }
      }

      toast({ title: `${name} added to roster!` });
      navigate("/roster");
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const pct = Math.round(((step + 1) / steps.length) * 100);
  const canNext = step !== 0 || (name.trim().length > 0 && gender.length > 0 && type.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/roster" className="text-[12px] text-muted-foreground hover:text-primary font-body font-medium transition-colors shrink-0">
              ← Roster
            </Link>
            <div className="hidden sm:block">
              <h1 className="font-display text-base font-bold leading-tight">Add Talent</h1>
              <p className="text-[11px] text-muted-foreground font-body">Step {step + 1} of {steps.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[12px] font-body text-muted-foreground hidden sm:block">Step {step + 1}/{steps.length}</span>
            <Progress value={pct} className="w-24 h-2" />
          </div>
        </div>
      </div>

      {/* Step tabs */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 pt-5">
        <div className="flex items-center gap-1 overflow-x-auto pb-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-body font-medium whitespace-nowrap transition-all ${
                  i === step ? "bg-primary text-primary-foreground shadow-sm"
                  : i < step ? "bg-emerald-500/10 text-emerald-700"
                  : "text-muted-foreground/60"
                }`}>
                <Icon className="h-3 w-3" strokeWidth={1.5} />
                {s.label}
                {i < step && <CheckCircle2 className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-5 animate-fade-in">

        {/* STEP 0 — Basic */}
        {step === 0 && (
          <section className="glass-card p-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold">Basic Information</h2>
              <p className="text-[12px] text-muted-foreground font-body mt-1">Fields marked * are required</p>
            </div>

            {/* Headshot upload */}
            <HeadshotUpload url={headshot} uploading={headshotUploading} onFileSelect={handleHeadshotUpload} />

            <div className="grid sm:grid-cols-2 gap-5">
              <FG label="Full Name *"><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Anya Kapoor" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FG>
              <FG label="Age"><Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 28" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FG>
              <FG label="Gender *">
                <Select value={gender} onValueChange={setGender}><SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Non-Binary">Non-Binary</SelectItem></SelectContent></Select>
              </FG>
              <FG label="Actor Type *">
                <Select value={type} onValueChange={setType}><SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="Lead">Lead</SelectItem><SelectItem value="Character">Character</SelectItem><SelectItem value="Emerging">Emerging</SelectItem><SelectItem value="Supporting">Supporting</SelectItem></SelectContent></Select>
              </FG>
              <FG label="Status">
                <Select value={status} onValueChange={setStatus}><SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Available">Available</SelectItem><SelectItem value="Booked">Booked</SelectItem><SelectItem value="On Hold">On Hold</SelectItem></SelectContent></Select>
              </FG>
              <FG label="Location"><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Mumbai, India" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FG>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div><Label className="font-body text-[13px] font-semibold">Profile Visible</Label><p className="text-[11px] text-muted-foreground font-body">Make publicly accessible via share link</p></div>
              <Switch checked={profileVisible} onCheckedChange={setProfileVisible} />
            </div>
          </section>
        )}

        {/* STEP 1 — Physical */}
        {step === 1 && (
          <section className="glass-card p-6 space-y-5">
            <h2 className="font-display text-lg font-bold">Physical Attributes</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              <FG label="Height"><Input value={height} onChange={e => setHeight(e.target.value)} placeholder="5'7&quot;" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FG>
              <FG label="Hair Colour"><Input value={hair} onChange={e => setHair(e.target.value)} placeholder="Black" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FG>
              <FG label="Eye Colour"><Input value={eyes} onChange={e => setEyes(e.target.value)} placeholder="Brown" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FG>
            </div>
          </section>
        )}

        {/* STEP 2 — Skills */}
        {step === 2 && (
          <section className="glass-card p-6 space-y-5">
            <h2 className="font-display text-lg font-bold">Skills & Languages</h2>
            <TagInput label="Languages" tags={languages} input={langInput} setInput={setLangInput} onAdd={() => addTag(languages, setLanguages, langInput, setLangInput)} onRemove={t => removeTag(languages, setLanguages, t)} placeholder="e.g. Telugu, Hindi — press Enter" />
            <TagInput label="Skills" tags={skills} input={skillInput} setInput={setSkillInput} onAdd={() => addTag(skills, setSkills, skillInput, setSkillInput)} onRemove={t => removeTag(skills, setSkills, t)} placeholder="e.g. Classical Dance, Yoga" />
            <TagInput label="Accents" tags={accents} input={accentInput} setInput={setAccentInput} onAdd={() => addTag(accents, setAccents, accentInput, setAccentInput)} onRemove={t => removeTag(accents, setAccents, t)} placeholder="e.g. Standard Telugu, RP British" />
          </section>
        )}

        {/* STEP 3 — Bio & Reels */}
        {step === 3 && (
          <section className="glass-card p-6 space-y-5">
            <h2 className="font-display text-lg font-bold">Bio & Showreels</h2>
            <FG label="Biography"><Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio..." rows={5} className="font-body text-[13px] rounded-xl bg-background border-border resize-none" /></FG>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="font-body text-[12px] font-semibold">Showreel URLs</Label>
                <button onClick={() => setReelUrls(r => [...r, ""])} className="text-[11px] font-body text-primary hover:underline flex items-center gap-1"><Plus className="h-3 w-3" /> Add another</button>
              </div>
              {reelUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={url} onChange={e => setReelUrls(r => r.map((v, j) => j === i ? e.target.value : v))}
                    placeholder="https://vimeo.com/your-reel" className="font-body text-[13px] rounded-xl h-10 bg-background border-border flex-1" />
                  {reelUrls.length > 1 && <button onClick={() => setReelUrls(r => r.filter((_, j) => j !== i))} className="p-2 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* STEP 4 — Contact (manager-private) */}
        {step === 4 && (
          <section className="glass-card p-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold">Contact Info</h2>
              <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[12px] font-body text-amber-800 flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">🔒</span>
                <span>Contact details are <strong>private</strong> — only you can see them. Never included in shared links.</span>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <FG label="Phone Number"><Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+91 98765 43210" type="tel" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FG>
              <FG label="Email"><Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="actor@email.com" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FG>
            </div>
            <FG label="Manager Notes"><Textarea value={managerNotes} onChange={e => setManagerNotes(e.target.value)} placeholder="Internal notes about this actor..." rows={4} className="font-body text-[13px] rounded-xl bg-background border-border resize-none" /></FG>
          </section>
        )}

        {/* STEP 5 — Filmography */}
        {step === 5 && (
          <section className="glass-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Filmography</h2>
              <Button variant="outline" size="sm" onClick={addFilm} className="h-8 rounded-lg text-[12px] font-body border-border"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Entry</Button>
            </div>
            {filmography.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl">
                <Clapperboard className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-body mb-3">No entries yet</p>
                <Button variant="outline" size="sm" onClick={addFilm} className="h-8 rounded-lg text-[12px] font-body border-border"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add First Entry</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filmography.map((entry, idx) => (
                  <div key={entry.id} className="border border-border rounded-xl p-4 bg-accent/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-body font-semibold text-muted-foreground">Entry {idx + 1}</span>
                      <button onClick={() => removeFilm(entry.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input value={entry.title} onChange={e => updateFilm(entry.id, "title", e.target.value)} placeholder="Project title" className="font-body text-[13px] rounded-lg h-9 bg-background border-border" />
                      <Input value={entry.role} onChange={e => updateFilm(entry.id, "role", e.target.value)} placeholder="Your role" className="font-body text-[13px] rounded-lg h-9 bg-background border-border" />
                      <Input value={entry.year} onChange={e => updateFilm(entry.id, "year", e.target.value)} placeholder="Year" className="font-body text-[13px] rounded-lg h-9 bg-background border-border" />
                      <Select value={entry.type} onValueChange={v => updateFilm(entry.id, "type", v)}>
                        <SelectTrigger className="font-body text-[13px] rounded-lg h-9 bg-background border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>{["Film","TV Series","Short","Theatre","Web Series","Commercial","OTT"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* STEP 6 — Photos */}
        {step === 6 && (
          <section className="glass-card p-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold">Portfolio Photos</h2>
              <p className="text-[12px] text-muted-foreground font-body mt-1">Upload photos for this actor's profile. JPG, PNG or WEBP, max 10 MB each.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((p, idx) => (
                <AddTalentPhoto key={p.id} entry={p} idx={idx}
                  onRemove={() => removePhoto(p.id)}
                  onFileSelect={file => handlePhotoUpload(p.id, file)} />
              ))}
              <button onClick={addPhoto}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all">
                <Plus className="h-7 w-7" />
                <span className="text-[11px] font-body font-medium">Add Photo</span>
              </button>
            </div>
          </section>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pb-10">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="h-10 rounded-xl font-body text-[13px] border-border">
              <ChevronLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
          ) : (
            <Link to="/roster"><Button variant="outline" className="h-10 rounded-xl font-body text-[13px] border-border">Cancel</Button></Link>
          )}

          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext}
              className="h-10 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              Next <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}
              className="h-10 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Save className="h-4 w-4 mr-2" />Save Talent</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── HeadshotUpload ────────────────────────────────────────────
function HeadshotUpload({ url, uploading, onFileSelect }: { url: string; uploading: boolean; onFileSelect: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-border shrink-0 bg-accent/30 flex items-center justify-center">
        {url ? <img src={url} alt="Headshot" className="w-full h-full object-cover" /> : <User className="h-8 w-8 text-muted-foreground/30" />}
      </div>
      <div>
        <p className="text-[13px] font-body font-semibold mb-1">Profile Photo (Headshot)</p>
        <input ref={ref} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }} />
        <button onClick={() => ref.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 text-[12px] font-body text-primary hover:underline">
          {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</> : <><Upload className="h-3.5 w-3.5" /> {url ? "Change photo" : "Upload photo"}</>}
        </button>
        <p className="text-[10px] text-muted-foreground font-body mt-0.5">JPG, PNG or WEBP · max 10 MB</p>
      </div>
    </div>
  );
}

// ── AddTalentPhoto ────────────────────────────────────────────
function AddTalentPhoto({ entry, idx, onRemove, onFileSelect }: { entry: PhotoEntry; idx: number; onRemove: () => void; onFileSelect: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative aspect-square rounded-xl overflow-hidden border border-border group">
      <input ref={ref} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }} />
      {entry.imageUrl ? (
        <>
          <img src={entry.imageUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
          <button onClick={onRemove}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : entry.uploading ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground bg-accent/30">
          <Loader2 className="h-6 w-6 animate-spin" /><span className="text-[11px] font-body">Uploading…</span>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()}
          className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all bg-accent/20">
          <Upload className="h-6 w-6" /><span className="text-[11px] font-body font-medium">Tap to upload</span>
        </button>
      )}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────
function FG({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="font-body text-[12px] font-semibold text-foreground">{label}</Label>{children}</div>;
}

function TagInput({ label, tags, input, setInput, onAdd, onRemove, placeholder }: {
  label: string; tags: string[]; input: string; setInput: (v: string) => void; onAdd: () => void; onRemove: (t: string) => void; placeholder: string;
}) {
  return (
    <div>
      <Label className="font-body text-[12px] font-semibold text-foreground mb-2 block">{label}</Label>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="text-[11px] px-3 py-1.5 rounded-full bg-primary/10 text-primary font-body font-medium flex items-center gap-1.5">
            {tag}<button onClick={() => onRemove(tag)} className="hover:text-destructive transition-colors"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), onAdd())}
          placeholder={placeholder} className="font-body text-[13px] rounded-xl h-9 bg-background border-border flex-1" />
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="h-9 rounded-xl text-[12px] font-body border-border"><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

export default AddTalent;
