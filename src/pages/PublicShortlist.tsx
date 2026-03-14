import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ExternalLink, Camera, ChevronDown, ChevronUp } from "lucide-react";
import { useShortlistBySlug } from "@/hooks/use-data";
import { getStatusVariant } from "@/lib/helpers";
import { supabase } from "@/lib/supabase";

const PublicShortlist = () => {
  const { slug } = useParams();
  const { data: shortlist, isLoading } = useShortlistBySlug(slug!);
  const actorIds: string[] = shortlist?.actor_ids || shortlist?.actorIds || [];

  useEffect(() => {
    if (shortlist?.id) {
      supabase.from("shortlist_views").insert({
        shortlist_id: shortlist.id,
        referrer: document.referrer || "Direct",
        ip: "",
      }).then(() => {});
    }
  }, [shortlist?.id]);

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
          <ShortlistActors actorIds={actorIds} />
        )}

        <p className="text-center text-[11px] text-muted-foreground font-body mt-12">Powered by TAARA</p>
      </div>
    </div>
  );
};

function ShortlistActors({ actorIds }: { actorIds: string[] }) {
  const [actors, setActors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actorIds.length) { setLoading(false); return; }
    supabase
      .from("actors")
      .select("*, filmography(*), portfolio(*), works(*)")
      .in("id", actorIds)
      .then(({ data }) => {
        // Preserve the order of actorIds
        const ordered = actorIds
          .map(id => (data || []).find((a: any) => a.id === id))
          .filter(Boolean);
        setActors(ordered);
        setLoading(false);
      });
  }, [actorIds.join(",")]);

  if (loading) return (
    <div className="space-y-4">
      {[1,2].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
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

function ActorCard({ actor }: { actor: any }) {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const portfolio: any[] = actor.portfolio || [];
  const filmography: any[] = actor.filmography || [];
  const works: any[] = actor.works || [];
  const headshot = actor.headshot_url || portfolio[0]?.image_url || portfolio[0]?.imageUrl;

  const workStatusColor = (s: string) => {
    if (s === "Released") return "bg-emerald-100 text-emerald-700";
    if (s === "Post-Production") return "bg-amber-100 text-amber-700";
    if (s === "In Production") return "bg-blue-100 text-blue-700";
    return "bg-purple-100 text-purple-700";
  };

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
          {/* Headshot */}
          {headshot ? (
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-border shrink-0 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightboxImg(headshot)}>
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
            {/* Physical details inline */}
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground font-body flex-wrap">
              {actor.height && <span>Height: <strong className="text-foreground">{actor.height}</strong></span>}
              {actor.hair && <span>Hair: <strong className="text-foreground">{actor.hair}</strong></span>}
              {actor.eyes && <span>Eyes: <strong className="text-foreground">{actor.eyes}</strong></span>}
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {actor.bio && (
        <div className="px-6 pb-4">
          <p className="text-[13px] text-foreground/80 font-body leading-relaxed">{actor.bio}</p>
        </div>
      )}

      {/* Languages + Skills */}
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

      {/* Portfolio gallery */}
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
                <div key={item.id} className="aspect-square rounded-xl overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity group relative"
                  onClick={() => setLightboxImg(imgUrl)}>
                  <img src={imgUrl} alt={item.title || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Reel */}
      {actor.reel_url && (
        <div className="px-6 pb-4">
          <a href={actor.reel_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-body font-medium text-primary hover:text-primary/80 transition-colors">
            <ExternalLink className="h-3.5 w-3.5" /> Watch Showreel
          </a>
        </div>
      )}

      {/* Filmography + Works — expandable */}
      {(filmography.length > 0 || works.length > 0) && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowMore(!showMore)}
            className="w-full flex items-center justify-between px-6 py-3 hover:bg-accent/30 transition-colors text-left"
          >
            <span className="text-[12px] font-body font-semibold text-muted-foreground">
              {filmography.length > 0 && `${filmography.length} filmography credit${filmography.length !== 1 ? "s" : ""}`}
              {filmography.length > 0 && works.length > 0 && " · "}
              {works.length > 0 && `${works.length} work${works.length !== 1 ? "s" : ""}`}
            </span>
            {showMore ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {showMore && (
            <div className="px-6 pb-5 space-y-4">
              {/* Filmography */}
              {filmography.length > 0 && (
                <div>
                  <p className="text-[12px] font-body font-semibold mb-2">Filmography</p>
                  <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                    {filmography.map((f: any) => (
                      <div key={f.id} className="flex items-center justify-between px-4 py-2.5 text-[13px] font-body">
                        <div>
                          <span className="font-medium">{f.title}</span>
                          {f.role && <span className="text-muted-foreground ml-2 text-[12px]">as {f.role}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {f.year && <span className="text-muted-foreground text-[12px]">{f.year}</span>}
                          <span className="text-[10px] font-body text-muted-foreground px-2 py-0.5 rounded bg-accent">{f.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Works */}
              {works.length > 0 && (
                <div>
                  <p className="text-[12px] font-body font-semibold mb-2">Works</p>
                  <div className="space-y-2">
                    {works.map((w: any) => (
                      <div key={w.id} className="p-3 rounded-xl bg-accent/30 border border-border">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-[13px] font-body font-semibold">{w.project_name || w.projectName}</p>
                          <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full ${workStatusColor(w.status)}`}>{w.status}</span>
                        </div>
                        <p className="text-[12px] text-muted-foreground font-body">
                          {w.role && `${w.role}`}{w.director && ` · Dir. ${w.director}`}{w.year && ` · ${w.year}`}
                        </p>
                        {w.description && <p className="text-[12px] text-muted-foreground font-body mt-1 leading-relaxed">{w.description}</p>}
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
