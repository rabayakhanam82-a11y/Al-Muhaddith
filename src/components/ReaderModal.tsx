import { useEffect } from "react";
import type { HadithNode } from "../types";
import { useSettings } from "../state/SettingsContext";
import { useLibrary } from "../state/LibraryContext";
import { GradeBadge } from "./GradeBadge";
import { BookmarkFilledIcon, BookmarkIcon, CollectionGlyph, XIcon } from "./icons";
import { COLLECTIONS, LANGUAGE_LABELS } from "../data/constants";

/** Focused reader: typography controls apply live via CSS variable scales. */
export function ReaderModal({
  node,
  onClose,
}: {
  node: HadithNode | null;
  onClose: () => void;
}) {
  const { layoutMode, setLayoutMode } = useSettings();
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

  const translationList = (() => {
    const usable = node.translations.filter((t) => t.text.trim());
    if (usable.length > 0) return usable;
    return node.translatedText.trim()
      ? [{ langCode: "", text: node.translatedText }]
      : [];
  })();

    const translationBlock = (text: string, langCode?: string, idx: number = 0) => {
    const isGold = !langCode || langCode === "eng" || idx === 0;
    const borderClass = isGold
      ? "translation-card-gold"
      : langCode === "ben"
      ? "translation-card-emerald"
      : "translation-card-teal";
    const langLabel =
      langCode === "eng"
        ? "ENGLISH TRANSLATION"
        : langCode === "ben"
        ? "BENGALI - ABU BAKR ZAKARIA"
        : langCode
        ? `${(LANGUAGE_LABELS[langCode] ?? langCode).toUpperCase()} TRANSLATION`
        : "TRANSLATION";

    return (
      <div className={borderClass}>
        <div className="translation-header-title">
          <span>{langLabel}</span>
        </div>
        <p className="translation-body-text">{text}</p>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Hadith reader"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="panel relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-hairline bg-ink-raised shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <div className="flex items-center gap-2">
            {collection && <CollectionGlyph glyph={collection.glyph} size="sm" />}
            <span className="text-sm font-semibold text-parchment">
              {collection?.name} · No. {node.hadithNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLayoutMode(split ? "stacked" : "split")}
              className="btn-ghost hidden text-xs sm:inline-flex"
              title="Toggle reading orientation"
            >
              {split ? "Stacked view" : "Side-by-side view"}
            </button>
            <button
              onClick={() => void toggleBookmark(node)}
              className={`btn-ghost ${isBookmarked ? "text-crimson" : ""}`}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this hadith"}
            >
              {isBookmarked ? <BookmarkFilledIcon /> : <BookmarkIcon size={16} />}
            </button>
            <button
              onClick={onClose}
              className="btn-ghost"
              aria-label="Close reader"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-stone-mid">{node.sectionName}</span>
            {node.grades
              .filter((g) => /[a-z]/i.test(g.grade ?? ""))
              .map((g, i) => (
                <GradeBadge key={i} grade={g} />
              ))}
          </div>

          {split ? (
            <div className="grid gap-8 md:grid-cols-2">
              <div className="order-2 border-t border-hairline pt-6 md:order-1 md:border-t-0 md:pt-0">
                <div className="space-y-4">
                  {translationList.map((t, i) => (
                    <div key={t.langCode}>
                      {translationBlock(t.text, t.langCode, i)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 md:order-2 md:border-l md:border-hairline md:pl-8">
                <p className="arabic-text">{node.arabicText}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {node.arabicText && (
                <p className="arabic-text border-b border-hairline pb-6">
                  {node.arabicText}
                </p>
              )}
              <div className="space-y-4">
                {translationList.map((t, i) => (
                  <div key={t.langCode}>
                    {translationBlock(t.text, t.langCode, i)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
