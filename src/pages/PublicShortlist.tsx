import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ExternalLink, Camera, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { useShortlistBySlug } from "@/hooks/use-data";
import { getStatusVariant } from "@/lib/helpers";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PublicShortlist = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { data: shortlist, isLoading } = useShortlistBySlug(slug!);

  // ── ALL hooks must be declared before any conditional return ──
  const hashedPc = searchParams.get("ph");
  const expiry = searchParams.get("exp");

  const [enteredPc, setEnteredPc] = useState("");
  const [manuallyUnlocked, setManuallyUnlocked] = useState(false);

  // Track view — always called, no conditional
  useEffect(() => {
    if (shortlist?.id && (!hashedPc || manuallyUnlocked)) {
      supabase.from("shortlist_views").insert({
        shortlist_id: shortlist.id,
        referrer: document.referrer || "Direct",
        ip: "",
      }).then(() => {});
    }
  }, [shortlist?.id, manuallyUnlocked]);

  // ── Derived values (not hooks) ──
  const isExpired = expiry ? Date.now() > parseInt(expiry) : false;
  const pcUnlocked = !hashedPc || manuallyUnlocked;
  const actorIds: string[] = shortlist?.actor_ids || [];

  const checkPasscode = (entered: string) => {
    if (!hashedPc) return true;
    try { return btoa(entered).replace(/=/g, "") === hashedPc; } catch { return false; }
  };

  const handleUnlock = () => {
    if (checkPasscode(enteredPc)) setManuallyUnlocked(true);
  };

  // ── Conditional renders (all hooks already called above) ──

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-[860px] w-full mx-auto px-8 py-12 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );

  if (!shortlist) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold mb-2">Shortlist not found</h1>
        <p className="text-muted-foreground font-body text-[13px]">This link may be invalid or expired.</p>
      </div>
    </div>
  );

  if (isExpired) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-xs">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="font-display text-xl font-bold mb-2">Link Expired</h1>
        <p className="text-[13px] text-muted-foreground font-body">Ask the talent manager for a new link.</p>
      </div>
    </div>
  );

  if (!pcUnlocked) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[320px] animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <span className="font-display text-primary-foreground text-sm font-bold">T</span>
          </div>
          <h1 className="font-display text-xl font-bold mb-1">Protected Shortlist</h1>
          <p className="text-[13px] text-muted-foreground font-body">Enter the passcode to view these profiles.</p>
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
          <Button onClick={handleUnlock} disabled={!enteredPc}
            className="w-full rounded-xl font-body text-[13px] h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
            Unlock
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Main content ──
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[860px] mx-auto px-6 py-12 animate-fade-in">
        <div className="mb-10">
          <p className="text-[11px] text-muted-foreground font-body uppercase tracking-wider mb-2">Talent Shortlist</p>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-2">{shortlist.name}</h1>
          {shortlist.description && <p className="text-[14px] text-muted-foreground font-body">{shortlist.description}</p>}
          <p className="text-[12px] text-muted-foreground font-body mt-2">{actorIds.length} profile{actorIds.length !== 1 ? "s" : ""}</p>
        </div>

        {actorIds.length === 0 ? (
          <p className="text-muted-foreground font-body text-[13px]">No talent added to this shortlist yet.</p>
        ) : (
          <ShortlistActors key={actorIds.join(",")} actorIds={actorIds} />
        )}

        <p className="text-center text-[11px] text-muted-foreground font-body mt-12">Powered by TAARA</p>
      </div>
    </div>
  );
};

// ── ShortlistActors ────────────────────────────────────────────
function ShortlistActors({ actorIds }: { actorIds: string[] }) {
  const [actors, setActors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!actorIds.length) { setLoading(false); return; }
    setLoading(true);
    const fetchActors = async () => {
      try {
        const { data, error } = await supabase
          .from("actors")
          .select("id, name, age, gender, type, status, location, height, hair, eyes, bio, reel_url, reel_urls, headshot_url, color, languages, skills, accents, slug, filmography(id, title, role, year, type), portfolio(id, title, category, image_url), works(id, project_name, role, director, year, type, status, description)")
          .in("id", actorIds);
        if (error) { setFetchError(error.message); setLoading(false); return; }
        const ordered = actorIds.map(id => (data || []).find((a: any) => a.id === id)).filter(Boolean);
        setActors(ordered);
      } catch (err: any) {
        setFetchError(err.message || "Failed to load profiles");
      } finally {
        setLoading(false);
      }
    };
    fetchActors();
  }, [actorIds.join(",")]);

  if (loading) return (
    <div className="space-y-4">
      {[1, 2].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
    </div>
  );

  if (fetchError) return (
    <div className="text-center py-12">
      <p className="text-[13px] text-destructive font-body mb-1">Failed to load profiles</p>
      <p className="text-[11px] text-muted-foreground font-body">{fetchError}</p>
    </div>
  );

  if (actors.length === 0) return (
    <div className="text-center py-12">
      <p className="text-[13px] text-muted-foreground font-body">No profiles found.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {actors.map((actor: any) => (
        <ActorCard key={actor.id} actor={actor} />
      ))}
    </div>
  );
}

