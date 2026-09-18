import { useEffect, useState } from "react";
import {
  fetchEncCategoryHadiths,
  searchEncCategories,
  searchEncHadiths,
  type EncCategoryNode,
  type EncSearchHit,
} from "../data/hadeethenc";
import { SitemapIcon, ChevronDownIcon, SearchIcon } from "./icons";

/**
 * Topic search results (HadeethEnc layer). The category tree is the index of
 * this API, so topic suggestions render with priority above narration text
 * hits. Selecting a category drills into its narrations; selecting a
 * narration opens the Topic Reader, which links back to the app's own copy.
 */
export function TopicSearch({
  query,
  language,
  visible,
  onOpenHit,
}: {
  query: string;
  language: string;
  visible: boolean;
  onOpenHit: (encId: string) => void;
}) {
  const [categories, setCategories] = useState<EncCategoryNode[] | null>(null);
  const [hits, setHits] = useState<EncSearchHit[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [openCategory, setOpenCategory] = useState<EncCategoryNode | null>(null);
  const [categoryItems, setCategoryItems] = useState<EncSearchHit[] | null>(null);

  // Run whenever the query or language changes while the panel is visible.
  useEffect(() => {
    if (!visible) return;
    const q = query.trim();
    if (!q) {
      setCategories(null);
      setHits(null);
      setFailed(false);
      setOpenCategory(null);
      setCategoryItems(null);
      return;
    }
    let alive = true;
    setFailed(false);
    setOpenCategory(null);
    setCategoryItems(null);

    Promise.all([
      searchEncCategories(q, 6).catch(() => [] as EncCategoryNode[]),
      searchEncHadiths(q, language).catch(() => [] as EncSearchHit[]),
    ])
      .then(([cats, textHits]) => {
        if (!alive) return;
        setCategories(cats);
        setHits(textHits);
        setFailed(false);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [query, language, visible]);

  // Drilling into a category loads its narration list.
  useEffect(() => {
    if (!openCategory) return;
    let alive = true;
    setCategoryItems(null);
    fetchEncCategoryHadiths(openCategory.id, language, 24)
      .then((items) => {
        if (alive) setCategoryItems(items);
      })
      .catch(() => {
        if (alive) setCategoryItems([]);
      });
    return () => {
      alive = false;
    };
  }, [openCategory, language]);

  if (!visible) return null;

  const q = query.trim();

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
          <SitemapIcon size={14} />
          Encyclopedia topics
        </h2>
        <span className="text-[10px] text-stone-mid/70">HadeethEnc.com index</span>
      </div>

      {failed && (
        <p className="mt-4 text-sm text-stone-mid">
          The encyclopedia index is unreachable right now. Local search still
          works below.
        </p>
      )}

      {/* Category priority block */}
      {categories && categories.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-mid">
            Topics matching "{q}"
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setOpenCategory(c)}
                className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                  openCategory?.id === c.id
                    ? "border-gold bg-gold-faint text-gold"
                    : "border-hairline text-parchment hover:border-gold-muted"
                }`}
                title={c.isLeaf ? `${c.hadeeths_count} hadiths` : "Category with subtopics"}
              >
                {openCategory?.id === c.id ? <ChevronDownIcon size={12} /> : <SitemapIcon size={13} />}
                {c.title}
                <span className="text-[10px] text-stone-mid">({c.hadeeths_count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category drill-in */}
      {openCategory && (
        <div className="mt-4 border border-hairline bg-ink-sunken p-4">
          <p className="text-sm font-semibold text-parchment">
            {openCategory.title}
          </p>
          {categoryItems === null ? (
            <p className="mt-3 animate-soft-pulse text-xs text-stone-mid">
              Loading narrations in this topic…
            </p>
          ) : categoryItems.length === 0 ? (
            <p className="mt-3 text-xs text-stone-mid">
              No narrations listed under this topic.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {categoryItems.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => onOpenHit(h.id)}
                    className="w-full border-l-2 border-gold-muted pl-3 text-left text-sm text-stone-mid transition-colors duration-200 hover:border-gold hover:text-parchment"
                  >
                    <span className="line-clamp-2">{h.hadithText || h.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Narration text hits */}
      {hits && hits.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-mid">
            Narrations matching "{q}"
          </p>
          <ul className="space-y-2">
            {hits.slice(0, 8).map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => onOpenHit(h.id)}
                  className="w-full border-l-2 border-gold-muted pl-3 text-left text-sm text-stone-mid transition-colors duration-200 hover:border-gold hover:text-parchment"
                >
                  <span className="line-clamp-2">{h.hadithText || h.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(categories === null || hits === null) && (
        <p className="mt-4 flex items-center gap-2 text-sm text-stone-mid">
          <span className="opacity-60">
            <SearchIcon size={13} />
          </span>
          Searching the encyclopedia index…
        </p>
      )}
    </div>
  );
}
