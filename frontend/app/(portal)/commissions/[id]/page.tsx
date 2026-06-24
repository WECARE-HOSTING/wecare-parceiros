"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCommission, updateCommissionStatus, getProperty, getPartners, type CommissionDetailResponse } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const STATUS_NEXT: Record<string, { label: string; value: string; color: string }> = {
  PENDING:       { label: "Aguardar NFS-e",  value: "AWAITING_NFSE", color: "bg-yellow-500 hover:bg-yellow-600" },
  AWAITING_NFSE: { label: "Aprovar",          value: "APPROVED",      color: "bg-indigo-600 hover:bg-indigo-700" },
  APPROVED:      { label: "Marcar como pago", value: "PAID",          color: "bg-green-600 hover:bg-green-700"  },
};

const CANCEL_REASONS = [
  { value: "OWNER_CANCELLED",        label: "Proprietário cancelou" },
  { value: "PROPERTY_NEVER_OPERATED",label: "Imóvel nunca operou" },
  { value: "FRAUD",                  label: "Fraude" },
  { value: "CHARGEBACK",             label: "Chargeback" },
];

function brl(v: string | number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export default function CommissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const commId = parseInt(id);

  const [comm, setComm] = useState<CommissionDetailResponse | null>(null);
  const [partnerName, setPartnerName] = useState<string>("");
  const [propertyLabel, setPropertyLabel] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [nfseNumber, setNfseNumber] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  async function load() {
    try {
      const c = await getCommission(commId);
      setComm(c);
      setNfseNumber(c.nfse_number ?? "");

      const [partners, prop] = await Promise.all([
        getPartners().catch(() => []),
        getProperty(c.property_id).catch(() => null),
      ]);
      const partner = partners.find((p) => p.id === c.partner_id);
      if (partner) setPartnerName(partner.full_name);
      if (prop) setPropertyLabel(`${prop.owner_name} — ${prop.address_city}/${prop.address_state}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [commId]);

  async function advance() {
    if (!comm) return;
    const next = STATUS_NEXT[comm.status];
    if (!next) return;
    setSaving(true);
    try {
      const updated = await updateCommissionStatus(commId, {
        status: next.value as "AWAITING_NFSE" | "APPROVED" | "PAID",
        nfse_number: nfseNumber || undefined,
      });
      setComm(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar.");
    } finally {
      setSaving(false);
    }
  }

  async function cancel() {
    if (!cancelReason) return;
    setSaving(true);
    try {
      const updated = await updateCommissionStatus(commId, {
        status: "CANCELLED",
        cancellation_reason: cancelReason as "OWNER_CANCELLED" | "PROPERTY_NEVER_OPERATED" | "FRAUD" | "CHARGEBACK",
      });
      setComm(updated);
      setShowCancel(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao cancelar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="space-y-4 max-w-xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );

  if (!comm) return null;

  const nextAction = STATUS_NEXT[comm.status];
  const isPaid = comm.status === "PAID";
  const isCancelled = comm.status === "CANCELLED";

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/commissions">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <ArrowLeft size={15} />Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comissão #{comm.id}</h1>
            <p className="text-muted-foreground text-sm">{partnerName || `Parceiro #${comm.partner_id}`}</p>
          </div>
        </div>
        <StatusBadge status={comm.status} />
      </div>

      {/* Sucesso pago */}
      {isPaid && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Comissão paga</p>
            <p className="text-xs text-green-600">
              {comm.paid_at ? new Date(comm.paid_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : ""}
            </p>
          </div>
        </div>
      )}

      {/* Detalhes */}
      <Card className="shadow-none border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detalhes</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="Parceiro" value={partnerName || `#${comm.partner_id}`} />
          <Row label="Imóvel" value={propertyLabel || `#${comm.property_id}`} />
          <Row label="Modelo de contrato" value={`Modelo ${comm.contract_model}`} />
          <Row label="Base de cálculo" value={brl(comm.commission_base)} />
          <Row label="Valor da comissão" value={<span className="text-lg font-bold text-primary">{brl(comm.commission_amount)}</span>} />
          <Row label="Vencimento" value={new Date(comm.payment_due_date + "T12:00:00").toLocaleDateString("pt-BR")} />
          {comm.nfse_number && <Row label="NFS-e" value={comm.nfse_number} />}
          {isCancelled && comm.cancellation_reason && (
            <Row label="Motivo do cancelamento" value={CANCEL_REASONS.find(r => r.value === comm.cancellation_reason)?.label ?? comm.cancellation_reason} />
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Ações */}
      {!isPaid && !isCancelled && (
        <Card className="shadow-none border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* NFS-e */}
            {(comm.status === "AWAITING_NFSE" || comm.status === "APPROVED") && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Número da NFS-e</label>
                <Input
                  value={nfseNumber}
                  onChange={(e) => setNfseNumber(e.target.value)}
                  placeholder="Ex: 2025/001234"
                />
              </div>
            )}

            <div className="flex gap-3">
              {nextAction && (
                <Button onClick={advance} disabled={saving}
                  className={`text-white gap-2 flex-1 ${nextAction.color}`}>
                  {saving ? "Salvando…" : nextAction.label}
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowCancel(!showCancel)}
                className="text-red-600 border-red-200 hover:bg-red-50">
                Cancelar comissão
              </Button>
            </div>

            {/* Painel de cancelamento */}
            {showCancel && (
              <div className="border border-red-200 rounded-xl p-4 space-y-3 bg-red-50">
                <p className="text-sm font-medium text-red-800">Confirmar cancelamento</p>
                <div className="space-y-1.5">
                  <label className="text-sm text-red-700">Motivo obrigatório</label>
                  <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full h-9 rounded-md border border-red-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-300">
                    <option value="">Selecione…</option>
                    {CANCEL_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowCancel(false)}>Voltar</Button>
                  <Button size="sm" disabled={!cancelReason || saving} onClick={cancel}
                    className="bg-red-600 hover:bg-red-700 text-white">
                    Confirmar cancelamento
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
