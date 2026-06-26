"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "@/app/providers";
import {
  fetchCrmClients,
  updateCrmClientFase,
  getPartners,
  type CrmClientResponse,
  type CrmFase,
  type PartnerResponse,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, User, AlertCircle, Filter } from "lucide-react";

// ── Column metadata ────────────────────────────────────────────────────────────

const COLS: { fase: CrmFase; label: string; color: string }[] = [
  { fase: "1_lead",              label: "Lead",         color: "#B79152" },
  { fase: "2_reuniao",           label: "Reunião",      color: "#3B82F6" },
  { fase: "3_proposta_contrato", label: "Proposta",     color: "#22C55E" },
  { fase: "4_aguardando_docs",   label: "Aguard. Docs", color: "#F97316" },
  { fase: "5_assinatura",        label: "Assinatura",   color: "#A855F7" },
  { fase: "operacao",            label: "Operação",     color: "#14B8A6" },
  { fase: "perdido",             label: "Perdido",      color: "#6B7280" },
];

function getColMeta(fase: CrmFase) {
  return COLS.find(c => c.fase === fase) ?? COLS[0];
}

function isOverdue(prazo: string | null): boolean {
  if (!prazo) return false;
  return new Date(prazo) < new Date();
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR");
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FaseBadge({ fase }: { fase: CrmFase }) {
  const col = getColMeta(fase);
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: col.color + "22", color: col.color }}
    >
      {col.label}
    </span>
  );
}

function CardBody({ client }: { client: CrmClientResponse }) {
  const overdue = isOverdue(client.prazo);
  return (
    <div className="space-y-2">
      <p className="font-semibold text-foreground text-sm leading-tight">
        {client.nome_cliente}
      </p>

      {(client.cidade || client.estado) && (
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <MapPin size={11} />
          <span>{[client.cidade, client.estado].filter(Boolean).join(" — ")}</span>
        </div>
      )}

      {client.partner_name && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
          <User size={11} />
          <span className="truncate">{client.partner_name}</span>
        </div>
      )}

      <FaseBadge fase={client.fase_atual} />

      {client.proxima_acao && (
        <div className="flex items-start gap-1 text-xs text-muted-foreground border-t border-border pt-1.5 mt-1">
          <Calendar size={11} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2">{client.proxima_acao}</span>
        </div>
      )}

      {client.prazo && (
        <div
          className={`flex items-center gap-1 text-xs ${
            overdue ? "text-red-500 font-semibold" : "text-muted-foreground"
          }`}
        >
          <AlertCircle size={11} />
          <span>
            {overdue ? "Vencido: " : "Prazo: "}
            {fmtDate(client.prazo)}
          </span>
        </div>
      )}
    </div>
  );
}

function CrmCard({ client }: { client: CrmClientResponse }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: client.id,
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-card border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing select-none transition-shadow ${
        isDragging ? "opacity-25 shadow-none" : "hover:shadow-md"
      }`}
    >
      <CardBody client={client} />
    </div>
  );
}

function CrmCardOverlay({ client }: { client: CrmClientResponse }) {
  return (
    <div className="w-64 bg-card border border-primary/30 rounded-xl p-3 shadow-2xl ring-2 ring-primary/20 rotate-1 select-none">
      <CardBody client={client} />
    </div>
  );
}

function KanbanColumn({
  col,
  clients,
}: {
  col: (typeof COLS)[number];
  clients: CrmClientResponse[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.fase });

  return (
    <div className="flex flex-col w-64 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
          <span className="text-sm font-semibold text-foreground">{col.label}</span>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {clients.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] rounded-xl p-2 space-y-2 transition-all ${
          isOver
            ? "bg-primary/5 ring-2 ring-primary/25"
            : "bg-muted/40"
        }`}
      >
        {clients.map(client => (
          <CrmCard key={client.id} client={client} />
        ))}
        {clients.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground/40">
            Sem clientes
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="flex gap-4">
      {COLS.map(col => (
        <div key={col.fase} className="w-64 shrink-0 space-y-2">
          <div className="flex items-center gap-2 px-1 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="rounded-xl bg-muted/40 p-2 space-y-2 min-h-[200px]">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CrmPage() {
  const { partner } = useAuth();
  const router = useRouter();

  const [clients, setClients] = useState<CrmClientResponse[]>([]);
  const [partners, setPartners] = useState<PartnerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterPartnerId, setFilterPartnerId] = useState<number | "">("");
  const [filterOverdue, setFilterOverdue] = useState(false);

  const [activeClient, setActiveClient] = useState<CrmClientResponse | null>(null);

  // Guard: admin only
  useEffect(() => {
    if (partner !== null && !partner.is_admin) {
      router.replace("/leads");
    }
  }, [partner, router]);

  // Fetch clients + partners
  useEffect(() => {
    if (!partner?.is_admin) return;
    setLoading(true);
    Promise.all([fetchCrmClients(), getPartners()])
      .then(([cls, pts]) => {
        setClients(cls);
        setPartners(pts);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [partner?.is_admin]);

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const c = clients.find(x => x.id === event.active.id);
    setActiveClient(c ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveClient(null);
    const { active, over } = event;
    if (!over) return;

    const clientId = active.id as number;
    const newFase = over.id as CrmFase;
    const client = clients.find(c => c.id === clientId);
    if (!client || client.fase_atual === newFase) return;

    const prevFase = client.fase_atual;
    setClients(prev =>
      prev.map(c => (c.id === clientId ? { ...c, fase_atual: newFase } : c))
    );

    updateCrmClientFase(clientId, { fase: newFase }).catch(() => {
      setClients(prev =>
        prev.map(c => (c.id === clientId ? { ...c, fase_atual: prevFase } : c))
      );
    });
  }

  // Filters
  const filtered = clients.filter(c => {
    if (filterPartnerId !== "" && c.partner_id !== filterPartnerId) return false;
    if (filterOverdue && !isOverdue(c.prazo)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !c.nome_cliente.toLowerCase().includes(q) &&
        !(c.email ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const byFase = (fase: CrmFase) => filtered.filter(c => c.fase_atual === fase);
  const hasFilters = search !== "" || filterPartnerId !== "" || filterOverdue;

  if (!partner?.is_admin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">CRM — Funil de Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Arraste os cartões entre colunas para avançar clientes no funil.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Filter
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none"
          />
          <Input
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-60"
          />
        </div>

        <select
          value={filterPartnerId}
          onChange={e =>
            setFilterPartnerId(e.target.value ? Number(e.target.value) : "")
          }
          className="text-sm border border-border bg-card text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 h-10"
        >
          <option value="">Todos os parceiros</option>
          {partners.map(p => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setFilterOverdue(v => !v)}
          className={`h-10 text-sm px-4 rounded-lg border transition-colors ${
            filterOverdue
              ? "bg-red-50 border-red-300 text-red-700 font-medium"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Prazo vencido
        </button>

        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setFilterPartnerId("");
              setFilterOverdue(false);
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Limpar filtros
          </button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Kanban board — breaks out of the layout's padded container for full width scroll */}
      <div className="-mx-8 px-8 overflow-x-auto pb-6">
        {loading ? (
          <KanbanSkeleton />
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4" style={{ minWidth: "max-content" }}>
              {COLS.map(col => (
                <KanbanColumn
                  key={col.fase}
                  col={col}
                  clients={byFase(col.fase)}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeClient ? <CrmCardOverlay client={activeClient} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
