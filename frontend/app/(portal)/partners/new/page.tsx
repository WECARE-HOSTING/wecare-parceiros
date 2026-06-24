"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPartner } from "@/lib/api";
import { validateDocument, formatDocument } from "@/lib/cpf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const SEGMENTS = [
  "Corretor de Imóveis",
  "Imobiliária",
  "Consultor Independente",
  "Administrador de Condomínio",
  "Advogado",
  "Contador",
  "Outro",
];

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

export default function NewPartnerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [docError, setDocError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    document: "",
    email: "",
    phone: "",
    segment: "",
    company_name: "",
    initial_password: "",
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatDocument(e.target.value);
    setForm((prev) => ({ ...prev, document: formatted }));
    setDocError("");
  }

  function handleDocBlur() {
    if (form.document && !validateDocument(form.document)) {
      setDocError("CPF ou CNPJ inválido.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateDocument(form.document)) {
      setDocError("CPF ou CNPJ inválido.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await createPartner({
        full_name: form.full_name,
        document: form.document,
        email: form.email,
        phone: form.phone || undefined,
        segment: form.segment || undefined,
        company_name: form.company_name || undefined,
        initial_password: form.initial_password || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push("/partners"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar parceiro.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Parceiro cadastrado!</h2>
        <p className="text-muted-foreground text-sm">
          O link de indicação foi gerado automaticamente. Redirecionando…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/partners">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft size={15} />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo parceiro</h1>
          <p className="text-muted-foreground text-sm">
            O código UTM e o link de indicação serão gerados automaticamente.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados pessoais */}
        <Card className="shadow-none border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados pessoais</CardTitle>
            <CardDescription>Informações de identificação do parceiro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nome completo" required>
              <Input
                value={form.full_name}
                onChange={set("full_name")}
                placeholder="Ex: João Silva"
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="CPF ou CNPJ" required hint="Formatado automaticamente">
                <Input
                  value={form.document}
                  onChange={handleDocChange}
                  onBlur={handleDocBlur}
                  placeholder="000.000.000-00"
                  required
                  className={docError ? "border-red-400 focus-visible:ring-red-300" : ""}
                />
                {docError && <p className="text-xs text-red-500 mt-1">{docError}</p>}
              </Field>
              <Field label="Telefone / WhatsApp">
                <Input
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="(11) 99999-9999"
                />
              </Field>
            </div>

            <Field label="E-mail" required>
              <Input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="joao@email.com"
                required
              />
            </Field>
          </CardContent>
        </Card>

        {/* Dados profissionais */}
        <Card className="shadow-none border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados profissionais</CardTitle>
            <CardDescription>Segmento de atuação e empresa (opcional).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Segmento">
              <select
                value={form.segment}
                onChange={set("segment")}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Selecione…</option>
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Empresa / Imobiliária">
              <Input
                value={form.company_name}
                onChange={set("company_name")}
                placeholder="Ex: Imobiliária Santos Ltda."
              />
            </Field>
          </CardContent>
        </Card>

        {/* Acesso */}
        <Card className="shadow-none border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acesso ao portal</CardTitle>
            <CardDescription>
              Senha provisória para o primeiro acesso. Se deixado em branco, o parceiro não
              conseguirá logar até que uma senha seja definida.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field label="Senha provisória">
              <Input
                type="password"
                value={form.initial_password}
                onChange={set("initial_password")}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </Field>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/partners">
            <Button type="button" variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="gap-2 min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Cadastrando…
              </>
            ) : (
              "Cadastrar parceiro"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
