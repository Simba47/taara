/**
 * TAARA — Supabase data hooks
 * Every hook maps 1-to-1 with a Supabase table.
 * All data is scoped to the logged-in user via RLS.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface Actor {
  id: string;
  user_id: string;
  name: string;
  age?: number;
  gender?: "Male" | "Female" | "Non-Binary";
  type?: "Lead" | "Character" | "Emerging" | "Supporting";
  status: "Available" | "Booked" | "On Hold";
  location?: string;
  height?: string;
  hair?: string;
  eyes?: string;
  bio?: string;
  reel_url?: string;
  headshot_url?: string;
  slug?: string;
  profile_visible: boolean;
  profile_password?: string;
  profile_expires_at?: string;
  languages: string[];
  skills: string[];
  accents: string[];
  manager_notes?: string;
  profile_completeness: number;
  color: string;
  created_at: string;
  updated_at: string;
  filmography?: FilmographyEntry[];
  portfolio?: PortfolioItem[];
  works?: WorkEntry[];
}

export interface FilmographyEntry {
  id: string;
  actor_id: string;
  user_id: string;
  title: string;
  role?: string;
  year?: number;
  type?: "Film" | "TV Series" | "Short" | "Theatre";
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  actor_id: string;
  user_id: string;
  title: string;
  category?: "Headshot" | "Behind the Scenes" | "Editorial" | "Character Look";
  image_url?: string;
  created_at: string;
}

export interface WorkEntry {
  id: string;
  actor_id: string;
  user_id: string;
  project_name: string;
  role?: string;
  director?: string;
  year?: number;
  type?: "Film" | "TV Series" | "Short" | "Theatre" | "Web Series" | "Commercial";
  status?: "Released" | "Post-Production" | "In Production" | "Upcoming";
  description?: string;
  poster_url?: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  actor_id?: string;
  actor_name?: string;
  title: string;
  type: "Audition" | "Callback" | "Booking" | "Meeting";
  date: string;
  time?: string;
  end_time?: string;
  location?: string;
  notes?: string;
  created_at: string;
}

export interface Shortlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  actor_ids: string[];
  slug?: string;
  created_at: string;
  updated_at: string;
  shortlist_views?: ShortlistView[];
}

export interface ShortlistView {
  id: string;
  shortlist_id: string;
  viewed_at: string;
  referrer?: string;
  ip?: string;
}

export interface CastingOpportunity {
  id: string;
  user_id: string;
  project_name: string;
  role?: string;
  director?: string;
  casting_director?: string;
  deadline?: string;
  notes?: string;
  created_at: string;
  casting_submissions?: CastingSubmission[];
}

export interface CastingSubmission {
  id: string;
  opportunity_id: string;
  user_id: string;
  actor_id?: string;
  actor_name?: string;
  status: "Submitted" | "Viewed" | "Shortlisted" | "Callback" | "Booked" | "Rejected";
  submitted_at: string;
  notes?: string;
}

export interface AgencyProfile {
  id: string;
  user_id: string;
  name?: string;
  slug?: string;
  about?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  location?: string;
  logo_url?: string;
  founded_year?: number;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// ACTORS
// ─────────────────────────────────────────────────────────────

export function useActors() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["actors", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actors")
        .select("*, filmography(*), portfolio(*), works(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Actor[];
    },
  });
}

export function useActor(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["actor", id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actors")
        .select("*, filmography(*), portfolio(*), works(*)")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as Actor;
    },
  });
}

export function useActorBySlug(slug: string) {
  return useQuery({
    queryKey: ["actor-slug", slug],
    enabled: !!slug,
    queryFn: async () => {
      // No profile_visible filter: if the manager shared the link, always show the actor
      const { data, error } = await supabase
        .from("actors")
        .select("*, filmography(*), portfolio(*), works(*)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Actor | null;
    },
  });
}

function makeSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);
}

export function useCreateActor() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (actor: Omit<Partial<Actor>, "id" | "user_id" | "created_at" | "updated_at">) => {
      const slug = makeSlug(actor.name ?? "actor") + "-" + Date.now().toString(36);
      const { data, error } = await supabase
        .from("actors")
        .insert({ ...actor, user_id: user!.id, slug })
        .select()
        .single();
      if (error) throw error;
      return data as Actor;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["actors"] }),
  });
}

export function useUpdateActor() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Actor> & { id: string }) => {
      const { data, error } = await supabase
        .from("actors")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data as Actor;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["actors"] });
      qc.invalidateQueries({ queryKey: ["actor", vars.id] });
    },
  });
}

export function useDeleteActor() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("actors").delete().eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["actors"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// FILMOGRAPHY
// ─────────────────────────────────────────────────────────────

export function useCreateFilmographyEntry() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<Partial<FilmographyEntry>, "id" | "user_id" | "created_at"> & { actor_id: string }) => {
      const { data, error } = await supabase
        .from("filmography")
        .insert({ ...entry, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as FilmographyEntry;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["actor", vars.actor_id] });
      qc.invalidateQueries({ queryKey: ["actors"] });
    },
  });
}

export function useDeleteFilmographyEntry() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actorId }: { id: string; actorId: string }) => {
      const { error } = await supabase.from("filmography").delete().eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
      return actorId;
    },
    onSuccess: (actorId) => {
      qc.invalidateQueries({ queryKey: ["actor", actorId] });
      qc.invalidateQueries({ queryKey: ["actors"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// WORKS
// ─────────────────────────────────────────────────────────────

export function useCreateWork() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (work: Omit<Partial<WorkEntry>, "id" | "user_id" | "created_at"> & { actor_id: string }) => {
      const { data, error } = await supabase
        .from("works")
        .insert({ ...work, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as WorkEntry;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["actor", vars.actor_id] });
      qc.invalidateQueries({ queryKey: ["actors"] });
    },
  });
}

export function useDeleteWork() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actorId }: { id: string; actorId: string }) => {
      const { error } = await supabase.from("works").delete().eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
      return actorId;
    },
    onSuccess: (actorId) => {
      qc.invalidateQueries({ queryKey: ["actor", actorId] });
      qc.invalidateQueries({ queryKey: ["actors"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// PORTFOLIO
// ─────────────────────────────────────────────────────────────

export function useCreatePortfolioItem() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<Partial<PortfolioItem>, "id" | "user_id" | "created_at"> & { actor_id: string }) => {
      const { data, error } = await supabase
        .from("portfolio")
        .insert({ ...item, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as PortfolioItem;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["actor", vars.actor_id] });
      qc.invalidateQueries({ queryKey: ["actors"] });
    },
  });
}

export function useDeletePortfolioItem() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actorId }: { id: string; actorId: string }) => {
      const { error } = await supabase.from("portfolio").delete().eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
      return actorId;
    },
    onSuccess: (actorId) => {
      qc.invalidateQueries({ queryKey: ["actor", actorId] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// IMAGE UPLOAD (headshots + portfolio)
// ─────────────────────────────────────────────────────────────

export async function uploadImage(
  bucket: "headshots" | "portfolio",
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteImage(bucket: "headshots" | "portfolio", url: string) {
  const path = url.split(`/${bucket}/`)[1];
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}

// ─────────────────────────────────────────────────────────────
// CALENDAR EVENTS
// ─────────────────────────────────────────────────────────────

export function useCalendarEvents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["events", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CalendarEvent[];
    },
  });
}

export function useCreateEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: Omit<Partial<CalendarEvent>, "id" | "user_id" | "created_at">) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({ ...event, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalendarEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useDeleteEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// SHORTLISTS
// ─────────────────────────────────────────────────────────────

export function useShortlists() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["shortlists", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shortlists")
        .select("*, shortlist_views(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Shortlist[];
    },
  });
}

export function useShortlist(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["shortlist", id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shortlists")
        .select("*, shortlist_views(*)")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as Shortlist;
    },
  });
}

export function useShortlistBySlug(slug: string) {
  return useQuery({
    queryKey: ["shortlist-slug", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shortlists")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Shortlist | null;
    },
  });
}

export function useCreateShortlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sl: Pick<Shortlist, "name"> & Partial<Shortlist>) => {
      const slug = makeSlug(sl.name) + "-" + Date.now().toString(36);
      const { data, error } = await supabase
        .from("shortlists")
        .insert({ ...sl, user_id: user!.id, slug, actor_ids: sl.actor_ids ?? [] })
        .select()
        .single();
      if (error) throw error;
      return data as Shortlist;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shortlists"] }),
  });
}

export function useUpdateShortlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Shortlist> & { id: string }) => {
      const { data, error } = await supabase
        .from("shortlists")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data as Shortlist;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["shortlists"] });
      qc.invalidateQueries({ queryKey: ["shortlist", vars.id] });
    },
  });
}

export function useDeleteShortlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shortlists").delete().eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shortlists"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// CASTING OPPORTUNITIES
// ─────────────────────────────────────────────────────────────

export function useCastingOpportunities() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["casting", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("casting_opportunities")
        .select("*, casting_submissions(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CastingOpportunity[];
    },
  });
}

export function useCreateCastingOpportunity() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opp: Omit<Partial<CastingOpportunity>, "id" | "user_id" | "created_at">) => {
      const { data, error } = await supabase
        .from("casting_opportunities")
        .insert({ ...opp, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as CastingOpportunity;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["casting"] }),
  });
}

export function useDeleteCastingOpportunity() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("casting_opportunities").delete().eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["casting"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// CASTING SUBMISSIONS
// ─────────────────────────────────────────────────────────────

export function useCreateSubmission() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sub: Omit<Partial<CastingSubmission>, "id" | "user_id" | "submitted_at"> & { opportunity_id: string }) => {
      const { data, error } = await supabase
        .from("casting_submissions")
        .insert({ ...sub, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as CastingSubmission;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["casting"] }),
  });
}

export function useUpdateSubmissionStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CastingSubmission["status"] }) => {
      const { data, error } = await supabase
        .from("casting_submissions")
        .update({ status })
        .eq("id", id)
        .eq("user_id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data as CastingSubmission;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["casting"] }),
  });
}

export function useDeleteSubmission() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("casting_submissions").delete().eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["casting"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// AGENCY PROFILE
// ─────────────────────────────────────────────────────────────

export function useAgencyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["agency", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("agency_profile")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as AgencyProfile | null;
    },
  });
}

export function useSaveAgencyProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Omit<Partial<AgencyProfile>, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("agency_profile")
        .upsert({ ...profile, user_id: user!.id }, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data as AgencyProfile;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agency"] }),
  });
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD STATS (uses the user_stats view)
// ─────────────────────────────────────────────────────────────

export function useUserStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["stats", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as {
        total_actors: number;
        available_actors: number;
        booked_actors: number;
        total_shortlists: number;
        total_casting_calls: number;
        total_events: number;
      } | null;
    },
  });
}

// ─────────────────────────────────────────────────────────────
// PENDING REGISTRATIONS
// Actors who submitted via invite link — not yet owned by a manager
// ─────────────────────────────────────────────────────────────

export function usePendingActors() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pending-actors"],
    enabled: !!user,
    staleTime: 1000 * 30, // refresh every 30s
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actors")
        .select("*, filmography(*), portfolio(*)")
        .is("user_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Actor[];
    },
  });
}

export function useClaimActor() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (actorId: string) => {
      const { data, error } = await supabase
        .from("actors")
        .update({ user_id: user!.id, profile_visible: false })
        .is("user_id", null)
        .eq("id", actorId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-actors"] });
      qc.invalidateQueries({ queryKey: ["actors"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useRejectPendingActor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (actorId: string) => {
      const { error } = await supabase
        .from("actors")
        .delete()
        .is("user_id", null)
        .eq("id", actorId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pending-actors"] }),
  });
}
