import { useState } from "react";
import { Send, Check, Search, MessageSquare, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getStatusVariant } from "@/lib/helpers";
import { useToast } from "@/hooks/use-toast";
import { useActors } from "@/hooks/use-data";

interface BulkMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedIds?: string[];
}

export const BulkMessageModal = ({ open, onOpenChange, preSelectedIds = [] }: BulkMessageModalProps) => {
  const { toast } = useToast();
  const { data: actors = [], isLoading } = useActors();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preSelectedIds));
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("whatsapp");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const filtered = actors.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
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

  const handleSend = () => {
    if (selectedIds.size === 0 || !message.trim()) {
      toast({ title: "Missing info", description: "Select actors and write a message.", variant: "destructive" });
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast({ title: "Messages sent!", description: `Sent to ${selectedIds.size} actor(s) via ${channel}.` });
      onOpenChange(false);
      setMessage("");
      setSelectedIds(new Set());
    }, 1200);
  };

  const templates = [
    { label: "Availability Check", text: "Hi {name}, are you available for a shoot on [DATE]? Please confirm at your earliest convenience." },
    { label: "Audition Notice", text: "Hi {name}, you have an audition for [PROJECT] on [DATE] at [TIME]. Location: [LOCATION]. Please confirm attendance." },
    { label: "General Update", text: "Hi {name}, we have an exciting update regarding [PROJECT]. Please check your dashboard for details." },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl glass-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Bulk Message</DialogTitle>
          <DialogDescription className="font-body text-[13px]">Send messages to multiple actors at once via WhatsApp, Email, or SMS.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-body font-semibold text-muted-foreground">Channel:</span>
            {[
              { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
              { id: "email", label: "Email", icon: Mail },
              { id: "sms", label: "SMS", icon: Phone },
            ].map((ch) => (
              <button
                key={ch.id}
                onClick={() => setChannel(ch.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-body font-medium transition-all ${
                  channel === ch.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                <ch.icon className="h-3.5 w-3.5" />
                {ch.label}
              </button>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-body font-semibold">
                Select Actors ({selectedIds.size}{actors.length > 0 ? ` of ${actors.length}` : ""})
              </span>
              {actors.length > 0 && (
                <button onClick={selectAll} className="text-[11px] font-body text-primary font-medium hover:underline">
                  {selectedIds.size === actors.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter actors..." className="pl-9 font-body text-[12px] rounded-lg h-8 bg-background border-border" />
            </div>
            <div className="max-h-[160px] overflow-y-auto space-y-1 border border-border rounded-xl p-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-[12px] text-muted-foreground font-body">
                  {actors.length === 0 ? "No actors in your roster yet. Add talent first." : "No matching actors."}
                </div>
              ) : (
                filtered.map((actor) => (
                  <button
                    key={actor.id}
                    onClick={() => toggleSelect(actor.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                      selectedIds.has(actor.id) ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-accent"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${selectedIds.has(actor.id) ? "bg-primary border-primary" : "border-border"}`}>
                      {selectedIds.has(actor.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-display font-bold ring-1 ring-border shrink-0"
                      style={{ backgroundColor: (actor.color || "#6366f1") + "12", color: actor.color || "#6366f1" }}>
                      {actor.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <span className="text-[12px] font-body font-medium flex-1 truncate">{actor.name}</span>
                    <Badge variant={getStatusVariant(actor.status)} className="text-[8px] shrink-0">{actor.status}</Badge>
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <span className="text-[12px] font-body font-semibold block mb-2">Quick Templates</span>
            <div className="flex gap-2 flex-wrap">
              {templates.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setMessage(t.text)}
                  className="text-[11px] font-body font-medium px-3 py-1.5 rounded-full bg-accent hover:bg-accent/80 text-foreground transition-all"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[12px] font-body font-semibold block mb-1.5">Message</span>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message... Use {name} for personalization."
              rows={4}
              className="font-body text-[13px] rounded-xl bg-background border-border resize-none"
            />
            <p className="text-[10px] text-muted-foreground font-body mt-1">Use <code className="bg-accent px-1 rounded">{"{name}"}</code> to personalize each message.</p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 rounded-xl font-body text-[13px] border-border">Cancel</Button>
            <Button onClick={handleSend} disabled={sending || selectedIds.size === 0} className="h-10 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : `Send to ${selectedIds.size} Actor${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
