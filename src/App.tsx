import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HadithNode } from "./types";
import { hydrateCollection } from "./data/hydration";
import { COLLECTIONS, PAGE_SIZE, SEARCH_DEBOUNCE_MS } from "./data/constants";
import { SettingsProvider, useSettings } from "./state/SettingsContext";
import { LibraryProvider } from "./state/LibraryContext";
import { useViewTracker } from "./hooks/useViewTracker";
import { Header } from "./components/Header";
import { SideMenu, type ViewKey } from "./components/SideMenu";
import { HomeView } from "./components/HomeView";
import { HadithCard } from "./components/HadithCard";
import { ReaderModal } from "./components/ReaderModal";
import { SettingsPanel } from "./components/SettingsPanel";
import { LibraryView } from "./components/LibraryView";
import { HistoryView } from "./components/HistoryView";
import { CollectionGlyph } from "./components/icons";

function AppShell() {
  const { langCodes, layoutMode } = useSettings();

  const [view, setView] = useState<ViewKey>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [collectionKey, setCollectionKey] = useState("bukhari");
  const [nodes, setNodes] = useState<HadithNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [readerNode, setReaderNode] = useState<HadithNode | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<number | null>(null);

  // Debounce search input.
  useEffect(() => {
    const t = setTimeout(() => setQuery(rawQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [rawQuery]);

  // Parallel hydration pipe: Arabic + all active translations concurrently.
  const loadCollection = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSectionFilter(null);
    setVisibleCount(PAGE_SIZE);
    try {
      const result = await hydrateCollection(collectionKey, langCodes);
      setNodes(result.nodes);
      setOfflineMode(result.offline);
    } catch (err) {
      setNodes([]);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch data streams from CDN.",
      );
    } finally {
      setLoading(false);
    }
  }, [collectionKey, langCodes]);

  // Hydrate whenever collection or translations change, and whenever the
  // browse view becomes visible so entering from Home is instant.
  useEffect(() => {
    if (view !== "browse") return;
    if (nodes.length === 0) void loadCollection();
  }, [view, nodes.length, loadCollection]);

  // Re-hydrate when the active language set changes while browsing.
  const langsKey = langCodes.join(",");
  const lastLangsRef = useRef(langsKey);
  useEffect(() => {
    if (view !== "browse") {
      lastLangsRef.current = langsKey;
      return;
    }
    if (lastLangsRef.current !== langsKey) {
      lastLangsRef.current = langsKey;
      void loadCollection();
    }
  }, [langsKey, view, loadCollection]);

  // Deep-link support: ?hadith=<id> opens the focused reader after hydration,
  // switching collections when the shared id belongs to another book.
  const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get("hadith"),
  );
  useEffect(() => {
    if (!pendingDeepLink || loading || error) return;
    const prefix = pendingDeepLink.split("-")[0];
    const targetCollection = COLLECTIONS.find((c) => c.key === prefix)?.key;
    if (targetCollection && targetCollection !== collectionKey) {
      setCollectionKey(targetCollection);
      setView("browse");
      return;
    }
    const node = nodes.find((n) => n.id === pendingDeepLink);
    if (node) {
      setReaderNode(node);
      setPendingDeepLink(null);
      const url = new URL(window.location.href);
      url.searchParams.delete("hadith");
      window.history.replaceState({}, "", url.pathname + url.search);
    } else if (!targetCollection) {
      setPendingDeepLink(null);
    }
  }, [pendingDeepLink, loading, error, nodes, collectionKey]);

  // Filtered deck (deep client-side search runs against local memory).
  const filtered = useMemo(() => {
    let list = nodes;
    if (sectionFilter !== null) {
      list = list.filter((n) => n.sectionId === sectionFilter);
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (n) =>
          n.translatedText.toLowerCase().includes(q) ||
          n.sectionName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [nodes, query, sectionFilter]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  useViewTracker(visible);

  const selectCollection = (key: string) => {
    setView("browse");
    if (key !== collectionKey) setCollectionKey(key);
  };

  const selectView = (v: ViewKey) => {
    setView(v);
    if (v !== "browse") setMenuOpen(false);
  };

  const quickSearch = (q: string) => {
    setRawQuery(q);
    setView("browse");
    setMenuOpen(false);
  };

  // Quick Read: a hadith number opens the reader directly; empty opens the
  // whole book stream. Waits for hydration when needed.
  const [quickReadTarget, setQuickReadTarget] = useState<string | null>(null);
  const quickRead = (book: string, hadithNo: string) => {
    setView("browse");
    if (book !== collectionKey) setCollectionKey(book);
    setQuickReadTarget(hadithNo ? `${book}-${hadithNo}` : null);
  };
  useEffect(() => {
    if (!quickReadTarget || loading || error) return;
    const node = nodes.find((n) => n.id === quickReadTarget);
    if (node) {
      setReaderNode(node);
      setQuickReadTarget(null);
    }
  }, [quickReadTarget, loading, error, nodes]);

  const sections = useMemo(() => {
    const map = new Map<number, string>();
    nodes.forEach((n) => {
      if (!map.has(n.sectionId)) map.set(n.sectionId, n.sectionName);
    });
    return [...map.entries()].slice(0, 24);
  }, [nodes]);

  const collection = COLLECTIONS.find((c) => c.key === collectionKey);

  return (
    <div className="min-h-screen">
      <Header
        searchQuery={rawQuery}
        onSearch={(q) => {
          setRawQuery(q);
          if (view === "home") setView("browse");
        }}
        onToggleSettings={() => setSettingsOpen(true)}
        onToggleMenu={() => setMenuOpen(true)}
        menuOpen={menuOpen}
      />

      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeView={view}
        onSelectView={selectView}
        activeCollection={collectionKey}
        onSelectCollection={selectCollection}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <main id="main-content" className="flex flex-col gap-6">
          {view === "home" && (
            <HomeView
              onQuickSearch={quickSearch}
              onOpenReader={setReaderNode}
              onQuickRead={quickRead}
            />
          )}

          {view === "browse" && (
            <>
              {/* Control bar */}
              <section className="panel flex flex-wrap items-center gap-3 p-4">
                <button
                  onClick={() => setView("home")}
                  className="btn-ghost text-xs text-gold"
                >
                  Home
                </button>
                <span className="flex items-center gap-2 text-sm font-semibold text-parchment">
                  {collection && <CollectionGlyph glyph={collection.glyph} size="sm" />}
                  {collection?.name}
                </span>
                <span className="text-xs text-stone-mid">
                  {nodes.length.toLocaleString()} narrations loaded
                  {offlineMode && " · offline cache"}
                </span>
                {sectionFilter !== null && (
                  <button
                    onClick={() => setSectionFilter(null)}
                    className="btn-ghost text-xs text-gold"
                  >
                    Clear section filter
                  </button>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <select
                    value={sectionFilter ?? ""}
                    onChange={(e) =>
                      setSectionFilter(e.target.value === "" ? null : Number(e.target.value))
                    }
                    className="input-plain max-w-[220px] py-1.5 text-xs"
                    aria-label="Filter by book section"
                  >
                    <option value="">All sections…</option>
                    {sections.map(([id, name]) => (
                      <option key={id} value={id}>
                        {id}. {name || "General"}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Cards stream */}
              <section
                id="hadith-cards-container"
                aria-label="Hadith cards"
                className={
                  layoutMode === "split"
                    ? "grid gap-6 xl:grid-cols-2"
                    : "flex flex-col gap-6"
                }
              >
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="panel flex h-48 flex-col justify-between p-5"
                      aria-hidden="true"
                    >
                      <div className="flex gap-2">
                        <span className="h-4 w-20 bg-white/5" />
                        <span className="h-4 w-14 bg-white/5" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-white/5" />
                        <div className="h-4 w-11/12 bg-white/5" />
                        <div className="h-4 w-2/3 bg-white/5" />
                      </div>
                      <div className="h-4 w-24 bg-white/5" />
                    </div>
                  ))}

                {!loading && error && (
                  <div className="panel border-crimson/40 p-8 text-center">
                    <p className="text-lg font-semibold text-crimson">
                      Could not load this collection
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-stone-mid">
                      {error}. The CDN may be unreachable. Retry, or switch
                      collection; cached editions remain readable offline.
                    </p>
                    <button
                      onClick={() => void loadCollection()}
                      className="mt-4 border border-gold bg-gold-faint px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold-muted"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!loading &&
                  !error &&
                  visible.map((node, i) => (
                    <HadithCard
                      key={node.id}
                      node={node}
                      searchQuery={query}
                      onOpenReader={setReaderNode}
                      index={i}
                    />
                  ))}
              </section>

              {!loading && !error && visible.length < filtered.length && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="border border-gold-muted bg-ink-panel px-6 py-2.5 text-sm font-medium text-gold transition-colors duration-200 hover:border-gold"
                  >
                    Load {Math.min(PAGE_SIZE, filtered.length - visible.length)} more
                    narrations
                  </button>
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="panel p-10 text-center">
                  <p className="text-lg font-semibold text-parchment">
                    No matches in the local index
                  </p>
                  <p className="mt-2 text-sm text-stone-mid">
                    {query
                      ? `Nothing found for “${query}”. Try a shorter keyword.`
                      : "This section filter returned an empty set."}
                  </p>
                </div>
              )}
            </>
          )}

          {view === "library" && <LibraryView onOpenReader={setReaderNode} />}

          {view === "history" && <HistoryView />}
        </main>
      </div>

      <footer className="mx-auto max-w-[1600px] px-4 pb-10 pt-4 text-center text-xs text-stone-mid/60 sm:px-6">
        Al-Muhaddith · data from the open fawazahmed0/hadith-api CDN ·
        bookmarks, playlists, views & history stored privately in your
        browser.
      </footer>

      <ReaderModal node={readerNode} onClose={() => setReaderNode(null)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <LibraryProvider>
        <AppShell />
      </LibraryProvider>
    </SettingsProvider>
  );
}
