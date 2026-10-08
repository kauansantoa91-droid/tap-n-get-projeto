import { supabase } from "@/integrations/supabase/client";
import {
  adminDashboard,
  adminResetCounter,
  adminUploadApk,
  adminSaveApkData,
  publicApkDownload,
} from "./admin-auth.functions";

export const APK_BUCKET = "apks";

export type AccessLog = { id: string; ip: string | null; user_agent: string | null; device: string | null; version: string | null; created_at: string };
export type DownloadLog = { id: string; ip: string | null; user_agent: string | null; device: string | null; version: string | null; created_at: string };
export type ApkInfo = { name: string; size: number | null; version: string | null; originalName: string | null };

export async function getPublicApkDownload(): Promise<{ url: string; fileName: string | null }> {
  return publicApkDownload();
}

export async function fetchDashboard() {
  return adminDashboard() as Promise<{
    counters: { access: number; download: number };
    stats: { accessLog: AccessLog[]; downloads: DownloadLog[] };
    info: ApkInfo;
  }>;
}

export async function uploadApk(file: File) {
  // 1. Limpar APKs antigos do Storage e do banco de dados antes de enviar o novo
  try {
    const { data: existingFiles } = await supabase.storage.from(APK_BUCKET).list();
    if (existingFiles && existingFiles.length > 0) {
      const filesToRemove = existingFiles.map((f) => f.name);
      await supabase.storage.from(APK_BUCKET).remove(filesToRemove);
    }
    await supabase.from("apk_releases").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  } catch (cleanupError) {
    console.warn("Aviso ao limpar APKs antigos:", cleanupError);
  }

  // 2. Preparar e fazer o upload do novo APK
  const { path, token } = await adminUploadApk();
  const { error } = await supabase.storage.from(APK_BUCKET).uploadToSignedUrl(path, token, file, {
    contentType: "application/vnd.android.package-archive",
  });

  if (error) throw error;
  await adminSaveApkData({ fileName: file.name, size: file.size });
}

export async function resetCounter(key: "access" | "download") {
  await adminResetCounter({ data: { key } });
}
