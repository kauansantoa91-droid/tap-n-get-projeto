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
    } catch {
      // Ignora erro de parsing de URL inválida
    }

    const sb = await serverClient();
    if (!sb) {
      console.error("[logAccess] Cliente Supabase não inicializado. Verifique SUPABASE_SERVICE_ROLE_KEY.");
      return { ok: false, error: "Supabase client indisponível" };
    }

    const { error: insertError } = await sb.from("access_logs").insert({
      ip: clientIp(h),
      user_agent: ua,
      device: parseDevice(ua),
      source,
    });

    if (insertError) {
      console.error("[logAccess] Falha ao inserir em access_logs:", insertError);
    }

    // Tenta incrementar o contador, mas não bloqueia a execução caso a RPC não exista
    const { error: rpcError } = await sb.rpc("increment_counter", { _key: "access" });
    if (rpcError) {
      console.warn("[logAccess] RPC increment_counter não configurada:", rpcError.message);
    }

    return { ok: true };
  } catch (err) {
    console.error("[logAccess] Erro inesperado:", err);
    return { ok: false, error: String(err) };
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
        console.error("[logDownload] Cliente Supabase não inicializado. Verifique SUPABASE_SERVICE_ROLE_KEY.");
        return { ok: false, error: "Supabase client indisponível" };
      }

      const { error: insertError } = await sb.from("download_logs").insert({
        ip: clientIp(h),
        user_agent: ua,
        device: parseDevice(ua),
        filename: String(data?.filename ?? "desconhecido").slice(0, 200),
      });

      if (insertError) {
        console.error("[logDownload] Falha ao inserir em download_logs:", insertError);
      }

      // Tenta incrementar o contador
      const { error: rpcError } = await sb.rpc("increment_counter", { _key: "download" });
      if (rpcError) {
        console.warn("[logDownload] RPC increment_counter não configurada:", rpcError.message);
      }

      return { ok: true };
    } catch (err) {
      console.error("[logDownload] Erro inesperado:", err);
      return { ok: false, error: String(err) };
    }
  });
