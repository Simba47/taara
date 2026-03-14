import { useState } from "react";
import { Link2, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface InviteActorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InviteActorModal = ({ open, onOpenChange }: InviteActorModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/register`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share this link with actors to let them create their profile." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Invite Actors</DialogTitle>
          <DialogDescription className="font-body text-[13px]">
            Share this link with actors so they can fill in their own profile details and join your roster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={inviteLink}
              className="font-body text-[13px] rounded-xl h-10 bg-accent/50 border-border"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              className="h-10 rounded-xl font-body text-[13px] font-medium border-border shrink-0"
            >
              {copied ? (
                <><CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" /> Copied</>
              ) : (
                <><Copy className="h-4 w-4 mr-1.5" /> Copy</>
              )}
            </Button>
          </div>

          <div className="bg-accent/30 rounded-xl p-4 space-y-2">
            <p className="text-[12px] font-body font-semibold text-foreground">How it works:</p>
            <ol className="text-[12px] font-body text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Share the link with actors via WhatsApp, email, or SMS</li>
              <li>Actors fill in their profile — basic info, bio, filmography, and portfolio</li>
              <li>Their profile is submitted for your review</li>
              <li>You approve and add them to the roster</li>
            </ol>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link2 className="h-4 w-4 text-primary shrink-0" />
            <p className="text-[11px] font-body text-muted-foreground">
              This link is always active. Actors can register anytime.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
