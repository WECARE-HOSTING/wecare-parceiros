"use client";

import Image from "next/image";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, User, FileText, Info } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[0.9rem] font-semibold text-[#161513] font-[family-name:var(--font-inter)]">
      {children}
      {required && <span className="text-[#8F6E37] ml-0.5">*</span>}
    </label>
  );
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-[14px] py-3 rounded-lg border border-[#143240] bg-white text-[0.95rem] text-[#161513] placeholder:text-[#6B675E]/60 focus:outline-none focus:border-[#B79152] focus:ring-[3px] focus:ring-[#E8D9B8] transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)] font-[family-name:var(--font-inter)] ${className}`}
      {...props}
    />
  );
}

function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full min-h-[4.5rem] px-[14px] py-3 rounded-lg border border-[#143240] bg-white text-[0.95rem] leading-relaxed text-[#161513] placeholder:text-[#6B675E]/60 focus:outline-none focus:border-[#B79152] focus:ring-[3px] focus:ring-[#E8D9B8] transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)] font-[family-name:var(--font-inter)] resize-y ${className}`}
      rows={3}
      {...props}
    />
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex items-center gap-2.5">
        <Icon size={17} className="text-[#8F6E37] shrink-0" />
        <span className="text-[0.78rem] font-semibold tracking-[0.18em] uppercase text-[#8F6E37] font-[family-name:var(--font-inter)]">
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-[18px]">{children}</div>
    </div>
  );
}

function PageHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[rgba(242,234,217,0.92)] backdrop-blur-[10px] backdrop-saturate-[140%] border-b border-[rgba(22,21,19,0.10)]">
      <div className="max-w-[680px] mx-auto px-5 md:px-10 h-[72px] flex items-center justify-between gap-4">
        <Image src="/logo.png" alt="WeCare Hosting" width={140} height={30} className="h-[30px] w-auto" priority />
        <span className="hidden sm:inline-block text-[0.64rem] font-semibold tracking-[0.2em] uppercase text-[#6B675E] font-[family-name:var(--font-inter)]">
          Avaliação de imóvel · Proprietários
        </span>
      </div>
    </header>
  );
}

function FormIntro() {
  return (
    <div className="text-center mb-9">
      <div className="flex items-center justify-center gap-3.5 mb-5">
        <span className="block w-9 h-px bg-[#B79152]" />
        <span className="text-[0.6875rem] font-semibold tracking-[0.22em] uppercase text-[#D2B785] font-[family-name:var(--font-inter)]">
          O próximo passo
        </span>
        <span className="block w-9 h-px bg-[#B79152]" />
      </div>
      <h1 className="font-[family-name:var(--font-spectral)] font-medium text-[clamp(1.9rem,1.4rem+1.8vw,2.6rem)] leading-[1.2] text-[#F7F1E5] mb-3.5">
        Avalie seu imóvel{" "}
        <em className="italic text-[#D2B785] font-[family-name:var(--font-spectral)]">com a WeCare.</em>
      </h1>
      <p className="text-base leading-[1.7] text-[#8FA6B0] max-w-[52ch] mx-auto font-[family-name:var(--font-inter)]">
        Cuidamos de um número limitado de imóveis. A gente avalia o seu imóvel — e você
        avalia a gente. Se houver fit dos dois lados, seguimos juntos.
      </p>
    </div>
  );
}

function StatusCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-[rgba(22,21,19,0.10)] shadow-[0_8px_24px_rgba(12,35,48,0.09)] max-w-[680px] w-full p-7 md:p-11">
      {children}
    </div>
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

  if (step === "success") {
    return (
      <main className="min-h-screen bg-[#0C2330] font-[family-name:var(--font-inter)]">
        <PageHeader />
        <section className="py-16 md:py-24 px-5 md:px-10">
          <div className="max-w-[680px] mx-auto flex justify-center">
            <StatusCard>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#E4EAE2] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-[#4C6B52]" />
                </div>
                <h1 className="text-2xl font-semibold text-[#161513] font-[family-name:var(--font-spectral)]">
                  Indicação recebida!
                </h1>
                <p className="text-[#2B2A27] text-base leading-relaxed">
                  Obrigado pelo interesse. Nossa equipe entrará em contato em breve para dar andamento ao processo.
                </p>
                <div className="bg-[#F2EAD9]/60 border border-[rgba(22,21,19,0.08)] rounded-lg p-4 text-sm text-[#2B2A27]">
                  Guarde este contato:{" "}
                  <a href="mailto:contato@wecarehosting.com.br" className="text-[#8F6E37] font-semibold underline hover:text-[#B79152] transition">
                    contato@wecarehosting.com.br
                  </a>
                </div>
              </div>
            </StatusCard>
          </div>
          <p className="text-center text-[0.78rem] text-[#8FA6B0] mt-7 font-[family-name:var(--font-inter)]">
            wecare. — patrimônio em boas mãos
          </p>
        </section>
      </main>
    );
  }

  if (step === "error") {
    return (
      <main className="min-h-screen bg-[#0C2330] font-[family-name:var(--font-inter)]">
        <PageHeader />
        <section className="py-16 md:py-24 px-5 md:px-10">
          <div className="max-w-[680px] mx-auto flex justify-center">
            <StatusCard>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F0DED9] flex items-center justify-center mx-auto">
                  <AlertCircle size={32} className="text-[#8A3A33]" />
                </div>
                <h1 className="text-2xl font-semibold text-[#161513] font-[family-name:var(--font-spectral)]">
                  Não foi possível enviar
                </h1>
                <p className="text-[#8A3A33] text-sm">{errorMsg}</p>
                <button
                  onClick={() => setStep("form")}
                  className="text-sm text-[#8F6E37] underline hover:text-[#B79152] transition"
                >
                  Tentar novamente
                </button>
              </div>
            </StatusCard>
          </div>
          <p className="text-center text-[0.78rem] text-[#8FA6B0] mt-7 font-[family-name:var(--font-inter)]">
            wecare. — patrimônio em boas mãos
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0C2330] font-[family-name:var(--font-inter)]">
      <PageHeader />

      <section className="py-16 md:py-24 pb-20 md:pb-28 px-5 md:px-10">
        <div className="max-w-[680px] mx-auto">
          <FormIntro />

          {!utmCode && (
            <div className="mb-6 bg-[#F1E6D2] border border-[rgba(154,106,46,0.25)] rounded-lg p-4 text-sm text-[#9A6A2E]">
              Link de indicação não identificado. Certifique-se de ter acessado este formulário
              pelo link enviado pelo seu parceiro.
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[rgba(22,21,19,0.10)] rounded-lg shadow-[0_8px_24px_rgba(12,35,48,0.09)] p-7 md:p-11 flex flex-col gap-[22px]"
          >
            {errorMsg && step === "form" && (
              <div className="flex items-center gap-2 text-sm text-[#8A3A33] bg-[#F0DED9] border border-[rgba(138,58,51,0.2)] rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            <Section icon={User} title="Dados do proprietário">
              <div className="flex flex-col gap-2">
                <Label required>Nome completo</Label>
                <Input
                  value={form.full_name}
                  onChange={set("full_name")}
                  placeholder="Como consta no documento"
                  required
                />
              </div>

              <p className="flex items-center gap-2 text-[0.85rem] text-[#6B675E] m-0">
                <Info size={14} className="shrink-0" />
                Informe ao menos e-mail ou telefone.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                <div className="flex flex-col gap-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </Section>

            <div className="flex flex-col gap-2">
              <Label>Breve descrição do imóvel</Label>
              <Textarea
                value={form.property_description}
                onChange={set("property_description")}
                placeholder="Ex: Apartamento 2 quartos em Florianópolis, próximo à praia, mobiliado, disponível para temporada..."
              />
            </div>

            <div className="border-t border-[rgba(22,21,19,0.10)] pt-[22px] flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <FileText size={17} className="text-[#8F6E37] shrink-0" />
                <span className="text-[0.78rem] font-semibold tracking-[0.18em] uppercase text-[#8F6E37] font-[family-name:var(--font-inter)]">
                  Consentimento
                </span>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.lgpd_consent}
                  onChange={set("lgpd_consent")}
                  className="mt-[3px] w-4 h-4 accent-[#0C2330] shrink-0"
                />
                <span className="text-[0.88rem] text-[#2B2A27] leading-relaxed">
                  Autorizo a WeCare Hosting a armazenar e utilizar meus dados para contato
                  e análise da indicação, conforme a{" "}
                  <a
                    href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8F6E37] underline hover:text-[#B79152] transition"
                  >
                    Lei Geral de Proteção de Dados (LGPD)
                  </a>
                  . Meus dados não serão compartilhados com terceiros.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={step === "loading" || !utmCode}
              className="w-full font-[family-name:var(--font-inter)] text-base font-semibold text-[#081720] bg-[#B79152] hover:bg-[#8F6E37] hover:text-[#FBF7EF] disabled:opacity-50 disabled:hover:bg-[#B79152] disabled:hover:text-[#081720] border-none rounded-lg py-[15px] px-6 cursor-pointer transition-[background,color] duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)] flex items-center justify-center gap-2"
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

          <p className="text-center text-[0.78rem] text-[#8FA6B0] mt-7 font-[family-name:var(--font-inter)]">
            wecare. — patrimônio em boas mãos
          </p>
        </div>
      </section>
    </main>
  );
}
