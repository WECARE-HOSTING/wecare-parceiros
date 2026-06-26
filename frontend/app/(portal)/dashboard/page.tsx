"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers";
import {
  getDashboard,
  getAdminDashboard,
  getMe,
  type PartnerDashboard,
  type AdminDashboard,
  type PartnerResponse,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  AlertCircle,
  XCircle,
  FileText,
  Upload,
} from "lucide-react";

function brl(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value)
  );
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <Card className="bg-card border-border shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${accent ?? "bg-muted"}`}>
            <Icon size={16} className={accent ? "text-white" : "text-muted-foreground"} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function PendingBanner({ partner }: { partner: PartnerResponse }) {
  const hasTerm = !!partner.term_accepted_at;
  const hasDocs = (partner.documents ?? []).length > 0;
  const allDone = hasTerm && hasDocs;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-yellow-600 shrink-0" />
        <div>
          <p className="font-semibold text-yellow-800 text-sm">Conta em análise</p>
          <p className="text-yellow-700 text-xs mt-0.5">
            {allDone
              ? "Tudo enviado! A equipe WeCare ativará sua conta em até 7 dias úteis."
              : "Complete os passos abaixo para agilizar a ativação da sua conta."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cadastro */}
        <div className="flex items-center gap-3 bg-card rounded-lg border border-yellow-100 px-4 py-3">
          <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground">Cadastro</p>
            <p className="text-xs text-muted-foreground/80">Realizado</p>
          </div>
        </div>

        {/* Termo */}
        <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${hasTerm ? "bg-card border-yellow-100" : "bg-yellow-100/50 border-yellow-200"}`}>
          {hasTerm
            ? <CheckCircle2 size={18} className="text-green-500 shrink-0" />
            : <FileText size={18} className="text-yellow-500 shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Termo de Parceria</p>
            {hasTerm ? (
              <p className="text-xs text-muted-foreground/80">
                Assinado em {new Date(partner.term_accepted_at!).toLocaleDateString("pt-BR")}
              </p>
            ) : (
              <Link href="/cadastro-parceiro" className="text-xs text-primary hover:underline">
                Assinar agora →
              </Link>
            )}
          </div>
        </div>

        {/* Documentos */}
        <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${hasDocs ? "bg-card border-yellow-100" : "bg-yellow-100/50 border-yellow-200"}`}>
          {hasDocs
            ? <CheckCircle2 size={18} className="text-green-500 shrink-0" />
            : <Upload size={18} className="text-yellow-500 shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Documentos</p>
            {hasDocs ? (
              <p className="text-xs text-muted-foreground/80">
                {partner.documents!.length} arquivo{partner.documents!.length > 1 ? "s" : ""} enviado{partner.documents!.length > 1 ? "s" : ""}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/80">
                Pendente de envio
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid({ cols }: { cols: number }) {
  const gridClass =
    cols === 4
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      : cols === 3
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 gap-4";

  return (
    <div className={gridClass}>
      {Array.from({ length: cols * 2 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

function AdminView() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getAdminDashboard()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError("");
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
      )}
      {!data ? <SkeletonGrid cols={4} /> : (
        <>
          <div>
            <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide mb-3">Parceiros</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Parceiros ativos"   value={data.partners_active}  icon={UserPlus}   accent="bg-primary" />
              <StatCard title="Aguardando ativação" value={data.partners_pending} icon={AlertCircle} accent="bg-yellow-500" />
              <StatCard title="Total de parceiros" value={data.partners_total}   icon={Users} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide mb-3">Leads</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Leads esta semana" value={data.leads_week}      icon={TrendingUp}  accent="bg-indigo-500" />
              <StatCard title="Em andamento"       value={data.leads_active}    icon={Clock}       accent="bg-yellow-500" />
              <StatCard title="Convertidos"         value={data.leads_converted} icon={CheckCircle} accent="bg-green-600" />
              <StatCard title="Total de leads"      value={data.leads_total}     icon={Users} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide mb-3">Imóveis &amp; Comissões</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Em operação"       value={data.properties_operational}               icon={Building2}   accent="bg-primary" />
              <StatCard title="Total de imóveis"  value={data.properties_total}                     icon={Building2} />
              <StatCard title="Comissões a pagar" value={brl(data.commissions_pending_amount)}
                sub={`${data.commissions_pending_count} pendentes`}                                  icon={DollarSign}  accent="bg-yellow-500" />
              <StatCard title="Pago este mês"     value={brl(data.commissions_paid_month)}          icon={CheckCircle} accent="bg-green-600" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PartnerView({ partnerId, createdAt }: { partnerId: number; createdAt: string }) {
  const [data, setData] = useState<PartnerDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (partnerId == null || !Number.isFinite(partnerId) || partnerId <= 0) return;

    let cancelled = false;

    getDashboard(partnerId)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError("");
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [partnerId]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
      )}
      {!data ? <SkeletonGrid cols={3} /> : (
        <>
          <div>
            <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide mb-3">Leads</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Leads ativos"    value={data.leads_new ?? 0}           icon={UserPlus} accent="bg-primary" />
              <StatCard title="Em andamento"    value={data.leads_in_progress ?? 0}   icon={Clock}    accent="bg-yellow-500" />
              <StatCard title="Não convertidos" value={data.leads_not_converted ?? 0} icon={XCircle} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide mb-3">Comissões</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                title="Comissão a receber"
                value={brl(data.commissions_to_receive_month ?? 0)}
                sub="mês atual"
                icon={DollarSign}
                accent="bg-yellow-500"
              />
              <StatCard
                title="Comissões recebidas"
                value={brl(data.total_commissions_paid ?? 0)}
                sub="acumulado total"
                icon={CheckCircle}
                accent="bg-green-600"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Parceiro WeCare desde: {fmtDate(createdAt)}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { partner, setPartner } = useAuth();
  const partnerId = partner?.id;
  const isAdmin = partner?.is_admin === true;
  const stablePartnerId = useRef<number | null>(null);
  const stableCreatedAt = useRef("");

  if (partnerId != null && Number.isFinite(partnerId) && partnerId > 0) {
    stablePartnerId.current = partnerId;
    stableCreatedAt.current = partner?.created_at ?? "";
  }

  const displayPartnerId = stablePartnerId.current;

  // Atualiza dados do parceiro PENDING ao entrar no dashboard
  useEffect(() => {
    if (!partnerId || isAdmin || partner?.status !== "PENDING") return;
    getMe().then(setPartner).catch(() => {});
  }, [partnerId, isAdmin, partner?.status, setPartner]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          Olá, {partner?.full_name.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAdmin
            ? "Visão geral do programa WeCare."
            : "Aqui está o resumo da sua parceria com a WeCare."}
        </p>
      </div>

      {partner && !isAdmin && partner.status === "PENDING" && (
        <PendingBanner partner={partner} />
      )}

      {isAdmin ? (
        <AdminView />
      ) : displayPartnerId != null ? (
        <PartnerView partnerId={displayPartnerId} createdAt={stableCreatedAt.current} />
      ) : (
        <SkeletonGrid cols={3} />
      )}
    </div>
  );
}
