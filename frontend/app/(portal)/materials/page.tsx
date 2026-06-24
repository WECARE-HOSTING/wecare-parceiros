"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  deleteMaterial,
  downloadMaterial,
  getMaterials,
  restoreMaterial,
  type MaterialResponse,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/app/providers";

const CATEGORIES = [
  { id: "ALL", label: "Todos" },
  { id: "ART", label: "Artes" },
  { id: "TEXT", label: "Textos" },
  { id: "PRESENTATION", label: "Apresentações" },
] as const;

const STATUS_TABS = [
  { id: "PUBLISHED", label: "Publicados" },
  { id: "ARCHIVED", label: "Arquivados" },
  { id: "ALL", label: "Todos" },
] as const;

function formatSize(bytes: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MaterialsPage() {
  const { partner } = useAuth();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("ALL");
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]["id"]>("PUBLISHED");
  const [items, setItems] = useState<MaterialResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData(selected: (typeof CATEGORIES)[number]["id"], selectedStatus: (typeof STATUS_TABS)[number]["id"]) {
    setLoading(true);
    setError("");
    try {
      const includeArchived = selectedStatus !== "PUBLISHED";
      const data = await getMaterials(selected === "ALL" ? undefined : selected, includeArchived);
      const filtered =
        selectedStatus === "ALL"
          ? data
          : data.filter((item) => item.status === selectedStatus);
      setItems(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar materiais.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData(category, statusTab);
  }, [category, statusTab]);

  async function handleDownload(materialId: number) {
    try {
      const response = await downloadMaterial(materialId);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const finalUrl = response.download_url.startsWith("http")
        ? response.download_url
        : `${apiUrl}${response.download_url}`;
      window.open(finalUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao baixar material.");
    }
  }

  async function handleDelete(materialId: number) {
    const confirmed = window.confirm("Deseja realmente excluir este material?");
    if (!confirmed) return;
    try {
      await deleteMaterial(materialId);
      await loadData(category, statusTab);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao excluir material.");
    }
  }

  async function handleRestore(materialId: number) {
    try {
      await restoreMaterial(materialId);
      await loadData(category, statusTab);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao restaurar material.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portal de Materiais</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Baixe artes, textos e apresentações para apoiar suas indicações.
          </p>
        </div>
        {partner?.is_admin && (
          <Link href="/materials/new">
            <Button>Adicionar material</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {partner?.is_admin &&
          STATUS_TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={statusTab === tab.id ? "secondary" : "outline"}
              onClick={() => setStatusTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((option) => (
          <Button
            key={option.id}
            variant={category === option.id ? "default" : "outline"}
            onClick={() => setCategory(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && <p className="text-sm text-muted-foreground">Carregando materiais...</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum material disponível para esta categoria.</p>
        )}
        {!loading &&
          items.map((material) => (
            <Card key={material.id} className="bg-card border-border shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{material.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{material.description ?? "Sem descrição."}</p>
                <div className="text-xs text-muted-foreground">
                  <p>Arquivo: {material.file_name}</p>
                  <p>Tamanho: {formatSize(material.file_size_bytes)}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => void handleDownload(material.id)}>Baixar material</Button>
                  {partner?.is_admin && (
                    material.status === "ARCHIVED" ? (
                      <Button variant="secondary" onClick={() => void handleRestore(material.id)}>
                        Desarquivar
                      </Button>
                    ) : (
                      <Button variant="destructive" onClick={() => void handleDelete(material.id)}>
                        Excluir
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
