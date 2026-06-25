"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getLead,
  updateLeadStatus,
  getPartners,
  type LeadResponse,
  type LeadStatusUpdate,
} from "@/lib/api";
import { useAuth } from "@/app/providers";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const STATUS_NEXT: Record<string, { label: string; value: string; color: string }> = {
  NEW:       { label: "Marcar como Contatado", value: "CONTACTED", color: "bg-blue-600 hover:bg-blue-700" },
  CONTACTED: { label: "Qualificar",            value: "QUALIFIED",  color: "bg-indigo-600 hover:bg-indigo-700" },
  QUALIFIED: { label: "Converter",             value: "CONVERTED",  color: "bg-green-600 hover:bg-green-700" },
};

const DISQUALIFY_REASONS = [
  { value: "duplicate",    label: "Lead duplicado" },
  { value: "no_contact",   label: "Sem resposta" },
  { value: "not_eligible", label: "Não elegível" },
  { value: "fraud",        label: "Suspeita de fraude" },
];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function fmtCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const leadId = parseInt(id);
  const { partner: me } = useAuth();

  const [lead, setLead] = useState<LeadResponse | null>(null);
  const [partnerName, setPartnerName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDisqualify, setShowDisqualify] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState("");

  async function load() {
    try {
      const l = await getLead(leadId);
      setLead(l);
      if (me?.is_admin) {
        const partners = await getPartners().catch(() => []);
        const p = partners.find((p) => p.id === l.partner_id);
        if (p) setPartnerName(p.full_name);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [leadId]);

  async function advance() {
    if (!lead) return;
    const next = STATUS_NEXT[lead.status];
    if (!next) return;
    setSaving(true);
    try {
      const updated = await updateLeadStatus(leadId, { status: next.value as LeadStatusUpdate["status"] });
      setLead(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar.");
    } finally {
      setSaving(false);
    }
  }

  async function disqualify() {
    if (!disqualifyReason) return;
    setSaving(true);
    try {
      const updated = await updateLeadStatus(leadId, { status: "DISQUALIFIED", reason: disqualifyReason });
      setLead(updated);
      setShowDisqualify(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao desqualificar.");
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

  if (!lead) return null;

  const nextAction = STATUS_NEXT[lead.status];
  const isTerminal = ["CONVERTED", "DISQUALIFIED", "EXPIRED"].includes(lead.status);

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/leads">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <ArrowLeft size={15} />Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{lead.full_name}</h1>
            <p className="text-muted-foreground text-sm">Lead #{lead.id}</p>
          </div>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      {/* Dados */}
      <Card className="shadow-none border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dados do lead</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="CPF" value={fmtCPF(lead.cpf)} />
          <Row label="E-mail" value={lead.email} />
          {lead.phone && <Row label="Telefone" value={lead.phone} />}
          {me?.is_admin && (
            <Row
              label="Parceiro"
              value={partnerName || `#${lead.partner_id}`}
            />
          )}
          <Row
            label="Cadastrado em"
            value={new Date(lead.created_at).toLocaleDateString("pt-BR")}
          />
          <Row
            label="Janela expira em"
            value={new Date(lead.attribution_expires_at).toLocaleDateString("pt-BR")}
          />
        </CardContent>
      </Card>

      {/* Endereço */}
      {lead.address_city && (
        <Card className="shadow-none border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Endereço do imóvel</CardTitle>
          </CardHeader>
          <CardContent>
            {lead.address_street && (
              <Row
                label="Rua"
                value={`${lead.address_street}, ${lead.address_number}${lead.address_complement ? ` – ${lead.address_complement}` : ""}`}
              />
            )}
            <Row label="Cidade / UF" value={`${lead.address_city} / ${lead.address_state}`} />
            {lead.address_zip && (
              <Row
                label="CEP"
                value={lead.address_zip.replace(/(\d{5})(\d{3})/, "$1-$2")}
              />
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Ações — admin only, não-terminais */}
      {me?.is_admin && !isTerminal && (
        <Card className="shadow-none border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              {nextAction && (
                <Button
                  onClick={advance}
                  disabled={saving}
                  className={`text-white flex-1 ${nextAction.color}`}
                >
                  {saving ? "Salvando…" : nextAction.label}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowDisqualify(!showDisqualify)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <AlertTriangle size={14} className="mr-1.5" />
                Inelegível
              </Button>
            </div>

            {showDisqualify && (
              <div className="border border-red-200 rounded-xl p-4 space-y-3 bg-red-50">
                <p className="text-sm font-medium text-red-800">Marcar como inelegível</p>
                <select
                  value={disqualifyReason}
                  onChange={(e) => setDisqualifyReason(e.target.value)}
                  className="w-full h-9 rounded-md border border-red-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-300"
                >
                  <option value="">Selecione o motivo…</option>
                  {DISQUALIFY_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowDisqualify(false)}>
                    Voltar
                  </Button>
                  <Button
                    size="sm"
                    disabled={!disqualifyReason || saving}
                    onClick={disqualify}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirmar
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
