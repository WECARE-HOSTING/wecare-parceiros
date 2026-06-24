"use client";
import Image from "next/image";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api";
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
      <div className="text-center space-y-3 p-2">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <p className="text-sm text-gray-600">Link inválido ou expirado.</p>
        <Link href="/forgot-password">
          <Button variant="outline" className="w-full">Solicitar novo link</Button>
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
        <h2 className="text-lg font-semibold text-gray-800">Senha redefinida!</h2>
        <p className="text-sm text-gray-500">Redirecionando para o login…</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Nova senha</h2>
      <p className="text-sm text-gray-500 mb-6">Escolha uma senha segura com pelo menos 6 caracteres.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Nova senha</label>
          <Input
            type="password"
            placeholder="••••••••"
            {...register("new_password")}
            disabled={isSubmitting}
            autoComplete="new-password"
          />
          {errors.new_password && (
            <p className="text-xs text-red-500">{errors.new_password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Confirmar nova senha</label>
          <Input
            type="password"
            placeholder="••••••••"
            {...register("confirm_password")}
            disabled={isSubmitting}
            autoComplete="new-password"
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
          className="w-full bg-[#E55A4F] hover:bg-[#c44b43] text-white"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="WeCare" width={140} height={46} priority className="mb-2" />
          <p className="text-sm text-gray-500">Portal do Parceiro</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <Suspense fallback={<div className="h-40" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
