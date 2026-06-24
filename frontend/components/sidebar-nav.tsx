"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/providers";
import { getNotifications } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  LogOut,
  Copy,
  CheckCheck,
  UserPlus,
  UserCircle,
  Bell,
  FolderOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/dashboard",   label: "Dashboard",  icon: LayoutDashboard, adminOnly: false },
  { href: "/leads",       label: "Leads",      icon: Users,           adminOnly: false },
  { href: "/properties",  label: "Imóveis",    icon: Building2,       adminOnly: false },
  { href: "/commissions", label: "Comissões",  icon: DollarSign,      adminOnly: false },
  { href: "/materials",   label: "Materiais",  icon: FolderOpen,      adminOnly: false },
  { href: "/notifications", label: "Notificações", icon: Bell,         adminOnly: false },
  { href: "/partners",    label: "Parceiros",  icon: UserPlus,        adminOnly: true  },
  { href: "/profile",     label: "Meu perfil", icon: UserCircle,      adminOnly: false },
];

export function SidebarNav({ utmLink }: { utmLink?: string }) {
  const pathname = usePathname();
  const { partner, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await getNotifications(1);
        if (active) setUnreadCount(data.unread_count);
      } catch {
        // O menu não deve quebrar se o endpoint falhar
      }
    };
    void load();
    const timer = window.setInterval(load, 20000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  function copyLink() {
    if (!utmLink) return;
    navigator.clipboard.writeText(utmLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Image src="/logo.png" alt="WeCare" width={110} height={36} priority />
        <p className="text-gray-400 text-xs mt-1.5">Portal do Parceiro</p>
      </div>

      {/* Partner info */}
      {partner && (
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Parceiro</p>
          <p className="text-gray-800 text-sm font-medium truncate">{partner.full_name}</p>
          <p className="text-gray-400 text-xs truncate">{partner.email}</p>
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
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-[#E55A4F]/10 text-[#E55A4F]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <Icon size={16} />
              {label}
              {href === "/notifications" && unreadCount > 0 && (
                <Badge className="ml-auto bg-[#E55A4F] hover:bg-[#E55A4F]">{unreadCount}</Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* UTM link copy */}
      {utmLink && (
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Meu link de indicação</p>
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg px-3 py-2 text-left"
          >
            {copied ? (
              <CheckCheck size={14} className="text-[#E55A4F] shrink-0" />
            ) : (
              <Copy size={14} className="text-gray-400 shrink-0" />
            )}
            <span className="text-gray-500 text-xs truncate">
              {copied ? "Copiado!" : utmLink.replace("https://", "")}
            </span>
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
