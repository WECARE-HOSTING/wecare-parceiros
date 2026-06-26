"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/providers";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  LogOut,
  Copy,
  CheckCheck,
  UserCircle,
  Kanban,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/admin/crm",   label: "CRM",        icon: Kanban,          adminOnly: true  },
  { href: "/leads",       label: "Leads",      icon: Users,           adminOnly: false },
  { href: "/commissions", label: "Comissões",  icon: DollarSign,      adminOnly: false },
  { href: "/dashboard",   label: "Dashboard",  icon: LayoutDashboard, adminOnly: false },
  { href: "/profile",     label: "Meu Perfil", icon: UserCircle,      adminOnly: false },
];

type SidebarNavProps = {
  utmLink?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function SidebarNav({ utmLink, mobileOpen = false, onMobileClose }: SidebarNavProps) {
  const pathname = usePathname();
  const { partner, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  function copyLink() {
    if (!utmLink) return;
    navigator.clipboard.writeText(utmLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleNavClick() {
    onMobileClose?.();
  }

  return (
    <aside
      className={cn(
        "w-60 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col shrink-0",
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Brand */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <Image src="/logo.png" alt="WeCare" width={110} height={36} priority />
        <p className="text-sidebar-foreground/60 text-xs mt-1.5">Portal do Parceiro</p>
      </div>

      {/* Partner info */}
      {partner && (
        <div className="px-4 py-4 border-b border-sidebar-border">
          <p className="text-sidebar-foreground/60 text-xs uppercase tracking-wider mb-1">Parceiro</p>
          <p className="text-sidebar-foreground text-sm font-medium truncate">{partner.full_name}</p>
          <p className="text-sidebar-foreground/60 text-xs truncate">{partner.email}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.filter(({ adminOnly }) => !adminOnly || partner?.is_admin).map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-wecare-navy"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon size={16} className={active ? "text-wecare-navy" : "text-sidebar-foreground/70"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* UTM link copy */}
      {utmLink && (
        <div className="px-4 py-4 border-t border-sidebar-border">
          <p className="text-sidebar-foreground/60 text-xs uppercase tracking-wider mb-2">Meu link de indicação</p>
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-2 bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors rounded-lg px-3 py-2 text-left"
          >
            {copied ? (
              <CheckCheck size={14} className="text-sidebar-primary shrink-0" />
            ) : (
              <Copy size={14} className="text-sidebar-foreground/60 shrink-0" />
            )}
            <span className="text-sidebar-foreground/70 text-xs truncate">
              {copied ? "Copiado!" : utmLink.replace("https://", "")}
            </span>
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
