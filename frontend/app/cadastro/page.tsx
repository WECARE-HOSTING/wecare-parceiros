"use client";

import Image from "next/image";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  Info,
  ArrowDown,
  Camera,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const PROOFS = [
  { value: "10 anos", label: "de experiência no Airbnb" },
  { value: "Zero", label: "reclamações no Reclame Aqui" },
  { value: "< 1%", label: "de churn — quem entra, fica" },
];

const SERVICOS = [
  {
    icon: Camera,
    title: "Anúncio e precificação",
    desc: "Fotografia profissional, anúncio nas principais plataformas e preço ajustado todo dia. O imóvel posicionado à altura do que ele é.",
  },
  {
    icon: ShieldCheck,
    title: "Hóspedes",
    desc: "Atendimento humano 24h e curadoria de quem entra na sua casa. Nem todo hóspede passa — e é isso que protege o imóvel.",
  },
  {
    icon: Sparkles,
    title: "Limpeza e enxoval",
    desc: "Equipe própria entre cada estadia, com vistoria registrada em foto. Higiene de hotel, não de faxina avulsa.",
  },
  {
    icon: Wrench,
    title: "Manutenção",
    desc: "Manutenção preventiva e rede de prestadores para o que aparecer. Resolvemos sem te incomodar.",
  },
];

const GARANTIAS = [
  "Você usa o imóvel quando quiser, sem taxa. Ele é seu.",
  "Saída com 30 dias de aviso, sem multa. A relação se sustenta por resultado.",
  "Seguro obrigatório em toda locação, com orientação completa.",
  "Atendimento humano 24h para você e para o hóspede.",
  "O Relatório WeCare todo mês, e o repasse pontual no Dia do Repasse.",
];

const PASSOS = [
  {
    num: "01",
    title: "Avaliação mútua",
    desc: "A gente avalia o imóvel e você avalia a gente. É assim que se decide, juntos, se a parceria faz sentido.",
  },
  {
    num: "02",
    title: "Contrato e preparo",
    desc: "Contrato sem letra miúda. Vistoria, inventário, manual da casa, fotografia e o anúncio no ar.",
  },
  {
    num: "03",
    title: "Operação e repasse",
    desc: "O imóvel roda. Você acompanha pelo Relatório e recebe no Dia do Repasse.",
  },
];

