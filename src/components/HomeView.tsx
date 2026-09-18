import { useState } from "react";
import type { HadithNode } from "../types";
import { COLLECTIONS, TRANSLATION_LANGUAGES } from "../data/constants";
import { ENC_QUICK_TOPICS } from "../data/hadeethenc";
import { useSettings } from "../state/SettingsContext";
import { useLibrary } from "../state/LibraryContext";
import { HadithOfTheDay } from "./HadithOfTheDay";
import { BookIcon, ChevronDownIcon, SearchIcon, SitemapIcon } from "./icons";

/**
 * Home screen: quick search for hadith, Hadith of the Day, and the Quick Read
 * selector (book, hadith number, active translations) that jumps straight
 * into the reader or the browse stream.
 */
export function HomeView({
  onQuickSearch,
  onOpenReader,
  onQuickRead,
  onQuickTopic,
}: {
  onQuickSearch: (query: string) => void;
  onOpenReader: (node: HadithNode) => void;
  onQuickRead: (book: string, hadithNo: string) => void;
  onQuickTopic: (label: string) => void;
}) {
  const { langCodes, toggleLangCode } = useSettings();
  const { history } = useLibrary();

  const [searchValue, setSearchValue] = useState("");
  const [book, setBook] = useState("bukhari");
  const [hadithNo, setHadithNo] = useState("");

  const submitSearch = () => {
    const q = searchValue.trim();
    if (q) onQuickSearch(q);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="panel p-8 sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
          Al-Muhaddith
        </p>
        <h1 className="mt-3 max-w-2xl text-2xl font-bold leading-snug text-parchment sm:text-3xl">
          Search the six canonical collections, open today's narration, or
          jump straight to a numbered hadith.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-mid">
          Every narration streams with its original Arabic and your active
          translations, graded and cached for offline reading.
        </p>

        {/* Quick search */}
        <div className="mt-6 flex max-w-xl items-stretch">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-mid">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder="Quick search: intention, charity, patience…"
              aria-label="Quick search for hadith"
              className="input-plain pl-10"
            />
          </div>
          <button
            onClick={submitSearch}
            className="ml-2 border border-gold bg-gold-faint px-5 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold-muted"
          >
            Search
          </button>
        </div>

        {/* Quick reach topics: seeds a search where the HadeethEnc category
            index takes priority over the local text filter. */}
        <div className="mt-5">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-mid">
            <SitemapIcon size={13} />
            Quick reach topics
          </p>
          <div className="flex flex-wrap gap-2">
            {ENC_QUICK_TOPICS.map((t) => (
              <button
                key={t.categoryId}
                onClick={() => onQuickTopic(t.label)}
                className="border border-hairline px-3 py-1.5 text-xs font-medium text-parchment transition-colors duration-200 hover:border-gold-muted hover:text-gold"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Hadith of the Day */}
      <HadithOfTheDay onOpenReader={onOpenReader} />

      {/* Quick Read */}
      <section className="panel p-6 sm:p-8" aria-label="Quick read">
        <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
          <BookIcon size={16} />
          Quick Read
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {/* Book selector */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-stone-mid">
              Book
            </span>
            <div className="relative">
              <select
                value={book}
                onChange={(e) => setBook(e.target.value)}
                className="input-plain appearance-none pr-9"
                aria-label="Select book"
              >
                {COLLECTIONS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-mid">
                <ChevronDownIcon />
              </span>
            </div>
          </label>

          {/* Hadith number */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-stone-mid">
              Hadith No.
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={hadithNo}
              onChange={(e) => setHadithNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onQuickRead(book, hadithNo.trim())}
              placeholder="e.g. 1"
              className="input-plain"
              aria-label="Hadith number"
            />
          </label>

          {/* Translations multi-select */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-stone-mid">
              Translation(s)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TRANSLATION_LANGUAGES.map((l) => {
                const active = langCodes.includes(l.code);
                return (
                  <button
                    key={l.code}
                    onClick={() => toggleLangCode(l.code)}
                    aria-pressed={active}
                    title={active ? `Hide ${l.label}` : `Show ${l.label}`}
                    className={`border px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
                      active
                        ? "border-gold bg-gold-faint text-gold"
                        : "border-hairline text-stone-mid hover:text-parchment"
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onQuickRead(book, hadithNo.trim())}
            className="border border-gold bg-gold-faint px-5 py-2.5 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold-muted"
          >
            {hadithNo.trim() ? "Open hadith" : "Open book"}
          </button>
          <p className="text-[11px] leading-relaxed text-stone-mid/70">
            Active translations apply everywhere: cards, the focused reader,
            and Quick Read. Editions missing your language fall back to the
            primary one automatically.
          </p>
        </div>

        {/* Recent trail */}
        {history.length > 0 && (
          <div className="mt-6 border-t border-hairline pt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-mid">
              Continue Reading
            </p>
            <ul className="space-y-1.5">
              {history.slice(0, 4).map((h) => {
                const c = COLLECTIONS.find((col) => col.key === h.collectionKey);
                return (
                  <li key={h.id} className="flex items-center gap-2 text-xs text-stone-mid">
                    <span className="font-arabic text-gold">{c?.glyph ?? "ح"}</span>
                    <span className="truncate">{c?.name ?? h.collectionKey}</span>
                    <button
                      onClick={() => onQuickRead(h.collectionKey, h.id.split("-").slice(1).join("-"))}
                      className="ml-auto text-gold hover:underline"
                    >
                      Resume
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
