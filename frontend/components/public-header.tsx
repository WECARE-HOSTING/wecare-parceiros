import Link from "next/link";

type PublicHeaderProps = {
  rightLink?: { href: string; label: string };
};

export function PublicHeader({ rightLink }: PublicHeaderProps) {
  return (
    <header className="bg-[#0C2330] px-4 md:px-8 py-4 border-b border-[#B79152]/30">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-[#F2EAD9] tracking-tight">
            WeCare Hosting
          </span>
          <span className="text-[#F2EAD9]/50 text-sm hidden sm:inline font-[family-name:var(--font-inter)]">
            Programa de Parceria
          </span>
        </div>
        {rightLink && (
          <Link
            href={rightLink.href}
            className="text-[#B79152] hover:text-[#F2EAD9] text-sm transition font-[family-name:var(--font-inter)]"
          >
            {rightLink.label}
          </Link>
        )}
      </div>
    </header>
  );
}
