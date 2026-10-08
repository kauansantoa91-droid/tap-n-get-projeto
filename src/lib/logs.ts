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
  try {
    const req = getRequest();
    const h = req.headers;
    const ua = h.get("user-agent") || "";
    const ref = h.get("referer") || "";
    let source = "Direto";
    try {
      if (ref) source = new URL(ref).hostname;
    } catch {}

    const sb = await serverClient();
    if (!sb) {
      console.error("[logAccess] Supabase admin indisponível.");
      return { ok: false };
    }

    const { error: insertError } = await sb.from("access_logs").insert({
      ip: clientIp(h),
      user_agent: ua,
      device: parseDevice(ua),
      source,
    });

    if (insertError) {
      console.error("[logAccess] Erro ao gravar access_logs:", insertError);
    }

    await sb.rpc("increment_counter", { _key: "access" });
    return { ok: true };
  } catch (err) {
    console.error("[logAccess] Exceção:", err);
    return { ok: false };
  }
});

export const logDownload = createServerFn({ method: "POST" })
  .inputValidator((d: { filename: string }) => d)
  .handler(async ({ data }) => {
    try {
      const req = getRequest();
      const h = req.headers;
      const ua = h.get("user-agent") || "";
      const sb = await serverClient();

      if (!sb) {
        console.error("[logDownload] Supabase admin indisponível.");
        return { ok: false };
      }

      const { error: insertError } = await sb.from("download_logs").insert({
        ip: clientIp(h),
        user_agent: ua,
        device: parseDevice(ua),
        filename: String(data?.filename ?? "apk").slice(0, 200),
      });

      if (insertError) {
        console.error("[logDownload] Erro ao gravar download_logs:", insertError);
      }

      await sb.rpc("increment_counter", { _key: "download" });
      return { ok: true };
    } catch (err) {
      console.error("[logDownload] Exceção:", err);
      return { ok: false };
    }
  });
