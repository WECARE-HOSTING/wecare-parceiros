"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "@/app/providers";
import { SidebarNav } from "@/components/sidebar-nav";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { partner } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <SidebarNav
        utmLink={partner?.referral_url}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted min-h-10 min-w-10 flex items-center justify-center"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <span className="text-base font-semibold text-foreground">Portal do Parceiro</span>
        </header>

        <main className="flex-1 overflow-auto w-full">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
