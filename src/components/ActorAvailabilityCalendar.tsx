import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";

export type DateStatus = "available" | "booked" | "frozen" | "unavailable";
type PaintApplyMode = "toggle" | "set";

interface ActorAvailabilityCalendarProps {
  actorId: string;
  actorColor: string;
  bookedDates?: string[];
}

const statusConfig: Record<DateStatus, { label: string; className: string; dot: string; activeBg: string }> = {
  available: { label: "Available", className: "bg-status-available/15 text-status-available border-status-available/30", dot: "bg-status-available", activeBg: "bg-status-available/10 border-status-available/40 text-status-available" },
  booked: { label: "Booked", className: "bg-status-booked/15 text-status-booked border-status-booked/30", dot: "bg-status-booked", activeBg: "bg-status-booked/10 border-status-booked/40 text-status-booked" },
  frozen: { label: "Frozen", className: "bg-event-audition/15 text-event-audition border-event-audition/30", dot: "bg-event-audition", activeBg: "bg-event-audition/10 border-event-audition/40 text-event-audition" },
  unavailable: { label: "Unavailable", className: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive", activeBg: "bg-destructive/10 border-destructive/40 text-destructive" },
};

export function ActorAvailabilityCalendar({ actorId: _actorId, actorColor: _actorColor, bookedDates = [] }: ActorAvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [dateStatuses, setDateStatuses] = useState<Record<string, DateStatus>>(() => {
    const initial: Record<string, DateStatus> = {};
    bookedDates.forEach((d) => {
      initial[d] = "booked";
    });
    return initial;
  });
  const [paintMode, setPaintMode] = useState<DateStatus>("available");
  const [isPainting, setIsPainting] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDateKey = (d: Date) => format(d, "yyyy-MM-dd");

  const getStatus = (day: Date): DateStatus | null => {
    const key = getDateKey(day);
    return dateStatuses[key] || null;
  };

  const applyDayStatus = (day: Date, mode: PaintApplyMode) => {
    const key = getDateKey(day);
    setDateStatuses((prev) => {
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
  };

  const handlePointerDown = (day: Date) => {
    if (!isSameMonth(day, currentMonth)) return;
    setIsPainting(true);
    applyDayStatus(day, "toggle");
  };

  const handlePointerEnter = (day: Date) => {
    if (!isPainting || !isSameMonth(day, currentMonth)) return;
    applyDayStatus(day, "set");
  };

  const handlePointerUp = () => setIsPainting(false);

  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const stats = useMemo(() => {
    let available = 0, booked = 0, frozen = 0, unavailable = 0;
    monthDays.forEach((d) => {
      const s = getStatus(d);
      if (s === "available") available++;
      else if (s === "booked") booked++;
      else if (s === "frozen") frozen++;
      else if (s === "unavailable") unavailable++;
    });
    return { available, booked, frozen, unavailable, unset: monthDays.length - available - booked - frozen - unavailable };
  }, [dateStatuses, currentMonth]);

  return (
    <div className="premium-card overflow-hidden" onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onPointerCancel={handlePointerUp}>
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

      {/* Paint mode selector */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-2.5 bg-secondary/20">
        <span className="text-[10px] text-muted-foreground/60 font-body uppercase tracking-[0.1em] font-medium mr-1">Paint</span>
        {(Object.keys(statusConfig) as DateStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setPaintMode(status)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-body font-medium transition-all ${
              paintMode === status
                ? `${statusConfig[status].activeBg} border shadow-sm`
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${statusConfig[status].dot}`} />
            {statusConfig[status].label}
          </button>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="select-none touch-none">
        <div className="grid grid-cols-7 border-b border-border">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="px-1 py-2.5 text-center text-[10px] text-muted-foreground/60 font-body font-medium uppercase tracking-[0.1em]">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const status = getStatus(day);
            const config = status ? statusConfig[status] : null;

            return (
              <div
                key={i}
                onPointerDown={() => handlePointerDown(day)}
                onPointerEnter={() => handlePointerEnter(day)}
                className={`h-11 flex items-center justify-center border-b border-r border-border cursor-pointer transition-all ${
                  !inMonth ? "opacity-10 cursor-default" : ""
                } ${today ? "ring-1 ring-inset ring-primary/30" : ""} ${
                  config ? config.className : inMonth ? "hover:bg-secondary/40" : ""
                }`}
              >
                <span className={`text-[12px] font-body font-medium ${today ? "font-bold text-primary" : ""} ${!inMonth ? "text-muted-foreground" : ""}`}>
                  {format(day, "d")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-6 py-3.5 border-t border-border flex items-center gap-5 text-[11px] font-body text-muted-foreground font-medium">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-status-available" /> {stats.available} available</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-status-booked" /> {stats.booked} booked</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-event-audition" /> {stats.frozen} frozen</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" /> {stats.unavailable} unavailable</span>
        <span className="text-muted-foreground/50">{stats.unset} unset</span>
      </div>
    </div>
  );
}
