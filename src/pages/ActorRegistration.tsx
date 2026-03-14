import { useState, useRef } from "react";
import { Plus, X, Save, Camera, Clapperboard, CheckCircle2, ChevronRight, ChevronLeft, User, Ruler, Languages, FileText, Upload, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "physical", label: "Appearance", icon: Ruler },
  { id: "skills", label: "Skills & Languages", icon: Languages },
  { id: "bio", label: "Bio & Links", icon: FileText },
  { id: "filmography", label: "Filmography", icon: Clapperboard },
  { id: "portfolio", label: "Portfolio", icon: Camera },
];

interface FilmEntry { id: string; title: string; role: string; year: string; type: string; }
interface PortfolioEntry { id: string; title: string; category: string; imageUrl: string; uploading?: boolean; }

const COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

const ActorRegistration = () => {
  const { user } = useAuth();

  // If a manager is logged in and visits this page, show a notice
  // The /register route is ONLY for actors invited via link
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="glass-card p-10 max-w-md w-full text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="font-display text-xl font-extrabold tracking-tight mb-2">Manager account detected</h1>
          <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
            This page is for actors joining your roster. Share this link with actors — do not open it while logged in as a manager.
          </p>
          <p className="text-[12px] text-muted-foreground font-body">Send this link: <span className="font-mono text-primary">{window.location.href}</span></p>
        </div>
      </div>
    );
  }
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Basic
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

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
  const [reelUrl, setReelUrl] = useState("");

  // Filmography
  const [filmography, setFilmography] = useState<FilmEntry[]>([]);

  // Portfolio
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);

  const addTag = (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
    const t = input.trim();
    if (t && !list.includes(t)) setList([...list, t]);
    setInput("");
  };
  const removeTag = (list: string[], setList: (v: string[]) => void, item: string) => setList(list.filter(i => i !== item));

  const addFilmEntry = () => setFilmography([...filmography, { id: crypto.randomUUID(), title: "", role: "", year: "", type: "Film" }]);
  const updateFilmEntry = (id: string, field: keyof FilmEntry, value: string) => setFilmography(filmography.map(f => f.id === id ? { ...f, [field]: value } : f));
  const removeFilmEntry = (id: string) => setFilmography(filmography.filter(f => f.id !== id));

  const addPortfolioEntry = () => setPortfolio([...portfolio, { id: crypto.randomUUID(), title: "", category: "Headshot", imageUrl: "" }]);
  const removePortfolioEntry = (id: string) => setPortfolio(portfolio.filter(p => p.id !== id));

  const handlePortfolioUpload = async (id: string, file: File) => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) { toast({ title: "Only JPG, PNG, or WEBP allowed", variant: "destructive" }); return; }
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Image must be under 10 MB", variant: "destructive" }); return; }

    setPortfolio(prev => prev.map(p => p.id === id ? { ...p, uploading: true } : p));
    try {
      const ext = file.name.split(".").pop();
      const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("portfolio").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
      setPortfolio(prev => prev.map(p => p.id === id ? { ...p, imageUrl: data.publicUrl, uploading: false } : p));
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setPortfolio(prev => prev.map(p => p.id === id ? { ...p, uploading: false } : p));
    }
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return (
        name.trim().length > 0 &&
        phone.trim().length >= 7 &&  // at least 7 digits
        gender.length > 0 &&
        type.length > 0
      );
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];

      // Insert actor row — no user_id since actor isn't logged in
      // Uses a special public insert policy on the table
      const { data: actor, error } = await supabase
        .from("actors")
        .insert({
          name, age: age ? parseInt(age) : null,
          gender, type, location, status: "Available",
          bio, reel_url: reelUrl, height, hair, eyes,
          languages, skills, accents,
          profile_visible: false, // hidden until manager approves
          slug, color, profile_completeness: 0,
          // We store contact info in manager_notes since actors don't have auth
          manager_notes: `Registered via invite link. Email: ${email || "—"}. Phone: ${phone}.`,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert filmography
      if (filmography.length > 0) {
        await supabase.from("filmography").insert(
          filmography.filter(f => f.title).map(f => ({
            actor_id: actor.id, user_id: null,
            title: f.title, role: f.role,
            year: parseInt(f.year) || null, type: f.type,
          }))
        );
      }

      // Insert portfolio
      if (portfolio.length > 0) {
        await supabase.from("portfolio").insert(
          portfolio.filter(p => p.imageUrl).map(p => ({
            actor_id: actor.id, user_id: null,
            title: p.title, category: p.category, image_url: p.imageUrl,
          }))
        );
      }

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const completionPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="glass-card p-10 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight mb-2">Profile Submitted!</h1>
          <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
            Thank you, <span className="font-semibold text-foreground">{name}</span>. Your profile has been sent to the talent management team. They'll review it and add you to the roster.
          </p>
          <p className="text-[12px] text-muted-foreground font-body">You can close this page now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Clean standalone header — NO sidebar */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="font-display text-primary-foreground text-sm font-bold">T</span>
            </div>
            <div>
              <h1 className="font-display text-base font-bold leading-tight">Join the Roster</h1>
              <p className="text-[11px] text-muted-foreground font-body">Complete your profile to get started</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-body font-medium text-muted-foreground">Step {currentStep + 1}/{steps.length}</span>
            <Progress value={completionPercent} className="w-24 h-2" />
          </div>
        </div>
      </div>

      {/* Step tabs */}
      <div className="max-w-[800px] mx-auto px-6 pt-6">
        <div className="flex items-center gap-1 overflow-x-auto pb-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <button key={step.id} onClick={() => i <= currentStep && setCurrentStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-body font-medium whitespace-nowrap transition-all ${
                  i === currentStep ? "bg-primary text-primary-foreground shadow-sm"
                  : i < currentStep ? "bg-emerald-500/10 text-emerald-700"
                  : "text-muted-foreground"
                }`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {step.label}
                {i < currentStep && <CheckCircle2 className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-[800px] mx-auto px-6 py-6">
        <div className="animate-fade-in">

          {currentStep === 0 && (
            <section className="glass-card p-6 space-y-5">
              <div>
                <h2 className="font-display text-lg font-bold">Basic Information</h2>
                <p className="text-[12px] text-muted-foreground font-body mt-1">Fields marked with * are required</p>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <FieldGroup label="Full Name *">
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Anya Kapoor" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" />
                </FieldGroup>
                <FieldGroup label="Phone Number *">
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    type="tel"
                    className={`font-body text-[13px] rounded-xl h-10 bg-background ${phone.trim().length > 0 && phone.trim().length < 7 ? "border-destructive focus-visible:ring-destructive" : "border-border"}`}
                  />
                  {phone.trim().length > 0 && phone.trim().length < 7 && (
                    <p className="text-[11px] text-destructive font-body mt-1">Enter a valid phone number</p>
                  )}
                  {phone.trim().length === 0 && name.trim().length > 0 && (
                    <p className="text-[11px] text-destructive font-body mt-1">Phone number is required</p>
                  )}
                </FieldGroup>
                <FieldGroup label="Email">
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" />
                </FieldGroup>
                <FieldGroup label="Age">
                  <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 28" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" />
                </FieldGroup>
                <FieldGroup label="Gender *">
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Non-Binary">Non-Binary</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Actor Type *">
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Character">Character</SelectItem>
                      <SelectItem value="Emerging">Emerging</SelectItem>
                      <SelectItem value="Supporting">Supporting</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Location">
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Mumbai, India" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" />
                </FieldGroup>
              </div>
            </section>
          )}

          {currentStep === 1 && (
            <section className="glass-card p-6 space-y-5">
              <h2 className="font-display text-lg font-bold">Physical Attributes</h2>
              <div className="grid md:grid-cols-3 gap-5">
                <FieldGroup label="Height"><Input value={height} onChange={e => setHeight(e.target.value)} placeholder={`e.g. 5'7"`} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
                <FieldGroup label="Hair Color"><Input value={hair} onChange={e => setHair(e.target.value)} placeholder="e.g. Black" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
                <FieldGroup label="Eye Color"><Input value={eyes} onChange={e => setEyes(e.target.value)} placeholder="e.g. Brown" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
              </div>
            </section>
          )}

          {currentStep === 2 && (
            <section className="glass-card p-6 space-y-5">
              <h2 className="font-display text-lg font-bold">Skills & Languages</h2>
              <TagInput label="Languages" tags={languages} input={langInput} setInput={setLangInput} onAdd={() => addTag(languages, setLanguages, langInput, setLangInput)} onRemove={t => removeTag(languages, setLanguages, t)} placeholder="e.g. Hindi, English — press Enter" />
              <TagInput label="Skills" tags={skills} input={skillInput} setInput={setSkillInput} onAdd={() => addTag(skills, setSkills, skillInput, setSkillInput)} onRemove={t => removeTag(skills, setSkills, t)} placeholder="e.g. Classical Dance, Yoga" />
              <TagInput label="Accents" tags={accents} input={accentInput} setInput={setAccentInput} onAdd={() => addTag(accents, setAccents, accentInput, setAccentInput)} onRemove={t => removeTag(accents, setAccents, t)} placeholder="e.g. British RP, Standard Hindi" />
            </section>
          )}

          {currentStep === 3 && (
            <section className="glass-card p-6 space-y-5">
              <h2 className="font-display text-lg font-bold">Bio & Links</h2>
              <FieldGroup label="Biography">
                <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself, your training, and your experience..." rows={5} className="font-body text-[13px] rounded-xl bg-background border-border resize-none" />
              </FieldGroup>
              <FieldGroup label="Showreel / Demo Reel URL">
                <Input value={reelUrl} onChange={e => setReelUrl(e.target.value)} placeholder="https://vimeo.com/your-reel" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" />
              </FieldGroup>
            </section>
          )}

          {currentStep === 4 && (
            <section className="glass-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Filmography</h2>
                <Button variant="outline" size="sm" onClick={addFilmEntry} className="h-8 rounded-lg text-[12px] font-body border-border"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Entry</Button>
              </div>
              {filmography.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-xl">
                  <Clapperboard className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-body mb-3">No filmography entries yet</p>
                  <Button variant="outline" size="sm" onClick={addFilmEntry} className="h-8 rounded-lg text-[12px] font-body border-border"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add First Entry</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filmography.map((entry, idx) => (
                    <div key={entry.id} className="border border-border rounded-xl p-4 bg-accent/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-body font-semibold text-muted-foreground">Entry {idx + 1}</span>
                        <button onClick={() => removeFilmEntry(entry.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Input value={entry.title} onChange={e => updateFilmEntry(entry.id, "title", e.target.value)} placeholder="Project title" className="font-body text-[13px] rounded-lg h-9 bg-background border-border" />
                        <Input value={entry.role} onChange={e => updateFilmEntry(entry.id, "role", e.target.value)} placeholder="Your role" className="font-body text-[13px] rounded-lg h-9 bg-background border-border" />
                        <Input value={entry.year} onChange={e => updateFilmEntry(entry.id, "year", e.target.value)} placeholder="Year" className="font-body text-[13px] rounded-lg h-9 bg-background border-border" />
                        <Select value={entry.type} onValueChange={v => updateFilmEntry(entry.id, "type", v)}>
                          <SelectTrigger className="font-body text-[13px] rounded-lg h-9 bg-background border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["Film","TV Series","Short","Theatre","Web Series","Commercial"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {currentStep === 5 && (
            <section className="glass-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold">Portfolio</h2>
                  <p className="text-[12px] text-muted-foreground font-body mt-0.5">Upload photos from your device — JPG, PNG or WEBP, max 10 MB each</p>
                </div>
                <Button variant="outline" size="sm" onClick={addPortfolioEntry} className="h-8 rounded-lg text-[12px] font-body border-border"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Photo</Button>
              </div>
              {portfolio.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-xl">
                  <Camera className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-body mb-3">No photos added yet</p>
                  <Button variant="outline" size="sm" onClick={addPortfolioEntry} className="h-8 rounded-lg text-[12px] font-body border-border"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add First Photo</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolio.map((entry, idx) => (
                    <PortfolioUploadRow
                      key={entry.id}
                      entry={entry}
                      idx={idx}
                      onRemove={() => removePortfolioEntry(entry.id)}
                      onUpdate={(field, value) => setPortfolio(prev => prev.map(p => p.id === entry.id ? { ...p, [field]: value } : p))}
                      onFileSelect={file => handlePortfolioUpload(entry.id, file)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pb-10">
          <Button variant="outline" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="h-10 rounded-xl font-body text-[13px] font-medium border-border">
            <ChevronLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()} className="h-10 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
              Next <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="h-10 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</> : <><Save className="h-4 w-4 mr-2" /> Submit Profile</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

function PortfolioUploadRow({ entry, idx, onRemove, onUpdate, onFileSelect }: {
  entry: { id: string; title: string; category: string; imageUrl: string; uploading?: boolean };
  idx: number; onRemove: () => void;
  onUpdate: (field: string, value: string) => void;
  onFileSelect: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="border border-border rounded-xl p-4 bg-accent/20 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-body font-semibold text-muted-foreground">Photo {idx + 1}</span>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Input value={entry.title} onChange={e => onUpdate("title", e.target.value)} placeholder="e.g. Headshot 2024" className="font-body text-[13px] rounded-lg h-9 bg-background border-border" />
        <Select value={entry.category} onValueChange={v => onUpdate("category", v)}>
          <SelectTrigger className="font-body text-[13px] rounded-lg h-9 bg-background border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["Headshot","Behind the Scenes","Editorial","Character Look"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Upload zone */}
      <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }} />

      {entry.imageUrl ? (
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-xl overflow-hidden border border-border shrink-0">
            <img src={entry.imageUrl} alt={entry.title} className="w-full h-full object-cover" />
          </div>
          <button onClick={() => fileRef.current?.click()} className="text-[12px] font-body text-primary hover:underline">Change photo</button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={entry.uploading}
          className="w-full border border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground">
          {entry.uploading ? (
            <><Loader2 className="h-6 w-6 animate-spin" /><span className="text-[12px] font-body">Uploading…</span></>
          ) : (
            <><Upload className="h-6 w-6" /><span className="text-[12px] font-body font-medium">Tap to upload from device</span><span className="text-[11px] font-body">JPG, PNG, WEBP · max 10 MB</span></>
          )}
        </button>
      )}
    </div>
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
      <Label className="font-body text-[12px] font-semibold text-foreground mb-2 block">{label}</Label>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="text-[11px] px-3 py-1.5 rounded-full bg-primary/10 text-primary font-body font-medium flex items-center gap-1.5">
            {tag}
            <button onClick={() => onRemove(tag)} className="hover:text-destructive transition-colors"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), onAdd())}
          placeholder={placeholder} className="font-body text-[13px] rounded-xl h-9 bg-background border-border flex-1" />
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="h-9 rounded-xl text-[12px] font-body border-border"><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

export default ActorRegistration;
