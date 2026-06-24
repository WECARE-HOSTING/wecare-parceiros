"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { createMaterial, uploadMaterialFile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Category = "ART" | "TEXT" | "PRESENTATION";
const ALLOWED_EXTENSIONS = ["pdf", "zip", "ppt", "pptx", "doc", "docx", "jpg", "jpeg", "png"];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewMaterialPage() {
  const router = useRouter();
  const { partner } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("ART");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (partner && !partner.is_admin) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
        Acesso restrito a administradores.
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!file) {
      setError("Selecione um arquivo para enviar.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Extensão não permitida. Use: ${ALLOWED_EXTENSIONS.join(", ")}.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Arquivo muito grande. Limite de 20 MB.");
      return;
    }
    setSaving(true);
    setUploadProgress(0);
    try {
      const upload = await uploadMaterialFile(file, setUploadProgress);
      await createMaterial({
        title,
        description: description || undefined,
        category,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        file_url: upload.file_url,
        file_name: upload.file_name,
        file_mime_type: upload.file_mime_type || undefined,
        file_size_bytes: upload.file_size_bytes,
      });
      router.push("/materials");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar material.");
      setSaving(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setUploadProgress(0);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (selected && selected.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selected));
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo material</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cadastre artes, textos e apresentações para o portal do parceiro.
          </p>
        </div>
        <Link href="/materials">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
      )}

      <Card className="bg-card border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Dados do material</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Descrição</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Categoria</label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                <option value="ART">Artes</option>
                <option value="TEXT">Textos</option>
                <option value="PRESENTATION">Apresentações</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Tags (separadas por vírgula)</label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Arquivo</label>
              <input
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                type="file"
                required
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground">
                Permitidos: {ALLOWED_EXTENSIONS.join(", ")}. Tamanho máximo: 20 MB.
              </p>
            </div>

            {file && (
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">Pré-visualização</p>
                <p className="text-xs text-muted-foreground">Arquivo: {file.name}</p>
                <p className="text-xs text-muted-foreground">Tipo: {file.type || "desconhecido"}</p>
                <p className="text-xs text-muted-foreground">Tamanho: {formatSize(file.size)}</p>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview do arquivo selecionado"
                    className="max-h-40 rounded border border-border"
                  />
                )}
              </div>
            )}

            {saving && (
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-muted overflow-hidden">
                  <div
                    className="h-2 bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Upload: {uploadProgress}%</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button disabled={saving} type="submit">
                {saving ? "Salvando..." : "Publicar material"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
