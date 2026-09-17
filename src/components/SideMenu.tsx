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
  SettingsIcon,
  XIcon,
} from "./icons";

export type ViewKey = "home" | "browse" | "library" | "history";

/**
 * Sliding left navigation drawer. Fixed overlay opened by the header's
 * hamburger button; slides in from the left.
 */
export function SideMenu({
  open,
  onClose,
  activeView,
  onSelectView,
  activeCollection,
  onSelectCollection,
  onOpenSettings,
}: {
  open: boolean;
  onClose: () => void;
  activeView: ViewKey;
  onSelectView: (view: ViewKey) => void;
  activeCollection: string;
  onSelectCollection: (key: string) => void;
  onOpenSettings?: () => void;
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
    `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200 ${
      active
        ? "bg-hover-wash font-semibold text-parchment shadow-sm"
        : "text-stone-mid hover:bg-hover-wash hover:text-parchment"
    }`;

  const collectionsOpen = activeView === "browse";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/75"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-full max-w-xs flex-col border-r border-hairline bg-ink-panel p-5 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-label="Navigation menu"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div className="flex items-center gap-2">
            <MenuIcon size={18} />
            <span className="text-sm font-semibold tracking-wide text-parchment">
              Al-Muhaddith
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            aria-label="Close menu"
          >
            <XIcon />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
          <button
            onClick={() => onSelectView("home")}
            className={navButton(activeView === "home")}
          >
            <HomeIcon />
            <span>Home</span>
          </button>

          <div>
            <button
              onClick={() => onSelectView("browse")}
              className={navButton(activeView === "browse")}
            >
              <CollectionGlyph glyph="ك" size="sm" />
              <span className="flex-1">Collections</span>
              <span
                className={`transition-transform duration-200 ${
                  collectionsOpen ? "rotate-180" : ""
                }`}
              >
                <ChevronDownIcon />
              </span>
            </button>

            {collectionsOpen && (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-hairline pl-2">
                {COLLECTIONS.map((c) => {
                  const active = c.key === activeCollection;
                  return (
                    <button
                      key={c.key}
                      onClick={() => onSelectCollection(c.key)}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors duration-200 ${
                        active
                          ? "bg-gold-faint font-semibold text-gold"
                          : "text-stone-mid hover:text-parchment"
                      }`}
                    >
                      <CollectionGlyph glyph={c.glyph} size="sm" />
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => onSelectView("library")}
            className={navButton(activeView === "library")}
          >
            <BookmarkIcon />
            <span className="flex-1">Library</span>
            {bookmarks.size > 0 && (
              <span className="rounded-full bg-gold-faint px-2 py-0.5 text-[10px] font-semibold text-gold">
                {bookmarks.size}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectView("history")}
            className={navButton(activeView === "history")}
          >
            <HistoryIcon />
            <span>Preservation History</span>
          </button>

          {/* Quick Settings option in Nav Menu */}
          <div className="pt-2">
            <div className="my-2 border-t border-hairline" />
            <button
              onClick={() => {
                onClose();
                onOpenSettings?.();
              }}
              className={navButton(false)}
              title="Reader settings"
            >
              <SettingsIcon />
              <span className="flex-1">Settings</span>
            </button>
          </div>
        
          <div className="pt-3">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gold/80">
              Preferences
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenSettings?.();
              }}
              className={navButton(false)}
              title="Reader settings"
            >
              <SettingsIcon size={16} />
              <span className="flex-1 font-medium">Settings</span>
            </button>
          </div>

        </nav>

        <div className="border-t border-hairline pt-3 text-[11px] leading-relaxed text-stone-mid/70">
          The Living Hadith Library · Open authentic corpus
        </div>
      </aside>
    </>
  );
}
