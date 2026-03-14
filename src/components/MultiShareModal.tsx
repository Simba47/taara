import { useState, useMemo } from "react";
import { Check, Copy, Search, Globe, Users, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getStatusVariant } from "@/lib/helpers";
import { useActors, useCreateShortlist } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

interface MultiShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedIds?: string[];
}

export function MultiShareModal({ open, onOpenChange, preSelectedIds = [] }: MultiShareModalProps) {
  const { data: actors = [], isLoading } = useActors();
  const createShortlist = useCreateShortlist();
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preSelectedIds));
  const [search, setSearch] = useState("");
  const [shortlistName, setShortlistName] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() =>
    actors.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())),
    [actors, search]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === actors.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(actors.map((a) => a.id)));
  };

  const handleGenerateLink = async () => {
    if (selectedIds.size === 0) {
      toast({ title: "Select at least one actor", variant: "destructive" });
      return;
    }
    const name = shortlistName.trim() || `Selection – ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
    setCreating(true);
    try {
      const sl = await createShortlist.mutateAsync({
        name,
        description: `${selectedIds.size} profile${selectedIds.size !== 1 ? "s" : ""} shared via multi-share`,
        actor_ids: Array.from(selectedIds),
      } as any);
      const url = `${window.location.origin}/shortlist/${sl.slug}`;
      setGeneratedUrl(url);
    } catch (err: any) {
      toast({ title: "Error creating share link", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    sonnerToast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGeneratedUrl(null);
    setShortlistName("");
    setSelectedIds(new Set());
    setCopied(false);
  };

  const selectedActors = actors.filter((a) => selectedIds.has(a.id));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg glass-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Share Multiple Profiles
          </DialogTitle>
          <DialogDescription className="font-body text-[13px]">
            Select actors and generate a single shareable link that shows all their profiles.
          </DialogDescription>
        </DialogHeader>

        {generatedUrl ? (
          /* ── Success state ── */
          <div className="space-y-5 pt-2">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-3">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-[13px] font-body font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                Share link created!
              </p>
              <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-body">
                {selectedIds.size} profile{selectedIds.size !== 1 ? "s" : ""} included
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input readOnly value={generatedUrl} className="font-body text-[12px] rounded-xl h-10 bg-background border-border text-muted-foreground" />
              <Button variant="outline" onClick={handleCopy} className="h-10 px-3 rounded-xl border-border shrink-0">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-9 text-[13px] font-body rounded-xl border-border"
                onClick={() => window.open(generatedUrl, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Preview
              </Button>
              <Button variant="outline" className="flex-1 h-9 text-[13px] font-body rounded-xl border-border" onClick={handleReset}>
                Share another
              </Button>
              <Button className="flex-1 h-9 text-[13px] font-body rounded-xl bg-primary text-primary-foreground" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>

            {selectedActors.length > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground font-body mb-2">Profiles included:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedActors.map((a) => (
                    <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent text-[11px] font-body">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color || "#6366f1" }} />
                      {a.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Selection state ── */
          <div className="space-y-4 pt-2">
            {/* Shortlist name */}
            <div>
              <label className="text-[12px] font-body font-semibold block mb-1.5">Link name (optional)</label>
              <Input
                value={shortlistName}
                onChange={(e) => setShortlistName(e.target.value)}
                placeholder="e.g. Hero options for Project X"
                className="font-body text-[13px] rounded-xl h-10 bg-background border-border"
              />
            </div>

            {/* Actor selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-body font-semibold">
                  Select profiles
                  {selectedIds.size > 0 && <span className="ml-1.5 text-primary">({selectedIds.size} selected)</span>}
                </span>
                {actors.length > 0 && (
                  <button onClick={selectAll} className="text-[11px] font-body text-primary font-medium hover:underline">
                    {selectedIds.size === actors.length ? "Deselect all" : "Select all"}
                  </button>
                )}
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actors..." className="pl-9 font-body text-[12px] rounded-xl h-9 bg-background border-border" />
              </div>

              <div className="max-h-[200px] overflow-y-auto space-y-1 border border-border rounded-xl p-2">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
                      <Skeleton className="w-4 h-4 rounded" />
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-2.5 w-16" />
                      </div>
                    </div>
                  ))
                ) : filtered.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <Users className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[12px] text-muted-foreground font-body">
                      {actors.length === 0 ? "No actors in your roster yet." : "No matching actors."}
                    </p>
                  </div>
                ) : (
                  filtered.map((actor) => (
                    <button
                      key={actor.id}
                      onClick={() => toggleSelect(actor.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                        selectedIds.has(actor.id) ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-accent"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                        selectedIds.has(actor.id) ? "bg-primary border-primary" : "border-border"
                      }`}>
                        {selectedIds.has(actor.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-display font-bold ring-1 ring-border shrink-0"
                        style={{ backgroundColor: (actor.color || "#6366f1") + "15", color: actor.color || "#6366f1" }}>
                        {actor.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-body font-medium truncate">{actor.name}</p>
                        <p className="text-[11px] text-muted-foreground font-body">{actor.type}{actor.age ? ` · ${actor.age}` : ""}</p>
                      </div>
                      <Badge variant={getStatusVariant(actor.status)} className="text-[9px] shrink-0">{actor.status}</Badge>
                      {!actor.profile_visible && (
                        <span className="text-[9px] text-muted-foreground font-body shrink-0">Hidden</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Info */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/50 border border-border text-[12px] font-body text-muted-foreground">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                This creates a public shortlist link — anyone with the link can view the selected profiles.
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10 text-[13px] font-body rounded-xl border-border">
                Cancel
              </Button>
              <Button
                onClick={handleGenerateLink}
                disabled={selectedIds.size === 0 || creating}
                className="flex-1 h-10 text-[13px] font-body font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {creating ? "Creating…" : `Generate link for ${selectedIds.size || ""} profile${selectedIds.size !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
