"use client";

import { useState } from "react";
import { createRevenueRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Sparkles } from "lucide-react";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number;
  propertyLabel: string;
  onSuccess?: () => void;
};

export function RevenueModal({
  open,
  onOpenChange,
  propertyId,
  propertyLabel,
  onSuccess,
}: Props) {
  const now = new Date();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successFirst, setSuccessFirst] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    reference_month: String(now.getMonth() + 1),
    reference_year: String(now.getFullYear()),
    gross_revenue: "",
    wecare_admin_fee: "",
    owner_payout: "",
  });

  function reset() {
    setError("");
    setSuccessFirst(null);
    setForm({
      reference_month: String(now.getMonth() + 1),
      reference_year: String(now.getFullYear()),
      gross_revenue: "",
      wecare_admin_fee: "",
      owner_payout: "",
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        if (field === "gross_revenue" || field === "wecare_admin_fee") {
          const gross = parseFloat(field === "gross_revenue" ? value : prev.gross_revenue) || 0;
          const fee = parseFloat(field === "wecare_admin_fee" ? value : prev.wecare_admin_fee) || 0;
          if (gross > 0 && fee > 0) next.owner_payout = (gross - fee).toFixed(2);
        }
        return next;
      });
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const rec = await createRevenueRecord({
        property_id: propertyId,
        reference_month: parseInt(form.reference_month),
        reference_year: parseInt(form.reference_year),
        gross_revenue: parseFloat(form.gross_revenue),
        wecare_admin_fee: parseFloat(form.wecare_admin_fee),
        owner_payout: parseFloat(form.owner_payout),
      });
      setSuccessFirst(rec.is_first_complete_month);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao registrar receita.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {successFirst !== null ? (
          <>
            <DialogHeader>
              <DialogTitle>Receita registrada!</DialogTitle>
              <DialogDescription>{propertyLabel}</DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4 space-y-3">
              {successFirst && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                  <Sparkles size={16} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>1º mês completo!</strong> Comissão do parceiro gerada automaticamente.
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                className="bg-[#B79152] hover:bg-[#B79152]/90 text-white"
                onClick={() => handleOpenChange(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Registrar receita</DialogTitle>
              <DialogDescription>{propertyLabel}</DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Mês</label>
                  <select
                    value={form.reference_month}
                    onChange={set("reference_month")}
                    required
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Ano</label>
                  <Input
                    type="number"
                    min="2020"
                    max="2099"
                    value={form.reference_year}
                    onChange={set("reference_year")}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Receita bruta (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.gross_revenue}
                  onChange={set("gross_revenue")}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Taxa WeCare (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.wecare_admin_fee}
                  onChange={set("wecare_admin_fee")}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Repasse proprietário (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.owner_payout}
                  onChange={set("owner_payout")}
                  required
                />
              </div>
              {error && (
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#B79152] hover:bg-[#B79152]/90 text-white gap-2"
              >
                {loading ? <><Loader2 size={15} className="animate-spin" />Salvando…</> : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
