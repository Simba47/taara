import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, List, Grid3X3, MapPin, Calendar, X, Plus, Loader2 } from "lucide-react";
import { useActors, useCalendarEvents, useCreateEvent, useDeleteEvent } from "@/hooks/use-data";
import { getEventVariant } from "@/lib/helpers";
import { useToast } from "@/hooks/use-toast";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth,
  isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, addWeeks, subWeeks,
} from "date-fns";

const CalendarPage = () => {
  const { data: actors = [], isLoading: actorsLoading } = useActors();
  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedActorId, setSelectedActorId] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);

  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<string>("Audition");
  const [newActorId, setNewActorId] = useState<string>("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(view === "month" ? monthStart : currentDate, { weekStartsOn: 1 });
  const calendarEnd = view === "month" ? endOfWeek(monthEnd, { weekStartsOn: 1 }) : endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) =>
    events.filter((e) => {
      const match = isSameDay(new Date(e.date), day);
      if (selectedActorId) return match && (e.actor_id === selectedActorId || e.actorId === selectedActorId);
      return match;
    });

  const getActorColor = (actorId: string) => {
    const actor = actors.find((a) => a.id === actorId);
    return actor?.color || "#6366f1";
  };

  const dayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const nav = (dir: 1 | -1) => {
    if (view === "month") setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const handleCreate = async () => {
    if (!newTitle || !newDate) {
      toast({ title: "Missing fields", description: "Title and date are required.", variant: "destructive" });
      return;
    }
    try {
      const actor = actors.find((a) => a.id === newActorId);
      await createEvent.mutateAsync({
        title: newTitle, type: newType as any, date: newDate,
        time: newTime, end_time: newEndTime, location: newLocation, notes: newNotes,
        actor_id: newActorId || undefined, actor_name: actor?.name,
      } as any);
      toast({ title: "Event created!" });
      setCreateOpen(false);
      setNewTitle(""); setNewType("Audition"); setNewActorId(""); setNewDate(""); setNewTime(""); setNewEndTime(""); setNewLocation(""); setNewNotes("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const isLoading = actorsLoading || eventsLoading;

  const eventTypeColors: Record<string, string> = {
    Audition: "bg-event-audition/15 text-event-audition border-event-audition/20",
    Callback: "bg-event-callback/15 text-event-callback border-event-callback/20",
    Booking: "bg-event-booking/15 text-event-booking border-event-booking/20",
    Meeting: "bg-event-meeting/15 text-event-meeting border-event-meeting/20",
  };

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-1">
        <Calendar className="h-6 w-6 text-muted-foreground" />
        <h1 className="font-display text-3xl font-bold tracking-tight uppercase">Calendar</h1>
      </div>
      <p className="text-muted-foreground font-body text-[13px] mb-8 ml-9">Availability & schedule overview</p>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border" onClick={() => nav(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="font-display text-lg font-semibold min-w-[200px] text-center">
            {view === "month" ? format(currentDate, "MMMM yyyy") : `${format(calendarStart, "MMM d")} – ${format(calendarEnd, "MMM d, yyyy")}`}
          </h2>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border" onClick={() => nav(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>

        <div className="flex items-center gap-3">
          <select value={selectedActorId} onChange={(e) => setSelectedActorId(e.target.value)}
            className="h-8 rounded-lg bg-card border border-border text-[12px] font-body text-foreground px-2.5 focus:outline-none">
            <option value="">All Talent</option>
            {actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <Button size="sm" className="h-8 rounded-lg font-body text-[12px] font-medium bg-primary text-primary-foreground" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Event
          </Button>
          <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden h-8">
            <button onClick={() => setView("month")} className={`flex items-center gap-1.5 px-3 h-full text-[12px] font-body transition-colors ${view === "month" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Grid3X3 className="h-3.5 w-3.5" /> Month
            </button>
            <button onClick={() => setView("week")} className={`flex items-center gap-1.5 px-3 h-full text-[12px] font-body transition-colors ${view === "week" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <List className="h-3.5 w-3.5" /> Week
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          {isLoading ? <Skeleton className="h-[500px] w-full rounded-2xl" /> : (
            <div className="glass-card overflow-hidden">
              <div className="grid grid-cols-7 border-b border-border">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="py-2.5 text-center text-[11px] font-body font-semibold text-muted-foreground/60 uppercase tracking-[0.08em]">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day) => {
                  const dayEvs = getEventsForDay(day);
                  const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                  const inMonth = isSameMonth(day, currentDate);
                  return (
                    <div key={day.toISOString()} onClick={() => setSelectedDay(isSameDay(day, selectedDay || new Date(0)) ? null : day)}
                      className={`min-h-[90px] p-2 border-b border-r border-border/40 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-accent/40"} ${!inMonth ? "opacity-30" : ""}`}>
                      <div className={`text-[12px] font-display font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday(day) ? "bg-primary text-primary-foreground" : isSelected ? "text-primary" : "text-foreground"}`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvs.slice(0, 2).map((ev) => (
                          <div key={ev.id} className="text-[10px] font-body font-medium px-1.5 py-0.5 rounded truncate"
                            style={{ backgroundColor: getActorColor(ev.actor_id || ev.actorId || "") + "20", color: getActorColor(ev.actor_id || ev.actorId || "") }}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvs.length > 2 && <div className="text-[10px] text-muted-foreground font-body pl-1">+{dayEvs.length - 2} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {selectedDay && (
          <div className="w-72 shrink-0">
            <div className="glass-card p-4 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-bold">{format(selectedDay, "EEEE, MMM d")}</h3>
                <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
              </div>
              {dayEvents.length === 0 ? (
                <p className="text-[12px] text-muted-foreground font-body">No events this day.</p>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map((ev) => (
                    <div key={ev.id} className="p-3 rounded-xl bg-accent/50 group">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[12px] font-body font-semibold leading-tight">{ev.title}</p>
                          <p className="text-[11px] text-muted-foreground font-body mt-0.5">{ev.actor_name || ev.actorName}</p>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                          onClick={() => deleteEvent.mutate(ev.id)}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full inline-block mt-2 ${eventTypeColors[ev.type] || ""}`}>{ev.type}</div>
                      {ev.time && <p className="text-[11px] text-muted-foreground font-body mt-1">{ev.time}{ev.end_time || ev.endTime ? ` – ${ev.end_time || ev.endTime}` : ""}</p>}
                      {ev.location && <p className="text-[11px] text-muted-foreground font-body flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{ev.location}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create event dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-lg font-bold">Add Calendar Event</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Title *</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Dharma Callback" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Type</Label>
                <Select value={newType} onValueChange={setNewType}><SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Audition", "Callback", "Booking", "Meeting"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Talent</Label>
                <Select value={newActorId} onValueChange={setNewActorId}><SelectTrigger className="font-body text-[13px] rounded-xl h-10 bg-background border-border"><SelectValue placeholder="Select actor" /></SelectTrigger>
                  <SelectContent>{actors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Label className="text-[12px] font-body font-semibold mb-1.5 block">Date *</Label><Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
              <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Time</Label><Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
            </div>
            <div><Label className="text-[12px] font-body font-semibold mb-1.5 block">Location</Label><Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="e.g. Dharma Office, Khar" className="font-body text-[13px] rounded-xl h-10 bg-background border-border" /></div>
            <Button onClick={handleCreate} disabled={createEvent.isPending} className="w-full h-10 rounded-xl font-body text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              {createEvent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
