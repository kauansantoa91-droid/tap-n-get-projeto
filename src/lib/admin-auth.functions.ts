import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

type S = { admin?: boolean };
function cfg() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "tng-admin",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "none" as const, path: "/" },
  };
}

async function requireAdmin() {
  const s = await useSession<S>(cfg());
  if (!s.data.admin) throw new Error("Não autorizado");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const BUCKET = "apks";
const PATH = "modulo-seguranca.apk";

export const checkAdminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { user: string; pass: string }) => ({ user: String(d.user).slice(0, 100), pass: String(d.pass).slice(0, 100) }))
  .handler(async ({ data }) => {
    const ok = data.user === "admin" && data.pass === "admin171";
    if (ok) {
      const s = await useSession<S>(cfg());
      await s.update({ admin: true });
    }
    return { ok };
  });

export const isAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const s = await useSession<S>(cfg());
  return { ok: !!s.data.admin };
});

export const adminDashboard = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const sb = await admin();
  const [c, a, d, m, l] = await Promise.all([
    sb.from("counters").select("*"),
    sb.from("access_logs").select("*").order("created_at", { ascending: false }).limit(20),
    sb.from("download_logs").select("*").order("created_at", { ascending: false }).limit(20),
    sb.from("apk_meta").select("*").eq("id", 1).maybeSingle(),
    sb.storage.from(BUCKET).list("", { search: PATH }),
  ]);
  const map: Record<string, number> = {};
  (c.data ?? []).forEach((r: any) => { map[r.key] = Number(r.value); });
  const obj = l.data?.find((f) => f.name === PATH) ?? null;
  return {
    counters: { access: map["access"] ?? 0, download: map["download"] ?? 0 },
    access: (a.data ?? []) as any[],
    downloads: (d.data ?? []) as any[],
    info: obj
      ? { name: obj.name, size: (obj.metadata as any)?.size ?? m.data?.size ?? null, updated_at: obj.updated_at ?? m.data?.uploaded_at ?? null, originalName: m.data?.filename ?? PATH }
      : null,
  };
});

export const adminResetCounter = createServerFn({ method: "POST" })
  .inputValidator((d: { key: "access" | "download" }) => {
    if (d.key !== "access" && d.key !== "download") throw new Error("invalid");
    return d;
  })
  .handler(async ({ data }) => {
    await requireAdmin();
    await (await admin()).rpc("reset_counter", { _key: data.key });
    return { ok: true };
  });

export const adminUploadUrl = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdmin();
  const { data, error } = await (await admin()).storage.from(BUCKET).createSignedUploadUrl(PATH, { upsert: true });
  if (error || !data) throw new Error("Falha ao preparar upload");
  return { path: data.path, token: data.token };
});

export const adminSaveMeta = createServerFn({ method: "POST" })
  .inputValidator((d: { filename: string; size: number }) => ({
    filename: String(d.filename).replace(/[^\w.\- ()]/g, "_").slice(0, 200),
    size: Number(d.size) || 0,
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await (await admin()).from("apk_meta")
      .upsert({ id: 1, filename: data.filename, size: data.size, uploaded_at: new Date().toISOString() });
    if (error) throw new Error("Falha ao salvar");
    return { ok: true };
  });

export const publicApkDownload = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data: meta } = await sb.from("apk_meta").select("filename").eq("id", 1).maybeSingle();
  const filename = meta?.filename || PATH;
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(PATH, 60 * 60, { download: filename });
  if (error || !data) return null;
  return { url: data.signedUrl, filename };
});
