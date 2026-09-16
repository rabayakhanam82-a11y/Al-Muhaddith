import { useRef, useState } from "react";
import type { HadithNode } from "../types";
import { useLibrary } from "../state/LibraryContext";
import { HighlightedText } from "./HighlightedText";
import { GradeBadge, GraderBadge } from "./GradeBadge";
import { CollectionGlyph } from "./icons";
import { COLLECTIONS } from "../data/constants";

interface HadithCardProps {
  node: HadithNode;
  searchQuery: string;
  onOpenReader?: (node: HadithNode) => void;
  index?: number;
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

  const cardContent = (
    <>
      {/* Meta tray */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="border border-gold-muted bg-gold-faint px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold">
          No. {node.hadithNumber}
        </span>
        <span className="hidden items-center gap-1.5 truncate text-xs text-stone-mid sm:flex">
          {collection && <CollectionGlyph glyph={collection.glyph} size="sm" />}
          {node.sectionName}
        </span>
        {node.grades.slice(0, 2).map((g, i) => (
          <GradeBadge key={i} grade={g} />
        ))}
        {node.grades.length > 2 && (
          <span className="text-[11px] text-stone-mid">
            +{node.grades.length - 2} more
          </span>
        )}
        {node.grades.length === 0 && (
          <span className="border border-gold-muted bg-gold-faint px-2 py-0.5 text-[11px] font-medium text-gold">
            Grade unspecified
          </span>
        )}
      </div>

      {/* Arabic block */}
      {node.arabicText && (
        <p className="arabic-text border-b border-hairline pb-4">
          {node.arabicText}
        </p>
      )}

      {/* Translation block */}
      <p className="translation-text">
        <HighlightedText text={node.translatedText} query={searchQuery} />
      </p>

      {/* Grades detail row */}
      {node.grades.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {node.grades.map((g, i) => (
            <GraderBadge key={i} grade={g} />
          ))}
        </div>
      )}

      {/* Action tray */}
      <div className="mt-1 flex items-center justify-between border-t border-hairline pt-3">
        <div className="flex items-center gap-1.5 text-xs text-stone-mid">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="view-counter">{viewCount} views</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => void toggleBookmark(node)}
            className={`action-btn ${isBookmarked ? "text-crimson" : ""}`}
            aria-pressed={isBookmarked}
            title={isBookmarked ? "Remove bookmark" : "Bookmark this narration"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span className="hidden sm:inline">Playlist</span>
            </button>

            {menuOpen && (
              <div className="panel absolute bottom-full right-0 z-20 mb-2 w-56 bg-ink-raised p-2">
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
                        className="flex w-full items-center justify-between px-2 py-1.5 text-left text-xs text-parchment transition-colors duration-200 hover:bg-hover-wash"
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="hidden sm:inline">Share</span>
            <span className="sr-only">Copy deep link to this hadith</span>
          </button>

          {onOpenReader && (
            <button
              onClick={() => onOpenReader(node)}
              className="action-btn text-gold"
              title="Open focused reader"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6" />
                <path d="M10 14L21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
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
