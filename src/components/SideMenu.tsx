import { useEffect } from "react";
import { COLLECTIONS } from "../data/constants";
import { useLibrary } from "../state/LibraryContext";
import {
  BookmarkIcon,
  ChevronDownIcon,
  CollectionGlyph,
  HistoryIcon,
  HomeIcon,
  MenuIcon,
  XIcon,
} from "./icons";

export type ViewKey = "home" | "browse" | "library" | "history";

/**
 * Sliding left navigation drawer. Fixed overlay opened by the header's
 * hamburger (three-line menu) button; slides in from the left with an
 * overlay scrim. Navigation is color-only, with flat hairline panels.
 */
export function SideMenu({
  open,
  onClose,
  activeView,
  onSelectView,
  activeCollection,
  onSelectCollection,
}: {
  open: boolean;
  onClose: () => void;
  activeView: ViewKey;
  onSelectView: (view: ViewKey) => void;
  activeCollection: string;
  onSelectCollection: (key: string) => void;
}) {
  const { bookmarks } = useLibrary();

  // Close on Escape, lock scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const navButton = (active: boolean) =>
    `flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors duration-200 ${
      active
        ? "bg-hover-wash font-semibold text-parchment"
        : "text-stone-mid hover:bg-hover-wash hover:text-parchment"
    }`;

  const collectionsOpen = activeView === "browse";

  return (
    <>
      {/* Scrim */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-hairline bg-ink-panel transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal={open}
        aria-label="Navigation menu"
        aria-hidden={!open}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <span className="flex items-center gap-2.5">
            <span className="inline-grid h-8 w-8 place-items-center border border-hairline bg-ink-sunken text-gold">
              <MenuIcon size={16} />
            </span>
            <span className="text-sm font-semibold tracking-wide text-parchment">
              Menu
            </span>
          </span>
          <button onClick={onClose} className="btn-ghost" aria-label="Close menu">
            <XIcon />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-mid">
            Navigate
          </p>

          <button
            onClick={() => {
              onSelectView("home");
              onClose();
            }}
            className={navButton(activeView === "home")}
            aria-current={activeView === "home" ? "page" : undefined}
          >
            <HomeIcon />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              onSelectView("library");
              onClose();
            }}
            className={navButton(activeView === "library")}
            aria-current={activeView === "library" ? "page" : undefined}
          >
            <BookmarkIcon />
            <span className="flex-1 truncate">Saved & Playlists</span>
            <span className="border border-hairline bg-ink-sunken px-1.5 py-0.5 text-[10px] font-semibold text-gold">
              {bookmarks.size}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectView("history");
              onClose();
            }}
            className={navButton(activeView === "history")}
            aria-current={activeView === "history" ? "page" : undefined}
          >
            <HistoryIcon />
            <span>History of Hadith</span>
          </button>

          <div className="gold-rule my-4" />

          <button
            onClick={() => onSelectView("browse")}
            className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors duration-200 ${
              collectionsOpen ? "text-parchment" : "text-stone-mid hover:text-parchment"
            }`}
            aria-expanded={collectionsOpen}
          >
            <span className="flex items-center gap-2.5 font-semibold uppercase tracking-[0.2em] text-[10px]">
              Collections
            </span>
            <span
              className={`transition-transform duration-200 ${collectionsOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <ChevronDownIcon size={14} />
            </span>
            <span className="sr-only">Toggle collections list</span>
          </button>

          <div className="mt-1 space-y-0.5">
            {COLLECTIONS.map((c) => {
              const active = activeView === "browse" && activeCollection === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => {
                    onSelectCollection(c.key);
                    onClose();
                  }}
                  className={navButton(active)}
                  aria-current={active ? "page" : undefined}
                >
                  <CollectionGlyph glyph={c.glyph} size="sm" />
                  <span className="truncate">{c.name}</span>
                  {active && <span className="ml-auto text-[10px] text-gold">●</span>}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-hairline px-5 py-4">
          <p className="text-[10px] leading-relaxed text-stone-mid/70">
            Data streamed from the fawazahmed0/hadith-api open CDN, cached
            locally in IndexedDB for offline reading.
          </p>
        </div>
      </aside>
    </>
  );
}
