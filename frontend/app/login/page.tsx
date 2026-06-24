"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers";
import { login, getMe } from "@/lib/api";
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
      // redirecionamento feito pelo providers
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="WeCare" width={140} height={46} priority className="mb-2" />
          <p className="text-sm text-gray-500">Portal do Parceiro</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <Input
                type="email"
                placeholder="parceiro@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Senha</label>
                <Link href="/forgot-password" className="text-xs text-[#E55A4F] hover:underline">
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
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#E55A4F] hover:bg-[#c44b43] text-white"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Ainda não é parceiro?{" "}
          <Link href="/cadastro-parceiro" className="text-[#E55A4F] hover:underline font-medium">
            Cadastre-se aqui
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          Dúvidas? Entre em contato com{" "}
          <a href="mailto:felipe@wecarehosting.com.br" className="underline">
            felipe@wecarehosting.com.br
          </a>
        </p>
      </div>
    </div>
  );
}
