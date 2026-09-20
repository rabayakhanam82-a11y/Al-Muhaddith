import { useEffect, useState } from "react";
import { useSettings } from "../state/SettingsContext";
import { TRANSLATION_LANGUAGES } from "../data/constants";
import { XIcon, LanguageIcon } from "./icons";
import {
  downloadAllCollections,
  downloadCollection,
  removeCollectionFromOffline,
  getOfflineSummary,
  type OfflineSummary,
} from "../data/offlineManager";

/** Translation Settings: multi-language reader configuration & offline storage manager. */
export function SettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    langCodes,
    setLangCode,
    toggleLangCode,
    arabicScale,
    setArabicScale,
    translationScale,
    setTranslationScale,
    layoutMode,
    setLayoutMode,
  } = useSettings();
  const [query, setQuery] = useState("");
  const [offlineStatus, setOfflineStatus] = useState<OfflineSummary | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState("");

  const refreshOffline = async () => {
    try {
      const status = await getOfflineSummary(langCodes);
      setOfflineStatus(status);
    } catch {
      // offline status non-fatal
    }
  };

  useEffect(() => {
    if (open) {
      void refreshOffline();
    }
  }, [open, langCodes]);

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      await downloadAllCollections(langCodes, (_colName, pct, stepMsg) => {
        setDownloadMsg(`[${pct}%] ${stepMsg}`);
      });
      await refreshOffline();
      setDownloadMsg("All canonical collections downloaded for offline use!");
    } catch (e: any) {
      setDownloadMsg(`Download failed: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSingle = async (collectionKey: string) => {
    setDownloading(true);
    try {
      await downloadCollection(collectionKey, langCodes, (msg, pct) => {
        setDownloadMsg(`[${pct}%] ${msg}`);
      });
      await refreshOffline();
      setDownloadMsg(`Collection ${collectionKey} saved offline!`);
    } catch (e: any) {
      setDownloadMsg(`Download failed: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteSingle = async (collectionKey: string) => {
    try {
      await removeCollectionFromOffline(collectionKey, langCodes);
      await refreshOffline();
    } catch (e: any) {
      setDownloadMsg(`Removal failed: ${e.message}`);
    }
  };

  const languages = TRANSLATION_LANGUAGES.filter((l) =>
    l.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm overflow-y-auto border-l border-hairline bg-ink-panel p-6 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Translation settings"
        aria-hidden={!open}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-parchment">
            Settings & Offline
          </h2>
          <button onClick={onClose} className="btn-ghost" aria-label="Close settings">
            <XIcon />
          </button>
        </div>

        {/* Offline Database Section */}
        <section className="mb-8 rounded-xl border border-hairline bg-ink-raised/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
              Offline Storage (PWA)
            </p>
            {offlineStatus && (
              <span className="rounded bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-light">
                {offlineStatus.totalCachedEditions} cached ({offlineStatus.estimatedStorageMb} MB)
              </span>
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-stone-mid">
            Download complete Hadith databases (Arabic + active translations) to your device for 100% offline access without internet.
          </p>

          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gold bg-gold-faint px-3 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold hover:text-ink disabled:opacity-50"
          >
            {downloading ? "Downloading Database..." : "Download All Collections Offline"}
          </button>

          {downloadMsg && (
            <p className="mt-2 text-[11px] text-parchment/90 animate-pulse font-mono">
              {downloadMsg}
            </p>
          )}

          {offlineStatus && (
            <div className="mt-4 space-y-1.5 border-t border-hairline pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-mid">
                Collection Status
              </p>
              {offlineStatus.collections.map((c) => {
                return (
                  <div
                    key={c.key}
                    className="flex items-center justify-between py-1 text-xs"
                  >
                    <span className="text-parchment">{c.name}</span>
                    <div className="flex items-center gap-2">
                      {c.isDownloaded ? (
                        <>
                          <span className="text-[10px] text-emerald-light font-medium">Offline Ready</span>
                          <button
                            onClick={() => handleDeleteSingle(c.key)}
                            className="text-[10px] text-crimson hover:underline"
                            title="Delete offline cache for this book"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDownloadSingle(c.key)}
                          disabled={downloading}
                          className="rounded border border-hairline px-2 py-0.5 text-[10px] text-stone-mid hover:border-gold hover:text-gold disabled:opacity-50"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Typography scales */}
        <section className="mb-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
            Arabic Typography
          </p>
          <label className="mb-1.5 flex items-center justify-between text-xs text-stone-mid">
            <span>Script size</span>
            <span className="font-mono text-parchment">×{arabicScale.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0.7}
            max={1.6}
            step={0.05}
            value={arabicScale}
            onChange={(e) => setArabicScale(Number(e.target.value))}
            className="w-full accent-gold cursor-pointer"
          />

          <p className="mb-3 mt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
            Translation Typography
          </p>
          <label className="mb-1.5 flex items-center justify-between text-xs text-stone-mid">
            <span>Text size</span>
            <span className="font-mono text-parchment">
              ×{translationScale.toFixed(2)}
            </span>
          </label>
          <input
            type="range"
            min={0.8}
            max={1.5}
            step={0.05}
            value={translationScale}
            onChange={(e) => setTranslationScale(Number(e.target.value))}
            className="w-full accent-gold cursor-pointer"
          />
        </section>

        {/* Layout mode */}
        <section className="mb-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
            Layout Mode
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["stacked", "split"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setLayoutMode(mode)}
                className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                  layoutMode === mode
                    ? "border-gold bg-gold-faint text-gold shadow-sm"
                    : "border-hairline text-stone-mid hover:border-gold-muted hover:text-parchment"
                }`}
              >
                {mode === "split" ? "Side-by-side" : "Stacked"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-stone-mid/70">
            Side-by-side renders Arabic and every active translation in
            parallel columns; stacked keeps the classic vertical flow.
          </p>
        </section>

        {/* Language matrix: multi-select, first entry is primary */}
        <section>
          <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
            <LanguageIcon size={14} />
            Translation Languages
          </p>
          <p className="mb-3 text-[11px] leading-relaxed text-stone-mid/70">
            Toggle any number of languages. Each card shows a labeled block
            per language; the first one you pick is the primary used for
            search and fallback.
          </p>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter languages…"
            className="input-plain mb-3"
            aria-label="Filter languages"
          />
          <div className="grid grid-cols-2 gap-2">
            {languages.map((l) => {
              const active = langCodes.includes(l.code);
              const isPrimary = active && langCodes[0] === l.code;
              return (
                <div key={l.code} className="relative">
                  <button
                    onClick={() => (active ? setLangCode(l.code) : toggleLangCode(l.code))}
                    className={`w-full rounded-lg border px-3 py-2.5 pr-8 text-left text-xs font-medium transition-all duration-200 ${
                      active
                        ? "border-gold bg-gold-faint text-gold shadow-sm"
                        : "border-hairline text-stone-mid hover:border-gold-muted hover:text-parchment"
                    }`}
                    title={
                      active
                        ? isPrimary
                          ? "Primary translation"
                          : "Make primary translation"
                        : "Show this translation"
                    }
                  >
                    {l.label}
                  </button>
                  {active && (
                    <>
                      {isPrimary && (
                        <span
                          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-gold/20 px-1 py-0.5 text-[9px] font-bold uppercase text-gold"
                          title="Primary translation language"
                        >
                          P
                        </span>
                      )}
                      {!isPrimary && langCodes.length > 1 && (
                        <button
                          onClick={() => toggleLangCode(l.code)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-stone-mid hover:bg-crimson/20 hover:text-crimson"
                          title={`Remove ${l.label}`}
                          aria-label={`Remove ${l.label} translation`}
                        >
                          <XIcon size={10} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-stone-mid/70">
            Switching languages rehydrates the collection through the
            parallel Arabic and translation pipes. Editions without a
            language fall back to your primary translation automatically.
          </p>
        </section>
      </aside>
    </>
  );
}
