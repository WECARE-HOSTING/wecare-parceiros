"use client";

import { useAuth } from "@/app/providers";
import { SidebarNav } from "@/components/sidebar-nav";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { partner } = useAuth();

  return (
    <div className="flex min-h-screen">
      <SidebarNav utmLink={partner?.referral_url} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
