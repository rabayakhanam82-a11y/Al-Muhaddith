import type { CollectionInfo } from "../types";
import { COLLECTIONS } from "../data/constants";
import { useLibrary } from "../state/LibraryContext";
import { CollectionGlyph, BookmarkIcon, HistoryIcon } from "./icons";

export type ViewKey = "browse" | "library" | "history";

export function Sidebar({
  activeCollection,
  onSelectCollection,
  activeView,
  onSelectView,
}: {
  activeCollection: string;
  onSelectCollection: (key: string) => void;
  activeView: ViewKey;
  onSelectView: (view: ViewKey) => void;
}) {
  const { bookmarks } = useLibrary();

  return (
    <aside className="panel flex h-fit flex-col gap-1 p-4 lg:sticky lg:top-20">
      <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-mid">
        Collections
      </p>

      {COLLECTIONS.map((c: CollectionInfo) => {
        const active = activeView === "browse" && activeCollection === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onSelectCollection(c.key)}
            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors duration-200 ${
              active
                ? "bg-hover-wash font-semibold text-parchment"
                : "text-stone-mid hover:bg-hover-wash hover:text-parchment"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <CollectionGlyph glyph={c.glyph} size="sm" />
            <span className="truncate">{c.name}</span>
            {active && <span className="ml-auto text-[10px] text-gold">●</span>}
          </button>
        );
      })}

      <div className="gold-rule my-3" />

      <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-mid">
        Library
      </p>

      <button
        onClick={() => onSelectView("library")}
        className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors duration-200 ${
          activeView === "library"
            ? "bg-hover-wash font-semibold text-parchment"
            : "text-stone-mid hover:bg-hover-wash hover:text-parchment"
        }`}
        aria-current={activeView === "library" ? "page" : undefined}
      >
        <BookmarkIcon />
        <span className="flex-1 truncate">Saved & Playlists</span>
        <span className="border border-hairline bg-ink-sunken px-1.5 py-0.5 text-[10px] font-semibold text-gold">
          {bookmarks.size}
        </span>
      </button>

      <button
        onClick={() => onSelectView("history")}
        className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors duration-200 ${
          activeView === "history"
            ? "bg-hover-wash font-semibold text-parchment"
            : "text-stone-mid hover:bg-hover-wash hover:text-parchment"
        }`}
        aria-current={activeView === "history" ? "page" : undefined}
      >
        <HistoryIcon />
        <span className="flex-1 truncate">History of Hadith</span>
      </button>

      <div className="mt-auto hidden px-2 pt-4 lg:block">
        <p className="text-[10px] leading-relaxed text-stone-mid/70">
          Data streamed from the fawazahmed0/hadith-api open CDN, cached
          locally in IndexedDB for offline reading.
        </p>
      </div>
    </aside>
  );
}
