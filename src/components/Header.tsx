import { SearchIcon, SettingsIcon, MenuIcon } from "./icons";

/** Gold geometric logomark, matching the favicon. */
function Logomark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" fill="#101210" />
      <rect x="4" y="24" width="24" height="2.5" fill="#C2A145" />
      <path d="M16 6 L21 12 L16 22 L11 12 Z" fill="#C2A145" />
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
