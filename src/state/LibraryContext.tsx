import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { HadithNode, Playlist } from "../types";
import {
  addBookmark,
  deletePlaylist,
  getAllBookmarks,
  getAllPlaylists,
  getAllViews,
  getRecentHistory,
  incrementView,
  putPlaylist,
  recordHistory,
  removeBookmark,
  type BookmarkRecord,
} from "../data/db";

/**
 * Persistent Bookmarks & Grouped Playlists + Global Reactive Auditing Engine.
 * All user state lives in IndexedDB and is mirrored into React state.
 */

export interface BookmarkWithNode extends BookmarkRecord {
  node: HadithNode | null;
}

interface LibraryContextValue {
  bookmarks: Map<string, BookmarkWithNode>;
  playlists: Playlist[];
  views: Map<string, number>;
  history: { id: string; visitedAt: number; collectionKey: string }[];
  toggleBookmark: (
    node: HadithNode,
  ) => Promise<void>;
  createPlaylist: (name: string) => Promise<Playlist>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylistById: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, hadithId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, hadithId: string) => Promise<void>;
  commitView: (node: HadithNode) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [bookmarkMap, setBookmarkMap] = useState<
    Map<string, BookmarkWithNode>
  >(new Map());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [views, setViews] = useState<Map<string, number>>(new Map());
  const [history, setHistory] = useState<
    { id: string; visitedAt: number; collectionKey: string }[]
  >([]);

  // Initial hydration from IndexedDB.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [bm, pls, vw, hist] = await Promise.all([
        getAllBookmarks(),
        getAllPlaylists(),
        getAllViews(),
        getRecentHistory(50),
      ]);
      if (cancelled) return;
      setBookmarkMap(
        new Map(
          bm.map((b) => [
            b.id,
            { ...b, node: null },
          ]),
        ),
      );
      setPlaylists(pls);
      setViews(new Map([...vw].map(([id, v]) => [id, v.views])));
      setHistory(
        hist.map((h) => ({
          id: h.id,
          visitedAt: h.visitedAt,
          collectionKey: h.collectionKey,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleBookmark = useCallback(async (node: HadithNode) => {
    const existing = await getAllBookmarks();
    const isSaved = existing.some((b) => b.id === node.id);
    if (isSaved) {
      await removeBookmark(node.id);
    } else {
      await addBookmark({
        id: node.id,
        savedAt: Date.now(),
        collectionKey: node.collection,
        hadithNumber: node.hadithNumber,
        snippet: node.translatedText.slice(0, 140),
        // hydrated node attached for offline rendering in the bookmarks view
        ...( { node } as object),
      } as BookmarkRecord & { node: HadithNode });
    }
    const refreshed = await getAllBookmarks();
    setBookmarkMap(
      new Map(
        refreshed.map((b) => [
          b.id,
          { ...b, node: (b as BookmarkRecord & { node?: HadithNode }).node ?? null },
        ]),
      ),
    );
  }, []);

  const createPlaylist = useCallback(async (name: string) => {
    const playlist: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      hadithIds: [],
      createdAt: Date.now(),
    };
    await putPlaylist(playlist);
    setPlaylists((prev) => [...prev, playlist]);
    return playlist;
  }, []);

  const renamePlaylist = useCallback(async (id: string, name: string) => {
    setPlaylists((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, name } : p));
      const updated = next.find((p) => p.id === id);
      if (updated) void putPlaylist(updated);
      return next;
    });
  }, []);

  const deletePlaylistById = useCallback(async (id: string) => {
    await deletePlaylist(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addToPlaylist = useCallback(
    async (playlistId: string, hadithId: string) => {
      setPlaylists((prev) => {
        const next = prev.map((p) =>
          p.id === playlistId && !p.hadithIds.includes(hadithId)
            ? { ...p, hadithIds: [...p.hadithIds, hadithId] }
            : p,
        );
        const updated = next.find((p) => p.id === playlistId);
        if (updated) void putPlaylist(updated);
        return next;
      });
    },
    [],
  );

  const removeFromPlaylist = useCallback(
    async (playlistId: string, hadithId: string) => {
      setPlaylists((prev) => {
        const next = prev.map((p) =>
          p.id === playlistId
            ? { ...p, hadithIds: p.hadithIds.filter((h) => h !== hadithId) }
            : p,
        );
        const updated = next.find((p) => p.id === playlistId);
        if (updated) void putPlaylist(updated);
        return next;
      });
    },
    [],
  );

  const commitView = useCallback(async (node: HadithNode) => {
    const count = await incrementView(node.id);
    setViews((prev) => new Map(prev).set(node.id, count));
    await recordHistory(node.id, node.collection);
    setHistory((prev) =>
      [
        { id: node.id, visitedAt: Date.now(), collectionKey: node.collection },
        ...prev.filter((h) => h.id !== node.id),
      ].slice(0, 50),
    );
  }, []);

  const value = useMemo(
    () => ({
      bookmarks: bookmarkMap,
      playlists,
      views,
      history,
      toggleBookmark,
      createPlaylist,
      renamePlaylist,
      deletePlaylistById,
      addToPlaylist,
      removeFromPlaylist,
      commitView,
    }),
    [
      bookmarkMap,
      playlists,
      views,
      history,
      toggleBookmark,
      createPlaylist,
      renamePlaylist,
      deletePlaylistById,
      addToPlaylist,
      removeFromPlaylist,
      commitView,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
