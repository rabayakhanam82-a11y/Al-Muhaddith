import { useState } from "react";
import { useSettings } from "../state/SettingsContext";
import { TRANSLATION_LANGUAGES } from "../data/constants";
import { XIcon } from "./icons";

/** Translation Settings: Multi-Language Reader configuration controls. */
export function SettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    langCode,
    setLangCode,
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
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm overflow-y-auto border-l border-hairline bg-ink-panel p-6 transition-transform duration-300 ${
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
          <label className="mb-1 flex items-center justify-between text-xs text-stone-mid">
            <span>Script size</span>
            <span className="text-parchment">×{arabicScale.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0.7}
            max={1.6}
            step={0.05}
            value={arabicScale}
            onChange={(e) => setArabicScale(Number(e.target.value))}
            className="w-full accent-gold"
          />

          <p className="mb-3 mt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
            Translation Typography
          </p>
          <label className="mb-1 flex items-center justify-between text-xs text-stone-mid">
            <span>Text size</span>
            <span className="text-parchment">
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
            className="w-full accent-gold"
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
                className={`border px-3 py-2.5 text-xs font-medium transition-colors duration-200 ${
                  layoutMode === mode
                    ? "border-gold bg-gold-faint text-gold"
                    : "border-hairline text-stone-mid hover:text-parchment"
                }`}
              >
                {mode === "split" ? "Side-by-side" : "Stacked"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-stone-mid/70">
            Side-by-side renders Arabic and translation in parallel CSS
            grid columns; stacked keeps the classic vertical flow.
          </p>
        </section>

        {/* Language matrix */}
        <section>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
            Translation Language
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
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLangCode(l.code)}
                className={`border px-3 py-2.5 text-xs font-medium transition-colors duration-200 ${
                  langCode === l.code
                    ? "border-gold bg-gold-faint text-gold"
                    : "border-hairline text-stone-mid hover:text-parchment"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-stone-mid/70">
            Switching language rehydrates the collection through the
            parallel Arabic and translation pipes. Editions without your
            language fall back to English automatically.
          </p>
        </section>
      </aside>
    </>
  );
}
