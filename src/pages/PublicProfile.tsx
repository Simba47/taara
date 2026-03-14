import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ExternalLink, Camera } from "lucide-react";
import { useActorBySlug } from "@/hooks/use-data";
import { useState } from "react";

const Row = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="flex items-start justify-between px-4 py-2.5 text-[13px] font-body gap-4">
      <span className="text-muted-foreground shrink-0 w-24">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  ) : null;

const PublicProfile = () => {
  const { slug } = useParams();
  const { data: actor, isLoading } = useActorBySlug(slug!);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-[640px] w-full mx-auto px-6 py-16 space-y-6">
        <Skeleton className="h-24 w-24 rounded-2xl mx-auto" />
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );

  if (!actor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <h1 className="font-display text-2xl font-bold mb-2">Profile Not Available</h1>
          <p className="text-[13px] text-muted-foreground font-body">This profile doesn't exist or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const portfolioItems: any[] = actor.portfolio || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} alt="Portfolio" className="max-w-full max-h-full object-contain rounded-lg" />
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light"
            onClick={() => setLightboxImg(null)}
          >×</button>
        </div>
      )}

      <div className="max-w-[640px] mx-auto px-6 py-12 animate-fade-in">

        {/* Header */}
        <div className="text-center mb-10">
          {actor.headshot_url ? (
            <div
              className="w-28 h-28 rounded-2xl overflow-hidden border border-border mx-auto mb-4 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLightboxImg(actor.headshot_url)}
            >
              <img src={actor.headshot_url} alt={actor.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="w-28 h-28 rounded-2xl flex items-center justify-center border border-border mx-auto mb-4"
              style={{ backgroundColor: (actor.color || "#6366f1") + "15", color: actor.color || "#6366f1" }}
            >
              <span className="text-3xl font-display font-bold">
                {actor.name.split(" ").map((n: string) => n[0]).join("")}
              </span>
            </div>
          )}

          <h1 className="font-display text-[30px] font-bold tracking-tight">{actor.name}</h1>
          {actor.location && (
            <p className="text-muted-foreground font-body text-[13px] mt-1.5 flex items-center justify-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {actor.location}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
            {actor.type && <span className="text-[12px] text-muted-foreground font-body px-2.5 py-0.5 rounded-full bg-card border border-border">{actor.type}</span>}
            {actor.age && <span className="text-[12px] text-muted-foreground font-body">{actor.age} yrs</span>}
            {actor.gender && <span className="text-[12px] text-muted-foreground font-body">{actor.gender}</span>}
          </div>
        </div>

        {/* Bio */}
        {actor.bio && (
          <p className="text-[14px] text-foreground/80 font-body leading-[1.8] text-center mb-8">{actor.bio}</p>
        )}

        {/* Portfolio gallery — visible to anyone with the link */}
        {portfolioItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="font-display text-base font-semibold">Portfolio</h2>
              <span className="text-[11px] text-muted-foreground font-body">({portfolioItems.length} photos)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {portfolioItems.map((item: any) => {
                const imgUrl = item.imageUrl || item.image_url;
                return (
                  <div
                    key={item.id}
                    className="group relative rounded-xl overflow-hidden border border-border bg-accent/30 aspect-[4/5] cursor-pointer"
                    onClick={() => imgUrl && setLightboxImg(imgUrl)}
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={item.title || "Portfolio photo"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                    {(item.title || item.category) && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          {item.title && <p className="text-white text-[11px] font-body font-semibold truncate">{item.title}</p>}
                          {item.category && <p className="text-white/70 text-[10px] font-body">{item.category}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-2.5 border-b border-border">
            <h2 className="font-body text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Details</h2>
          </div>
          <div className="divide-y divide-border">
            <Row label="Height" value={actor.height} />
            <Row label="Hair" value={actor.hair} />
            <Row label="Eyes" value={actor.eyes} />
            {actor.languages?.length > 0 && <Row label="Languages" value={actor.languages.join(", ")} />}
            {actor.accents?.length > 0 && <Row label="Accents" value={actor.accents.join(", ")} />}
          </div>
        </div>

        {/* Skills */}
        {actor.skills?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-body text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {actor.skills.map((s: string) => (
                <span key={s} className="px-3 py-1 bg-card border border-border rounded-full text-[12px] font-body">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Filmography */}
        {actor.filmography?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-body text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Filmography</h2>
            <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
              {actor.filmography.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between px-4 py-2.5 text-[13px] font-body">
                  <div>
                    <span className="font-medium">{f.title}</span>
                    {f.role && <span className="text-muted-foreground ml-2 text-[12px]">as {f.role}</span>}
                  </div>
                  <span className="text-muted-foreground text-[12px] shrink-0">{f.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reel */}
        {actor.reel_url && (
          <a
            href={actor.reel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-11 w-full rounded-xl border border-border bg-card text-[13px] font-body font-medium hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View Showreel
          </a>
        )}

        <p className="text-center text-[11px] text-muted-foreground font-body mt-10">Powered by TAARA</p>
      </div>
    </div>
  );
};

export default PublicProfile;
