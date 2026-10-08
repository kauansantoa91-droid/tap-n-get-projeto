import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, RotateCcw, Upload, Users, History } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  uploadApk, getApkDownloadUrl, resetCounter, loadDashboard,
  type AccessLog, type DownloadLog, type ApkInfo,
} from "@/lib/apk";
import { toast } from "sonner";
import { checkAdminLogin, isAdmin } from "@/lib/admin-auth.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel — Tap n Get" },
      { name: "description", content: "Painel de controle: acessos, downloads e APK." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGate,
});

function maskIp(ip: string | null) {
  if (!ip) return "—";
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts[0]}:${parts[1] ?? ""}...${parts.slice(-1)[0]}`;
  }
  const o = ip.split(".");
  if (o.length === 4) return `${o[0]}.${o[1]}...${o[3]}`;
  return ip;
}

function fmt(d: string) {
  return new Date(d).toLocaleString("pt-BR");
}

function AdminGate() {
  const [ok, setOk] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { isAdmin().then((r) => r.ok && setOk(true)).catch(() => {}); }, []);
  if (ok) return <AdminPage />;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await checkAdminLogin({ data: { user, pass } });
      if (r.ok) setOk(true);
      else toast.error("Login ou senha incorretos");
    } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold text-foreground">Entrar no Painel</h1>
        <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Login" autoComplete="username"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground" />
        <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Senha" type="password" autoComplete="current-password"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground" />
        <button disabled={busy} className="w-full rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground disabled:opacity-50">
          {busy ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function AdminPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [info, setInfo] = useState<ApkInfo>(null);
  const [uploading, setUploading] = useState(false);
  const [counters, setCounters] = useState({ access: 0, download: 0 });
  const [access, setAccess] = useState<AccessLog[]>([]);
  const [downloads, setDownloads] = useState<DownloadLog[]>([]);

  const refreshAll = async () => {
    const r = await loadDashboard();
    setInfo(r.info); setCounters(r.counters); setAccess(r.access); setDownloads(r.downloads);
  };
  useEffect(() => { refreshAll(); }, []);

  const onFile = async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".apk")) { toast.error("Envie um arquivo .apk"); return; }
    setUploading(true);
    try {
      await uploadApk(f);
      toast.success("APK publicado.");
      await refreshAll();
    } catch (e: any) {
      toast.error("Falha no upload: " + (e?.message ?? "erro"));
    } finally { setUploading(false); }
  };

  const testDownload = async () => {
    const r = await getApkDownloadUrl();
    if (!r) { toast.error("Nenhum APK publicado."); return; }
    window.open(r.url, "_blank");
  };

  const reset = async (k: "access" | "download") => {
    await resetCounter(k);
    toast.success("Contagem resetada");
    await refreshAll();
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Painel</h1>
          <Link to="/" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">
            <ArrowLeft size={16} /> Voltar
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Acessos</p>
                <p className="mt-2 text-4xl font-bold">{counters.access}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2 text-primary"><Users size={18} /></div>
            </div>
            <button onClick={() => reset("access")}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20">
              <RotateCcw size={14} /> Resetar Contagem
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Downloads</p>
                <p className="mt-2 text-4xl font-bold">{counters.download}</p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600"><Download size={18} /></div>
            </div>
            <button onClick={() => reset("download")}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-500/20">
              <RotateCcw size={14} /> Resetar Contagem
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold"><Upload size={18} className="text-emerald-600" /> Upload de APK</h2>
          {info ? (
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <p className="font-medium text-primary">APK Atual: {info.originalName}</p>
              {info.updated_at && <p className="text-muted-foreground">Criado em: {fmt(info.updated_at)}</p>}
              {info.size ? (
                <p className="text-muted-foreground">Tamanho: {(info.size / (1024 * 1024)).toFixed(2)} MB</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nenhum APK publicado ainda.</p>
          )}
          <div className="mt-4">
            <label className="mb-2 block text-sm text-muted-foreground">Selecione o arquivo APK</label>
            <div className="flex items-stretch gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".apk,application/vnd.android.package-archive"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
              />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent">
                Escolher Arquivo
              </button>
              <div className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground truncate">
                {uploading ? "Enviando..." : "Nenhum arquivo escolhido"}
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Tamanho máximo: 1GB</p>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              <Upload size={16} /> {uploading ? "Enviando..." : "Enviar APK"}
            </button>
            {info && (
              <button onClick={testDownload}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm hover:bg-accent">
                <Download size={16} /> Testar
              </button>
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold"><History size={18} className="text-primary" /> Últimos Acessos</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">IP</th>
                    <th className="py-2 pr-3 font-medium">Dispositivo</th>
                    <th className="py-2 pr-3 font-medium">Data/Hora</th>
                    <th className="py-2 font-medium">Origem</th>
                  </tr>
                </thead>
                <tbody>
                  {access.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Nenhum acesso ainda</td></tr>}
                  {access.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-mono text-xs">{maskIp(r.ip)}</td>
                      <td className="py-2 pr-3">{r.device ?? "—"}</td>
                      <td className="py-2 pr-3 text-xs">{fmt(r.created_at)}</td>
                      <td className="py-2 text-xs truncate max-w-[160px]">{r.source ?? "Direto"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold"><Download size={18} className="text-emerald-600" /> Últimos Downloads</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">IP</th>
                    <th className="py-2 pr-3 font-medium">Dispositivo</th>
                    <th className="py-2 font-medium">Data/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Nenhum download ainda</td></tr>}
                  {downloads.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-mono text-xs">{maskIp(r.ip)}</td>
                      <td className="py-2 pr-3">{r.device ?? "—"}</td>
                      <td className="py-2 text-xs">{fmt(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
