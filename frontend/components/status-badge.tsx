import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Partner
  PENDING:    { label: "Pendente",     className: "bg-gray-100 text-gray-700" },
  ACTIVE:     { label: "Ativo",        className: "bg-green-100 text-green-700" },
  SUSPENDED:  { label: "Suspenso",     className: "bg-yellow-100 text-yellow-700" },
  TERMINATED: { label: "Encerrado",    className: "bg-red-100 text-red-700" },
  // Lead (rótulos do parceiro — alinhados ao dashboard)
  NEW:          { label: "Ativo",           className: "bg-wecare-gold/10 text-wecare-gold" },
  CONTACTED:    { label: "Em andamento",    className: "bg-blue-100 text-blue-700" },
  QUALIFIED:    { label: "Em andamento",    className: "bg-blue-100 text-blue-700" },
  CONVERTED:    { label: "Convertido",      className: "bg-green-100 text-green-700" },
  EXPIRED:      { label: "Não convertido", className: "bg-gray-100 text-gray-600" },
  DISQUALIFIED: { label: "Não convertido", className: "bg-gray-100 text-gray-600" },
  // Property
  LEAD:            { label: "Lead",           className: "bg-gray-100 text-gray-700" },
  PROPOSAL_SENT:   { label: "Proposta Env.",  className: "bg-blue-100 text-blue-700" },
  CONTRACT_SIGNED: { label: "Contrato Assin.",className: "bg-indigo-100 text-indigo-700" },
  ONBOARDING:      { label: "Onboarding",     className: "bg-yellow-100 text-yellow-700" },
  OPERATIONAL:     { label: "Em Operação",    className: "bg-green-100 text-green-700" },
  CANCELLED:       { label: "Cancelado",      className: "bg-red-100 text-red-700" },
  // Commission
  AWAITING_NFSE: { label: "Aguard. NFS-e", className: "bg-yellow-100 text-yellow-700" },
  APPROVED:      { label: "Aprovado",       className: "bg-indigo-100 text-indigo-700" },
  PAID:          { label: "Pago",           className: "bg-green-100 text-green-700" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <Badge className={cn("font-medium text-xs px-2 py-0.5 rounded-full border-0", config.className)}>
      {config.label}
    </Badge>
  );
}
