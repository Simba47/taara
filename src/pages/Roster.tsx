import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, MapPin, EyeOff, Users, Grid3X3, List, Trash2, ArrowUpDown, Share2, MessageSquare, UserPlus } from "lucide-react";
import { BulkMessageModal } from "@/components/BulkMessageModal";
import { MultiShareModal } from "@/components/MultiShareModal";
import { InviteActorModal } from "@/components/InviteActorModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusVariant } from "@/lib/helpers";
import { useActors, useDeleteActor } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";

const statusFilters = ["All", "Available", "Booked", "On Hold"] as const;
const typeFilters = ["All", "Lead", "Character", "Emerging", "Supporting"] as const;
const genderFilters = ["All", "Male", "Female", "Non-Binary"] as const;
const sortOptions = [{ label: "Name", key: "name" }, { label: "Updated", key: "updated_at" }, { label: "Complete", key: "profile_completeness" }] as const;
type SortKey = typeof sortOptions[number]["key"];

const Roster = () => {
  const { data: actors = [], isLoading } = useActors();
  const deleteActor = useDeleteActor();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMessageOpen, setBulkMessageOpen] = useState(false);
  const [multiShareOpen, setMultiShareOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const allLanguages = useMemo(() => {
    const langs = new Set<string>();
    actors.forEach((a) => (a.languages || []).forEach((l: string) => langs.add(l)));
    return ["All", ...Array.from(langs).sort()];
  }, [actors]);

  const filtered = useMemo(() => {
    let result = actors.filter((actor) => {
      const matchesSearch = actor.name.toLowerCase().includes(search.toLowerCase()) ||
        (actor.skills || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "All" || actor.status === statusFilter;
      const matchesType = typeFilter === "All" || actor.type === typeFilter;
      const matchesGender = genderFilter === "All" || actor.gender === genderFilter;
      const matchesLang = languageFilter === "All" || (actor.languages || []).includes(languageFilter);
      return matchesSearch && matchesStatus && matchesType && matchesGender && matchesLang;
    });
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "updated_at") cmp = new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      else if (sortBy === "profile_completeness") cmp = (b.profile_completeness || 0) - (a.profile_completeness || 0);
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [actors, search, statusFilter, typeFilter, genderFilter, languageFilter, sortBy, sortAsc]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleAll = () => {
    setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map((a) => a.id)));
  };
  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc); else { setSortBy(key); setSortAsc(true); }
  };
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from your roster?`)) return;
    try {
      await deleteActor.mutateAsync(id);
      toast({ title: "Removed", description: `${name} has been removed from your roster.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const FilterPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} className={`px-3 py-1.5 text-[11px] font-body font-medium rounded-lg transition-all ${active ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>{label}</button>
  );

  if (isLoading) return (
    <div className="max-w-[1100px] mx-auto px-8 py-10">
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">Roster</h1>
          <p className="text-muted-foreground font-body text-sm">{actors.length} talent · {actors.filter(a => a.status === "Available").length} available</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Actions that appear when actors are selected */}
          {selectedIds.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setBulkMessageOpen(true)} className="h-9 text-[12px] font-body font-medium rounded-xl border-border">
                <MessageSquare className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} /> Message ({selectedIds.size})
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMultiShareOpen(true)} className="h-9 text-[12px] font-body font-medium rounded-xl border-border">
                <Share2 className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} /> Share ({selectedIds.size})
              </Button>
            </>
          )}
          {/* Invite link button — always visible */}
          <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)} className="h-9 text-[12px] font-body font-medium rounded-xl border-border">
            <UserPlus className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} /> Invite
          </Button>
          <Link to="/roster/new">
            <Button className="h-10 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow transition-all">
              <Plus className="h-4 w-4 mr-2" strokeWidth={2} /> Add Talent
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input placeholder="Search talent, skills..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 font-body text-[13px] rounded-xl h-10 bg-card border-border" />
        </div>
        <div className="flex items-center gap-1">{statusFilters.map(f => <FilterPill key={f} label={f} active={statusFilter === f} onClick={() => setStatusFilter(f)} />)}</div>
        <div className="flex items-center gap-1">{typeFilters.map(f => <FilterPill key={f} label={f} active={typeFilter === f} onClick={() => setTypeFilter(f)} />)}</div>
        <div className="flex items-center gap-1">{genderFilters.map(f => <FilterPill key={f} label={f} active={genderFilter === f} onClick={() => setGenderFilter(f)} />)}</div>
        <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} className="h-8 text-[11px] font-body font-medium rounded-lg border border-border bg-card px-2 text-muted-foreground">
          {allLanguages.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <div className="flex items-center gap-1 ml-auto">
          {sortOptions.map(s => (
            <button key={s.key} onClick={() => handleSort(s.key)} className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-body font-medium rounded-lg transition-all ${sortBy === s.key ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <ArrowUpDown className="h-3 w-3" />{s.label}
            </button>
          ))}
          <div className="flex items-center gap-0.5 ml-1">
            <button onClick={() => setView("grid")} className={`p-1.5 rounded-lg transition-colors ${view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}><Grid3X3 className="h-4 w-4" /></button>
            <button onClick={() => setView("list")} className={`p-1.5 rounded-lg transition-colors ${view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* Select all bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 mb-3">
          <button onClick={toggleAll} className="text-[11px] font-body text-muted-foreground hover:text-foreground transition-colors">
            {selectedIds.size === filtered.length ? "Deselect all" : `Select all (${filtered.length})`}
          </button>
          {selectedIds.size > 0 && (
            <span className="text-[11px] font-body text-primary">
              {selectedIds.size} selected — use Share or Message above
            </span>
          )}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && !isLoading && (
        <div className="glass-card p-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-display text-lg font-bold mb-1">{actors.length === 0 ? "No talent yet" : "No results"}</p>
          <p className="text-[13px] text-muted-foreground font-body mb-4">
            {actors.length === 0 ? "Add your first actor or send an invite link." : "Try adjusting your filters."}
          </p>
          {actors.length === 0 && (
            <div className="flex items-center justify-center gap-3">
              <Link to="/roster/new"><Button className="rounded-xl font-body text-[13px] font-semibold">Add Manually</Button></Link>
              <Button variant="outline" onClick={() => setInviteOpen(true)} className="rounded-xl font-body text-[13px] font-medium border-border">
                <UserPlus className="h-3.5 w-3.5 mr-2" /> Send Invite Link
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((actor) => (
            <div key={actor.id} className={`glass-card group relative overflow-hidden hover:shadow-lg transition-all duration-300 ${selectedIds.has(actor.id) ? "ring-2 ring-primary" : ""}`}>
              <button onClick={() => toggleSelect(actor.id)} className="absolute top-2.5 left-2.5 w-5 h-5 rounded-md border border-border bg-background/80 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                {selectedIds.has(actor.id) && <div className="w-3 h-3 rounded-sm bg-primary" />}
              </button>
              <Link to={`/roster/${actor.id}`}>
                <div className="p-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-border mx-auto" style={{ backgroundColor: (actor.color || "#6366f1") + "15", color: actor.color || "#6366f1" }}>
                    <span className="text-xl font-display font-bold">{actor.name.split(" ").map((n: string) => n[0]).join("")}</span>
                  </div>
                  <h3 className="font-display text-[14px] font-bold text-center truncate mb-1">{actor.name}</h3>
                  <p className="text-[11px] text-muted-foreground font-body text-center mb-3">{actor.type}{actor.age ? ` · ${actor.age}` : ""}</p>
                  <div className="flex justify-center mb-3"><Badge variant={getStatusVariant(actor.status)} className="text-[10px]">{actor.status}</Badge></div>
                  {actor.location && <p className="text-[11px] text-muted-foreground font-body flex items-center gap-1 justify-center"><MapPin className="h-3 w-3" /><span className="truncate">{actor.location}</span></p>}
                  {!actor.profile_visible && <div className="flex items-center gap-1 justify-center mt-2 text-[10px] text-muted-foreground font-body"><EyeOff className="h-3 w-3" /> Hidden</div>}
                </div>
                {actor.profile_completeness !== undefined && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between mb-1"><span className="text-[10px] text-muted-foreground font-body">Profile</span><span className="text-[10px] font-body font-medium">{actor.profile_completeness}%</span></div>
                    <Progress value={actor.profile_completeness} className="h-1" />
                  </div>
                )}
              </Link>
              <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDelete(actor.id, actor.name)} className="p-1.5 rounded-lg bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && filtered.length > 0 && (
        <div className="glass-card divide-y divide-border overflow-hidden">
          {filtered.map((actor) => (
            <div key={actor.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors group ${selectedIds.has(actor.id) ? "bg-primary/5" : ""}`}>
              <button onClick={() => toggleSelect(actor.id)} className="w-5 h-5 rounded-md border border-border flex items-center justify-center shrink-0">
                {selectedIds.has(actor.id) && <div className="w-3 h-3 rounded-sm bg-primary" />}
              </button>
              <Link to={`/roster/${actor.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ring-1 ring-border text-xs font-display font-bold" style={{ backgroundColor: (actor.color || "#6366f1") + "15", color: actor.color || "#6366f1" }}>
                  {actor.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-body font-semibold truncate group-hover:text-primary transition-colors">{actor.name}</p>
                  <p className="text-[11px] text-muted-foreground font-body mt-0.5">{actor.type}{actor.age ? ` · ${actor.age}` : ""}{actor.location ? ` · ${actor.location}` : ""}</p>
                </div>
                <Badge variant={getStatusVariant(actor.status)} className="text-[10px] shrink-0">{actor.status}</Badge>
                {!actor.profile_visible && <EyeOff className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
              </Link>
              <button onClick={() => handleDelete(actor.id, actor.name)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <BulkMessageModal
        open={bulkMessageOpen}
        onOpenChange={setBulkMessageOpen}
        preSelectedIds={Array.from(selectedIds)}
      />
      <MultiShareModal
        open={multiShareOpen}
        onOpenChange={setMultiShareOpen}
        preSelectedIds={Array.from(selectedIds)}
      />
      <InviteActorModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
};

export default Roster;
