import { Search } from "./icons";

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
}: {
  searchQuery: string;
  onSearch: (q: string) => void;
  onToggleSettings: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink-base/95">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink-raised focus:px-4 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>

        <div className="flex items-center gap-2.5">
          <Logomark />
          <div className="hidden leading-tight sm:block">
            <p className="font-semibold tracking-wide text-parchment">
              Al-Muhaddith
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
              Studio Hadith Reader
            </p>
          </div>
        </div>

        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-mid">
            <Search />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search narrations across the open collection… (e.g. intention, charity)"
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="hidden md:inline">Settings</span>
        </button>
      </div>
    </header>
  );
}
