"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getLeads, uploadLeadsList, type LeadResponse, type LeadsUploadResult } from "@/lib/api";
import { exportCSV } from "@/lib/csv";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Download, Loader2, Search, Upload } from "lucide-react";

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

function ImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (reload: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<LeadsUploadResult | null>(null);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setResult(null);
    setUploadError("");
    setUploading(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    setResult(null);
    try {
      const res = await uploadLeadsList(file);
      setResult(res);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleClose(reload: boolean) {
    reset();
    onClose(reload);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(!!result); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar lista de leads</DialogTitle>
          <DialogDescription>
            Envie um arquivo CSV ou Excel com seus leads. Colunas aceitas:{" "}
            <span className="font-medium text-foreground">nome, email, telefone, cidade, estado</span>.
            Máximo de 500 linhas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!result && (
            <label
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30 ${
                uploading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={handleFile}
                disabled={uploading}
              />
              {uploading ? (
                <>
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Importando…</span>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Clique para selecionar arquivo</span>
                  <span className="text-xs text-muted-foreground">.csv ou .xlsx</span>
                </>
              )}
            </label>
          )}

          {uploadError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {uploadError}
            </p>
          )}

          {result && (
            <div className="space-y-3">
              <div className="bg-muted/40 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Leads importados</span>
                  <span className="font-semibold text-green-700">{result.criados}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ignorados</span>
                  <span className="font-medium text-yellow-700">{result.ignorados}</span>
                </div>
              </div>

              {result.erros.length > 0 && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">
                    {result.erros.length} aviso{result.erros.length !== 1 ? "s" : ""}
                  </summary>
                  <ul className="mt-2 space-y-0.5 pl-2 border-l border-border">
                    {result.erros.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </details>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => { reset(); }}>
                  Importar outro
                </Button>
                <Button size="sm" onClick={() => handleClose(true)} className="flex-1">
                  Fechar e atualizar lista
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadResponse[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);

  function loadLeads() {
    getLeads()
      .then(setLeads)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => { loadLeads(); }, []);

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
      <ImportDialog
        open={importOpen}
        onClose={(reload) => {
          setImportOpen(false);
          if (reload) { setLeads(null); loadLeads(); }
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">Proprietários indicados via seu link exclusivo.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5">
            <Upload size={14} />Importar lista
          </Button>
          {leads && leads.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <Download size={14} />Exportar CSV
            </Button>
          )}
        </div>
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
