import { useState } from "react";
import { useLibrary } from "../state/LibraryContext";
import type { HadithNode } from "../types";
import { COLLECTIONS } from "../data/constants";
import { HighlightedText } from "./HighlightedText";
import { GradeBadge } from "./GradeBadge";
import { CollectionGlyph } from "./icons";

/** Persistent Bookmarks & Grouped Playlists manager. */
export function LibraryView({
  onOpenReader,
}: {
  onOpenReader: (node: HadithNode) => void;
}) {
  const {
    bookmarks,
    playlists,
    views,
    createPlaylist,
    deletePlaylistById,
    removeFromPlaylist,
    toggleBookmark,
  } = useLibrary();
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [openPlaylistId, setOpenPlaylistId] = useState<string | null>(null);

  const bookmarkList = [...bookmarks.values()].sort(
    (a, b) => b.savedAt - a.savedAt,
  );

  const handleCreate = async () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    await createPlaylist(name);
    setNewPlaylistName("");
  };

  const openPlaylist = playlists.find((p) => p.id === openPlaylistId) ?? null;

  return (
    <div className="space-y-8">
      <section className="panel p-6" aria-label="Bookmarked narrations">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
          Bookmarked Narrations
          <span className="ml-2 text-sm font-normal tracking-normal text-stone-mid">
            ({bookmarkList.length})
          </span>
        </h2>

        {bookmarkList.length === 0 ? (
          <p className="mt-4 border border-dashed border-hairline p-6 text-center text-sm text-stone-mid">
            Nothing saved yet. Tap the bookmark on any narration to keep it
            here, stored locally and always available offline.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bookmarkList.map((bm) => (
              <li key={bm.id} className="border border-hairline bg-ink-sunken p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <CollectionGlyph
                        glyph={
                          COLLECTIONS.find((c) => c.key === bm.collectionKey)
                            ?.glyph ?? "ح"
                        }
                        size="sm"
                      />
                      <span className="border border-gold-muted bg-gold-faint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
                        {bm.collectionKey} · {bm.hadithNumber}
                      </span>
                      {bm.node?.grades?.slice(0, 1).map((g, i) => (
                        <GradeBadge key={i} grade={g} />
                      ))}
                      <span className="text-[11px] text-stone-mid">
                        {views.get(bm.id) ?? 0} views
                      </span>
                    </div>
                    <p className="truncate text-sm text-stone-mid">
                      {bm.snippet}
                    </p>
                    {bm.node?.arabicText && (
                      <p className="arabic-text mt-2 text-[1.15rem] leading-loose opacity-80">
                        {bm.node.arabicText}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {bm.node && (
                      <button
                        onClick={() => onOpenReader(bm.node!)}
                        className="btn-ghost text-xs text-gold"
                      >
                        Read
                      </button>
                    )}
                    <button
                      onClick={() =>
                        void toggleBookmark(
                          bm.node ?? {
                            id: bm.id,
                            hadithNumber: bm.hadithNumber,
                            arabicText: "",
                            translatedText: bm.snippet,
                            collection: bm.collectionKey,
                            sectionId: 0,
                            sectionName: "",
                            bookTitle: "",
                            grades: [],
                          },
                        )
                      }
                      className="btn-ghost text-xs text-crimson"
                      title="Remove bookmark"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel p-6" aria-label="Playlists">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
          Grouped Playlists
        </h2>
        <div className="mt-4 flex gap-2">
          <input
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
            placeholder="New playlist name (e.g. Ramadan Prep, Forty Nawawi)…"
            className="input-plain flex-1"
            aria-label="New playlist name"
          />
          <button
            onClick={() => void handleCreate()}
            className="border border-gold bg-gold-faint px-4 py-2 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold-muted"
          >
            Create
          </button>
        </div>

        {playlists.length === 0 ? (
          <p className="mt-4 border border-dashed border-hairline p-6 text-center text-sm text-stone-mid">
            Group narrations into named collections: study circles, khutbah
            prep, personal themes.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {playlists.map((pl) => (
              <li key={pl.id} className="border border-hairline bg-ink-sunken">
                <div className="flex items-center justify-between gap-3 p-4">
                  <button
                    onClick={() =>
                      setOpenPlaylistId(openPlaylistId === pl.id ? null : pl.id)
                    }
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span className="text-gold">
                      {openPlaylistId === pl.id ? "▾" : "▸"}
                    </span>
                    <span className="font-medium text-parchment">{pl.name}</span>
                    <span className="bg-gold-faint px-2 py-0.5 text-[10px] font-semibold text-gold">
                      {pl.hadithIds.length}
                    </span>
                  </button>
                  <button
                    onClick={() => void deletePlaylistById(pl.id)}
                    className="btn-ghost text-xs text-crimson"
                  >
                    Delete
                  </button>
                </div>

                {openPlaylistId === pl.id && (
                  <div className="border-t border-hairline p-4">
                    {openPlaylist?.hadithIds.length ? (
                      <ul className="space-y-2">
                        {openPlaylist.hadithIds.map((hid) => {
                          const bm = bookmarks.get(hid);
                          return (
                            <li
                              key={hid}
                              className="flex items-center justify-between gap-3 bg-black/20 px-3 py-2"
                            >
                              <span className="min-w-0 flex-1 truncate text-sm text-stone-mid">
                                <HighlightedText
                                  text={bm?.snippet ?? hid}
                                  query=""
                                />
                              </span>
                              <button
                                onClick={() =>
                                  void removeFromPlaylist(pl.id, hid)
                                }
                                className="btn-ghost text-xs text-crimson"
                              >
                                Remove
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-stone-mid">
                        Empty. Add narrations via the “Playlist” button on any
                        card.
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