// ── ActorCard ──────────────────────────────────────────────────
function ActorCard({ actor }: { actor: any }) {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const portfolio: any[] = actor.portfolio || [];
  const filmography: any[] = actor.filmography || [];
  const works: any[] = actor.works || [];
  const headshot = actor.headshot_url || portfolio[0]?.image_url;
  const reels: string[] = (actor.reel_urls?.filter(Boolean) || []).length > 0
    ? actor.reel_urls.filter(Boolean)
    : actor.reel_url ? [actor.reel_url] : [];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light" onClick={() => setLightboxImg(null)}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-5">
          {headshot ? (
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-border shrink-0 cursor-pointer hover:opacity-90" onClick={() => setLightboxImg(headshot)}>
              <img src={headshot} alt={actor.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0 text-xl font-display font-bold border border-border"
              style={{ backgroundColor: (actor.color || "#6366f1") + "15", color: actor.color || "#6366f1" }}>
              {actor.name.split(" ").map((n: string) => n[0]).join("")}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="font-display text-2xl font-bold">{actor.name}</h2>
              <Badge variant={getStatusVariant(actor.status)} className="text-[10px]">{actor.status}</Badge>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground font-body flex-wrap mb-2">
              {actor.age && <span>{actor.age}y · {actor.gender}</span>}
              {actor.type && <span className="font-medium">{actor.type}</span>}
              {actor.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{actor.location}</span>}
            </div>
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground font-body flex-wrap">
              {actor.height && <span>Height: <strong className="text-foreground">{actor.height}</strong></span>}
              {actor.hair && <span>Hair: <strong className="text-foreground">{actor.hair}</strong></span>}
              {actor.eyes && <span>Eyes: <strong className="text-foreground">{actor.eyes}</strong></span>}
            </div>
          </div>
        </div>
      </div>

      {actor.bio && <div className="px-6 pb-4"><p className="text-[13px] text-foreground/80 font-body leading-relaxed">{actor.bio}</p></div>}

      {(actor.languages?.length > 0 || actor.skills?.length > 0) && (
        <div className="px-6 pb-4 space-y-2">
          {actor.languages?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-body font-semibold text-muted-foreground">Languages:</span>
              {actor.languages.map((l: string) => <span key={l} className="text-[11px] px-2.5 py-0.5 rounded-full bg-accent font-body">{l}</span>)}
            </div>
          )}
          {actor.skills?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-body font-semibold text-muted-foreground">Skills:</span>
              {actor.skills.map((s: string) => <span key={s} className="text-[11px] px-2.5 py-0.5 rounded-full border border-primary/20 text-primary font-body">{s}</span>)}
            </div>
          )}
        </div>
      )}

      {portfolio.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[12px] font-body font-semibold text-muted-foreground">Portfolio ({portfolio.length})</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {portfolio.map((item: any) => {
              const imgUrl = item.image_url || item.imageUrl;
              return imgUrl ? (
                <div key={item.id} className="aspect-square rounded-xl overflow-hidden border border-border cursor-pointer hover:opacity-90 group"
                  onClick={() => setLightboxImg(imgUrl)}>
                  <img src={imgUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {reels.length > 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {reels.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-body text-muted-foreground hover:text-primary border border-border rounded-lg px-3 py-1.5 hover:bg-accent/30 transition-all">
              <ExternalLink className="h-3.5 w-3.5" />
              {reels.length > 1 ? `Showreel ${i + 1}` : "Watch Showreel"}
            </a>
          ))}
        </div>
      )}

      {(filmography.length > 0 || works.length > 0) && (
        <div className="border-t border-border">
          <button onClick={() => setShowMore(!showMore)}
            className="w-full flex items-center justify-between px-6 py-3 hover:bg-accent/30 transition-colors text-left">
            <span className="text-[12px] font-body font-semibold text-muted-foreground">
              {filmography.length > 0 && `${filmography.length} filmography credit${filmography.length !== 1 ? "s" : ""}`}
              {filmography.length > 0 && works.length > 0 && " · "}
              {works.length > 0 && `${works.length} work${works.length !== 1 ? "s" : ""}`}
            </span>
            {showMore ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {showMore && (
            <div className="px-6 pb-5 space-y-4">
              {filmography.length > 0 && (
                <div>
                  <p className="text-[12px] font-body font-semibold mb-2">Filmography</p>
                  <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                    {filmography.map((f: any) => (
                      <div key={f.id} className="flex items-center justify-between px-4 py-2.5 text-[13px] font-body">
                        <div><span className="font-medium">{f.title}</span>{f.role && <span className="text-muted-foreground ml-2 text-[12px]">as {f.role}</span>}</div>
                        <div className="flex items-center gap-2 shrink-0">
                          {f.year && <span className="text-muted-foreground text-[12px]">{f.year}</span>}
                          <span className="text-[10px] font-body text-muted-foreground px-2 py-0.5 rounded bg-accent">{f.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {works.length > 0 && (
                <div>
                  <p className="text-[12px] font-body font-semibold mb-2">Works</p>
                  <div className="space-y-2">
                    {works.map((w: any) => (
                      <div key={w.id} className="p-3 rounded-xl bg-accent/30 border border-border">
                        <p className="text-[13px] font-body font-semibold">{w.project_name}</p>
                        <p className="text-[12px] text-muted-foreground font-body">{w.role}{w.director ? ` · Dir. ${w.director}` : ""}{w.year ? ` · ${w.year}` : ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PublicShortlist;