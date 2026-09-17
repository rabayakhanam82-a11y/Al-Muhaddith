import { useState } from "react";
import { useSettings } from "../state/SettingsContext";
import { TRANSLATION_LANGUAGES } from "../data/constants";
import { XIcon, LanguageIcon } from "./icons";

/** Translation Settings: multi-language reader configuration controls. */
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
            Reader Settings
          </h2>
          <button onClick={onClose} className="btn-ghost" aria-label="Close settings">
            <XIcon />
          </button>
        </div>

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
