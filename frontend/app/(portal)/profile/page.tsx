"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers";
import { updatePartner } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, Loader2, Pencil, X } from "lucide-react";

const SEGMENTS = [
  "Corretor de Imóveis",
  "Imobiliária",
  "Consultor Independente",
  "Administrador de Condomínio",
  "Advogado",
  "Contador",
  "Outro",
];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value ?? "—"}</span>
    </div>
  );
}

function fmtDoc(doc: string, type: string) {
  if (type === "CPF" && doc.length === 11)
    return `${doc.slice(0, 3)}.${doc.slice(3, 6)}.${doc.slice(6, 9)}-${doc.slice(9)}`;
  if (type === "CNPJ" && doc.length === 14)
    return `${doc.slice(0, 2)}.${doc.slice(2, 5)}.${doc.slice(5, 8)}/${doc.slice(8, 12)}-${doc.slice(12)}`;
  return doc;
}

export default function ProfilePage() {
  const { partner, setPartner } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    phone: partner?.phone ?? "",
    segment: partner?.segment ?? "",
    company_name: partner?.company_name ?? "",
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  function startEdit() {
    setForm({
      phone: partner?.phone ?? "",
      segment: partner?.segment ?? "",
      company_name: partner?.company_name ?? "",
    });
    setEditing(true);
    setError("");
  }

  function cancelEdit() {
    setEditing(false);
    setError("");
  }

  async function save() {
    if (!partner) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updatePartner(partner.id, {
        phone: form.phone || null,
        segment: form.segment || null,
        company_name: form.company_name || null,
      });
      setPartner(updated);
      setEditing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!partner?.referral_url) return;
    await navigator.clipboard.writeText(partner.referral_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!partner) return null;

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu perfil</h1>
          <p className="text-gray-500 text-sm mt-1">Seus dados e link de indicação.</p>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5">
            <Pencil size={14} />Editar
          </Button>
        )}
      </div>

      {/* Dados de identificação (somente leitura) */}
      <Card className="shadow-none border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="Nome" value={partner.full_name} />
          <Row label="E-mail" value={partner.email} />
          <Row label={partner.document_type} value={fmtDoc(partner.document, partner.document_type)} />
          <Row label="Perfil" value={partner.is_admin ? "Administrador" : "Parceiro"} />
          <Row label="Status" value={partner.status} />
          <Row label="Membro desde" value={new Date(partner.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} />
        </CardContent>
      </Card>

      {/* Dados editáveis */}
      <Card className="shadow-none border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dados de contato</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Telefone / WhatsApp</label>
                <Input value={form.phone} onChange={set("phone")} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Segmento</label>
                <select value={form.segment} onChange={set("segment")}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Selecione…</option>
                  {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Empresa / Imobiliária</label>
                <Input value={form.company_name} onChange={set("company_name")} placeholder="Ex: Imobiliária Santos Ltda." />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button onClick={save} disabled={saving}
                  className="bg-[#E55A4F] hover:bg-[#E55A4F]/90 text-white gap-1.5">
                  {saving ? <><Loader2 size={14} className="animate-spin" />Salvando…</> : <><Check size={14} />Salvar</>}
                </Button>
                <Button variant="outline" onClick={cancelEdit} disabled={saving} className="gap-1.5">
                  <X size={14} />Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Row label="Telefone" value={partner.phone} />
              <Row label="Segmento" value={partner.segment} />
              <Row label="Empresa" value={partner.company_name} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Link de indicação */}
      <Card className="shadow-none border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Link de indicação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500 mb-0.5">Código UTM</p>
            <p className="text-sm font-mono font-medium text-gray-900">{partner.utm_code}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
            <p className="text-xs text-[#E55A4F] break-all">{partner.referral_url}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={copyLink}
              className={`shrink-0 gap-1.5 transition-colors ${copied ? "border-green-400 text-green-600" : ""}`}
            >
              {copied ? <><Check size={13} />Copiado</> : <><Copy size={13} />Copiar</>}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Compartilhe este link para indicar proprietários. A janela de atribuição é de{" "}
            <strong>180 dias</strong> a partir do registro do lead.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
