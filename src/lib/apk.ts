import { supabase } from "@/integrations/supabase/client";
import {
  adminDashboard, adminResetCounter, adminUploadUrl, adminSaveMeta, publicApkDownload,
} from "@/lib/admin-auth.functions";

export const APK_BUCKET = "apks";

export type AccessLog = { id: string; ip: string | null; user_agent: string | null; device: string | null; source: string | null; created_at: string };
export type DownloadLog = { id: string; ip: string | null; user_agent: string | null; device: string | null; filename: string | null; created_at: string };
export type ApkInfo = { name: string; size: number | null; updated_at: string | null; originalName: string } | null;

export async function getApkDownloadUrl(): Promise<{ url: string; filename: string } | null> {
  return publicApkDownload();
}

export async function loadDashboard() {
  return adminDashboard() as Promise<{
    counters: { access: number; download: number };
    access: AccessLog[]; downloads: DownloadLog[]; info: ApkInfo;
  }>;
}

export async function uploadApk(file: File) {
  const { path, token } = await adminUploadUrl();
  const { error } = await supabase.storage.from(APK_BUCKET).uploadToSignedUrl(path, token, file, {
    contentType: "application/vnd.android.package-archive",
  });
  if (error) throw error;
  await adminSaveMeta({ data: { filename: file.name, size: file.size } });
}

export async function resetCounter(key: "access" | "download") {
  await adminResetCounter({ data: { key } });
}
