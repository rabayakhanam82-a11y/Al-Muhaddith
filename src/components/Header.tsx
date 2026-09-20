import { useEffect, useState } from "react";
import { SearchIcon, SettingsIcon, MenuIcon } from "./icons";

import logoSvg from "../assets/logo.svg?raw";

const logoDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg)}`;

function Logomark() {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gold/30 bg-ink-raised/90 p-0 shadow-[0_2px_12px_rgba(214,187,105,0.18)] ring-1 ring-gold/10 transition-transform duration-200 hover:scale-105">
      <img
        src={logoDataUri}
        alt="Al-Muhaddith Emblem"
        className="h-full w-full scale-[1.04] object-contain filter drop-shadow"
      />
    </div>
  );
}

export function Header({
  searchQuery,
  onSearch,
  onToggleSettings,
  onToggleMenu,
  menuOpen,
}: {
  searchQuery: string;
  onSearch: (q: string) => void;
  onToggleSettings: () => void;
  onToggleMenu: () => void;
  menuOpen: boolean;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink-base/95">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        {/* Hamburger: three-line menu button, opens the sliding left drawer */}
        <button
          onClick={onToggleMenu}
          className="btn-ghost border border-hairline"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          title="Menu"
        >
          <MenuIcon />
        </button>

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink-raised focus:px-4 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>

        <div className="flex items-center gap-2.5">
          <Logomark />
          <div className="hidden leading-tight sm:block">
            <p className="font-semibold tracking-[0.04em] text-parchment">
              Al-Muhaddith
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
              The living library
            </p>
          </div>
        </div>

        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-mid">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search narrations across the open collection…"
            aria-label="Search hadith collection"
            className="input-plain pl-10"
          />
        </div>

        {deferredPrompt && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 rounded-lg border border-gold bg-gold-faint px-3 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold hover:text-ink"
            title="Install app on device"
          >
            <span>Install</span>
          </button>
        )}

        <button
          onClick={onToggleSettings}
          className="btn-ghost"
          title="Reader settings"
          aria-label="Open reader settings"
        >
          <SettingsIcon />
          <span className="hidden md:inline">Settings</span>
        </button>
      </div>
    </header>
  );
}
