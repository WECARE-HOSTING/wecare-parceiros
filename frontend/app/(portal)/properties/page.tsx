"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProperties, type PropertyResponse } from "@/lib/api";
import { useAuth } from "@/app/providers";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "LEAD", label: "Lead" },
  { value: "PROPOSAL_SENT", label: "Proposta" },
  { value: "CONTRACT_SIGNED", label: "Contrato" },
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "OPERATIONAL", label: "Em Operação" },
  { value: "CANCELLED", label: "Cancelado" },
];

const MODEL_LABEL: Record<string, string> = {
  A: "Modelo A",
  B: "Modelo B",
  C: "Modelo C",
};

const PAGE_SIZE = 15;

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function PropertiesPage() {
  const { partner } = useAuth();
  const [properties, setProperties] = useState<PropertyResponse[] | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getProperties()
      .then(setProperties)
      .catch((e: Error) => setError(e.message));
  }, []);

  // Reset page on filter/search change
  useEffect(() => { setPage(1); }, [statusFilter, search]);

  const filtered = properties?.filter((p) => {
    const matchesStatus = !statusFilter || p.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.owner_name.toLowerCase().includes(q) ||
      p.address_city.toLowerCase().includes(q) ||
      p.address_state.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil((filtered?.length ?? 0) / PAGE_SIZE);
  const paginated = filtered?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Imóveis</h1>
          <p className="text-gray-500 text-sm mt-1">Imóveis provenientes das indicações.</p>
        </div>
        {partner?.is_admin && (
          <Link href="/properties/new">
            <Button className="bg-[#E55A4F] hover:bg-[#E55A4F]/90 text-white gap-2">
              <Plus size={16} />Novo imóvel
            </Button>
          </Link>
        )}
      </div>

      {/* Busca + Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por proprietário ou cidade…"
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
                  ? "bg-[#E55A4F] text-white border-[#E55A4F]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {f.label}
              {f.value && properties && (
                <span className="ml-1 opacity-60">
                  ({properties.filter((p) => p.status === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Proprietário</TableHead>
              <TableHead>Cidade / UF</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Em operação desde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!properties
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : paginated!.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-12">
                      {statusFilter || search
                        ? "Nenhum imóvel encontrado para este filtro."
                        : "Nenhum imóvel cadastrado ainda."}
                    </TableCell>
                  </TableRow>
                )
              : paginated!.map((p) => (
                  <TableRow key={p.id} className="hover:bg-gray-50 cursor-pointer">
                    <TableCell>
                      <Link href={`/properties/${p.id}`} className="font-medium text-gray-900 hover:text-[#E55A4F]">
                        {p.owner_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{p.address_city} / {p.address_state}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{MODEL_LABEL[p.contract_model] ?? p.contract_model}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-gray-500 text-sm">{fmtDate(p.operational_since)}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {filtered!.length} imóve{filtered!.length === 1 ? "l" : "is"} • página {page} de {totalPages}
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
