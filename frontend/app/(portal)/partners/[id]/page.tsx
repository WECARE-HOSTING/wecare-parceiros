"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getPartner,
  updatePartnerStatus,
  getDashboard,
  uploadPartnerDocument,
  type PartnerResponse,
  type PartnerDashboard,
} from "@/lib/api";
import { useAuth } from "@/app/providers";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Copy, Check, Users, Building2, DollarSign, TrendingUp,
  Upload, Loader2, FileText, CheckCircle2, ExternalLink,
} from "lucide-react";

const DOC_TYPE_LABELS: Record<string, string> = {
  rg_cpf: "RG / CPF",
  contrato_social: "Contrato Social",
  comprovante_endereco: "Comprovante de Endereço",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const STATUS_ACTIONS: Record<string, { label: string; value: string; color: string }[]> = {
  PENDING:   [{ label: "Ativar parceiro",  value: "ACTIVE",     color: "bg-green-600 hover:bg-green-700" }],
  ACTIVE:    [
    { label: "Suspender",                  value: "SUSPENDED",  color: "bg-yellow-500 hover:bg-yellow-600" },
    { label: "Encerrar parceria",          value: "TERMINATED", color: "bg-red-600 hover:bg-red-700" },
  ],
  SUSPENDED: [
    { label: "Reativar",                   value: "ACTIVE",     color: "bg-green-600 hover:bg-green-700" },
    { label: "Encerrar parceria",          value: "TERMINATED", color: "bg-red-600 hover:bg-red-700" },
  ],
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

function brl(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const partnerId = parseInt(id);
  const { partner: me } = useAuth();

  const [partner, setPartner] = useState<PartnerResponse | null>(null);
  const [stats, setStats] = useState<PartnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("rg_cpf");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const [p, s] = await Promise.all([
        getPartner(partnerId),
        getDashboard(partnerId).catch(() => null),
      ]);
      setPartner(p);
      setStats(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [partnerId]);

  async function changeStatus(status: string) {
    setSaving(true);
    try {
      const updated = await updatePartnerStatus(partnerId, status);
      setPartner(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar.");
    } finally {
      setSaving(false);
    }
  }

  function copyLink() {
    if (!partner?.referral_url) return;
    navigator.clipboard.writeText(partner.referral_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleUpload(file: File) {
    if (!partner) return;
    setUploading(true);
    setUploadError("");
    try {
      const updated = await uploadPartnerDocument(partner.id, selectedDocType, file);
      setPartner(updated);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return (
    <div className="space-y-4 max-w-xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );

  if (!partner) return null;

  const actions = STATUS_ACTIONS[partner.status] ?? [];
  const isAdmin = me?.is_admin;

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/partners">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500">
              <ArrowLeft size={15} />Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{partner.full_name}</h1>
            <p className="text-gray-500 text-sm">{partner.email}</p>
          </div>
        </div>
        <StatusBadge status={partner.status} />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users size={14} /><span className="text-xs">Leads</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total_leads}</p>
            <p className="text-xs text-gray-400">{stats.converted_leads} convertidos</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Building2 size={14} /><span className="text-xs">Imóveis</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total_properties}</p>
            <p className="text-xs text-gray-400">{stats.operational_properties} em operação</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign size={14} /><span className="text-xs">A receber</span>
            </div>
            <p className="text-xl font-bold text-[#E55A4F]">{brl(stats.total_commissions_pending)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp size={14} /><span className="text-xs">Total recebido</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{brl(stats.total_commissions_paid)}</p>
          </div>
        </div>
      )}

      {/* Dados cadastrais */}
      <Card className="shadow-none border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dados cadastrais</CardTitle>
        </CardHeader>
        <CardContent>
          <Row
            label={partner.document_type === "CPF" ? "CPF" : "CNPJ"}
            value={partner.document}
          />
          {partner.phone && <Row label="Telefone" value={partner.phone} />}
          {partner.segment && <Row label="Segmento" value={partner.segment} />}
          {partner.company_name && <Row label="Empresa" value={partner.company_name} />}
          <Row
            label="Código UTM"
            value={
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                {partner.utm_code}
              </code>
            }
          />
          {partner.is_admin && (
            <Row
              label="Perfil"
              value={
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                  Admin
                </span>
              }
            />
          )}
          <Row
            label="Cadastrado em"
            value={new Date(partner.created_at).toLocaleDateString("pt-BR")}
          />
        </CardContent>
      </Card>

      {/* Link de indicação */}
      <Card className="shadow-none border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Link de indicação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 truncate text-gray-600">
              {partner.referral_url}
            </code>
            <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 gap-1.5">
              {copied
                ? <><Check size={13} className="text-green-600" />Copiado</>
                : <><Copy size={13} />Copiar</>
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assinatura do Termo */}
      <Card className="shadow-none border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={15} className="text-gray-400" />
            Termo de Parceria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partner.term_accepted_at ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle2 size={15} />
              <span>
                Assinado eletronicamente em{" "}
                {new Date(partner.term_accepted_at).toLocaleString("pt-BR")}
              </span>
            </div>
          ) : (
            <p className="text-sm text-yellow-600 bg-yellow-50 rounded-lg px-3 py-2">
              Termo ainda não assinado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card className="shadow-none border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload size={15} className="text-gray-400" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de documentos enviados */}
          {(partner.documents ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum documento enviado.</p>
          ) : (
            <div className="space-y-2">
              {partner.documents!.map((doc) => (
                <div
                  key={doc.filename}
                  className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {doc.original_name ?? doc.filename} ·{" "}
                        {(doc.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <a
                    href={`${API_URL}/partners/${partner.id}/documents/${doc.filename}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-gray-400 hover:text-[#E55A4F] transition"
                    title="Visualizar"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Upload — disponível para o próprio parceiro e admin */}
          <div className="space-y-3 pt-1 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Enviar novo documento
            </p>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E55A4F]/30"
            >
              <option value="rg_cpf">RG ou CPF</option>
              <option value="contrato_social">Contrato Social</option>
              <option value="comprovante_endereco">Comprovante de Endereço</option>
            </select>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-[#E55A4F]/50 transition"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleUpload(f);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = "";
                }}
              />
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-sm">Enviando…</span>
                </div>
              ) : (
                <>
                  <Upload size={18} className="mx-auto text-gray-300 mb-1" />
                  <p className="text-xs text-gray-500">
                    Arraste ou <span className="text-[#E55A4F]">clique para selecionar</span>
                  </p>
                  <p className="text-xs text-gray-400">PDF, JPEG ou PNG · máx. 5 MB</p>
                </>
              )}
            </div>
            {uploadError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{uploadError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Ações — admin only */}
      {isAdmin && actions.length > 0 && (
        <Card className="shadow-none border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {actions.map((a) => (
                <Button
                  key={a.value}
                  disabled={saving}
                  onClick={() => changeStatus(a.value)}
                  className={`text-white ${a.color}`}
                >
                  {saving ? "Salvando…" : a.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
