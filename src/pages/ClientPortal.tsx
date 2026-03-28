import { useState } from "react";
import { Search, Star, MapPin, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStatusVariant } from "@/lib/helpers";
import { useActors, useAgencyProfile } from "@/hooks/use-data";

const ClientPortal = () => {
  const { data: actors = [], isLoading } = useActors();
  const { data: agency } = useAgencyProfile();
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [shortlist, setShortlist]     = useState<Set<string>>(new Set());

  const publicActors = actors.filter((a) => a.profile_visible);

  const filtered = publicActors.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = a.name.toLowerCase().includes(q) || (a.skills || []).some((s) => s.toLowerCase().includes(q));
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const selected = actors.find((a) => a.id === selectedId);

  const toggleShortlist = (id: string) =>
    setShortlist((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <span className="font-display text-primary-foreground text-sm font-bold">T</span>
            </div>
            <div>
              <h1 className="font-display text-lg font-extrabold tracking-tight">{agency?.name || "Taara Talent"}</h1>
              <p className="text-[11px] text-muted-foreground font-body">Talent Roster • Client View</p>
            </div>
          </div>
          {shortlist.size > 0 && (
            <Button variant="outline" className="h-9 rounded-xl text-[12px] font-body font-medium border-border">
              <Star className="h-3.5 w-3.5 mr-1.5 text-amber-500 fill-amber-500" />
              My Shortlist ({shortlist.size})
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative w-[320px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <Input placeholder="Search actors, skills..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 font-body text-[13px] rounded-xl h-10 bg-card border-border" />
          </div>
          <div className="flex items-center gap-0.5 glass-card px-1.5 h-10">
            {["All", "Available", "Booked", "On Hold"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1.5 text-[11px] font-body font-medium rounded-lg transition-all ${statusFilter === s ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{s}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[14px] text-muted-foreground font-body">{publicActors.length === 0 ? "No public talent profiles yet." : "No results match your search."}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((actor) => (
              <div key={actor.id} className="glass-card overflow-hidden group cursor-pointer" onClick={() => setSelectedId(actor.id)}>
                <div className="h-32 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${actor.color}20, ${actor.color}08)` }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-display font-bold ring-2 ring-white/50 shadow-lg" style={{ backgroundColor: actor.color + "25", color: actor.color }}>
                    {actor.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-body text-[14px] font-semibold group-hover:text-primary transition-colors">{actor.name}</h3>
                      <p className="text-[11px] text-muted-foreground font-body">{actor.type}{actor.age ? ` · ${actor.age}y` : ""}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleShortlist(actor.id); }} className="p-1.5 rounded-lg hover:bg-accent transition-all">
                      <Star className={`h-4 w-4 ${shortlist.has(actor.id) ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  {actor.location && <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-body mb-3"><MapPin className="h-3 w-3" />{actor.location}</div>}
                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusVariant(actor.status)} className="text-[9px]">{actor.status}</Badge>
                    <div className="flex gap-1 flex-wrap">
                      {(actor.skills || []).slice(0, 2).map((s: string) => <span key={s} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-body font-medium">{s}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelectedId(null)}>
        {selected && (
          <DialogContent className="sm:max-w-lg glass-card border-border max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display text-xl font-bold">{selected.name}</DialogTitle></DialogHeader>
            <div className="space-y-5 pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant={getStatusVariant(selected.status)} className="text-[10px]">{selected.status}</Badge>
                <span className="text-[12px] text-muted-foreground font-body">{selected.type}{selected.age ? ` · ${selected.age}y` : ""}{selected.location ? ` · ${selected.location}` : ""}</span>
              </div>
              {selected.bio && <p className="text-[13px] text-muted-foreground font-body leading-relaxed">{selected.bio}</p>}
              {selected.reel_url && (
                <div>
                  <h3 className="font-display text-sm font-bold mb-2">Showreel</h3>
                  <a href={selected.reel_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] font-body font-medium text-primary hover:text-primary/80 transition-colors">
                    <ExternalLink className="h-4 w-4" /> Watch Reel
                  </a>
                </div>
              )}
              {(selected.portfolio || []).length > 0 && (
                <div>
                  <h3 className="font-display text-sm font-bold mb-2">Portfolio</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(selected.portfolio || []).map((p: any) => (
                      <div key={p.id} className="aspect-[4/5] rounded-lg overflow-hidden border border-border">
                        <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-display text-sm font-bold mb-2">Properties</h3>
                <div className="grid grid-cols-2 gap-2 text-[12px] font-body">
                  {selected.height && <div><span className="text-muted-foreground">Height:</span> {selected.height}</div>}
                  {selected.hair && <div><span className="text-muted-foreground">Hair:</span> {selected.hair}</div>}
                  {selected.eyes && <div><span className="text-muted-foreground">Eyes:</span> {selected.eyes}</div>}
                  {selected.languages?.length > 0 && <div><span className="text-muted-foreground">Languages:</span> {selected.languages.join(", ")}</div>}
                </div>
              </div>
              {selected.skills?.length > 0 && (
                <div>
                  <h3 className="font-display text-sm font-bold mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.skills.map((s: string) => <span key={s} className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-body font-medium">{s}</span>)}
                  </div>
                </div>
              )}
              <Button variant={shortlist.has(selected.id) ? "default" : "outline"} onClick={() => toggleShortlist(selected.id)} className="w-full h-9 rounded-xl text-[12px] font-body font-medium">
                <Star className={`h-3.5 w-3.5 mr-1.5 ${shortlist.has(selected.id) ? "fill-current" : ""}`} />
                {shortlist.has(selected.id) ? "Shortlisted" : "Add to Shortlist"}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default ClientPortal;
