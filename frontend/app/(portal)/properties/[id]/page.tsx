"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getProperty, updatePropertyStatus, updateProperty, getRevenueRecords,
  type PropertyDetailResponse, type RevenueRecordResponse, type PropertyUpdatePayload,
} from "@/lib/api";
import { useAuth } from "@/app/providers";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check, ChevronRight, Loader2, Pencil, Plus, X } from "lucide-react";

const STATUS_FLOW: Record<string, string> = {
  LEAD: "PROPOSAL_SENT",
  PROPOSAL_SENT: "CONTRACT_SIGNED",
  CONTRACT_SIGNED: "ONBOARDING",
  ONBOARDING: "OPERATIONAL",
};

const STATUS_LABEL: Record<string, string> = {
  LEAD: "Lead",
  PROPOSAL_SENT: "Proposta enviada",
  CONTRACT_SIGNED: "Contrato assinado",
  ONBOARDING: "Onboarding",
  OPERATIONAL: "Operacional",
  CANCELLED: "Cancelado",
};

const CONTRACT_LABEL: Record<string, string> = { A: "Modelo A", B: "Modelo B", C: "Modelo C" };

function brl(v: string | number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

function pct(v: string | null | undefined) {
  if (v == null) return "—";
  return `${(Number(v) * 100).toFixed(2).replace(".", ",")}%`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

function EditPropertyForm({
  prop,
  onSave,
  onCancel,
}: {
  prop: PropertyDetailResponse;
  onSave: (updated: PropertyDetailResponse) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<PropertyUpdatePayload>({
    owner_name: prop.owner_name,
    owner_document: prop.owner_document,
    address_street: prop.address_street,
    address_number: prop.address_number,
    address_complement: prop.address_complement ?? "",
    address_city: prop.address_city,
    address_state: prop.address_state,
    address_zip: prop.address_zip,
    model_a_setup_fee: prop.model_a_setup_fee != null ? Number(prop.model_a_setup_fee) : undefined,
    model_a_revenue_pct: prop.model_a_revenue_pct != null ? Number(prop.model_a_revenue_pct) : undefined,
    model_b_setup_fee: prop.model_b_setup_fee != null ? Number(prop.model_b_setup_fee) : undefined,
    model_b_fixed_monthly: prop.model_b_fixed_monthly != null ? Number(prop.model_b_fixed_monthly) : undefined,
    model_b_revenue_pct: prop.model_b_revenue_pct != null ? Number(prop.model_b_revenue_pct) : undefined,
    model_c_first_allocation: prop.model_c_first_allocation != null ? Number(prop.model_c_first_allocation) : undefined,
    model_c_ongoing_pct: prop.model_c_ongoing_pct != null ? Number(prop.model_c_ongoing_pct) : undefined,
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  function set(field: keyof PropertyUpdatePayload) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function setNum(field: keyof PropertyUpdatePayload) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value === "" ? undefined : parseFloat(e.target.value) }));
  }

  async function handleSave() {
    setSaving(true);
    setEditError("");
    try {
      const updated = await updateProperty(prop.id, form);
      onSave(updated);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );

  return (
    <Card className="shadow-none border-[#E55A4F]/30 bg-[#E55A4F]/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-[#E55A4F]">Editar dados do imóvel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <F label="Proprietário">
            <Input value={form.owner_name ?? ""} onChange={set("owner_name")} />
          </F>
          <F label="Documento do proprietário">
            <Input value={form.owner_document ?? ""} onChange={set("owner_document")} />
          </F>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <F label="Logradouro">
              <Input value={form.address_street ?? ""} onChange={set("address_street")} />
            </F>
          </div>
          <F label="Número">
            <Input value={form.address_number ?? ""} onChange={set("address_number")} />
          </F>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <F label="Complemento">
            <Input value={form.address_complement ?? ""} onChange={set("address_complement")} placeholder="Opcional" />
          </F>
          <F label="CEP">
            <Input value={form.address_zip ?? ""} onChange={set("address_zip")} />
          </F>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <F label="Cidade">
            <Input value={form.address_city ?? ""} onChange={set("address_city")} />
          </F>
          <F label="UF">
            <Input value={form.address_state ?? ""} onChange={set("address_state")} maxLength={2} />
          </F>
        </div>

        {/* Parâmetros do contrato */}
        {prop.contract_model === "A" && (
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-200">
            <F label="Taxa de setup (R$)">
              <Input type="number" step="0.01" value={form.model_a_setup_fee ?? ""} onChange={setNum("model_a_setup_fee")} />
            </F>
            <F label="% sobre receita bruta">
              <Input type="number" step="0.0001" value={form.model_a_revenue_pct ?? ""} onChange={setNum("model_a_revenue_pct")} />
            </F>
          </div>
        )}
        {prop.contract_model === "B" && (
          <div className="grid grid-cols-3 gap-3 pt-1 border-t border-gray-200">
            <F label="Taxa de setup (R$)">
              <Input type="number" step="0.01" value={form.model_b_setup_fee ?? ""} onChange={setNum("model_b_setup_fee")} />
            </F>
            <F label="Mensalidade fixa (R$)">
              <Input type="number" step="0.01" value={form.model_b_fixed_monthly ?? ""} onChange={setNum("model_b_fixed_monthly")} />
            </F>
            <F label="% adicional">
              <Input type="number" step="0.0001" value={form.model_b_revenue_pct ?? ""} onChange={setNum("model_b_revenue_pct")} />
            </F>
          </div>
        )}
        {prop.contract_model === "C" && (
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-200">
            <F label="1ª alocação (R$)">
              <Input type="number" step="0.01" value={form.model_c_first_allocation ?? ""} onChange={setNum("model_c_first_allocation")} />
            </F>
            <F label="% contínuo">
              <Input type="number" step="0.0001" value={form.model_c_ongoing_pct ?? ""} onChange={setNum("model_c_ongoing_pct")} />
            </F>
          </div>
        )}

        {editError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editError}</p>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving} className="bg-[#E55A4F] hover:bg-[#E55A4F]/90 text-white gap-1.5">
            {saving ? <><Loader2 size={14} className="animate-spin" />Salvando…</> : <><Check size={14} />Salvar</>}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving} className="gap-1.5">
            <X size={14} />Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const propId = parseInt(id);
  const { partner } = useAuth();
  const [prop, setProp] = useState<PropertyDetailResponse | null>(null);
  const [revenues, setRevenues] = useState<RevenueRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [p, r] = await Promise.all([getProperty(propId), getRevenueRecords(propId)]);
      setProp(p);
      setRevenues(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [propId]);

  async function advance() {
    if (!prop) return;
    const next = STATUS_FLOW[prop.status];
    if (!next) return;
    setAdvancing(true);
    try {
      const updated = await updatePropertyStatus(propId, next);
      setProp(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao avançar status.");
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) return (
    <div className="space-y-4 max-w-2xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );

  if (error) return (
    <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
  );

  if (!prop) return null;

  const nextStatus = STATUS_FLOW[prop.status];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/properties">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500">
              <ArrowLeft size={15} />Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{prop.owner_name}</h1>
            <p className="text-gray-500 text-sm">{prop.address_city}/{prop.address_state}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={prop.status} />
          {partner?.is_admin && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
              <Pencil size={14} />Editar
            </Button>
          )}
        </div>
      </div>

      {/* Form de edição (admin) */}
      {editing && (
        <EditPropertyForm
          prop={prop}
          onSave={(updated) => { setProp(updated); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* Avançar status */}
      {nextStatus && (
        <div className="bg-[#E55A4F]/5 border border-[#E55A4F]/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#E55A4F]">Próximo passo</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Avançar de <strong>{STATUS_LABEL[prop.status]}</strong> para{" "}
              <strong>{STATUS_LABEL[nextStatus]}</strong>
            </p>
          </div>
          <Button onClick={advance} disabled={advancing}
            className="bg-[#E55A4F] hover:bg-[#E55A4F]/90 text-white gap-2">
            {advancing ? "Avançando…" : <>Avançar <ChevronRight size={15} /></>}
          </Button>
        </div>
      )}

      {/* Detalhes */}
      <Card className="shadow-none border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dados do imóvel</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="Proprietário" value={prop.owner_name} />
          <Row label="Documento" value={prop.owner_document} />
          <Row label="Endereço" value={`${prop.address_street}, ${prop.address_number}${prop.address_complement ? ` — ${prop.address_complement}` : ""}`} />
          <Row label="Cidade/Estado" value={`${prop.address_city}/${prop.address_state}`} />
          <Row label="CEP" value={prop.address_zip} />
          <Row label="Contrato" value={CONTRACT_LABEL[prop.contract_model] ?? prop.contract_model} />
          <Row label="Em operação desde" value={prop.operational_since ? new Date(prop.operational_since).toLocaleDateString("pt-BR") : "—"} />
        </CardContent>
      </Card>

      {/* Detalhes do contrato */}
      <Card className="shadow-none border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Parâmetros do contrato — {CONTRACT_LABEL[prop.contract_model]}</CardTitle>
        </CardHeader>
        <CardContent>
          {prop.contract_model === "A" && <>
            <Row label="Taxa de setup" value={brl(prop.model_a_setup_fee)} />
            <Row label="% sobre receita bruta" value={pct(prop.model_a_revenue_pct)} />
          </>}
          {prop.contract_model === "B" && <>
            <Row label="Taxa de setup" value={brl(prop.model_b_setup_fee)} />
            <Row label="Mensalidade fixa" value={brl(prop.model_b_fixed_monthly)} />
            <Row label="% adicional" value={pct(prop.model_b_revenue_pct)} />
          </>}
          {prop.contract_model === "C" && <>
            <Row label="1ª alocação" value={brl(prop.model_c_first_allocation)} />
            <Row label="% contínuo" value={pct(prop.model_c_ongoing_pct)} />
          </>}
        </CardContent>
      </Card>

      {/* Receitas */}
      <Card className="shadow-none border-gray-200">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Receitas mensais</CardTitle>
          {prop.status === "OPERATIONAL" && (
            <Link href={`/revenue/new?property_id=${prop.id}`}>
              <Button size="sm" className="bg-[#E55A4F] hover:bg-[#E55A4F]/90 text-white gap-1.5">
                <Plus size={14} />Registrar
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {revenues.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              {prop.status === "OPERATIONAL" ? "Nenhuma receita registrada ainda." : "Imóvel ainda não está operacional."}
            </p>
          ) : (
            <div className="space-y-0">
              {revenues.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {String(r.reference_month).padStart(2, "0")}/{r.reference_year}
                    </p>
                    {r.is_first_complete_month && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">1º mês — comissão gerada</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{brl(r.gross_revenue)}</p>
                    <p className="text-xs text-gray-400">taxa: {brl(r.wecare_admin_fee)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
