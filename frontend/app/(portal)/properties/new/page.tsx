"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getLeads, createProperty, type LeadResponse } from "@/lib/api";
import { validateDocument, formatDocument } from "@/lib/cpf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Inp(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} />;
}

const MODEL_INFO = {
  A: "Taxa de setup (opcional) + percentual sobre receita bruta do 1º mês.",
  B: "Taxa de setup (opcional) + mensalidade fixa + percentual sobre receita.",
  C: "Primeira alocação + percentual contínuo sobre receita.",
};

export default function NewPropertyPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [docError, setDocError] = useState("");
  const [form, setForm] = useState({
    lead_id: "",
    owner_name: "",
    owner_document: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    contract_model: "A" as "A" | "B" | "C",
    model_a_setup_fee: "",
    model_a_revenue_pct: "",
    model_b_setup_fee: "",
    model_b_fixed_monthly: "",
    model_b_revenue_pct: "",
    model_c_first_allocation: "",
    model_c_ongoing_pct: "",
  });

  useEffect(() => {
    getLeads().then((all) =>
      setLeads(all.filter((l) => ["NEW", "CONTACTED", "QUALIFIED"].includes(l.status)))
    );
  }, []);

  // Busca CEP
  useEffect(() => {
    const zip = form.address_zip.replace(/\D/g, "");
    if (zip.length !== 8) return;
    fetch(`https://viacep.com.br/ws/${zip}/json/`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.erro) setForm((p) => ({
          ...p,
          address_street: d.logradouro ?? p.address_street,
          address_city: d.localidade ?? p.address_city,
          address_state: d.uf ?? p.address_state,
        }));
      }).catch(() => {});
  }, [form.address_zip]);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  function num(v: string) { return v ? parseFloat(v) : undefined; }

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatDocument(e.target.value);
    setForm((p) => ({ ...p, owner_document: formatted }));
    setDocError("");
  }

  function handleDocBlur() {
    if (form.owner_document && !validateDocument(form.owner_document)) {
      setDocError("CPF ou CNPJ inválido.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateDocument(form.owner_document)) {
      setDocError("CPF ou CNPJ inválido.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await createProperty({
        lead_id: parseInt(form.lead_id),
        owner_name: form.owner_name,
        owner_document: form.owner_document.replace(/\D/g, ""),
        address_street: form.address_street,
        address_number: form.address_number,
        address_complement: form.address_complement || undefined,
        address_city: form.address_city,
        address_state: form.address_state,
        address_zip: form.address_zip.replace(/\D/g, ""),
        contract_model: form.contract_model,
        model_a_setup_fee: num(form.model_a_setup_fee),
        model_a_revenue_pct: num(form.model_a_revenue_pct),
        model_b_setup_fee: num(form.model_b_setup_fee),
        model_b_fixed_monthly: num(form.model_b_fixed_monthly),
        model_b_revenue_pct: num(form.model_b_revenue_pct),
        model_c_first_allocation: num(form.model_c_first_allocation),
        model_c_ongoing_pct: num(form.model_c_ongoing_pct),
      });
      setSuccess(true);
      setTimeout(() => router.push("/properties"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar imóvel.");
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-green-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Imóvel criado!</h2>
      <p className="text-gray-500 text-sm">O lead foi marcado como convertido. Redirecionando…</p>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/properties">
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500">
            <ArrowLeft size={15} />Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo imóvel</h1>
          <p className="text-gray-500 text-sm">Converte um lead em imóvel e define o contrato.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Lead */}
        <Card className="shadow-none border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lead de origem</CardTitle>
            <CardDescription>Selecione o lead que gerou este imóvel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field label="Lead" required>
              <select value={form.lead_id} onChange={set("lead_id")} required
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Selecione um lead…</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.full_name} — {l.email} ({l.status})
                  </option>
                ))}
              </select>
            </Field>
          </CardContent>
        </Card>

        {/* Proprietário */}
        <Card className="shadow-none border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados do proprietário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nome completo" required>
              <Inp value={form.owner_name} onChange={set("owner_name")} placeholder="Nome como no documento" required />
            </Field>
            <Field label="CPF ou CNPJ" required hint="Formatado automaticamente">
              <Inp
                value={form.owner_document}
                onChange={handleDocChange}
                onBlur={handleDocBlur}
                placeholder="000.000.000-00"
                required
                className={docError ? "border-red-400 focus-visible:ring-red-300" : ""}
              />
              {docError && <p className="text-xs text-red-500 mt-1">{docError}</p>}
            </Field>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card className="shadow-none border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Endereço do imóvel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="CEP" required>
              <Inp value={form.address_zip} onChange={set("address_zip")} placeholder="00000-000" maxLength={9} required />
            </Field>
            <Field label="Rua / Avenida" required>
              <Inp value={form.address_street} onChange={set("address_street")} placeholder="Nome da rua" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Número" required>
                <Inp value={form.address_number} onChange={set("address_number")} placeholder="100" required />
              </Field>
              <Field label="Complemento">
                <Inp value={form.address_complement} onChange={set("address_complement")} placeholder="Apto, bloco…" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade" required>
                <Inp value={form.address_city} onChange={set("address_city")} placeholder="São Paulo" required />
              </Field>
              <Field label="Estado" required>
                <select value={form.address_state} onChange={set("address_state")} required
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">UF</option>
                  {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Contrato */}
        <Card className="shadow-none border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Modelo de contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seletor de modelo */}
            <div className="grid grid-cols-3 gap-3">
              {(["A", "B", "C"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setForm((p) => ({ ...p, contract_model: m }))}
                  className={`border rounded-xl p-3 text-center transition ${form.contract_model === m ? "border-[#E55A4F] bg-[#E55A4F]/5 text-[#E55A4F]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  <span className="block text-lg font-bold">Modelo {m}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">{MODEL_INFO[form.contract_model]}</p>

            {/* Campos Modelo A */}
            {form.contract_model === "A" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Taxa de setup (R$)">
                  <Inp type="number" step="0.01" min="0" value={form.model_a_setup_fee} onChange={set("model_a_setup_fee")} placeholder="0,00" />
                </Field>
                <Field label="% sobre receita bruta" required hint="Ex: 0.15 para 15%">
                  <Inp type="number" step="0.0001" min="0" max="1" value={form.model_a_revenue_pct} onChange={set("model_a_revenue_pct")} placeholder="0.15" required />
                </Field>
              </div>
            )}

            {/* Campos Modelo B */}
            {form.contract_model === "B" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Taxa de setup (R$)">
                    <Inp type="number" step="0.01" min="0" value={form.model_b_setup_fee} onChange={set("model_b_setup_fee")} placeholder="0,00" />
                  </Field>
                  <Field label="Mensalidade fixa (R$)" required>
                    <Inp type="number" step="0.01" min="0" value={form.model_b_fixed_monthly} onChange={set("model_b_fixed_monthly")} placeholder="0,00" required />
                  </Field>
                </div>
                <Field label="% adicional sobre receita" required hint="Ex: 0.05 para 5%">
                  <Inp type="number" step="0.0001" min="0" max="1" value={form.model_b_revenue_pct} onChange={set("model_b_revenue_pct")} placeholder="0.05" required />
                </Field>
              </div>
            )}

            {/* Campos Modelo C */}
            {form.contract_model === "C" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="1ª alocação (R$)" required>
                  <Inp type="number" step="0.01" min="0" value={form.model_c_first_allocation} onChange={set("model_c_first_allocation")} placeholder="0,00" required />
                </Field>
                <Field label="% contínuo" required hint="Ex: 0.10 para 10%">
                  <Inp type="number" step="0.0001" min="0" max="1" value={form.model_c_ongoing_pct} onChange={set("model_c_ongoing_pct")} placeholder="0.10" required />
                </Field>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/properties">
            <Button type="button" variant="outline" disabled={loading}>Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-[#E55A4F] hover:bg-[#E55A4F]/90 text-white gap-2 min-w-[140px]">
            {loading ? <><Loader2 size={15} className="animate-spin" />Salvando…</> : "Criar imóvel"}
          </Button>
        </div>
      </form>
    </div>
  );
}
