import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Lock, Clock, Copy, Check, ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";
import type { Actor } from "@/hooks/use-data";

type ShareMode = "public" | "passcode" | "expiring";

interface ShareProfileModalProps {
  actor: Actor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareProfileModal({ actor, open, onOpenChange }: ShareProfileModalProps) {
  const [mode, setMode] = useState<ShareMode>("public");
  const [passcode, setPasscode] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const profileUrl = `${baseUrl}/profile/${actor.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    toast.success(
      mode === "public"
        ? "Public link is active"
        : mode === "passcode"
        ? "Passcode-protected link created"
        : `Link expires in ${expiryDays} days`
    );
    onOpenChange(false);
  };

  const modes: { id: ShareMode; icon: typeof Globe; title: string; desc: string }[] = [
    { id: "public", icon: Globe, title: "Anyone with the link", desc: "No restrictions — open access" },
    { id: "passcode", icon: Lock, title: "Protected with passcode", desc: "Require a passcode to view" },
    { id: "expiring", icon: Clock, title: "Expiring link", desc: "Auto-expires after set duration" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-lg bg-card border-border p-0 gap-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <DialogHeader>
            <DialogTitle className="font-body text-[15px] font-semibold">Share to web</DialogTitle>
            <DialogDescription className="font-body text-[12px] text-muted-foreground">
              Publish {actor.name}'s profile
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Profile preview */}
        <div className="mx-5 mb-4 flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-[11px] font-display font-semibold">
            {actor.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-body truncate">{actor.name}</p>
            <p className="text-[11px] text-muted-foreground font-body">{actor.type}</p>
          </div>
          {actor.profileVisible && (
            <span className="text-[10px] text-status-available font-body flex items-center gap-0.5">
              <Eye className="h-2.5 w-2.5" /> Live
            </span>
          )}
        </div>

        {/* Modes */}
        <div className="px-5 space-y-1 mb-4">
          {modes.map((m) => {
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isActive ? "bg-secondary border border-border" : "hover:bg-secondary/50 border border-transparent"
                }`}
              >
                <m.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-body ${isActive ? "font-medium" : ""}`}>{m.title}</p>
                  <p className="text-[11px] text-muted-foreground font-body">{m.desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all ${
                  isActive ? "border-foreground bg-foreground" : "border-muted-foreground/30"
                }`}>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-card" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Conditional */}
        {mode === "passcode" && (
          <div className="px-5 mb-4 animate-fade-in">
            <Label className="text-[11px] font-body text-muted-foreground mb-1.5 block">Passcode</Label>
            <Input type="text" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Enter passcode..." className="rounded-lg font-body text-[13px] h-8 bg-background border-border" maxLength={20} />
            <p className="text-[11px] text-muted-foreground font-body mt-1.5">Share separately with viewers</p>
          </div>
        )}

        {mode === "expiring" && (
          <div className="px-5 mb-4 animate-fade-in">
            <Label className="text-[11px] font-body text-muted-foreground mb-1.5 block">Duration</Label>
            <div className="flex gap-1.5">
              {["1", "3", "7", "14", "30"].map((d) => (
                <button key={d} onClick={() => setExpiryDays(d)}
                  className={`px-2.5 py-1 text-[12px] font-body rounded-md transition-colors ${
                    expiryDays === d ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >{d}d</button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground font-body mt-1.5">Expires in {expiryDays} day{expiryDays !== "1" ? "s" : ""}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
          <div className="flex gap-1.5">
            <Input readOnly value={profileUrl} className="rounded-lg font-body text-[12px] h-8 bg-background border-border text-muted-foreground flex-1" />
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0 border-border" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-status-available" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 h-8 text-[12px] font-body border-border" onClick={() => window.open(profileUrl, "_blank")}>
              <ExternalLink className="h-3 w-3 mr-1" /> Preview
            </Button>
            <Button size="sm" className="flex-1 h-8 text-[12px] font-body" onClick={handleShare} disabled={mode === "passcode" && passcode.length === 0}>
              {mode === "public" ? "Publish" : "Create Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
