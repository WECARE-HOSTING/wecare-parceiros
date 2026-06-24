"use client";
import Image from "next/image";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch (err: unknown) {
      setError("root", {
        message: err instanceof Error ? err.message : "Erro ao processar solicitação. Tente novamente.",
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="WeCare" width={140} height={46} priority className="mb-2" />
          <p className="text-sm text-gray-500">Portal do Parceiro</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} className="text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">E-mail enviado!</h2>
              <p className="text-sm text-gray-500">
                Enviamos o link de redefinição para o seu e-mail.
                Verifique também sua caixa de spam.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full mt-2">
                  Voltar ao login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Recuperar acesso</h2>
              <p className="text-sm text-gray-500 mb-6">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">E-mail</label>
                  <Input
                    type="email"
                    placeholder="parceiro@empresa.com.br"
                    {...register("email")}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
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
                    <><Loader2 size={15} className="animate-spin mr-2" />Enviando…</>
                  ) : (
                    "Enviar link de redefinição"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                >
                  <ArrowLeft size={13} />Voltar ao login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
