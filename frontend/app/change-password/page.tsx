"use client";
import Image from "next/image";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { changePassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChangePasswordPage() {
  const { partner, setPartner } = useAuth();
  const router = useRouter();
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (next !== confirm) { setError("As senhas não coincidem."); return; }
    if (next.length < 6) { setError("A nova senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      await changePassword(next);
      if (partner) setPartner({ ...partner, must_change_password: false });
      router.replace("/leads");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao alterar senha.");
    } finally {
      setLoading(false);
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
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Crie sua senha</h2>
          <p className="text-sm text-gray-500 mb-6">
            Este é seu primeiro acesso. Defina uma senha pessoal para continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nova senha</label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Confirmar nova senha</label>
              <Input
                type="password"
                placeholder="Repita a nova senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              {loading ? "Salvando..." : "Definir senha e entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
