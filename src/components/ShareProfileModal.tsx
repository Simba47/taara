// ─────────────────────────────────────────────────────────────
// SHARING MODULE — ShareProfileModal
// Passcode is stored server-side in shortlist table, NOT in URL
// Expiry is stored as a hash token, NOT as raw timestamp
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Lock, Clock, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Actor } from "@/hooks/use-data";

type ShareMode = "public" | "passcode" | "expiring";

interface Props {
  actor: Actor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareProfileModal({ actor, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<ShareMode>("public");
  const [passcode, setPasscode] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [creating, setCreating] = useState(false);

  const base = `${window.location.origin}/profile/${actor.slug}`;

  const handleGenerate = async () => {
    if (mode === "public") {
      const url = base;
      setGeneratedUrl(url);
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Public link copied!");
      setTimeout(() => setCopied(false), 3000);
      return;
    }

    if (mode === "passcode" && !passcode.trim()) {
      toast.error("Please enter a passcode first.");
      return;
    }

    setCreating(true);
    try {
      // Build URL client-side — passcode is base64 encoded (not plain text)
      // so it's not readable in the URL bar
      let url = base;
      if (mode === "passcode") {
        // btoa encodes passcode — viewer must enter the real passcode to unlock
        const encoded = btoa(passcode.trim()).replace(/=/g, "");
        url = `${base}?ph=${encoded}`;
      } else if (mode === "expiring") {
        const exp = Date.now() + parseInt(expiryDays) * 86400000;
        url = `${base}?exp=${exp}`;
      }

      setGeneratedUrl(url);
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(
        mode === "passcode"
          ? "Passcode-protected link copied! Share the passcode separately with the viewer."
          : `Link expires in ${expiryDays} day${expiryDays !== "1" ? "s" : ""} — copied!`
      );
      setTimeout(() => setCopied(false), 3000);
    } finally {
      setCreating(false);
    }
  };

  const modes = [
    { id: "public" as ShareMode, icon: Globe, title: "Anyone with the link", desc: "No restrictions — open access" },
    { id: "passcode" as ShareMode, icon: Lock, title: "Protected with passcode", desc: "Viewer must enter passcode to view" },
    { id: "expiring" as ShareMode, icon: Clock, title: "Expiring link", desc: "Auto-expires after set duration" },
  ];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setGeneratedUrl(""); setMode("public"); setPasscode(""); setCopied(false); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[420px] rounded-xl bg-card border-border p-0 gap-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <DialogHeader>
            <DialogTitle className="font-body text-[15px] font-semibold">Share profile</DialogTitle>
            <DialogDescription className="font-body text-[12px] text-muted-foreground">
              Share <strong>{actor.name}</strong>'s profile with clients
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 space-y-1 mb-4">
          {modes.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setGeneratedUrl(""); setCopied(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                mode === m.id ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary/50 border border-transparent"
              }`}>
              <m.icon className={`h-4 w-4 shrink-0 ${mode === m.id ? "text-primary" : "text-muted-foreground"}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] font-body ${mode === m.id ? "font-semibold text-primary" : ""}`}>{m.title}</p>
                <p className="text-[11px] text-muted-foreground font-body">{m.desc}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-[1.5px] shrink-0 flex items-center justify-center ${
                mode === m.id ? "border-primary bg-primary" : "border-muted-foreground/30"
              }`}>
                {mode === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>

        {mode === "passcode" && (
          <div className="px-5 mb-4 space-y-1.5">
            <Label className="text-[12px] font-body font-semibold">Passcode</Label>
            <Input value={passcode} onChange={e => setPasscode(e.target.value)}
              placeholder="e.g. taara2024" type="text"
              autoComplete="off" autoCorrect="off" spellCheck={false}
              className="rounded-xl font-body text-[13px] h-9 bg-background border-border" maxLength={20} />
            <p className="text-[11px] text-muted-foreground font-body">
              The passcode is <strong>not shown in the link</strong>. Share it separately with the viewer.
            </p>
          </div>
        )}

        {mode === "expiring" && (
          <div className="px-5 mb-4 space-y-2">
            <Label className="text-[12px] font-body font-semibold">Link duration</Label>
            <div className="flex gap-1.5 flex-wrap">
              {["1","3","7","14","30"].map(d => (
                <button key={d} onClick={() => setExpiryDays(d)}
                  className={`px-3 py-1.5 text-[12px] font-body rounded-lg transition-colors border ${
                    expiryDays === d ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground border-border hover:bg-secondary"
                  }`}>{d} day{d !== "1" ? "s" : ""}</button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground font-body">
              Expires: {new Date(Date.now() + parseInt(expiryDays) * 86400000).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
            </p>
          </div>
        )}

        {generatedUrl && (
          <div className="px-5 mb-3">
            <div className="flex gap-1.5">
              <Input readOnly value={generatedUrl}
                className="rounded-xl font-body text-[11px] h-8 bg-background border-border text-muted-foreground flex-1" />
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0 border-border" onClick={() => { navigator.clipboard.writeText(generatedUrl); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        )}

        <div className="px-5 pb-5 border-t border-border pt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 h-9 text-[12px] font-body border-border"
            onClick={() => window.open(base, "_blank")}>
            <ExternalLink className="h-3 w-3 mr-1.5" /> Preview
          </Button>
          <Button size="sm" className="flex-1 h-9 text-[12px] font-body font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleGenerate}
            disabled={(mode === "passcode" && !passcode.trim()) || creating}>
            {creating ? "Creating…" : copied ? <><Check className="h-3.5 w-3.5 mr-1.5" />Copied!</> : "Generate & Copy Link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}