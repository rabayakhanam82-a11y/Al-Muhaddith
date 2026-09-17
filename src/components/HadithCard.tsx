import { useRef, useState } from "react";
import type { HadithNode, TranslationText } from "../types";
import { useLibrary } from "../state/LibraryContext";
import { HighlightedText } from "./HighlightedText";
import { GradeBadge, GraderBadge } from "./GradeBadge";
import {
  BookmarkFilledIcon,
  BookmarkIcon,
  CollectionGlyph,
  ExternalLinkIcon,
  EyeIcon,
  FoldersIcon,
  LanguageIcon,
  LinkIcon,
} from "./icons";
import { COLLECTIONS, LANGUAGE_LABELS } from "../data/constants";

interface HadithCardProps {
  node: HadithNode;
  searchQuery: string;
  onOpenReader?: (node: HadithNode) => void;
  index?: number;
}

/** Grade strings without letters (e.g. "-", "?") are junk and hidden. */
function usableGrades(node: HadithNode) {
  return node.grades.filter((g) => /[a-z]/i.test(g.grade ?? ""));
}

/** Non-empty translation blocks, primary order preserved. */
function usableTranslations(node: HadithNode): TranslationText[] {
  return node.translations.filter((t) => t.text && t.text.trim().length > 0);
}

export function HadithCard({
  node,
  searchQuery,
  onOpenReader,
  index = 0,
}: HadithCardProps) {
  const { bookmarks, views, toggleBookmark, playlists, addToPlaylist, removeFromPlaylist } =
    useLibrary();
  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const collection = COLLECTIONS.find((c) => c.key === node.collection);
  const isBookmarked = bookmarks.has(node.id);
  const viewCount = views.get(node.id) ?? 0;

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?hadith=${encodeURIComponent(node.id)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard unavailable, non-fatal */
    }
  };

  const grades = usableGrades(node);
  const translations = usableTranslations(node);
  const hasArabic = Boolean(node.arabicText && node.arabicText.trim());
  const textMissing = !hasArabic && translations.length === 0;

  const cardContent = (
    <>
      {/* Meta tray */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-gold-muted bg-gold-faint px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gold shadow-sm">
          No. {node.hadithNumber}
        </span>
        <span className="hidden items-center gap-1.5 truncate text-xs text-stone-mid sm:flex">
          {collection && <CollectionGlyph glyph={collection.glyph} size="sm" />}
          {node.sectionName}
        </span>
        {translations.length > 1 && (
          <span
            className="inline-flex items-center gap-1 rounded-md border border-hairline bg-ink-sunken/60 px-2 py-0.5 text-[11px] text-stone-mid"
            title={translations.map((t) => LANGUAGE_LABELS[t.langCode] ?? t.langCode).join(", ")}
          >
            <LanguageIcon size={13} />
            {translations.length} languages
          </span>
        )}
        {grades.slice(0, 2).map((g, i) => (
          <GradeBadge key={i} grade={g} />
        ))}
        {grades.length > 2 && (
          <span className="rounded-md border border-hairline bg-ink-sunken/60 px-2 py-0.5 text-[11px] text-stone-mid">
            +{grades.length - 2} more
          </span>
        )}
      </div>

      {/* Arabic block */}
      {hasArabic && (
        <p className="arabic-text border-b border-hairline pb-4 pt-1">
          {node.arabicText}
        </p>
      )}

      {/* Translation blocks: one block per active language, primary first */}
      {translations.length > 0 ? (
        <div className="space-y-3.5">
          {translations.map((t) => (
            <div key={t.langCode}>
              {translations.length > 1 && (
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/80">
                  {LANGUAGE_LABELS[t.langCode] ?? t.langCode}
                </span>
              )}
              <p className="translation-text">
                <HighlightedText text={t.text} query={searchQuery} />
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="translation-text text-stone-mid/70">
          {textMissing
            ? "The text of this record is unavailable in the open edition. It remains listed here with its number and reference."
            : node.translatedText}
        </p>
      )}

      {/* Grades detail row */}
      {grades.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {grades.map((g, i) => (
            <GraderBadge key={i} grade={g} />
          ))}
        </div>
      )}

      {/* Action tray */}
      <div className="mt-2 flex items-center justify-between border-t border-hairline pt-3">
        <div className="flex items-center gap-1.5 text-xs text-stone-mid">
          <span className="opacity-70">
            <EyeIcon />
          </span>
          <span className="view-counter">{viewCount} views</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => void toggleBookmark(node)}
            className={`action-btn ${isBookmarked ? "text-crimson" : ""}`}
            aria-pressed={isBookmarked}
            title={isBookmarked ? "Remove bookmark" : "Bookmark this narration"}
          >
            {isBookmarked ? <BookmarkFilledIcon /> : <BookmarkIcon size={15} />}
            <span className="hidden sm:inline">
              {isBookmarked ? "Saved" : "Bookmark"}
            </span>
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="action-btn"
              title="Add to playlist"
            >
              <FoldersIcon />
              <span className="hidden sm:inline">Playlist</span>
            </button>

            {menuOpen && (
              <div className="panel absolute bottom-full right-0 z-20 mb-2 w-56 rounded-xl border border-hairline bg-ink-raised p-2 shadow-2xl backdrop-blur-md">
                <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-widest text-stone-mid">
                  Add to playlist
                </p>
                {playlists.length === 0 ? (
                  <p className="px-2 py-1.5 text-xs text-stone-mid">
                    No playlists yet. Create one in the Library view.
                  </p>
                ) : (
                  playlists.map((pl) => {
                    const inList = pl.hadithIds.includes(node.id);
                    return (
                      <button
                        key={pl.id}
                        onClick={() => {
                          if (inList) {
                            void removeFromPlaylist(pl.id, node.id);
                          } else {
                            void addToPlaylist(pl.id, node.id);
                          }
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-parchment transition-colors duration-200 hover:bg-hover-wash"
                      >
                        <span className="truncate">{pl.name}</span>
                        {inList && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-mint-sahih">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <button onClick={share} className="action-btn" title="Copy deep link">
            <LinkIcon />
            <span className="hidden sm:inline">Share</span>
            <span className="sr-only">Copy deep link to this hadith</span>
          </button>

          {onOpenReader && (
            <button
              onClick={() => onOpenReader(node)}
              className="action-btn text-gold hover:text-parchment"
              title="Open focused reader"
            >
              <ExternalLinkIcon />
              <span className="hidden sm:inline">Reader</span>
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <article
      ref={cardRef}
      data-id={node.id}
      data-hadith-card="true"
      className="panel hadith-card p-5 sm:p-6"
      style={{ animationDelay: `${Math.min(index * 30, 400)}ms` }}
    >
      {cardContent}
    </article>
  );
}
