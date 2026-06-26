"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";
import { PublicHeader } from "@/components/public-header";
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
    <div className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
      <PublicHeader rightLink={{ href: "/cadastro-parceiro", label: "Quero ser parceiro" }} />

      <div className="flex items-center justify-center px-4 md:px-8 py-8 md:py-12">
        <div className="w-full max-w-md">
          <div className="bg-[#0C2330] rounded-2xl shadow-lg border border-[#B79152]/30 overflow-hidden">
            <div className="px-6 md:px-8 pt-8 pb-2 text-center">
              <h2 className="text-xl md:text-2xl font-semibold text-[#F2EAD9] font-[family-name:var(--font-spectral)]">
                Portal do Parceiro
              </h2>
              <p className="text-sm text-[#F2EAD9]/60 mt-1">
                {sent ? "E-mail enviado" : "Recuperar acesso"}
              </p>
            </div>

            <div className="bg-[#F2EAD9] m-4 mt-2 rounded-xl p-6 md:p-8">
              {sent ? (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0C2330]">E-mail enviado!</h3>
                  <p className="text-sm text-[#0C2330]/70">
                    Enviamos o link de redefinição para o seu e-mail.
                    Verifique também sua caixa de spam.
                  </p>
                  <Link href="/login">
                    <Button className="w-full mt-2 bg-[#B79152] hover:bg-[#B79152]/90 text-[#0C2330] font-semibold">
                      Voltar ao login
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#0C2330]/70 mb-6">
                    Informe seu e-mail e enviaremos um link para redefinir sua senha.
                  </p>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[#0C2330]">E-mail</label>
                      <Input
                        type="email"
                        placeholder="parceiro@empresa.com.br"
                        {...register("email")}
                        disabled={isSubmitting}
                        className="border-[#B79152]/30 bg-white text-[#0C2330] focus-visible:ring-[#B79152]/40 focus-visible:border-[#B79152]"
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
                      className="w-full min-h-10 bg-[#B79152] hover:bg-[#B79152]/90 text-[#0C2330] font-semibold text-base"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={15} className="animate-spin mr-2" />
                          Enviando…
                        </>
                      ) : (
                        "Enviar link de redefinição"
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-[#0C2330]/70 mt-6">
            <Link
              href="/login"
              className="text-[#B79152] hover:underline font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              Voltar ao login
            </Link>
          </p>

          <p className="text-center text-xs text-[#0C2330]/50 mt-4">
            Dúvidas? Entre em contato com{" "}
            <a href="mailto:contato@wecarehosting.com.br" className="underline text-[#B79152]">
              contato@wecarehosting.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
