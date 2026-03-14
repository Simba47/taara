import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, Share2, Edit, Eye, EyeOff, MapPin, ChevronRight, Film, Camera, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusVariant, getEventVariant } from "@/lib/helpers";
import { ShareProfileModal } from "@/components/ShareProfileModal";
import { EditActorModal } from "@/components/EditActorModal";
import { ActorAvailabilityCalendar } from "@/components/ActorAvailabilityCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useActor } from "@/hooks/use-data";
import { useCalendarEvents } from "@/hooks/use-data";

const ActorProfile = () => {
  const { id } = useParams();
  const { data: actor, isLoading } = useActor(id!);
  const { data: allEvents = [] } = useCalendarEvents();
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [portfolioFilter, setPortfolioFilter] = useState<string>("All");

  if (isLoading) return (
    <div className="max-w-[1100px] mx-auto px-8 py-10 space-y-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid lg:grid-cols-3 gap-6"><Skeleton className="lg:col-span-2 h-96 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>
    </div>
  );

  if (!actor) return (
    <div className="p-12 text-center">
      <p className="text-muted-foreground font-body text-sm">Actor not found</p>
      <Link to="/roster" className="text-sm text-primary underline mt-3 inline-block font-body">Back to Roster</Link>
    </div>
  );

  const actorEvents = allEvents.filter((e) => e.actorId === actor.id || e.actor_id === actor.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const bookedDates = actorEvents.map((e) => e.date);
  const portfolioItems = actor.portfolio || [];
  const portfolioCategories = ["All", ...new Set(portfolioItems.map((p) => p.category))];
  const filteredPortfolio = portfolioFilter === "All" ? portfolioItems : portfolioItems.filter((p) => p.category === portfolioFilter);

  const workStatusColor = (status: string) => {
    switch (status) {
      case "Released": return "bg-emerald-500/15 text-emerald-700 border-emerald-200";
      case "Post-Production": return "bg-amber-500/15 text-amber-700 border-amber-200";
      case "In Production": return "bg-blue-500/15 text-blue-700 border-blue-200";
      case "Upcoming": return "bg-purple-500/15 text-purple-700 border-purple-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-10 animate-fade-in">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/roster" className="text-[12px] text-muted-foreground hover:text-primary font-body font-medium transition-colors">Roster</Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        <span className="text-[12px] font-body font-semibold text-foreground">{actor.name}</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-9 text-[12px] font-body font-medium border-border rounded-xl" onClick={() => setEditOpen(true)}>
          <Edit className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} /> Edit
        </Button>
        <Button variant="outline" size="sm" className="h-9 text-[12px] font-body font-medium border-border rounded-xl" onClick={() => setShareOpen(true)}>
          <Share2 className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} /> Share
        </Button>
      </div>

      <div className="glass-card p-8 mb-8">
        <div className="flex items-center gap-6">
          {actor.headshot_url ? (
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 ring-1 ring-border">
              <img src={actor.headshot_url} alt={actor.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-border" style={{ backgroundColor: (actor.color || "#6366f1") + "12", color: actor.color || "#6366f1" }}>
              <span className="text-2xl font-display font-bold">{actor.name.split(" ").map((n: string) => n[0]).join("")}</span>
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">{actor.name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={getStatusVariant(actor.status)} className="text-[10px]">{actor.status}</Badge>
              <span className="text-[13px] text-muted-foreground font-body font-medium">{actor.type}</span>
              {actor.location && <span className="text-[13px] text-muted-foreground font-body flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />{actor.location}</span>}
              {actor.profile_visible ? (
                <span className="text-[12px] text-status-available font-body font-medium flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> Live</span>
              ) : (
                <span className="text-[12px] text-muted-foreground font-body flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} /> Hidden</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start bg-card/60 backdrop-blur-sm border border-border rounded-xl p-1 h-auto">
              <TabsTrigger value="overview" className="font-body text-[12px] font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
              <TabsTrigger value="portfolio" className="font-body text-[12px] font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Camera className="h-3.5 w-3.5 mr-1.5" />Portfolio ({portfolioItems.length})
              </TabsTrigger>
              <TabsTrigger value="works" className="font-body text-[12px] font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clapperboard className="h-3.5 w-3.5 mr-1.5" />Works ({(actor.works || []).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <ActorAvailabilityCalendar actorId={actor.id} actorColor={actor.color || "#6366f1"} bookedDates={bookedDates} />
              {actor.bio && (
                <div className="glass-card p-6">
                  <h2 className="font-display text-lg font-bold mb-4">Biography</h2>
                  <p className="text-[13px] text-muted-foreground font-body leading-[1.8]">{actor.bio}</p>
                </div>
              )}
              <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border"><h2 className="font-display text-lg font-bold">Filmography</h2></div>
                {(actor.filmography || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body py-8 text-center">No entries yet</p>
                ) : (
                  <div className="divide-y divide-border">
                    {(actor.filmography || []).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-accent/50 transition-colors">
                        <div><p className="text-[13px] font-body font-semibold">{entry.title}</p><p className="text-[12px] text-muted-foreground font-body mt-0.5">{entry.role} · {entry.year}</p></div>
                        <span className="text-[10px] text-muted-foreground font-body font-medium px-2.5 py-1 rounded-lg bg-accent">{entry.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {actor.manager_notes && (
                <div className="glass-card p-6 border-dashed">
                  <h2 className="font-display text-lg font-bold mb-4">Manager Notes</h2>
                  <p className="text-[13px] text-muted-foreground font-body italic leading-[1.8]">{actor.manager_notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="portfolio" className="mt-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-lg font-bold">Portfolio</h2>
                  <div className="flex items-center gap-1 bg-accent/50 rounded-lg p-0.5">
                    {portfolioCategories.map((cat) => (
                      <button key={cat} onClick={() => setPortfolioFilter(cat)} className={`px-2.5 py-1.5 text-[11px] font-body font-medium rounded-md transition-all ${portfolioFilter === cat ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{cat}</button>
                    ))}
                  </div>
                </div>
                {filteredPortfolio.length === 0 ? (
                  <div className="text-center py-12"><Camera className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground font-body">No portfolio items in this category</p></div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredPortfolio.map((item) => (
                      <div key={item.id} className="group relative rounded-xl overflow-hidden border border-border bg-accent/30 aspect-[4/5]">
                        <img src={item.imageUrl || item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-3"><p className="text-white text-[12px] font-body font-semibold">{item.title}</p><p className="text-white/70 text-[10px] font-body mt-0.5">{item.category}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="works" className="mt-6">
              <div className="space-y-4">
                {(actor.works || []).length === 0 ? (
                  <div className="glass-card p-12 text-center"><Film className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground font-body">No works added yet</p></div>
                ) : (
                  (actor.works || []).map((work) => (
                    <div key={work.id} className="glass-card p-5 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-2">
                            <h3 className="font-display text-[15px] font-bold truncate">{work.projectName || work.project_name}</h3>
                            <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full border ${workStatusColor(work.status)}`}>{work.status}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[12px] text-muted-foreground font-body mb-2.5">
                            <span className="font-medium text-foreground">{work.role}</span><span>·</span><span>Dir. {work.director}</span><span>·</span><span>{work.year}</span>
                          </div>
                          <p className="text-[12px] text-muted-foreground font-body leading-relaxed">{work.description}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-body font-medium px-2.5 py-1 rounded-lg bg-accent shrink-0">{work.type}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border"><h2 className="font-display text-lg font-bold">Properties</h2></div>
            <div className="divide-y divide-border">
              {actor.age && <PropRow label="Age" value={String(actor.age)} />}
              {actor.height && <PropRow label="Height" value={actor.height} />}
              {actor.hair && <PropRow label="Hair" value={actor.hair} />}
              {actor.eyes && <PropRow label="Eyes" value={actor.eyes} />}
              {(actor.languages || []).length > 0 && <PropRow label="Languages" value={(actor.languages || []).join(", ")} />}
              {(actor.accents || []).length > 0 && <PropRow label="Accents" value={(actor.accents || []).join(", ")} />}
            </div>
          </div>
          {(actor.skills || []).length > 0 && (
            <div className="glass-card p-5">
              <h2 className="font-display text-lg font-bold mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">{(actor.skills || []).map((skill) => <span key={skill} className="text-[11px] px-3 py-1.5 rounded-full bg-primary/10 text-primary font-body font-medium">{skill}</span>)}</div>
            </div>
          )}
          {actor.reel_url && (
            <div className="glass-card p-5">
              <h2 className="font-display text-lg font-bold mb-3">Showreel</h2>
              {actor.reel_url.includes("youtube.com") || actor.reel_url.includes("youtu.be") ? (
                <div className="aspect-video rounded-xl overflow-hidden border border-border"><iframe src={actor.reel_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Showreel" /></div>
              ) : actor.reel_url.includes("vimeo.com") ? (
                <div className="aspect-video rounded-xl overflow-hidden border border-border"><iframe src={actor.reel_url.replace("vimeo.com/", "player.vimeo.com/video/")} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Showreel" /></div>
              ) : (
                <a href={actor.reel_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] font-body font-medium text-primary hover:text-primary/80 transition-colors"><ExternalLink className="h-4 w-4" strokeWidth={1.5} /> Watch Reel</a>
              )}
            </div>
          )}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border"><h2 className="font-display text-lg font-bold">Schedule</h2></div>
            {actorEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body text-center py-8">No upcoming events</p>
            ) : (
              <div className="divide-y divide-border">
                {actorEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/50 transition-colors">
                    <div className="min-w-0 flex-1"><p className="text-[13px] font-body font-semibold truncate">{event.title}</p><p className="text-[11px] text-muted-foreground font-body mt-0.5">{format(new Date(event.date), "MMM d")} · {event.time}</p></div>
                    <Badge variant={getEventVariant(event.type)} className="text-[9px] shrink-0">{event.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ShareProfileModal actor={actor} open={shareOpen} onOpenChange={setShareOpen} />
      {editOpen && <EditActorModal actor={actor} open={editOpen} onOpenChange={setEditOpen} />}
    </div>
  );
};

function PropRow({ label, value }: { label: string; value: string }) {
  return (<div className="flex items-start px-5 py-3.5 hover:bg-accent/30 transition-colors"><p className="text-[12px] text-muted-foreground font-body font-medium w-24 shrink-0">{label}</p><p className="text-[13px] font-body flex-1">{value}</p></div>);
}

export default ActorProfile;
