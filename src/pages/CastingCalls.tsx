import { useState } from "react";
import { Plus, Search, Calendar, Clock, Film, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCastingOpportunities, useCreateCastingOpportunity, useDeleteCastingOpportunity } from "@/hooks/use-data";
import { getSubmissionStatusColor } from "@/lib/helpers";
import { useToast } from "@/hooks/use-toast";
import type { CastingOpportunity } from "@/hooks/use-data";

const CastingCalls = () => {
  const { data: opportunities = [], isLoading } = useCastingOpportunities();
  const createOpp = useCreateCastingOpportunity();
  const deleteOpp = useDeleteCastingOpportunity();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCasting, setSelectedCasting] = useState<CastingOpportunity | null>(null);

  const [newProject, setNewProject] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDirector, setNewDirector] = useState("");
  const [newCD, setNewCD] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const filtered = opportunities.filter((c) =>
    (c.projectName || c.project_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.role || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.director || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newProject || !newRole) {
      toast({ title: "Missing fields", description: "Project name and role are required.", variant: "destructive" });
      return;
    }
    try {
      await createOpp.mutateAsync({
        projectName: newProject, role: newRole, director: newDirector,
        castingDirector: newCD, deadline: newDeadline || undefined, notes: newNotes,
      } as any);
      toast({ title: "Casting call created!", description: `${newRole} for ${newProject} has been posted.` });
      setCreateOpen(false);
      setNewProject(""); setNewRole(""); setNewDirector(""); setNewCD(""); setNewDeadline(""); setNewNotes("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOpp.mutateAsync(id);
      toast({ title: "Deleted" });
      if (selectedCasting?.id === id) setSelectedCasting(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getDeadlineStatus = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Expired", className: "bg-destructive/10 text-destructive" };
    if (days <= 3) return { label: `${days}d left`, className: "bg-amber-500/10 text-amber-700" };
    return { label: `${days}d left`, className: "bg-emerald-500/10 text-emerald-700" };
  };

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">Casting Calls</h1>
          <p className="text-muted-foreground font-body text-sm">{opportunities.length} active breakdowns</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-10 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow transition-all">
          <Plus className="h-4 w-4 mr-2" strokeWidth={2} /> New Breakdown
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search breakdowns..." className="pl-10 font-body text-[13px] rounded-xl h-10 bg-card border-border" />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Film className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[13px] font-body font-semibold mb-1">{search ? "No results found" : "No casting calls yet"}</p>
            <p className="text-[12px] text-muted-foreground font-body">Create your first breakdown to start tracking submissions.</p>
          </div>
        ) : (
          filtered.map((opp) => {
            const projectName = opp.projectName || (opp as any).project_name;
            const castingDirector = opp.castingDirector || (opp as any).casting_director;
            const deadline = opp.deadline || (opp as any).deadline;
            const submissions = opp.submissions || (opp as any).casting_submissions || [];
            const deadlineStatus = deadline ? getDeadlineStatus(deadline) : null;
            return (
              <div key={opp.id} className="glass-card p-6 cursor-pointer hover:border-primary/30 transition-all group" onClick={() => setSelectedCasting(opp)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display text-base font-bold group-hover:text-primary transition-colors">{projectName}</h3>
                    <p className="text-[13px] text-muted-foreground font-body mt-0.5">{opp.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {deadlineStatus && <span className={`text-[11px] font-body font-semibold px-2.5 py-1 rounded-full ${deadlineStatus.className}`}>{deadlineStatus.label}</span>}
                    <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      onClick={(e) => { e.stopPropagation(); handleDelete(opp.id); }}>
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-muted-foreground font-body mb-4">
                  {opp.director && <span className="flex items-center gap-1.5"><Film className="h-3.5 w-3.5" strokeWidth={1.5} />{opp.director}</span>}
                  {castingDirector && <span>CD: {castingDirector}</span>}
                  {deadline && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />Deadline: {deadline}</span>}
                </div>
                {submissions.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {submissions.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-accent text-[11px] font-body">
                        <span className="font-medium">{s.actorName || s.actor_name}</span>
                        <span className={`font-semibold ${getSubmissionStatusColor(s.status)}`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-lg font-bold">New Casting Breakdown</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Project Name *</Label><Input value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="e.g. Untitled Dharma Project" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
            <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Role *</Label><Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g. Female Lead — Priya" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Director</Label><Input value={newDirector} onChange={(e) => setNewDirector(e.target.value)} placeholder="Director name" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
              <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Casting Director</Label><Input value={newCD} onChange={(e) => setNewCD(e.target.value)} placeholder="CD name" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
            </div>
            <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Deadline</Label><Input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
            <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Notes</Label><Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Role requirements, notes..." rows={3} className="font-body text-[13px] rounded-xl bg-background border-border resize-none" /></div>
            <Button onClick={handleCreate} disabled={createOpp.isPending} className="w-full h-10 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              {createOpp.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Breakdown
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CastingCalls;
