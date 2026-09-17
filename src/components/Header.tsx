import { SearchIcon, SettingsIcon, MenuIcon } from "./icons";

/** Lantern-and-book mark: a compact symbol for guided reading and preservation. */
function Logomark() {
  return (
    <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true" className="al-muhaddith-mark">
      <defs>
        <linearGradient id="mark-gold" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f4df9a" />
          <stop offset="1" stopColor="#b88e3f" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="12" fill="#0b2419" stroke="rgba(214,187,105,.38)" />
      <path d="M20 6v3M15.5 8.5h9" stroke="url(#mark-gold)" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M13 12h14l-1.8 13.2a2.5 2.5 0 0 1-2.5 2.2h-3.4a2.5 2.5 0 0 1-2.5-2.2L15 12Z" fill="none" stroke="url(#mark-gold)" strokeWidth="1.5" />
      <path d="M16.5 15.5h7M16.8 19h6.4M17.2 22.5h5.6" stroke="#f4df9a" strokeWidth="1" strokeLinecap="round" opacity=".8" />
      <path d="M8.5 29.5c3.5-2.5 7-2.5 11.5.5 4.5-3 8-3 11.5-.5v3c-3.5-2.3-7-2.3-11.5.4-4.5-2.7-8-2.7-11.5-.4v-3Z" fill="url(#mark-gold)" opacity=".95" />
      <path d="M20 30v3" stroke="#0b2419" strokeWidth="1.2" />
    </svg>
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
