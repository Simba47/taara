import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface UploadResult {
  url: string;
  path: string;
}

export function useUpload(bucket: "headshots" | "portfolio") {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File): Promise<UploadResult> => {
    if (!user) throw new Error("Not authenticated");

    // Validate type & size
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Only JPG, PNG, or WEBP images are allowed.");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Image must be under 10 MB.");
    }

    setUploading(true);
    setProgress(10);

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    // Store under user's own folder — matches RLS policy
    const path = `${user.id}/${fileName}`;

    setProgress(40);

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false });

    if (error) throw error;

    setProgress(80);

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    setProgress(100);
    setTimeout(() => { setUploading(false); setProgress(0); }, 500);

    return { url: data.publicUrl, path };
  };

  return { upload, uploading, progress };
}
