"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { getPartners, type PartnerResponse } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Link2, Search, UserPlus } from "lucide-react";

const INVITE_LINK = "https://cadastro.wecarehosting.com.br/cadastro-parceiro";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function PartnersPage() {
  const { partner } = useAuth();
  const router = useRouter();

  const [partners, setPartners] = useState<PartnerResponse[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (partner !== null && !partner.is_admin) {
      router.replace("/leads");
    }
  }, [partner, router]);

  useEffect(() => {
    if (!partner?.is_admin) return;
    getPartners({ excludeAdmins: true })
      .then(setPartners)
      .catch((e: Error) => setError(e.message));
  }, [partner?.is_admin]);

  function copyInviteLink() {
    navigator.clipboard.writeText(INVITE_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const filtered = partners?.filter((p) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  if (!partner?.is_admin) return null;

  return (
    <div className="space-y-6">
      {copied && (
        <div className="fixed bottom-6 right-6 z-50 bg-wecare-navy text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
          Link copiado!
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Parceiros</h1>
          <p className="text-muted-foreground text-base mt-1">
            Gerencie os parceiros cadastrados no programa.
          </p>
        </div>
        <Button onClick={copyInviteLink} className="gap-1.5 shrink-0">
          <UserPlus size={15} />
          Convidar parceiro
        </Button>
      </div>

      <div className="relative max-w-xs w-full">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
        <Input
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="font-semibold text-foreground">Nome</TableHead>
                <TableHead className="font-semibold text-foreground">E-mail</TableHead>
                <TableHead className="font-semibold text-foreground">Segmento</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Membro desde</TableHead>
                <TableHead className="font-semibold text-foreground">Link curto</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!partners
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : filtered!.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground/80 py-12">
                        {search
                          ? "Nenhum parceiro encontrado para este filtro."
                          : "Nenhum parceiro cadastrado ainda."}
                      </TableCell>
                    </TableRow>
                  )
                : filtered!.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted">
                      <TableCell className="font-medium text-foreground">{p.full_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.segment ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{fmtDate(p.created_at)}</TableCell>
                      <TableCell>
                        <a
                          href={p.short_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Link2 size={13} />
                          {p.short_link.replace("https://", "")}
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/leads?partner_id=${p.id}`} className="gap-1.5">
                            <ExternalLink size={13} />
                            Ver leads
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {!partners
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))
          : filtered!.length === 0
          ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground/80">
                {search
                  ? "Nenhum parceiro encontrado para este filtro."
                  : "Nenhum parceiro cadastrado ainda."}
              </div>
            )
          : filtered!.map((p) => (
              <div key={p.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground text-base">{p.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{p.email}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Segmento: {p.segment ?? "—"}</p>
                  <p>Membro desde: {fmtDate(p.created_at)}</p>
                  <a
                    href={p.short_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Link2 size={13} />
                    {p.short_link.replace("https://", "")}
                  </a>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/leads?partner_id=${p.id}`} className="gap-1.5">
                    <ExternalLink size={13} />
                    Ver leads
                  </Link>
                </Button>
              </div>
            ))}
      </div>

      {partners && filtered && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} parceiro{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
