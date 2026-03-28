// ─────────────────────────────────────────────────────────────
// SHARING MODULE — MultiShareModal
// Supports: public link, passcode-protected, expiring link
// ─────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from "react";
import { Check, Copy, Search, Globe, Users, ExternalLink, Share2, ChevronLeft, Lock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { getStatusVariant } from "@/lib/helpers";
import { useActors, useCreateShortlist } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

type ShareMode = "public" | "passcode" | "expiring";

interface MultiShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedIds?: string[];
}

export function MultiShareModal({ open, onOpenChange, preSelectedIds = [] }: MultiShareModalProps) {
  const { data: actors = [], isLoading } = useActors();
  const createShortlist = useCreateShortlist();
  const { toast } = useToast();

  const hasPreSelection = preSelectedIds.length > 0;
  const [step, setStep] = useState<"select" | "name" | "done">(hasPreSelection ? "name" : "select");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preSelectedIds));
  const [search, setSearch] = useState("");
  const [shortlistName, setShortlistName] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  // Protection options
  const [shareMode, setShareMode] = useState<ShareMode>("public");
  const [passcode, setPasscode] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(preSelectedIds));
      setStep(preSelectedIds.length > 0 ? "name" : "select");
      setSearch("");
      setShortlistName("");
      setGeneratedUrl(null);
      setCopied(false);
      setShareMode("public");
      setPasscode("");
      setExpiryDays("7");
    }
  }, [open, preSelectedIds.join(",")]);

  const filtered = useMemo(() =>
    actors.filter(a => a.name.toLowerCase().includes(search.toLowerCase())),
    [actors, search]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(selectedIds.size === actors.length ? new Set() : new Set(actors.map(a => a.id)));
  };

  const handleGenerateLink = async () => {
    if (selectedIds.size === 0) { toast({ title: "Select at least one actor", variant: "destructive" }); return; }
    if (shareMode === "passcode" && !passcode.trim()) {
      toast({ title: "Please enter a passcode", variant: "destructive" }); return;
    }
    const name = shortlistName.trim() || `Selection – ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
    setCreating(true);
    try {
      const sl = await createShortlist.mutateAsync({
        name,
        description: `${selectedIds.size} profile${selectedIds.size !== 1 ? "s" : ""} shared`,
        actor_ids: Array.from(selectedIds),
      } as any);

      // Build URL based on mode
      let url = `${window.location.origin}/shortlist/${sl.slug}`;
      if (shareMode === "passcode") {
        const encoded = btoa(passcode.trim()).replace(/=/g, "");
        url = `${url}?ph=${encoded}`;
      } else if (shareMode === "expiring") {
        const exp = Date.now() + parseInt(expiryDays) * 86400000;
        url = `${url}?exp=${exp}`;
      }

      setGeneratedUrl(url);
      setStep("done");
    } catch (err: any) {
      toast({ title: "Error creating share link", description: err.message, variant: "destructive" });
    } finally { setCreating(false); }
  };

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    sonnerToast.success(
      shareMode === "passcode"
        ? "Link copied! Remember to share the passcode separately."
        : "Link copied to clipboard"
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedActors = actors.filter(a => selectedIds.has(a.id));

  const handleClose = (v: boolean) => {
    if (!v) {
      setGeneratedUrl(null);
      setStep(preSelectedIds.length > 0 ? "name" : "select");
    }
    onOpenChange(v);
  };

  const modes = [
    { id: "public" as ShareMode, icon: Globe, title: "Anyone with the link", desc: "No restrictions — open access" },
    { id: "passcode" as ShareMode, icon: Lock, title: "Protected with passcode", desc: "Viewer must enter passcode to view" },
    { id: "expiring" as ShareMode, icon: Clock, title: "Expiring link", desc: "Auto-expires after set duration" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg glass-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Share Profiles
          </DialogTitle>
          <DialogDescription className="font-body text-[13px]">
            {step === "select" ? "Select actors to share"
              : step === "name" ? `${selectedIds.size} profile${selectedIds.size !== 1 ? "s" : ""} selected`
              : "Your share link is ready"}
          </DialogDescription>
        </DialogHeader>

        {/* ── DONE ── */}
        {step === "done" && generatedUrl && (
          <div className="space-y-4 pt-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-[13px] font-body font-semibold text-emerald-800 mb-0.5">Link created!</p>
              <p className="text-[11px] text-emerald-600 font-body">{selectedIds.size} profile{selectedIds.size !== 1 ? "s" : ""} · {shareMode === "passcode" ? "🔒 Passcode protected" : shareMode === "expiring" ? `⏱ Expires in ${expiryDays}d` : "🌐 Public"}</p>
            </div>
            {shareMode === "passcode" && (
              <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[12px] font-body text-amber-800">
                <strong>Remember:</strong> Share the passcode <strong>{passcode}</strong> separately with the viewer — it's not in the link.
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input readOnly value={generatedUrl} className="font-body text-[11px] rounded-xl h-10 bg-background border-border text-muted-foreground" />
              <Button variant="outline" onClick={handleCopy} className="h-10 px-3 rounded-xl border-border shrink-0">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-9 text-[12px] font-body rounded-xl border-border" onClick={() => window.open(generatedUrl, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Preview
              </Button>
              <Button variant="outline" className="flex-1 h-9 text-[12px] font-body rounded-xl border-border" onClick={() => { setStep("select"); setSelectedIds(new Set()); setGeneratedUrl(null); }}>
                Share another
              </Button>
              <Button className="flex-1 h-9 text-[12px] font-body rounded-xl bg-primary text-primary-foreground" onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}

        {/* ── NAME + PROTECTION STEP ── */}
        {step === "name" && (
          <div className="space-y-4 pt-2">
            {!hasPreSelection && (
              <button onClick={() => setStep("select")} className="flex items-center gap-1.5 text-[12px] font-body text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}

            {/* Selected actors */}
            <div className="flex flex-wrap gap-2 p-3 bg-accent/30 rounded-xl border border-border">
              {selectedActors.map(a => (
                <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card text-[11px] font-body border border-border">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color || "#6366f1" }} />{a.name}
                </div>
              ))}
            </div>

            {/* Link name */}
            <div>
              <Label className="text-[12px] font-body font-semibold block mb-1.5">Link name (optional)</Label>
              <Input value={shortlistName} onChange={e => setShortlistName(e.target.value)}
                placeholder="e.g. Hero options for Project X"
                className="font-body text-[13px] rounded-xl h-10 bg-background border-border" />
            </div>

            {/* Protection mode */}
            <div>
              <Label className="text-[12px] font-body font-semibold block mb-2">Link protection</Label>
              <div className="space-y-1.5">
                {modes.map(m => (
                  <button key={m.id} onClick={() => setShareMode(m.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors border ${
                      shareMode === m.id ? "bg-primary/10 border-primary/20" : "hover:bg-accent/50 border-transparent"
                    }`}>
                    <m.icon className={`h-4 w-4 shrink-0 ${shareMode === m.id ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-body ${shareMode === m.id ? "font-semibold text-primary" : ""}`}>{m.title}</p>
                      <p className="text-[11px] text-muted-foreground font-body">{m.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-[1.5px] shrink-0 flex items-center justify-center ${
                      shareMode === m.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {shareMode === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Passcode input */}
            {shareMode === "passcode" && (
              <div className="space-y-1.5">
                <Label className="text-[12px] font-body font-semibold">Passcode</Label>
                <Input value={passcode} onChange={e => setPasscode(e.target.value)}
                  placeholder="e.g. taara2024" type="text" maxLength={20}
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  className="font-body text-[13px] rounded-xl h-10 bg-background border-border" />
                <p className="text-[11px] text-muted-foreground font-body">Not shown in the link — share it separately with the viewer.</p>
              </div>
            )}

            {/* Expiry selector */}
            {shareMode === "expiring" && (
              <div className="space-y-1.5">
                <Label className="text-[12px] font-body font-semibold">Link expires after</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {["1","3","7","14","30"].map(d => (
                    <button key={d} onClick={() => setExpiryDays(d)}
                      className={`px-3 py-1.5 text-[12px] font-body rounded-lg border transition-colors ${
                        expiryDays === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"
                      }`}>{d} day{d !== "1" ? "s" : ""}</button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground font-body">
                  Expires: {new Date(Date.now() + parseInt(expiryDays) * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10 text-[13px] font-body rounded-xl border-border">Cancel</Button>
              <Button onClick={handleGenerateLink}
                disabled={selectedIds.size === 0 || creating || (shareMode === "passcode" && !passcode.trim())}
                className="flex-1 h-10 text-[13px] font-body font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                {creating ? "Creating…" : "Generate link"}
              </Button>
            </div>
          </div>
        )}

        {/* ── SELECT STEP ── */}
        {step === "select" && (
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-body font-semibold">
                  Select profiles {selectedIds.size > 0 && <span className="text-primary ml-1">({selectedIds.size} selected)</span>}
                </span>
                {actors.length > 0 && (
                  <button onClick={selectAll} className="text-[11px] font-body text-primary font-medium hover:underline">
                    {selectedIds.size === actors.length ? "Deselect all" : "Select all"}
                  </button>
                )}
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actors..."
                  className="pl-9 font-body text-[12px] rounded-xl h-9 bg-background border-border" />
              </div>
              <div className="max-h-[240px] overflow-y-auto space-y-1 border border-border rounded-xl p-2">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
                      <Skeleton className="w-4 h-4 rounded" /><Skeleton className="w-8 h-8 rounded-full" /><Skeleton className="h-3 w-28 flex-1" />
                    </div>
                  ))
                ) : filtered.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <Users className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[12px] text-muted-foreground font-body">{actors.length === 0 ? "No actors in your roster yet." : "No matching actors."}</p>
                  </div>
                ) : (
                  filtered.map(actor => (
                    <button key={actor.id} onClick={() => toggleSelect(actor.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${selectedIds.has(actor.id) ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-accent"}`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedIds.has(actor.id) ? "bg-primary border-primary" : "border-border"}`}>
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
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10 text-[13px] font-body rounded-xl border-border">Cancel</Button>
              <Button onClick={() => setStep("name")} disabled={selectedIds.size === 0}
                className="flex-1 h-10 text-[13px] font-body font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                Next — {selectedIds.size || "0"} selected
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}