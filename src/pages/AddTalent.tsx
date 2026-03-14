import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Plus, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCreateActor } from "@/hooks/use-data";

const COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

const AddTalent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createActor = useCreateActor();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("Available");
  const [location, setLocation] = useState("");
  const [height, setHeight] = useState("");
  const [hair, setHair] = useState("");
  const [eyes, setEyes] = useState("");
  const [bio, setBio] = useState("");
  const [reelUrl, setReelUrl] = useState("");
  const [profileVisible, setProfileVisible] = useState(true);
  const [languages, setLanguages] = useState<string[]>([]);
  const [langInput, setLangInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [accents, setAccents] = useState<string[]>([]);
  const [accentInput, setAccentInput] = useState("");
  const [managerNotes, setManagerNotes] = useState("");

  const addTag = (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
    const trimmed = input.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    setInput("");
  };
  const removeTag = (list: string[], setList: (v: string[]) => void, item: string) =>
    setList(list.filter((i) => i !== item));

  const handleSubmit = async () => {
    if (!name || !gender || !type) {
      toast({ title: "Missing fields", description: "Please fill in name, gender, and type.", variant: "destructive" });
      return;
    }
    try {
      await createActor.mutateAsync({
        name, age: age ? parseInt(age) : undefined,
        gender: gender as any, type: type as any, status: status as any,
        location, height, hair, eyes, bio,
        reel_url: reelUrl, profile_visible: profileVisible,
        languages, skills, accents,
        manager_notes: managerNotes,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        profile_completeness: 50,
      });
      toast({ title: "Talent added!", description: `${name} has been added to your roster.` });
      navigate("/roster");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-8 py-10 animate-fade-in">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/roster" className="text-[12px] text-muted-foreground hover:text-primary font-body font-medium transition-colors">Roster</Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        <span className="text-[12px] font-body font-semibold text-foreground">Add Talent</span>
      </div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">Add Talent</h1>
        <p className="text-muted-foreground font-body text-sm">Fill in the details to add a new actor to your roster.</p>
      </div>
      <div className="space-y-8">
        <section className="glass-card p-6">
          <h2 className="font-display text-lg font-bold mb-5">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <FieldGroup label="Full Name *"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anya Kapoor" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
            <FieldGroup label="Age"><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 28" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
            <FieldGroup label="Gender *">
              <Select value={gender} onValueChange={setGender}><SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Non-Binary">Non-Binary</SelectItem></SelectContent></Select>
            </FieldGroup>
            <FieldGroup label="Type *">
              <Select value={type} onValueChange={setType}><SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="Lead">Lead</SelectItem><SelectItem value="Character">Character</SelectItem><SelectItem value="Emerging">Emerging</SelectItem><SelectItem value="Supporting">Supporting</SelectItem></SelectContent></Select>
            </FieldGroup>
            <FieldGroup label="Status">
              <Select value={status} onValueChange={setStatus}><SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Available">Available</SelectItem><SelectItem value="Booked">Booked</SelectItem><SelectItem value="On Hold">On Hold</SelectItem></SelectContent></Select>
            </FieldGroup>
            <FieldGroup label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mumbai, India" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
          </div>
        </section>
        <section className="glass-card p-6">
          <h2 className="font-display text-lg font-bold mb-5">Physical Attributes</h2>
          <div className="grid md:grid-cols-3 gap-5">
            <FieldGroup label="Height"><Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder={`e.g. 5'7"`} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
            <FieldGroup label="Hair"><Input value={hair} onChange={(e) => setHair(e.target.value)} placeholder="e.g. Black" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
            <FieldGroup label="Eyes"><Input value={eyes} onChange={(e) => setEyes(e.target.value)} placeholder="e.g. Brown" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
          </div>
        </section>
        <section className="glass-card p-6">
          <h2 className="font-display text-lg font-bold mb-5">Bio & Links</h2>
          <div className="space-y-5">
            <FieldGroup label="Biography"><Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Write a short bio..." rows={4} className="font-body text-[13px] rounded-xl bg-background border-border resize-none" /></FieldGroup>
            <FieldGroup label="Reel URL"><Input value={reelUrl} onChange={(e) => setReelUrl(e.target.value)} placeholder="https://vimeo.com/..." className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></FieldGroup>
            <div className="flex items-center justify-between">
              <div><Label className="font-body text-[13px] font-semibold">Profile Visible</Label><p className="text-[11px] text-muted-foreground font-body mt-0.5">Make this profile publicly accessible</p></div>
              <Switch checked={profileVisible} onCheckedChange={setProfileVisible} />
            </div>
          </div>
        </section>
        <section className="glass-card p-6">
          <h2 className="font-display text-lg font-bold mb-5">Skills & Languages</h2>
          <div className="space-y-5">
            <TagInput label="Languages" tags={languages} input={langInput} setInput={setLangInput} onAdd={() => addTag(languages, setLanguages, langInput, setLangInput)} onRemove={(t) => removeTag(languages, setLanguages, t)} placeholder="Add language..." />
            <TagInput label="Skills" tags={skills} input={skillInput} setInput={setSkillInput} onAdd={() => addTag(skills, setSkills, skillInput, setSkillInput)} onRemove={(t) => removeTag(skills, setSkills, t)} placeholder="Add skill..." />
            <TagInput label="Accents" tags={accents} input={accentInput} setInput={setAccentInput} onAdd={() => addTag(accents, setAccents, accentInput, setAccentInput)} onRemove={(t) => removeTag(accents, setAccents, t)} placeholder="Add accent..." />
          </div>
        </section>
        <section className="glass-card p-6">
          <h2 className="font-display text-lg font-bold mb-5">Manager Notes</h2>
          <Textarea value={managerNotes} onChange={(e) => setManagerNotes(e.target.value)} placeholder="Internal notes about this talent..." rows={3} className="font-body text-[13px] rounded-xl bg-background border-border resize-none" />
        </section>
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link to="/roster"><Button variant="outline" className="h-10 rounded-xl font-body text-[13px] font-medium border-border">Cancel</Button></Link>
          <Button onClick={handleSubmit} disabled={createActor.isPending} className="h-10 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow transition-all">
            {createActor.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" strokeWidth={2} />}
            Save Talent
          </Button>
        </div>
      </div>
    </div>
  );
};

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="space-y-1.5"><Label className="font-body text-[12px] font-semibold text-foreground">{label}</Label>{children}</div>);
}

function TagInput({ label, tags, input, setInput, onAdd, onRemove, placeholder }: { label: string; tags: string[]; input: string; setInput: (v: string) => void; onAdd: () => void; onRemove: (t: string) => void; placeholder: string }) {
  return (
    <div>
      <Label className="font-body text-[12px] font-semibold text-foreground mb-2 block">{label}</Label>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {tags.map((tag) => (<span key={tag} className="text-[11px] px-3 py-1.5 rounded-full bg-primary/10 text-primary font-body font-medium flex items-center gap-1.5">{tag}<button onClick={() => onRemove(tag)} className="hover:text-destructive transition-colors"><X className="h-3 w-3" /></button></span>))}
      </div>
      <div className="flex items-center gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAdd())} placeholder={placeholder} className="font-body text-[13px] rounded-xl h-9 bg-background border-border flex-1" />
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="h-9 rounded-xl text-[12px] font-body border-border"><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

export default AddTalent;
