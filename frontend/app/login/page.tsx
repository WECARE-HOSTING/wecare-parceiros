"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers";
import { login, getMe } from "@/lib/api";
import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem("wecare_token", res.access_token);
      const me = await getMe();
      setAuth(res.access_token, me);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F2EAD9] font-[family-name:var(--font-inter)]">
      <PublicHeader rightLink={{ href: "/cadastro-parceiro", label: "Quero ser parceiro" }} />

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-[#0C2330] rounded-2xl shadow-lg border border-[#B79152]/30 overflow-hidden">
            <div className="px-8 pt-8 pb-2 text-center">
              <h2 className="text-xl font-semibold text-[#F2EAD9] font-[family-name:var(--font-spectral)]">
                Portal do Parceiro
              </h2>
              <p className="text-sm text-[#F2EAD9]/60 mt-1">Entrar na sua conta</p>
            </div>

            <div className="bg-[#F2EAD9] m-4 mt-2 rounded-xl p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-[#0C2330]">E-mail</label>
                  <Input
                    type="email"
                    placeholder="parceiro@empresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="border-[#B79152]/30 bg-white text-[#0C2330] focus-visible:ring-[#B79152]/40 focus-visible:border-[#B79152]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#0C2330]">Senha</label>
                    <Link href="/forgot-password" className="text-xs text-[#B79152] hover:underline">
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="border-[#B79152]/30 bg-white text-[#0C2330] focus-visible:ring-[#B79152]/40 focus-visible:border-[#B79152]"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#B79152] hover:bg-[#B79152]/90 text-[#0C2330] font-semibold"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </div>
          </div>

          <p className="text-center text-sm text-[#0C2330]/70 mt-6">
            Ainda não é parceiro?{" "}
            <Link href="/cadastro-parceiro" className="text-[#B79152] hover:underline font-medium">
              Cadastre-se aqui
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
