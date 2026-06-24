"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, User, FileText } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";


function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E55A4F]/30 focus:border-[#E55A4F] transition ${className}`}
      {...props}
    />
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#E55A4F]">
        <Icon size={16} />
        <h2 className="font-semibold text-sm uppercase tracking-wide">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

type Step = "form" | "loading" | "success" | "error";

export default function IndicarPage() {
  const params = useSearchParams();
  const utmCode = params.get("utm_campaign") ?? params.get("ref") ?? "";

  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    cpf: "",
    email: "",
    phone: "",
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
    setStep("loading");
    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utm_code: utmCode,
          utm_source: "parceiro",
          utm_medium: "referral",
          utm_campaign: utmCode,
          full_name: form.full_name,
          cpf: form.cpf,
          email: form.email,
          phone: form.phone || undefined,
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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Indicação recebida!</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Obrigado pelo interesse. Nossa equipe entrará em contato em breve para dar andamento ao processo.
          </p>
          <div className="bg-[#E55A4F]/5 rounded-xl p-4 text-sm text-[#E55A4F]">
            Guarde este contato: <strong>contato@wecarehosting.com.br</strong>
          </div>
        </div>
      </main>
    );
  }

  // ── Tela de erro ─────────────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Não foi possível enviar</h1>
          <p className="text-red-600 text-sm">{errorMsg}</p>
          <button
            onClick={() => setStep("form")}
            className="text-sm text-[#E55A4F] underline"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  // ── Formulário ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#E55A4F] px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">WeCare Hosting</p>
            <p className="text-white/60 text-xs">Programa de Parceria</p>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* Chamada */}
        <div className="text-center space-y-2 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Indique seu imóvel para a WeCare
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Preencha os dados abaixo e nossa equipe entrará em contato para apresentar
            como transformar seu imóvel em renda com a gestão profissional da WeCare Hosting.
          </p>
        </div>

        {!utmCode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            Link de indicação não identificado. Certifique-se de ter acessado este formulário
            pelo link enviado pelo seu parceiro.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Dados pessoais */}
          <Section icon={User} title="Dados do Proprietário">
            <div>
              <Label required>Nome completo</Label>
              <Input
                value={form.full_name}
                onChange={set("full_name")}
                placeholder="Como consta no documento"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>CPF</Label>
                <Input
                  value={form.cpf}
                  onChange={set("cpf")}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
              <div>
                <Label>Telefone / WhatsApp</Label>
                <Input
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <div>
              <Label required>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="seu@email.com"
                required
              />
            </div>
          </Section>

          <hr className="border-gray-100" />

          {/* LGPD */}
          <Section icon={FileText} title="Consentimento">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.lgpd_consent}
                onChange={set("lgpd_consent")}
                className="mt-0.5 accent-[#E55A4F]"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                Autorizo a WeCare Hosting a armazenar e utilizar meus dados para contato
                e análise da indicação, conforme a{" "}
                <span className="text-[#E55A4F] underline cursor-pointer">
                  Lei Geral de Proteção de Dados (LGPD)
                </span>
                . Meus dados não serão compartilhados com terceiros.
              </span>
            </label>
          </Section>

          <button
            type="submit"
            disabled={step === "loading" || !utmCode}
            className="w-full h-11 rounded-xl bg-[#E55A4F] hover:bg-[#E55A4F]/90 disabled:opacity-50 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            {step === "loading" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando…
              </>
            ) : (
              "Enviar indicação"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          WeCare Hosting · Gestão Profissional de Imóveis para Temporada
        </p>
      </div>
    </main>
  );
}
