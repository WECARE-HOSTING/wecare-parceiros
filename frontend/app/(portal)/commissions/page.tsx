"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCommissions, type CommissionResponse } from "@/lib/api";
import { exportCSV } from "@/lib/csv";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendente" },
  { value: "AWAITING_NFSE", label: "Aguard. NFS-e" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "PAID", label: "Pago" },
  { value: "CANCELLED", label: "Cancelado" },
];

const PAGE_SIZE = 15;

function brl(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<CommissionResponse[] | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getCommissions()
      .then(setCommissions)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => { setPage(1); }, [statusFilter, search]);

  const filtered = commissions?.filter((c) => {
    const matchesStatus = !statusFilter || c.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      String(c.property_id).includes(q) ||
      c.contract_model.toLowerCase().includes(q) ||
      (c.nfse_number ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil((filtered?.length ?? 0) / PAGE_SIZE);
  const paginated = filtered?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalPaid = commissions
    ?.filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) ?? 0;

  const totalPending = commissions
    ?.filter((c) => ["PENDING", "AWAITING_NFSE", "APPROVED"].includes(c.status))
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) ?? 0;

  function handleExport() {
    if (!filtered?.length) return;
    exportCSV(filtered, "comissoes_wecare.csv", [
      { key: "id", label: "ID" },
      { key: "property_id", label: "Imóvel ID" },
      { key: "contract_model", label: "Modelo" },
      { key: "commission_base", label: "Base (R$)" },
      { key: "commission_amount", label: "Comissão (R$)" },
      { key: "status", label: "Status" },
      { key: "payment_due_date", label: "Vencimento" },
      { key: "nfse_number", label: "NFS-e" },
      { key: "paid_at", label: "Pago em" },
      { key: "created_at", label: "Criado em" },
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comissões</h1>
          <p className="text-muted-foreground text-sm mt-1">Extrato completo das comissões.</p>
        </div>
        {commissions && commissions.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download size={14} />Exportar CSV
          </Button>
        )}
      </div>

      {commissions && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground mb-1">A Receber</p>
            <p className="text-2xl font-bold text-primary">{brl(totalPending)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground mb-1">Total Recebido</p>
            <p className="text-2xl font-bold text-foreground">{brl(totalPaid)}</p>
          </div>
        </div>
      )}

      {/* Busca + Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
          <Input
            placeholder="Buscar por imóvel ID ou NFS-e…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-border"
              }`}
            >
              {f.label}
              {f.value && commissions && (
                <span className="ml-1 opacity-60">
                  ({commissions.filter((c) => c.status === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Imóvel</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>NFS-e</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!commissions
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : paginated!.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground/80 py-12">
                      {statusFilter || search
                        ? "Nenhuma comissão encontrada para este filtro."
                        : "Nenhuma comissão apurada ainda."}
                    </TableCell>
                  </TableRow>
                )
              : paginated!.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted cursor-pointer">
                    <TableCell className="text-muted-foreground text-sm">
                      <Link href={`/properties/${c.property_id}`} className="hover:text-primary">
                        Imóvel #{c.property_id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">Modelo {c.contract_model}</TableCell>
                    <TableCell className="text-foreground text-sm font-medium">{brl(c.commission_base)}</TableCell>
                    <TableCell>
                      <Link href={`/commissions/${c.id}`} className="text-primary font-bold hover:underline">
                        {brl(c.commission_amount)}
                      </Link>
                    </TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{fmtDate(c.payment_due_date)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.nfse_number ?? <span className="text-yellow-600">Pendente</span>}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filtered!.length} comissão{filtered!.length !== 1 ? "ões" : ""} • página {page} de {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1"
            >
              <ChevronLeft size={14} />Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="gap-1"
            >
              Próxima<ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
