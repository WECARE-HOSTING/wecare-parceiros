"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPartners, type PartnerResponse } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PartnersPage() {
  const [partners, setPartners] = useState<PartnerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getPartners()
      .then(setPartners)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = partners.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.utm_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parceiros</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os parceiros do programa WeCare.
          </p>
        </div>
        <Link href="/partners/new">
          <Button className="gap-2">
            <UserPlus size={16} />
            Novo parceiro
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
        <Input
          placeholder="Buscar por nome, email ou código…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Código UTM</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground/80 py-10">
                  Nenhum parceiro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted cursor-pointer">
                  <TableCell className="font-medium text-foreground">
                    <Link href={`/partners/${p.id}`} className="hover:text-primary">
                      {p.full_name}
                    </Link>
                    {p.is_admin && (
                      <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                        Admin
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.email}</TableCell>
                  <TableCell className="text-muted-foreground">{p.segment ?? "—"}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                      {p.utm_code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
