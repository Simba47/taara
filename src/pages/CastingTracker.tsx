import { useState } from "react";
import { Film, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSubmissionStatusColor } from "@/lib/helpers";
import { format } from "date-fns";

const submissionStatusOrder = ["Booked", "Callback", "Shortlisted", "Viewed", "Submitted", "Rejected"];

const CastingTracker = () => {
  const [expandedId, setExpandedId] = useState<string | null>(mockCastingOpportunities[0]?.id || null);

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-1">
        <Film className="h-6 w-6 text-muted-foreground" />
        <h1 className="font-display text-3xl font-bold tracking-tight uppercase">Casting Tracker</h1>
      </div>
      <p className="text-muted-foreground font-body text-[13px] mb-8 ml-9">Track submissions & casting opportunities</p>

      <div className="space-y-3">
        {mockCastingOpportunities.map((opp) => {
          const isExpanded = expandedId === opp.id;
          const statusCounts: Record<string, number> = {};
          opp.submissions.forEach((s) => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });

          return (
            <div key={opp.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-secondary/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-body text-[15px] font-semibold truncate">{opp.projectName}</h3>
                    <span className="text-[11px] text-muted-foreground font-body">→ {opp.role}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-body">
                    <span>Dir: {opp.director}</span>
                    <span>CD: {opp.castingDirector}</span>
                    <span>Deadline: {format(new Date(opp.deadline), "MMM d, yyyy")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <span key={status} className={`text-[10px] font-body px-2 py-0.5 rounded-full bg-secondary ${getSubmissionStatusColor(status as any)}`}>
                      {count} {status}
                    </span>
                  ))}
                </div>

                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="border-t border-border">
                  {opp.notes && (
                    <div className="px-5 py-3 bg-secondary/20 border-b border-border">
                      <p className="text-[12px] text-muted-foreground font-body italic">{opp.notes}</p>
                    </div>
                  )}
                  <div className="divide-y divide-border">
                    {opp.submissions
                      .sort((a, b) => submissionStatusOrder.indexOf(a.status) - submissionStatusOrder.indexOf(b.status))
                      .map((sub) => (
                        <div key={sub.id} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/10 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-body font-medium">{sub.actorName}</p>
                            <p className="text-[11px] text-muted-foreground font-body">Submitted {format(new Date(sub.submittedAt), "MMM d, yyyy")}</p>
                          </div>
                          <span className={`text-[11px] font-body font-semibold ${getSubmissionStatusColor(sub.status)}`}>
                            {sub.status}
                          </span>
                          {sub.notes && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-body max-w-[200px]">
                              <MessageSquare className="h-3 w-3 shrink-0" />
                              <span className="truncate">{sub.notes}</span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CastingTracker;
