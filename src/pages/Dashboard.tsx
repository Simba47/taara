import { Users, UserCheck, ListChecks, ChevronRight, Check, X, Clock, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useActors, useShortlists, useUserStats, usePendingActors, useClaimActor, useRejectPendingActor } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: actors = [], isLoading: actorsLoading } = useActors();
  const { data: shortlists = [], isLoading: shortlistsLoading } = useShortlists();
  const { data: pending = [], isLoading: pendingLoading } = usePendingActors();
  const claimActor = useClaimActor();
  const rejectActor = useRejectPendingActor();
  const { toast } = useToast();

  const handleApprove = async (id: string, name: string) => {
    try {
      await claimActor.mutateAsync(id);
      toast({ title: "Added to roster!", description: `${name} has been added to your roster.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleReject = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}'s registration? This cannot be undone.`)) return;
    try {
      await rejectActor.mutateAsync(id);
      toast({ title: "Removed", description: `${name}'s submission has been removed.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const statCards = [
    { label: "Total Talent",   value: stats?.total_actors ?? 0,    icon: Users,      color: "bg-orange-100 text-orange-600" },
    { label: "Available",      value: stats?.available_actors ?? 0, icon: UserCheck,  color: "bg-emerald-100 text-emerald-600" },
    { label: "Shortlists",     value: stats?.total_shortlists ?? 0, icon: ListChecks, color: "bg-blue-100 text-blue-600" },
  ];

  const statusColor = (s: string) => {
    if (s === "Available") return "bg-emerald-100 text-emerald-700";
    if (s === "Booked")    return "bg-blue-100 text-blue-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">Dashboard</h1>
        <p className="text-muted-foreground font-body text-sm">Your talent workspace overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {statCards.map((s) => (
          <div key={s.label} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <span className="text-[12px] text-muted-foreground font-body font-medium">{s.label}</span>
            </div>
            {statsLoading
              ? <Skeleton className="h-9 w-14" />
              : <p className="text-4xl font-display font-extrabold">{s.value}</p>
            }
          </div>
        ))}
      </div>

      {/* ── Pending approvals — shown only when there are submissions ── */}
      {(pendingLoading || pending.length > 0) && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" strokeWidth={1.8} />
              <h2 className="font-display text-lg font-bold">Pending Approvals</h2>
            </div>
            {pending.length > 0 && (
              <span className="text-[11px] font-body font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {pending.length} new submission{pending.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="glass-card divide-y divide-border overflow-hidden border-amber-200/50">
            {pendingLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-36" /><Skeleton className="h-2.5 w-24" /></div>
                  <Skeleton className="h-8 w-20 rounded-xl" />
                  <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
              ))
            ) : (
              pending.map((actor) => {
                const hasPhoto = actor.headshot_url || (actor.portfolio?.[0]?.imageUrl || actor.portfolio?.[0]?.image_url);
                const phone = actor.manager_notes?.match(/Phone:\s*([^\n.]+)/)?.[1]?.trim();
                const email = actor.manager_notes?.match(/Email:\s*([^\n.]+)/)?.[1]?.trim();
                return (
                  <div key={actor.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                    {/* Avatar / headshot */}
                    {hasPhoto ? (
                      <div className="w-11 h-11 rounded-full overflow-hidden ring-1 ring-border shrink-0">
                        <img
                          src={actor.headshot_url || actor.portfolio?.[0]?.imageUrl || actor.portfolio?.[0]?.image_url}
                          alt={actor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-xs font-display font-bold ring-1 ring-border"
                        style={{ backgroundColor: (actor.color || "#6366f1") + "18", color: actor.color || "#6366f1" }}
                      >
                        {actor.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                    )}

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-body font-semibold">{actor.name}</p>
                        {actor.type && (
                          <span className="text-[10px] font-body text-muted-foreground px-2 py-0.5 rounded-full bg-accent">{actor.type}</span>
                        )}
                        {actor.portfolio?.length > 0 && (
                          <span className="text-[10px] font-body text-muted-foreground flex items-center gap-1">
                            <Camera className="h-3 w-3" />{actor.portfolio.length} photo{actor.portfolio.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-body mt-0.5">
                        {[phone, email, actor.location].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="h-8 px-3 rounded-xl text-[12px] font-body font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApprove(actor.id, actor.name)}
                        disabled={claimActor.isPending}
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                      </Button>
                      <button
                        onClick={() => handleReject(actor.id, actor.name)}
                        className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        disabled={rejectActor.isPending}
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-body mt-2">
            Approved actors are added to your roster with profile hidden — you can review and make them public from their profile page.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Roster */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">Roster</h2>
            <Link to="/roster" className="text-[12px] text-primary hover:text-primary/80 font-body font-medium flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="glass-card divide-y divide-border overflow-hidden">
            {actorsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-20" /></div>
                  </div>
                ))
              : actors.length === 0
              ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-[13px] text-muted-foreground font-body mb-2">No talent added yet.</p>
                  <Link to="/roster/new" className="text-[12px] text-primary font-body font-medium">Add your first actor →</Link>
                </div>
              )
              : actors.slice(0, 7).map((actor) => (
                  <Link key={actor.id} to={`/roster/${actor.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors group">
                    {actor.headshot_url ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-1 ring-border">
                        <img src={actor.headshot_url} alt={actor.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-display font-bold ring-1 ring-border"
                        style={{ backgroundColor: (actor.color || "#6366f1") + "18", color: actor.color || "#6366f1" }}
                      >
                        {actor.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-body font-semibold truncate group-hover:text-primary transition-colors">{actor.name}</p>
                      <p className="text-[11px] text-muted-foreground font-body mt-0.5">{actor.type}{actor.location ? ` · ${actor.location}` : ""}</p>
                    </div>
                    <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full ${statusColor(actor.status)}`}>{actor.status}</span>
                  </Link>
                ))
            }
          </div>
        </div>

        {/* Shortlists */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">Shortlists</h2>
            <Link to="/shortlists" className="text-[12px] text-primary hover:text-primary/80 font-body font-medium flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="glass-card divide-y divide-border overflow-hidden">
            {shortlistsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-40" /><Skeleton className="h-2.5 w-24" /></div>
                  </div>
                ))
              : shortlists.length === 0
              ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-[13px] text-muted-foreground font-body mb-2">No shortlists yet.</p>
                  <Link to="/shortlists" className="text-[12px] text-primary font-body font-medium">Create a shortlist →</Link>
                </div>
              )
              : shortlists.slice(0, 5).map((sl) => (
                  <Link key={sl.id} to={`/shortlists/${sl.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ListChecks className="h-[18px] w-[18px] text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-body font-semibold truncate group-hover:text-primary transition-colors">{sl.name}</p>
                      <p className="text-[11px] text-muted-foreground font-body mt-0.5">
                        {sl.actor_ids?.length ?? 0} talent · {sl.shortlist_views?.length ?? 0} views
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </Link>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
