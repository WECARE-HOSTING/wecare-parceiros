"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getProperties, createRevenueRecord, type PropertyResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2, Sparkles } from "lucide-react";

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

export default function NewRevenuePage() {
  const router = useRouter();
  const params = useSearchParams();
  const preselectedId = params.get("property_id") ?? "";

  const [properties, setProperties] = useState<PropertyResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ isFirst: boolean } | null>(null);
  const [error, setError] = useState("");
  const now = new Date();
  const [form, setForm] = useState({
    property_id: preselectedId,
    reference_month: String(now.getMonth() + 1),
    reference_year: String(now.getFullYear()),
    gross_revenue: "",
    wecare_admin_fee: "",
    owner_payout: "",
  });

  useEffect(() => {
    getProperties().then((all) => setProperties(all.filter((p) => p.status === "OPERATIONAL")));
  }, []);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  // Calcula owner_payout automaticamente
  useEffect(() => {
    const gross = parseFloat(form.gross_revenue) || 0;
    const fee = parseFloat(form.wecare_admin_fee) || 0;
    if (gross > 0 && fee > 0) {
      setForm((p) => ({ ...p, owner_payout: (gross - fee).toFixed(2) }));
    }
  }, [form.gross_revenue, form.wecare_admin_fee]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const rec = await createRevenueRecord({
        property_id: parseInt(form.property_id),
        reference_month: parseInt(form.reference_month),
        reference_year: parseInt(form.reference_year),
        gross_revenue: parseFloat(form.gross_revenue),
        wecare_admin_fee: parseFloat(form.wecare_admin_fee),
        owner_payout: parseFloat(form.owner_payout),
      });
      setSuccess({ isFirst: rec.is_first_complete_month });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao registrar receita.");
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${success.isFirst ? "bg-yellow-100" : "bg-green-100"}`}>
        {success.isFirst
          ? <Sparkles size={32} className="text-yellow-600" />
          : <CheckCircle2 size={32} className="text-green-600" />}
      </div>
      <h2 className="text-xl font-bold text-foreground">Receita registrada!</h2>
      {success.isFirst && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 text-center max-w-sm">
          <strong>1º mês completo de operação!</strong><br />
          A comissão do parceiro foi gerada automaticamente e o parceiro foi notificado por e-mail.
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => router.push(`/properties/${form.property_id}`)}>
          Ver imóvel
        </Button>
        <Button onClick={() => router.push("/commissions")}>
          Ver comissões
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/properties">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft size={15} />Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registrar receita</h1>
          <p className="text-muted-foreground text-sm">O 1º mês gera a comissão do parceiro automaticamente.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="shadow-none border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Imóvel e período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Imóvel" required>
              <select value={form.property_id} onChange={set("property_id")} required
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Selecione um imóvel…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.owner_name} — {p.address_city}/{p.address_state}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mês de referência" required>
                <select value={form.reference_month} onChange={set("reference_month")} required
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ano" required>
                <Input type="number" min="2020" max="2099" value={form.reference_year} onChange={set("reference_year")} required />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Valores (R$)</CardTitle>
            <CardDescription>O repasse ao proprietário é calculado automaticamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Receita bruta" required>
              <Input type="number" step="0.01" min="0" value={form.gross_revenue} onChange={set("gross_revenue")} placeholder="0,00" required />
            </Field>
            <Field label="Taxa de administração WeCare" required hint="Valor retido pela WeCare">
              <Input type="number" step="0.01" min="0" value={form.wecare_admin_fee} onChange={set("wecare_admin_fee")} placeholder="0,00" required />
            </Field>
            <Field label="Repasse ao proprietário" required hint="Preenchido automaticamente (bruto − taxa)">
              <Input type="number" step="0.01" min="0" value={form.owner_payout} onChange={set("owner_payout")} placeholder="0,00" required />
            </Field>
          </CardContent>
        </Card>

        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/properties">
            <Button type="button" variant="outline" disabled={loading}>Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2 min-w-[160px]">
            {loading ? <><Loader2 size={15} className="animate-spin" />Salvando…</> : "Registrar receita"}
          </Button>
        </div>
      </form>
    </div>
  );
}
