"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLeads, type LeadResponse } from "@/lib/api";
import { exportCSV } from "@/lib/csv";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Contatado" },
  { value: "QUALIFIED", label: "Qualificado" },
  { value: "CONVERTED", label: "Convertido" },
  { value: "DISQUALIFIED", label: "Inelegível" },
  { value: "EXPIRED", label: "Expirado" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function daysLeft(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (diff <= 0) return <span className="text-red-500 text-xs">Expirado</span>;
  if (diff <= 30) return <span className="text-yellow-600 text-xs">{diff} dias</span>;
  return <span className="text-muted-foreground text-xs">{diff} dias</span>;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadResponse[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getLeads()
      .then(setLeads)
      .catch((e: Error) => setError(e.message));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, [statusFilter, search]);

  const filtered = leads?.filter((l) => {
    const matchesStatus = !statusFilter || l.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      l.full_name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.cpf.includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil((filtered?.length ?? 0) / PAGE_SIZE);
  const paginated = filtered?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleExport() {
    if (!filtered?.length) return;
    exportCSV(filtered, "leads_wecare.csv", [
      { key: "id", label: "ID" },
      { key: "full_name", label: "Nome" },
      { key: "email", label: "E-mail" },
      { key: "cpf", label: "CPF" },
      { key: "phone", label: "Telefone" },
      { key: "address_city", label: "Cidade" },
      { key: "address_state", label: "UF" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Registrado em" },
      { key: "attribution_expires_at", label: "Janela expira em" },
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">Proprietários indicados via seu link exclusivo.</p>
        </div>
        {leads && leads.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download size={14} />Exportar CSV
          </Button>
        )}
      </div>

      {/* Busca + Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
          <Input
            placeholder="Buscar por nome, e-mail ou CPF…"
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
              {f.value && leads && (
                <span className="ml-1 opacity-60">
                  ({leads.filter((l) => l.status === f.value).length})
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
              <TableHead className="font-semibold text-foreground">Nome</TableHead>
              <TableHead className="font-semibold text-foreground">E-mail</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="font-semibold text-foreground">Registrado em</TableHead>
              <TableHead className="font-semibold text-foreground">Janela expira</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!leads
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered!.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground/80 py-12">
                      {search || statusFilter
                        ? "Nenhum lead encontrado para este filtro."
                        : "Nenhum lead registrado ainda. Compartilhe seu link de indicação!"}
                    </TableCell>
                  </TableRow>
                )
              : paginated!.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted cursor-pointer">
                    <TableCell className="font-medium text-foreground">
                      <Link href={`/leads/${lead.id}`} className="hover:text-primary">
                        {lead.full_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{lead.email}</TableCell>
                    <TableCell><StatusBadge status={lead.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{fmtDate(lead.created_at)}</TableCell>
                    <TableCell>{daysLeft(lead.attribution_expires_at)}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filtered!.length} lead{filtered!.length !== 1 ? "s" : ""} • página {page} de {totalPages}
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