// ── Componentes auxiliares ────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[15px] font-medium text-[#161513] font-[family-name:var(--font-inter)]">
      {children}
      {required && <span className="text-[#C0392B] ml-0.5">*</span>}
    </label>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-[14px] py-3 rounded-lg border border-[#C9BBA4] bg-white text-[15px] text-[#161513] placeholder:text-[#8A857C] focus:outline-none focus:ring-2 focus:ring-[#B79152] focus:ring-offset-1 transition font-[family-name:var(--font-inter)] ${className}`}
      {...props}
    />
  );
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full min-h-[5rem] px-[14px] py-3 rounded-lg border border-[#C9BBA4] bg-white text-[15px] text-[#161513] placeholder:text-[#8A857C] focus:outline-none focus:ring-2 focus:ring-[#B79152] focus:ring-offset-1 transition font-[family-name:var(--font-inter)] resize-y ${className}`}
      rows={3}
      {...props}
    />
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <Icon size={18} className="text-[#B79152] shrink-0" />
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#B79152] font-[family-name:var(--font-inter)]">
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function PageFooter() {
  return (
    <footer className="bg-[#0C2330] px-6 py-8 text-center">
      <p className="text-sm text-[#C9BBA4] font-[family-name:var(--font-inter)]">
        wecare. — patrimônio em boas mãos
      </p>
      <p className="mt-3 text-xs text-[#C9BBA4]/70 font-[family-name:var(--font-inter)]">
        WeCare Hosting Serviços LTDA · CNPJ 30.870.784/0001-70 · Cotia — SP
        <br />
        Dúvidas?{" "}
        <a href="mailto:contato@wecarehosting.com.br" className="underline text-[#B79152] hover:text-[#C9A96B] transition">
          contato@wecarehosting.com.br
        </a>
      </p>
    </footer>
  );
}

function scrollToForm() {
  const target = document.getElementById("form-imovel");
  if (target) {
    const y = target.getBoundingClientRect().top + window.pageYOffset - 24;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

function BrandHeader() {
  return (
    <div className="max-w-[1080px] mx-auto pt-7 flex items-center justify-between gap-4">
      <Image src="/logo.png" alt="WeCare Hosting" width={140} height={30} className="h-[30px] w-auto" priority />
      <span className="hidden sm:block text-xs tracking-[0.2em] uppercase text-[#C9BBA4] font-[family-name:var(--font-inter)]">
        Gestão de imóveis para temporada
      </span>
    </div>
  );
}

function CompactHeader() {
  return (
    <header className="bg-[#0C2330] px-6 pb-7">
      <BrandHeader />
    </header>
  );
}

function Hero({ indicado }: { indicado: boolean }) {
  return (
    <header className="bg-[#0C2330] text-[#F2EAD9] px-6">
      <BrandHeader />

      <div className="max-w-[1080px] mx-auto pt-16 pb-14 md:pt-[88px] md:pb-[72px]">
        <div className="flex items-center gap-3.5 mb-7">
          <span className="block w-12 h-px bg-[#B79152]" />
          <span className="text-xs tracking-[0.22em] uppercase text-[#B79152] font-[family-name:var(--font-inter)]">
            {indicado ? "Você chegou por indicação" : "Para quem tem patrimônio parado"}
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-spectral)] font-medium text-[clamp(2.5rem,6vw,4.25rem)] leading-[1.06] mb-6 max-w-[18ch] text-[#F2EAD9]">
          O melhor retorno para o seu imóvel.{" "}
          <em className="text-[#B79152] font-[family-name:var(--font-spectral)] italic">
            Com quem pensa como proprietário.
          </em>
        </h1>
        <p className="text-[19px] leading-relaxed text-[rgba(242,234,217,0.85)] max-w-[58ch] mb-4 font-[family-name:var(--font-inter)]">
          A WeCare opera imóveis de médio e alto padrão em locação por temporada, de ponta a ponta:
          anúncio, precificação, hóspede, limpeza, manutenção e financeiro.
        </p>
        <p className="text-[19px] leading-relaxed text-[rgba(242,234,217,0.85)] max-w-[56ch] mb-10 font-[family-name:var(--font-inter)]">
          Renda passiva de verdade, sem abrir mão do ativo e sem depreciar o que é seu.
        </p>
        <div className="flex items-center gap-6 flex-wrap">
          <button
            type="button"
            onClick={scrollToForm}
            className="inline-flex items-center gap-2.5 bg-[#B79152] hover:bg-[#C9A96B] text-[#0C2330] font-semibold text-base px-7 py-3.5 rounded-lg transition duration-[220ms] ease-[cubic-bezier(.25,.46,.45,.94)] font-[family-name:var(--font-inter)]"
          >
            Avaliar meu imóvel
            <ArrowDown size={18} />
          </button>
          <span className="text-sm text-[#C9BBA4] font-[family-name:var(--font-inter)]">
            Sem taxa de adesão. Sem fidelidade.
          </span>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto border-t border-[rgba(183,145,82,0.4)] py-9 pb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {PASSOS.map((p) => (
          <div key={p.num} className="flex flex-col gap-2.5">
            <span className="font-[family-name:var(--font-spectral)] text-[15px] text-[#B79152]">{p.num}</span>
            <span className="font-[family-name:var(--font-spectral)] text-[21px] text-[#F2EAD9]">{p.title}</span>
            <span className="text-sm leading-[1.55] text-[rgba(242,234,217,0.65)] font-[family-name:var(--font-inter)]">
              {p.desc}
            </span>
          </div>
        ))}
      </div>
    </header>
  );
}

function ProofsStrip() {
  return (
    <section className="bg-white border-b border-[rgba(22,21,19,0.08)] px-6 py-7">
      <div className="max-w-[1080px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
        {PROOFS.map((p) => (
          <div key={p.value} className="flex flex-col gap-0.5 text-center">
            <span className="font-[family-name:var(--font-spectral)] text-[26px] font-medium text-[#0C2330]">
              {p.value}
            </span>
            <span className="text-[13px] tracking-[0.14em] uppercase text-[#6B675E] font-[family-name:var(--font-inter)]">
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HistoriaSection() {
  return (
    <section className="px-6 py-14 md:py-20">
      <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 md:gap-16 items-start">
        <div className="flex flex-col gap-1">
          <span className="text-xs tracking-[0.22em] uppercase text-[#B79152] font-[family-name:var(--font-inter)]">
            A história de origem
          </span>
          <span className="font-[family-name:var(--font-spectral)] text-[38px] md:text-[44px] leading-[1.05] text-[#0C2330] mt-3">
            R$ 3.500
          </span>
          <span className="text-[#B79152] text-2xl leading-none my-1">↓</span>
          <span className="font-[family-name:var(--font-spectral)] text-[38px] md:text-[44px] leading-[1.05] text-[#0C2330]">
            R$ 30.000
          </span>
          <span className="text-[13px] text-[#6B675E] mt-2 font-[family-name:var(--font-inter)]">
            por mês · a mesma casa
          </span>
        </div>

        <div className="max-w-[58ch]">
          <h2 className="font-[family-name:var(--font-spectral)] font-medium text-[32px] leading-[1.2] text-[#0C2330] mb-5">
            A casa que ia ser vendida virou a tese.
          </h2>
          <p className="text-[16px] leading-relaxed text-[#4A463F] mb-4 font-[family-name:var(--font-inter)]">
            No interior de São Paulo, a casa da família rendia R$ 3.500 por mês. Rendia tão pouco que
            já se falava em vender. Reformada e operada com método, passou a faturar R$ 30 mil mensais.
          </p>
          <p className="text-[16px] leading-relaxed text-[#4A463F] mb-5 font-[family-name:var(--font-inter)]">
            A WeCare nasceu daí: pegar imóveis bons e subutilizados e fazê-los render, sem o
            proprietário abrir mão do ativo.
          </p>
          <p className="text-[13px] leading-relaxed text-[#6B675E] border-l-2 border-[#C9BBA4] pl-4 font-[family-name:var(--font-inter)]">
            É o resultado de um imóvel específico, com reforma, praça e perfil próprios. Não é
            projeção do que o seu vai render — isso só a avaliação diz.
          </p>
        </div>
      </div>
    </section>
  );
}

function ServicosSection() {
  return (
    <section className="px-6 pb-14 md:pb-20">
      <div className="max-w-[1080px] mx-auto">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs tracking-[0.22em] uppercase text-[#B79152] font-[family-name:var(--font-inter)]">
            O que fazemos
          </span>
          <h2 className="font-[family-name:var(--font-spectral)] font-medium text-[34px] leading-[1.2] mt-3 text-[#0C2330]">
            Operação ponta a ponta. Você só colhe a renda.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SERVICOS.map((s) => (
            <div
              key={s.title}
              className="bg-white border border-[rgba(22,21,19,0.08)] rounded-lg p-7 flex flex-col gap-3.5 shadow-[0_1px_3px_rgba(12,35,48,0.06)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(12,35,48,0.10)] transition duration-[220ms] ease-[cubic-bezier(.25,.46,.45,.94)]"
            >
              <s.icon size={24} className="text-[#B79152]" />
              <h3 className="font-[family-name:var(--font-spectral)] font-semibold text-xl text-[#0C2330]">
                {s.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-[#4A463F] font-[family-name:var(--font-inter)]">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GarantiasSection() {
  return (
    <section className="px-6 pb-14 md:pb-[88px]">
      <div className="max-w-[1080px] mx-auto bg-[#0C2330] rounded-lg p-8 md:p-16 text-[#F2EAD9]">
        <div className="max-w-[640px] mb-9">
          <span className="text-xs tracking-[0.22em] uppercase text-[#B79152] font-[family-name:var(--font-inter)]">
            O que fica combinado
          </span>
          <h2 className="font-[family-name:var(--font-spectral)] font-medium text-[clamp(1.75rem,4vw,2.375rem)] leading-[1.2] mt-3">
            O imóvel continua <em className="italic text-[#B79152]">seu</em>. Em tudo.
          </h2>
        </div>

        <ul className="flex flex-col gap-4 max-w-[68ch]">
          {GARANTIAS.map((g) => (
            <li key={g} className="flex items-start gap-3.5">
              <CheckCircle2 size={19} className="text-[#B79152] shrink-0 mt-0.5" />
              <span className="text-[16px] leading-relaxed text-[rgba(242,234,217,0.85)] font-[family-name:var(--font-inter)]">
                {g}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex items-center gap-6 flex-wrap">
          <button
            type="button"
            onClick={scrollToForm}
            className="inline-flex items-center gap-2.5 bg-[#B79152] hover:bg-[#C9A96B] text-[#0C2330] font-semibold text-base px-7 py-3.5 rounded-lg transition duration-[220ms] ease-[cubic-bezier(.25,.46,.45,.94)] font-[family-name:var(--font-inter)]"
          >
            Avaliar meu imóvel
          </button>
          <span className="text-sm text-[rgba(242,234,217,0.6)] font-[family-name:var(--font-inter)]">
            Só gerimos o que acreditamos que vai ganhar.
          </span>
        </div>
      </div>
    </section>
  );
}

type Step = "form" | "loading" | "success" | "error";

export default function IndicarPage() {
  const params = useSearchParams();
  const rawUtmCampaign = params.get("utm_campaign") ?? "";
  const utmCode = params.get("utm_code") ?? (rawUtmCampaign || "");

  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    property_description: "",
    lgpd_consent: false,
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setForm((prev) => ({ ...prev, [field]: val }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lgpd_consent) {
      setErrorMsg("Você precisa aceitar os termos para continuar.");
      return;
    }
    if (!form.email && !form.phone) {
      setErrorMsg("Informe ao menos e-mail ou telefone.");
      return;
    }
    setStep("loading");
    try {
      const res = await fetch(`${API_URL}/leads/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utm_code: utmCode,
          utm_source: "parceiro",
          utm_medium: "referral",
          utm_campaign: utmCode,
          full_name: form.full_name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          property_description: form.property_description || undefined,
          lgpd_consent: form.lgpd_consent,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Erro ao enviar." }));
        throw new Error(err.detail ?? "Erro ao enviar.");
      }
      setStep("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro inesperado.");
      setStep("error");
    }
  }

  // ── Tela de sucesso ──────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <main className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
        <CompactHeader />
        <div className="flex items-center justify-center px-6 py-12 md:py-20">
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(12,35,48,0.06)] border border-[rgba(22,21,19,0.08)] max-w-2xl w-full p-8 md:p-10 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#E4EAE2] flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-[#4C6B52]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0C2330] font-[family-name:var(--font-spectral)]">
              Recebemos os seus dados.
            </h1>
            <p className="text-[#4A463F] text-base leading-relaxed">
              Nossa equipe entra em contato para marcar a avaliação do seu imóvel. É uma conversa
              sem compromisso: a gente avalia o imóvel e você avalia a gente.
            </p>
            <div className="bg-[#F2EAD9]/60 rounded-lg p-4 text-sm text-[#4A463F] border border-[rgba(22,21,19,0.08)]">
              Se preferir adiantar, escreva para{" "}
              <a href="mailto:contato@wecarehosting.com.br" className="text-[#B79152] font-semibold underline">
                contato@wecarehosting.com.br
              </a>
            </div>
          </div>
        </div>
        <PageFooter />
      </main>
    );
  }

  // ── Tela de erro ─────────────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <main className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
        <CompactHeader />
        <div className="flex items-center justify-center px-6 py-12 md:py-20">
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(12,35,48,0.06)] border border-[rgba(22,21,19,0.08)] max-w-2xl w-full p-8 md:p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F0DED9] flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-[#8A3A33]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0C2330] font-[family-name:var(--font-spectral)]">
              Não foi possível enviar
            </h1>
            <p className="text-[#8A3A33] text-sm">{errorMsg}</p>
            <button
              onClick={() => setStep("form")}
              className="text-sm text-[#B79152] underline hover:text-[#8F6E37] transition"
            >
              Tentar novamente
            </button>
          </div>
        </div>
        <PageFooter />
      </main>
    );
  }

  // ── Página ───────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
      <Hero indicado={Boolean(utmCode)} />
      <ProofsStrip />
      <HistoriaSection />
      <ServicosSection />
      <GarantiasSection />

      <section id="form-imovel" className="px-6 pb-24">
        <div className="max-w-[720px] mx-auto mb-8 text-center">
          <span className="text-xs tracking-[0.22em] uppercase text-[#B79152] font-[family-name:var(--font-inter)]">
            Avaliação sem compromisso
          </span>
          <h2 className="font-[family-name:var(--font-spectral)] font-medium text-[34px] leading-[1.2] mt-3 text-[#0C2330]">
            Vamos ver o que o seu imóvel pode render.
          </h2>
        </div>

        {!utmCode && (
          <div className="max-w-[720px] mx-auto mb-5 bg-[#F1E6D2] border border-[rgba(183,145,82,0.4)] rounded-lg p-5 text-sm text-[#7A5A22]">
            <p className="font-semibold">Não reconhecemos o link de indicação.</p>
            <p className="mt-1.5 leading-relaxed">
              O envio fica bloqueado até identificarmos quem indicou você, porque é assim que
              garantimos o crédito a quem fez a indicação. Abra o formulário pelo link que seu
              parceiro enviou, ou escreva para{" "}
              <a href="mailto:contato@wecarehosting.com.br" className="underline font-medium">
                contato@wecarehosting.com.br
              </a>{" "}
              que a gente resolve por aqui.
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="max-w-[720px] mx-auto bg-white rounded-xl p-6 md:p-12 shadow-[0_1px_3px_rgba(12,35,48,0.06)] flex flex-col gap-5"
        >
          {errorMsg && step === "form" && (
            <div className="flex items-center gap-2 text-sm text-[#8A3A33] bg-[#F0DED9] border border-[#F0DED9] rounded-lg px-3 py-2">
              <AlertCircle size={14} className="shrink-0" />
              {errorMsg}
            </div>
          )}

          <Section icon={User} title="Seus dados">
            <div className="flex flex-col gap-1.5">
              <Label required>Nome completo</Label>
              <Input
                value={form.full_name}
                onChange={set("full_name")}
                placeholder="Como consta no documento"
                required
              />
            </div>

            <div className="flex items-center gap-1.5 text-sm text-[#6B675E]">
              <Info size={14} className="shrink-0" />
              <span>Informe ao menos e-mail ou telefone.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="seu@email.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Telefone / WhatsApp</Label>
                <Input
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </Section>

          <hr className="border-0 border-t border-[rgba(22,21,19,0.1)] my-2" />

          <Section icon={FileText} title="Sobre o imóvel">
            <div className="flex flex-col gap-1.5">
              <Label>Breve descrição</Label>
              <Textarea
                value={form.property_description}
                onChange={set("property_description")}
                placeholder="Ex: apartamento de 2 quartos nos Jardins, mobiliado, livre para temporada"
              />
              <p className="text-xs text-[#8A857C]">
                Quanto mais você contar, mais precisa fica a avaliação.
              </p>
            </div>
          </Section>

          <hr className="border-0 border-t border-[rgba(22,21,19,0.1)] my-2" />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.lgpd_consent}
              onChange={set("lgpd_consent")}
              className="mt-1 accent-[#B79152]"
            />
            <span className="text-sm text-[#4A463F] leading-relaxed">
              Autorizo a WeCare Hosting a armazenar e utilizar meus dados para contato e análise da
              indicação, conforme a Lei Geral de Proteção de Dados (LGPD). Meus dados não são
              vendidos nem cedidos para publicidade. Podem ser compartilhados com prestadores de
              serviço da operação e com autoridades, quando a lei exigir.
            </span>
          </label>

          <button
            type="submit"
            disabled={step === "loading" || !utmCode}
            className="w-full py-4 rounded-lg bg-[#B79152] hover:bg-[#C9A96B] disabled:opacity-50 disabled:hover:bg-[#B79152] text-[#0C2330] font-semibold text-base transition flex items-center justify-center gap-2 font-[family-name:var(--font-inter)]"
          >
            {step === "loading" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando…
              </>
            ) : (
              "Avaliar meu imóvel"
            )}
          </button>
        </form>
      </section>

      <PageFooter />
    </main>
  );
}
