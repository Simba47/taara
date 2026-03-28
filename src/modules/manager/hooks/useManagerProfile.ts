// ─────────────────────────────────────────────────────────────
// MANAGER MODULE — Hooks
// ─────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/modules/auth/hooks/useAuthContext";
import type { ManagerProfile, ManagerProfileUpdate } from "../types";

export function useManagerProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["manager-profile", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data } = await supabase
        .from("manager_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as ManagerProfile | null;
    },
  });
}

export function useSaveManagerProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: ManagerProfileUpdate) => {
      // Check username uniqueness (excluding current user)
      if (updates.username) {
        const { data: existing } = await supabase
          .from("manager_profiles")
          .select("user_id")
          .eq("username", updates.username.toLowerCase().trim())
          .neq("user_id", user!.id)
          .maybeSingle();
        if (existing) throw new Error("Username is already taken. Please choose another.");
        updates = { ...updates, username: updates.username.toLowerCase().trim() };
      }

      const { data, error } = await supabase
        .from("manager_profiles")
        .upsert({
          ...updates,
          user_id: user!.id,
          email: user!.email,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data as ManagerProfile;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["manager-profile"] }),
  });
}

export function useUploadAvatar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = data.publicUrl + `?t=${Date.now()}`; // cache-bust

      // Save URL to profile
      await supabase
        .from("manager_profiles")
        .upsert({ user_id: user!.id, avatar_url: avatarUrl, updated_at: new Date().toISOString() },
          { onConflict: "user_id" });

      return avatarUrl;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["manager-profile"] }),
  });
}
