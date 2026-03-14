import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ListChecks, Eye, Share2, Trash2, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useActors, useShortlists, useCreateShortlist, useDeleteShortlist } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ShortlistsPage = () => {
  const { data: shortlists = [], isLoading } = useShortlists();
  const { data: actors = [] } = useActors();
  const createShortlist = useCreateShortlist();
  const deleteShortlist = useDeleteShortlist();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createShortlist.mutateAsync({ name: newName, description: newDesc, actor_ids: [] });
      toast({ title: "Shortlist created!", description: `"${newName}" is ready to use.` });
      setNewName(""); setNewDesc(""); setShowCreate(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteShortlist.mutateAsync(id);
      toast({ title: "Deleted", description: `"${name}" has been removed.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">Shortlists</h1>
          <p className="text-muted-foreground font-body text-sm">Create & share curated talent selections</p>
        </div>
        <Button className="h-10 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow transition-all" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={2} /> New Shortlist
        </Button>
      </div>

      {showCreate && (
        <div className="glass-card p-6 mb-6 animate-scale-in">
          <h3 className="font-display text-lg font-bold mb-5">Create Shortlist</h3>
          <div className="space-y-3">
            <Input placeholder="Shortlist name (e.g., Hero options for Project X)" value={newName} onChange={(e) => setNewName(e.target.value)} className="font-body text-[13px] bg-background border-border rounded-xl h-10" />
            <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="font-body text-[13px] bg-background border-border rounded-xl h-10" />
            <div className="flex items-center gap-3 pt-1">
              <Button className="h-9 font-body text-[13px] font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleCreate} disabled={createShortlist.isPending}>
                {createShortlist.isPending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />} Create
              </Button>
              <Button variant="outline" size="sm" className="h-9 font-body text-[13px] font-medium rounded-xl border-border" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)
        ) : shortlists.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[13px] font-body font-semibold mb-1">No shortlists yet</p>
            <p className="text-[12px] text-muted-foreground font-body">Create your first shortlist to share talent with clients.</p>
          </div>
        ) : (
          shortlists.map((sl) => {
            const slActors = (sl.actor_ids || sl.actorIds || []).map((id: string) => actors.find((a) => a.id === id)).filter(Boolean);
            return (
              <div key={sl.id} className="glass-card p-6 group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Link to={`/shortlists/${sl.id}`} className="font-display text-lg font-bold hover:text-primary transition-colors">{sl.name}</Link>
                    <p className="text-[12px] text-muted-foreground font-body mt-1">{sl.description}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <Button variant="outline" size="sm" className="h-8 text-[11px] font-body font-medium rounded-lg border-border"
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/shortlist/${sl.slug}`); toast({ title: "Link copied!" }); }}>
                      <Share2 className="h-3 w-3 mr-1.5" /> Copy Link
                    </Button>
                    <button className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      onClick={() => handleDelete(sl.id, sl.name)}>
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-[12px] text-muted-foreground font-body font-medium mb-4">
                  <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" strokeWidth={1.5} /> {slActors.length} talent</span>
                  <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> {sl.views?.length ?? 0} views</span>
                  <span>Updated {format(new Date(sl.updated_at || sl.updatedAt || sl.created_at), "MMM d, yyyy")}</span>
                </div>
                {slActors.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {slActors.map((actor: any) => (
                      <div key={actor.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-[11px] font-body font-medium">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: actor.color }} />{actor.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ShortlistsPage;
