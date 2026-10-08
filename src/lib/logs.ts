import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
async function serverClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function clientIp(h: Headers): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return (fwd.split(",")[0] ?? "").trim();
  return h.get("cf-connecting-ip") || h.get("x-real-ip") || "";
}

function parseDevice(ua: string): string {
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os/i.test(ua)) return "Mac";
  if (/linux/i.test(ua)) return "Linux";
  return "Desconhecido";
}

export const logAccess = createServerFn({ method: "POST" }).handler(async () => {
  const req = getRequest();
  const h = req.headers;
  const ua = h.get("user-agent") || "";
  const ref = h.get("referer") || "";
  let source = "Direto";
  try { if (ref) source = new URL(ref).hostname; } catch {}
  const sb = await serverClient();
  await sb.from("access_logs").insert({
    ip: clientIp(h),
    user_agent: ua,
    device: parseDevice(ua),
    source,
  });
  await sb.rpc("increment_counter", { _key: "access" });
  return { ok: true };
});

export const logDownload = createServerFn({ method: "POST" })
  .inputValidator((d: { filename: string }) => d)
  .handler(async ({ data }) => {
    const req = getRequest();
    const h = req.headers;
    const ua = h.get("user-agent") || "";
    const sb = await serverClient();
    await sb.from("download_logs").insert({
      ip: clientIp(h),
      user_agent: ua,
      device: parseDevice(ua),
      filename: String(data.filename).slice(0, 200),
    });
    await sb.rpc("increment_counter", { _key: "download" });
    return { ok: true };
  });
