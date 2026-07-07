type PublicHeaderProps = {
  rightLink?: { href: string; label: string };
};

export function PublicHeader({ rightLink: _rightLink }: PublicHeaderProps) {
  return (
    <header className="bg-[#0C2330] px-4 md:px-8 py-4 border-b border-[#B79152]/30">
      <div className="max-w-2xl mx-auto flex items-center justify-center">
        <span className="font-[family-name:var(--font-spectral)] text-xl font-semibold text-[#F2EAD9] tracking-tight">
          WeCare Hosting
        </span>
      </div>
    </header>
  );
}
