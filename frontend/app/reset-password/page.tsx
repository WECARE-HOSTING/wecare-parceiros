"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api";
import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const schema = z
  .object({
    new_password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "As senhas não coincidem.",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await resetPassword(token, data.new_password);
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (e: unknown) {
      setError("root", {
        message: e instanceof Error ? e.message : "Erro ao redefinir senha.",
      });
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <p className="text-base text-[#0C2330]/70">Link inválido ou expirado.</p>
        <Link href="/forgot-password">
          <Button variant="outline" className="w-full min-h-10">Solicitar novo link</Button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={24} className="text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-[#0C2330]">Senha redefinida!</h3>
        <p className="text-base text-[#0C2330]/70">Redirecionando para o login…</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-base text-[#0C2330]/70 mb-6">
        Escolha uma senha segura com pelo menos 6 caracteres.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#0C2330]">Nova senha</label>
          <Input
            type="password"
            placeholder="••••••••"
            {...register("new_password")}
            disabled={isSubmitting}
            autoComplete="new-password"
            className="border-[#B79152]/30 bg-white text-[#0C2330] focus-visible:ring-[#B79152]/40 focus-visible:border-[#B79152]"
          />
          {errors.new_password && (
            <p className="text-xs text-red-500">{errors.new_password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[#0C2330]">Confirmar nova senha</label>
          <Input
            type="password"
            placeholder="••••••••"
            {...register("confirm_password")}
            disabled={isSubmitting}
            autoComplete="new-password"
            className="border-[#B79152]/30 bg-white text-[#0C2330] focus-visible:ring-[#B79152]/40 focus-visible:border-[#B79152]"
          />
          {errors.confirm_password && (
            <p className="text-xs text-red-500">{errors.confirm_password.message}</p>
          )}
        </div>

        {errors.root && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full min-h-10 bg-[#B79152] hover:bg-[#B79152]/90 text-[#0C2330] font-semibold text-base"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><Loader2 size={15} className="animate-spin mr-2" />Redefinindo…</>
          ) : (
            "Redefinir senha"
          )}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
      <PublicHeader rightLink={{ href: "/login", label: "Voltar ao login" }} />

      <div className="flex items-center justify-center px-4 md:px-8 py-8 md:py-12">
        <div className="w-full max-w-md">
          <div className="bg-[#0C2330] rounded-2xl shadow-lg border border-[#B79152]/30 overflow-hidden">
            <div className="px-6 md:px-8 pt-8 pb-2 text-center">
              <h2 className="text-xl md:text-2xl font-semibold text-[#F2EAD9] font-[family-name:var(--font-spectral)]">
                Portal do Parceiro
              </h2>
              <p className="text-sm text-[#F2EAD9]/60 mt-1">Nova senha</p>
            </div>

            <div className="bg-[#F2EAD9] m-4 mt-2 rounded-xl p-6 md:p-8">
              <Suspense fallback={<div className="h-40" />}>
                <ResetPasswordForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
