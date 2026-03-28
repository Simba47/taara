import { useParams, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ExternalLink, Camera, Lock } from "lucide-react";
import { useActorBySlug } from "@/hooks/use-data";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Row = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="flex items-start justify-between px-4 py-2.5 text-[13px] font-body gap-4">
      <span className="text-muted-foreground shrink-0 w-24">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  ) : null;

const PublicProfile = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { data: actor, isLoading } = useActorBySlug(slug!);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // ── Passcode / expiry enforcement ──────────────────────────
  const requiredPc = searchParams.get("pc");       // legacy plain passcode
  const hashedPc = searchParams.get("ph");         // hashed passcode (base64)
  const expiry = searchParams.get("exp");          // expiry timestamp
  const hasToken = !!searchParams.get("token");

  // Check expiry
  const isExpired = !hasToken && expiry && Date.now() > parseInt(expiry);

  const [enteredPc, setEnteredPc] = useState("");
  const [manuallyUnlocked, setManuallyUnlocked] = useState(false);

  // Derived: open if no passcode needed, or if manually unlocked
  const needsPasscode = !hasToken && (!!requiredPc || !!hashedPc);
  const pcUnlocked = !needsPasscode || manuallyUnlocked;

  const checkPasscode = (entered: string) => {
    if (requiredPc) return entered === requiredPc;
    if (hashedPc) {
      try { return btoa(entered).replace(/=/g, "") === hashedPc; } catch { return false; }
    }
    return false;
  };

  const handleUnlock = () => {
    if (checkPasscode(enteredPc)) setManuallyUnlocked(true);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-[640px] w-full mx-auto px-6 py-16 space-y-6">
        <Skeleton className="h-24 w-24 rounded-2xl mx-auto" />
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );

  if (!actor) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <h1 className="font-display text-2xl font-bold mb-2">Profile Not Found</h1>
        <p className="text-[13px] text-muted-foreground font-body">This link is invalid.</p>
      </div>
    </div>
  );

  // ── Expired link ───────────────────────────────────────────
  if (isExpired) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-xs animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="font-display text-xl font-bold mb-2">Link Expired</h1>
        <p className="text-[13px] text-muted-foreground font-body">This profile link has expired. Ask the talent manager for a new link.</p>
      </div>
    </div>
  );

  // ── Passcode gate ──────────────────────────────────────────
  if (!pcUnlocked) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[320px] animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <span className="font-display text-primary-foreground text-sm font-bold">T</span>
          </div>
          <h1 className="font-display text-xl font-bold mb-1">Protected Profile</h1>
          <p className="text-[13px] text-muted-foreground font-body">Enter the passcode to view this profile.</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input value={enteredPc} onChange={e => setEnteredPc(e.target.value)}
              placeholder="Enter passcode" type="password"
              className="pl-9 font-body text-[13px] rounded-xl h-10 bg-background border-border"
              onKeyDown={e => { if (e.key === "Enter") handleUnlock(); }} />
          </div>
          {enteredPc && !checkPasscode(enteredPc) && (
            <p className="text-[11px] text-destructive font-body">Incorrect passcode</p>
          )}
          <Button onClick={handleUnlock}
            disabled={!enteredPc} className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
            Unlock Profile
          </Button>
        </div>
      </div>
    </div>
  );

  const portfolioItems: any[] = actor.portfolio || [];
  const reelUrls: string[] = actor.reel_urls || (actor.reel_url ? [actor.reel_url] : []);

  return (
    <div className="min-h-screen bg-background">
      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light" onClick={() => setLightboxImg(null)}>×</button>
        </div>
      )}

      <div className="max-w-[640px] mx-auto px-6 py-12 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          {actor.headshot_url ? (
            <div className="w-28 h-28 rounded-2xl overflow-hidden border border-border mx-auto mb-4 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightboxImg(actor.headshot_url)}>
              <img src={actor.headshot_url} alt={actor.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-28 h-28 rounded-2xl flex items-center justify-center border border-border mx-auto mb-4" style={{ backgroundColor: (actor.color || "#6366f1") + "15", color: actor.color || "#6366f1" }}>
              <span className="text-3xl font-display font-bold">{actor.name.split(" ").map((n: string) => n[0]).join("")}</span>
            </div>
          )}
          <h1 className="font-display text-[30px] font-bold tracking-tight">{actor.name}</h1>
          {actor.location && <p className="text-muted-foreground font-body text-[13px] mt-1.5 flex items-center justify-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {actor.location}</p>}
          <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
            {actor.type && <span className="text-[12px] text-muted-foreground font-body px-2.5 py-0.5 rounded-full bg-card border border-border">{actor.type}</span>}
            {actor.age && <span className="text-[12px] text-muted-foreground font-body">{actor.age} yrs</span>}
            {actor.gender && <span className="text-[12px] text-muted-foreground font-body">{actor.gender}</span>}
          </div>
        </div>

        {actor.bio && <p className="text-[14px] text-foreground/80 font-body leading-[1.8] text-center mb-8">{actor.bio}</p>}

        {/* Portfolio gallery */}
        {portfolioItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="font-display text-base font-semibold">Portfolio</h2>
              <span className="text-[11px] text-muted-foreground font-body">({portfolioItems.length} photos)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {portfolioItems.map((item: any) => {
                const imgUrl = item.image_url || item.imageUrl;
                return imgUrl ? (
                  <div key={item.id} className="aspect-[4/5] rounded-xl overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity group relative" onClick={() => setLightboxImg(imgUrl)}>
                    <img src={imgUrl} alt={item.title || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    {item.title && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="absolute bottom-2 left-2 right-2 text-white text-[11px] font-body font-medium truncate">{item.title}</p>
                      </div>
                    )}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-2.5 border-b border-border"><h2 className="font-body text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Details</h2></div>
          <div className="divide-y divide-border">
            <Row label="Height" value={actor.height} />
            <Row label="Hair" value={actor.hair} />
            <Row label="Eyes" value={actor.eyes} />
            {actor.languages?.length > 0 && <Row label="Languages" value={actor.languages.join(", ")} />}
            {actor.accents?.length > 0 && <Row label="Accents" value={actor.accents.join(", ")} />}
          </div>
        </div>

        {actor.skills?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-body text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">{actor.skills.map((s: string) => <span key={s} className="px-3 py-1 bg-card border border-border rounded-full text-[12px] font-body">{s}</span>)}</div>
          </div>
        )}

        {actor.filmography?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-body text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Filmography</h2>
            <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
              {actor.filmography.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between px-4 py-2.5 text-[13px] font-body">
                  <div><span className="font-medium">{f.title}</span>{f.role && <span className="text-muted-foreground ml-2 text-[12px]">as {f.role}</span>}</div>
                  <span className="text-muted-foreground text-[12px] shrink-0">{f.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {actor.works?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-body text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Works</h2>
            <div className="space-y-2">
              {actor.works.map((w: any) => (
                <div key={w.id} className="p-3 rounded-xl bg-card border border-border">
                  <p className="text-[13px] font-body font-semibold">{w.project_name || w.projectName}</p>
                  <p className="text-[12px] text-muted-foreground font-body">{w.role}{w.director ? ` · Dir. ${w.director}` : ""}{w.year ? ` · ${w.year}` : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multiple Reels */}
        {reelUrls.length > 0 && (
          <div className="space-y-2">
            {reelUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 h-11 w-full rounded-xl border border-border bg-card text-[13px] font-body font-medium hover:text-primary transition-colors">
                <ExternalLink className="h-3.5 w-3.5" /> {reelUrls.length > 1 ? `Showreel ${i + 1}` : "View Showreel"}
              </a>
            ))}
          </div>
        )}

        <p className="text-center text-[11px] text-muted-foreground font-body mt-10">Powered by TAARA</p>
      </div>
    </div>
  );
};

export default PublicProfile;