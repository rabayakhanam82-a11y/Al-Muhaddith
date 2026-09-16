import { useEffect } from "react";
import type { HadithNode } from "../types";
import { useSettings } from "../state/SettingsContext";
import { useLibrary } from "../state/LibraryContext";
import { GradeBadge } from "./GradeBadge";
import { CollectionGlyph, XIcon } from "./icons";
import { COLLECTIONS } from "../data/constants";

/** Focused reader: typography controls apply live via CSS variable scales. */
export function ReaderModal({
  node,
  onClose,
}: {
  node: HadithNode | null;
  onClose: () => void;
}) {
  const { layoutMode, setLayoutMode, arabicScale, translationScale } =
    useSettings();
  const { toggleBookmark, bookmarks } = useLibrary();

  useEffect(() => {
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [node, onClose]);

  if (!node) return null;

  const collection = COLLECTIONS.find((c) => c.key === node.collection);
  const isBookmarked = bookmarks.has(node.id);
  const split = layoutMode === "split";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Focused hadith reader"
    >
      <div
        className="panel max-h-[88vh] w-full max-w-4xl overflow-y-auto bg-ink-panel p-6 sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
              Focused Reader
            </p>
            <h2 className="mt-2 flex items-center gap-2.5 text-lg font-semibold text-parchment">
              {collection && <CollectionGlyph glyph={collection.glyph} size="sm" />}
              {collection?.name} · No. {node.hadithNumber}
            </h2>
            <p className="text-xs text-stone-mid">{node.sectionName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setLayoutMode(split ? "stacked" : "split")
              }
              className="btn-ghost border border-gold-muted text-xs"
              title="Toggle stacked / split layout"
            >
              {split ? "Stacked" : "Split"}
            </button>
            <button
              onClick={() => void toggleBookmark(node)}
              className={`btn-ghost border border-gold-muted text-xs ${isBookmarked ? "text-crimson" : "text-gold"}`}
            >
              {isBookmarked ? "Saved" : "Save"}
            </button>
            <button
              onClick={onClose}
              className="btn-ghost border border-gold-muted text-xs"
              aria-label="Close reader"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {split ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border border-hairline bg-ink-sunken p-5">
              {node.arabicText ? (
                <p className="arabic-text">{node.arabicText}</p>
              ) : (
                <p className="text-sm text-stone-mid">
                  Arabic source unavailable for this node.
                </p>
              )}
            </div>
            <div className="border border-hairline bg-ink-sunken p-5">
              <p className="translation-text">{node.translatedText}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {node.arabicText && (
              <p className="arabic-text border-b border-hairline pb-5">
                {node.arabicText}
              </p>
            )}
            <p className="translation-text">{node.translatedText}</p>
          </div>
        )}

        {node.grades.length > 0 && (
          <div className="mt-8 border-t border-hairline pt-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-stone-mid">
              Scholastic grading
            </p>
            <div className="flex flex-wrap gap-2">
              {node.grades.map((g, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 border border-hairline bg-ink-sunken px-3 py-1 text-xs text-stone-mid"
                >
                  <GradeBadge grade={g} />
                  <span>{g.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-[11px] text-stone-mid/70">
          Typography scales: Arabic ×{arabicScale.toFixed(2)} · Translation
          ×{translationScale.toFixed(2)}. Adjust in Settings; changes apply
          instantly without refetching data.
        </p>
      </div>
    </div>
  );
}
