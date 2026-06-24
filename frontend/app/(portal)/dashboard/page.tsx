"use client";

import { useEffect, useState } from "react";
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
  FileText,
  Upload,
} from "lucide-react";

function brl(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value)
  );
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
    <Card className="bg-white border-gray-200 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${accent ?? "bg-gray-100"}`}>
            <Icon size={16} className={accent ? "text-white" : "text-gray-500"} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
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
        <div className="flex items-center gap-3 bg-white rounded-lg border border-yellow-100 px-4 py-3">
          <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-gray-800">Cadastro</p>
            <p className="text-xs text-gray-400">Realizado</p>
          </div>
        </div>

        {/* Termo */}
        <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${hasTerm ? "bg-white border-yellow-100" : "bg-yellow-100/50 border-yellow-200"}`}>
          {hasTerm
            ? <CheckCircle2 size={18} className="text-green-500 shrink-0" />
            : <FileText size={18} className="text-yellow-500 shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800">Termo de Parceria</p>
            {hasTerm ? (
              <p className="text-xs text-gray-400">
                Assinado em {new Date(partner.term_accepted_at!).toLocaleDateString("pt-BR")}
              </p>
            ) : (
              <Link href="/cadastro-parceiro" className="text-xs text-[#E55A4F] hover:underline">
                Assinar agora →
              </Link>
            )}
          </div>
        </div>

        {/* Documentos */}
        <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${hasDocs ? "bg-white border-yellow-100" : "bg-yellow-100/50 border-yellow-200"}`}>
          {hasDocs
            ? <CheckCircle2 size={18} className="text-green-500 shrink-0" />
            : <Upload size={18} className="text-yellow-500 shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800">Documentos</p>
            {hasDocs ? (
              <p className="text-xs text-gray-400">
                {partner.documents!.length} arquivo{partner.documents!.length > 1 ? "s" : ""} enviado{partner.documents!.length > 1 ? "s" : ""}
              </p>
            ) : (
              <Link href={`/partners/${partner.id}`} className="text-xs text-[#E55A4F] hover:underline">
                Enviar agora →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid({ cols }: { cols: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${cols} gap-4`}>
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
    getAdminDashboard()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return (
    <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
  );

  return (
    <div className="space-y-6">
      {!data ? <SkeletonGrid cols={4} /> : (
        <>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Parceiros</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Parceiros ativos"   value={data.partners_active}  icon={UserPlus}   accent="bg-[#E55A4F]" />
              <StatCard title="Aguardando ativação" value={data.partners_pending} icon={AlertCircle} accent="bg-yellow-500" />
              <StatCard title="Total de parceiros" value={data.partners_total}   icon={Users} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Leads</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Leads esta semana" value={data.leads_week}      icon={TrendingUp}  accent="bg-indigo-500" />
              <StatCard title="Em andamento"       value={data.leads_active}    icon={Clock}       accent="bg-yellow-500" />
              <StatCard title="Convertidos"         value={data.leads_converted} icon={CheckCircle} accent="bg-green-600" />
              <StatCard title="Total de leads"      value={data.leads_total}     icon={Users} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Imóveis &amp; Comissões</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Em operação"       value={data.properties_operational}               icon={Building2}   accent="bg-[#E55A4F]" />
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

function PartnerView({ partnerId, name }: { partnerId: number; name: string }) {
  const [data, setData] = useState<PartnerDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard(partnerId)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [partnerId]);

  if (error) return (
    <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
  );

  return (
    <div className="space-y-6">
      {!data ? <SkeletonGrid cols={3} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total de Leads"       value={data.total_leads}                   sub={`${data.active_leads} ativos`}          icon={Users} />
          <StatCard title="Leads Convertidos"    value={data.converted_leads}               icon={TrendingUp}  accent="bg-indigo-500" />
          <StatCard title="Imóveis"              value={data.total_properties}              sub={`${data.operational_properties} em operação`} icon={Building2} />
          <StatCard title="Comissões Pendentes"  value={data.pending_commissions}           icon={Clock}       accent="bg-yellow-500" />
          <StatCard title="A Receber"            value={brl(data.total_commissions_pending)} icon={DollarSign}  accent="bg-[#E55A4F]" />
          <StatCard title="Total Recebido"       value={brl(data.total_commissions_paid)}   icon={CheckCircle} accent="bg-green-600" />
        </div>
      )}

      <div className="bg-[#E55A4F]/5 border border-[#E55A4F]/20 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#E55A4F] mb-2">Como funciona sua comissão</h2>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Você recebe o equivalente à taxa de administração WeCare do <strong>1º mês completo</strong> de operação do imóvel indicado.</li>
          <li>• Pagamento em até o dia <strong>10 do mês seguinte</strong> ao primeiro mês de operação, mediante emissão de NFS-e.</li>
          <li>• Janela de atribuição: <strong>180 dias</strong> a partir do registro do lead.</li>
        </ul>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { partner, setPartner } = useAuth();

  // Atualiza dados do parceiro PENDING ao entrar no dashboard
  useEffect(() => {
    if (partner && !partner.is_admin && partner.status === "PENDING") {
      getMe().then(setPartner).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {partner?.full_name.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {partner?.is_admin
            ? "Visão geral do programa WeCare."
            : "Aqui está o resumo da sua parceria com a WeCare."}
        </p>
      </div>

      {partner && !partner.is_admin && partner.status === "PENDING" && (
        <PendingBanner partner={partner} />
      )}

      {partner?.is_admin
        ? <AdminView />
        : partner && <PartnerView partnerId={partner.id} name={partner.full_name} />
      }
    </div>
  );
}
