"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useAuth } from "@/app/providers";
import { RevenueModal } from "@/components/revenue-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  adminUpdateLeadStatus,
  adminUpdatePropertyStatus,
  getAdminKanban,
  type KanbanColumn,
  type KanbanLeadCard,
  type KanbanResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { GripVertical, Loader2, RefreshCw } from "lucide-react";

const COLUMNS: { id: KanbanColumn; label: string }[] = [
  { id: "NEW", label: "Novo" },
  { id: "CONTACTED", label: "Contatado" },
  { id: "QUALIFIED", label: "Qualificado" },
  { id: "ONBOARDING", label: "Onboarding" },
  { id: "OPERATIONAL", label: "Operacional" },
  { id: "CANCELLED", label: "Cancelado" },
];

const EMPTY_BOARD: KanbanResponse = {
  NEW: [],
  CONTACTED: [],
  QUALIFIED: [],
  ONBOARDING: [],
  OPERATIONAL: [],
  CANCELLED: [],
};

function daysBadgeClass(days: number) {
  if (days < 30) return "bg-red-100 text-red-700 border-red-200";
  if (days < 60) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function cityLabel(card: KanbanLeadCard) {
  return card.property?.address_city ?? card.address_city ?? "—";
}

function applyFilters(
  board: KanbanResponse,
  partnerId: string,
  cityQuery: string,
  expiringSoon: boolean
): KanbanResponse {
  const city = cityQuery.trim().toLowerCase();
  const result = { ...EMPTY_BOARD };
  for (const col of COLUMNS) {
    result[col.id] = board[col.id].filter((card) => {
      if (partnerId && String(card.partner_id) !== partnerId) return false;
      if (city && !cityLabel(card).toLowerCase().includes(city)) return false;
      if (expiringSoon && card.days_remaining_attribution >= 30) return false;
      return true;
    });
  }
  return result;
}

function findCardColumn(board: KanbanResponse, leadId: number): KanbanColumn | null {
  for (const col of COLUMNS) {
    if (board[col.id].some((c) => c.id === leadId)) return col.id;
  }
  return null;
}

function moveCardInBoard(
  board: KanbanResponse,
  card: KanbanLeadCard,
  from: KanbanColumn,
  to: KanbanColumn
): KanbanResponse {
  const updated = { ...card, kanban_column: to };
  return {
    ...board,
    [from]: board[from].filter((c) => c.id !== card.id),
    [to]: [updated, ...board[to].filter((c) => c.id !== card.id)],
  };
}

async function persistColumnMove(card: KanbanLeadCard, target: KanbanColumn) {
  switch (target) {
    case "NEW":
    case "CONTACTED":
    case "QUALIFIED":
      await adminUpdateLeadStatus(card.id, { status: target });
      break;
    case "ONBOARDING":
      if (!card.property) throw new Error("Lead sem imóvel — não é possível mover para Onboarding.");
      await adminUpdatePropertyStatus(card.property.id, "ONBOARDING");
      break;
    case "OPERATIONAL":
      if (!card.property) throw new Error("Lead sem imóvel — não é possível mover para Operacional.");
      await adminUpdatePropertyStatus(card.property.id, "OPERATIONAL");
      break;
    case "CANCELLED":
      if (card.property) {
        await adminUpdatePropertyStatus(card.property.id, "CANCELLED");
      } else {
        await adminUpdateLeadStatus(card.id, { status: "DISQUALIFIED" });
      }
      break;
  }
}

function KanbanCardView({
  card,
  isDragging,
  onRegisterRevenue,
}: {
  card: KanbanLeadCard;
  isDragging?: boolean;
  onRegisterRevenue: (card: KanbanLeadCard) => void;
}) {
  const days = card.days_remaining_attribution;
  const detailHref = card.property ? `/properties/${card.property.id}` : `/leads/${card.id}`;

  return (
    <Card
      className={cn(
        "shadow-sm border-[#0C2330]/10 bg-white cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-[#B79152]"
      )}
      size="sm"
    >
      <CardContent className="space-y-2.5 pt-3">
        <div className="flex items-start gap-1.5">
          <GripVertical size={14} className="text-gray-300 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#0C2330] text-sm leading-tight truncate">
              {card.full_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{cityLabel(card)}</p>
          </div>
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 shrink-0", daysBadgeClass(days))}
          >
            {days <= 0 ? "Expirado" : `${days}d`}
          </Badge>
        </div>

        <p className="text-[11px] text-gray-400 truncate pl-5">{card.partner_name}</p>

        {card.commission && card.commission.count_pending > 0 && (
          <p className="text-[11px] text-[#B79152] pl-5">
            Comissão pendente: R$ {parseFloat(card.commission.total_pending).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        )}

        <div className="flex gap-1.5 pl-5 pt-0.5">
          {card.property && card.property.status === "OPERATIONAL" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-[11px] px-2 border-[#B79152]/40 text-[#B79152] hover:bg-[#F2EAD9]"
              onClick={(e) => {
                e.stopPropagation();
                onRegisterRevenue(card);
              }}
            >
              Registrar receita
            </Button>
          )}
          <Link href={detailHref} onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] px-2 text-[#0C2330]"
            >
              Ver detalhes
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function DraggableCard({
  card,
  onRegisterRevenue,
}: {
  card: KanbanLeadCard;
  onRegisterRevenue: (card: KanbanLeadCard) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lead-${card.id}`,
    data: { card },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <KanbanCardView card={card} isDragging={isDragging} onRegisterRevenue={onRegisterRevenue} />
    </div>
  );
}

function DroppableColumn({
  column,
  label,
  count,
  children,
}: {
  column: KanbanColumn;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-64 shrink-0 rounded-xl bg-[#F2EAD9]/60 border border-[#0C2330]/10",
        isOver && "ring-2 ring-[#B79152] bg-[#F2EAD9]"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#0C2330]/10">
        <h3 className="text-sm font-semibold text-[#0C2330]">{label}</h3>
        <span className="text-xs font-medium bg-[#0C2330] text-[#F2EAD9] rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
          {count}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-280px)] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export default function AdminKanbanPage() {
  const { partner, logout } = useAuth();
  const [board, setBoard] = useState<KanbanResponse>(EMPTY_BOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCard, setActiveCard] = useState<KanbanLeadCard | null>(null);
  const [partnerFilter, setPartnerFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [revenueCard, setRevenueCard] = useState<KanbanLeadCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminKanban();
      setBoard(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar kanban.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!partner) return;
    if (!partner.is_admin) {
      logout();
      return;
    }
    void loadBoard();
  }, [partner, logout, loadBoard]);

  const partners = useMemo(() => {
    const map = new Map<number, string>();
    for (const col of COLUMNS) {
      for (const card of board[col.id]) {
        map.set(card.partner_id, card.partner_name);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [board]);

  const filteredBoard = useMemo(
    () => applyFilters(board, partnerFilter, cityFilter, expiringSoon),
    [board, partnerFilter, cityFilter, expiringSoon]
  );

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const card = active.data.current?.card as KanbanLeadCard | undefined;
    if (!card) return;

    let targetColumn = over.id as string;
    if (targetColumn.startsWith("lead-")) {
      const overId = parseInt(targetColumn.replace("lead-", ""), 10);
      const col = findCardColumn(filteredBoard, overId);
      if (!col) return;
      targetColumn = col;
    }

    const to = targetColumn as KanbanColumn;
    const from = card.kanban_column;
    if (from === to) return;

    const previous = board;
    setBoard((b) => moveCardInBoard(b, card, from, to));

    try {
      await persistColumnMove(card, to);
      await loadBoard();
    } catch (err: unknown) {
      setBoard(previous);
      setError(err instanceof Error ? err.message : "Erro ao mover card.");
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const card = event.active.data.current?.card as KanbanLeadCard | undefined;
    setActiveCard(card ?? null);
  }

  if (!partner?.is_admin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-[#B79152]" size={28} />
      </div>
    );
  }

  return (
    <div className="max-w-none -mx-8 px-4 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0C2330]">Kanban Gerencial</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Pipeline de leads e imóveis — arraste os cards entre colunas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadBoard()}
          disabled={loading}
          className="gap-1.5 border-[#0C2330]/20"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Atualizar
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-[#0C2330] text-[#F2EAD9]">
        <div className="space-y-1 min-w-[180px]">
          <label className="text-xs uppercase tracking-wider opacity-70">Parceiro</label>
          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="w-full h-9 rounded-md border border-[#B79152]/30 bg-[#0C2330] text-[#F2EAD9] px-3 text-sm"
          >
            <option value="">Todos</option>
            {partners.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1 min-w-[160px]">
          <label className="text-xs uppercase tracking-wider opacity-70">Cidade</label>
          <Input
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder="Filtrar cidade…"
            className="h-9 bg-[#0C2330] border-[#B79152]/30 text-[#F2EAD9] placeholder:text-[#F2EAD9]/40"
          />
        </div>
        <label className="flex items-center gap-2 h-9 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={expiringSoon}
            onChange={(e) => setExpiringSoon(e.target.checked)}
            className="rounded border-[#B79152]/50"
          />
          Vencimento &lt; 30 dias
        </label>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#B79152]" size={32} />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={(e) => void handleDragEnd(e)}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {COLUMNS.map(({ id, label }) => (
              <DroppableColumn
                key={id}
                column={id}
                label={label}
                count={filteredBoard[id].length}
              >
                {filteredBoard[id].map((card) => (
                  <DraggableCard
                    key={card.id}
                    card={card}
                    onRegisterRevenue={setRevenueCard}
                  />
                ))}
              </DroppableColumn>
            ))}
          </div>

          <DragOverlay>
            {activeCard ? (
              <KanbanCardView card={activeCard} onRegisterRevenue={() => {}} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {revenueCard?.property && (
        <RevenueModal
          open={!!revenueCard}
          onOpenChange={(open) => !open && setRevenueCard(null)}
          propertyId={revenueCard.property.id}
          propertyLabel={`${revenueCard.property.owner_name} — ${revenueCard.property.address_city}`}
          onSuccess={() => void loadBoard()}
        />
      )}
    </div>
  );
}
