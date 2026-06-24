"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMe, type PartnerResponse } from "@/lib/api";

type AuthCtx = {
  partner: PartnerResponse | null;
  token: string | null;
  setAuth: (token: string, partner: PartnerResponse) => void;
  setPartner: (partner: PartnerResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx>({
  partner: null,
  token: null,
  setAuth: () => {},
  setPartner: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [partner, setPartner] = useState<PartnerResponse | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("wecare_token");
    if (stored) {
      setToken(stored);
      getMe()
        .then((p) => setPartner(p))
        .catch(() => {
          localStorage.removeItem("wecare_token");
          localStorage.removeItem("wecare_partner_id");
        })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const publicPaths = ["/login", "/forgot-password", "/reset-password", "/indicar", "/cadastro-parceiro"];
    const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith("/indicar") || pathname.startsWith("/cadastro-parceiro"));
    if (!token && !isPublic) { router.replace("/login"); return; }
    if (token && partner?.must_change_password && pathname !== "/change-password") {
      router.replace("/change-password");
      return;
    }
    if (token && isPublic && pathname !== "/indicar") router.replace("/dashboard");
  }, [ready, token, partner, pathname, router]);

  const setAuth = useCallback((t: string, p: PartnerResponse) => {
    localStorage.setItem("wecare_token", t);
    localStorage.setItem("wecare_partner_id", String(p.id));
    setToken(t);
    setPartner(p);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("wecare_token");
    localStorage.removeItem("wecare_partner_id");
    setToken(null);
    setPartner(null);
    router.replace("/login");
  }, [router]);

  const updatePartnerInCtx = useCallback((p: PartnerResponse) => setPartner(p), []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E55A4F] border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ partner, token, setAuth, setPartner: updatePartnerInCtx, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
