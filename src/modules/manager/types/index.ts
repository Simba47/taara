// ─────────────────────────────────────────────────────────────
// MANAGER MODULE — Types
// ─────────────────────────────────────────────────────────────

export interface ManagerProfile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  agency_name?: string;
  agency_location?: string;
  bio?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  years_experience?: number;
  specialisation?: string; // e.g. "Film", "TV", "Theatre", "Commercial"
  created_at: string;
  updated_at: string;
}

export interface ManagerProfileUpdate extends Partial<Omit<ManagerProfile, "id" | "user_id" | "created_at" | "updated_at" | "email">> {}
