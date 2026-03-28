import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActorAvailability, useSaveActorAvailability } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday,
} from "date-fns";

export type DateStatus = "available" | "booked" | "frozen" | "unavailable";

const statusConfig: Record<DateStatus, { label: string; className: string; dot: string; activeBg: string }> = {
  available:   { label: "Available",   className: "bg-emerald-500/15 text-emerald-700 border-emerald-300/40",  dot: "bg-emerald-500",  activeBg: "bg-emerald-500/10 border-emerald-400/50 text-emerald-700" },
  booked:      { label: "Booked",      className: "bg-amber-500/15 text-amber-700 border-amber-300/40",        dot: "bg-amber-500",    activeBg: "bg-amber-500/10 border-amber-400/50 text-amber-700" },
  frozen:      { label: "Frozen",      className: "bg-blue-500/15 text-blue-700 border-blue-300/40",           dot: "bg-blue-400",     activeBg: "bg-blue-500/10 border-blue-400/50 text-blue-700" },
  unavailable: { label: "Unavailable", className: "bg-destructive/10 text-destructive border-destructive/30",  dot: "bg-destructive",  activeBg: "bg-destructive/10 border-destructive/40 text-destructive" },
};

interface Props {
  actorId: string;
  actorColor: string;
  bookedDates?: string[];
}

export function ActorAvailabilityCalendar({ actorId, actorColor }: Props) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [dateStatuses, setDateStatuses] = useState<Record<string, DateStatus>>({});
  const [paintMode, setPaintMode] = useState<DateStatus>("available");
  const [isPainting, setIsPainting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const { data: savedStatuses, isLoading } = useActorAvailability(actorId);
  const saveAvailability = useSaveActorAvailability();
  const { toast } = useToast();

  // Load saved data into local state
  useEffect(() => {
    if (savedStatuses) {
      setDateStatuses(savedStatuses);
      setDirty(false);
    }
  }, [savedStatuses]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDateKey = (d: Date) => format(d, "yyyy-MM-dd");
  const getStatus = (day: Date): DateStatus | null => dateStatuses[getDateKey(day)] || null;

  const applyDayStatus = (day: Date, mode: "toggle" | "set") => {
    if (!isSameMonth(day, currentMonth)) return;
    const key = getDateKey(day);
    setDateStatuses(prev => {
      const current = prev[key];
      if (mode === "toggle") {
        if (current === paintMode) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: paintMode };
      }
      if (current === paintMode) return prev;
      return { ...prev, [key]: paintMode };
    });
    setDirty(true);
  };

  const handlePointerDown = (day: Date) => {
    if (!isSameMonth(day, currentMonth)) return;
    setIsPainting(true);
    applyDayStatus(day, "toggle");
  };
  const handlePointerEnter = (day: Date) => {
    if (!isPainting) return;
    applyDayStatus(day, "set");
  };
  const handlePointerUp = () => setIsPainting(false);

  const handleSave = async () => {
    try {
      await saveAvailability.mutateAsync({ actorId, dateStatuses });
      setDirty(false);
      toast({ title: "Availability saved!" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  const stats = useMemo(() => {
    let available = 0, booked = 0, frozen = 0, unavailable = 0;
    monthDays.forEach(d => {
      const s = getStatus(d);
      if (s === "available") available++;
      else if (s === "booked") booked++;
      else if (s === "frozen") frozen++;
      else if (s === "unavailable") unavailable++;
    });
    return { available, booked, frozen, unavailable, unset: monthDays.length - available - booked - frozen - unavailable };
  }, [dateStatuses, currentMonth]);

  return (
    <div className="glass-card overflow-hidden" onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onPointerCancel={handlePointerUp}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Availability</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <span className="text-[13px] font-body font-medium min-w-[130px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* Paint mode */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-2.5 bg-secondary/20 flex-wrap">
        <span className="text-[10px] text-muted-foreground/60 font-body uppercase tracking-[0.1em] font-medium mr-1">Paint</span>
        {(Object.keys(statusConfig) as DateStatus[]).map(status => (
          <button key={status} onClick={() => setPaintMode(status)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-body font-medium transition-all ${
              paintMode === status
                ? `${statusConfig[status].activeBg} border shadow-sm`
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}>
            <span className={`w-2 h-2 rounded-full ${statusConfig[status].dot}`} />
            {statusConfig[status].label}
          </button>
        ))}
        {/* Save button */}
        <Button size="sm" onClick={handleSave}
          disabled={!dirty || saveAvailability.isPending}
          className={`ml-auto h-8 rounded-xl font-body text-[12px] font-semibold transition-all ${
            dirty ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" : "opacity-40 cursor-not-allowed bg-primary text-primary-foreground"
          }`}>
          {saveAvailability.isPending
            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</>
            : <><Save className="h-3.5 w-3.5 mr-1.5" />{dirty ? "Save changes" : "Saved"}</>
          }
        </Button>
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="select-none touch-none">
          <div className="grid grid-cols-7 border-b border-border">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day => (
              <div key={day} className="px-1 py-2.5 text-center text-[10px] text-muted-foreground/60 font-body font-medium uppercase tracking-[0.1em]">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const status = getStatus(day);
              const cfg = status ? statusConfig[status] : null;
              return (
                <div key={i}
                  onPointerDown={() => handlePointerDown(day)}
                  onPointerEnter={() => handlePointerEnter(day)}
                  className={`h-11 flex items-center justify-center border-b border-r border-border transition-all ${
                    !inMonth ? "opacity-10 cursor-default" : "cursor-pointer"
                  } ${today ? "ring-1 ring-inset ring-primary/30" : ""} ${
                    cfg ? cfg.className : inMonth ? "hover:bg-secondary/40" : ""
                  }`}>
                  <span className={`text-[12px] font-body font-medium ${today ? "font-bold text-primary" : ""} ${!inMonth ? "text-muted-foreground" : ""}`}>
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="px-6 py-3.5 border-t border-border flex items-center gap-5 flex-wrap text-[11px] font-body text-muted-foreground font-medium">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />{stats.available} available</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />{stats.booked} booked</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />{stats.frozen} frozen</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" />{stats.unavailable} unavailable</span>
        <span className="text-muted-foreground/50">{stats.unset} unset</span>
      </div>
    </div>
  );
}
