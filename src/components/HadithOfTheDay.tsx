import { useEffect, useMemo, useRef, useState } from "react";
import type { HadithNode } from "../types";
import { hydrateCollection } from "../data/hydration";
import { hadithOfTheDay } from "../data/hod";
import { useSettings } from "../state/SettingsContext";
import { useLibrary } from "../state/LibraryContext";
import { CollectionGlyph, ArrowRightIcon } from "./icons";
import { TRANSLATION_LANGUAGES, LANGUAGE_LABELS } from "../data/constants";

const HOD_BOOKS = ["bukhari", "muslim", "nasai", "abudawud", "tirmidhi", "ibnmajah"];

function pickDailyBook(): string {
  const now = new Date();
  const seed =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return HOD_BOOKS[seed % HOD_BOOKS.length];
}

/**
 * Curated daily widget. The calendar date seeds both the book and the
 * narration index, producing an identical selection globally for 24h.
 * Self-fetching: loads only its own book through the hydration pipe.
 */
export function HadithOfTheDay({
  onOpenReader,
}: {
  onOpenReader?: (node: HadithNode) => void;
}) {
  const { langCodes } = useSettings();
  const { commitView } = useLibrary();
  const bookRef = useRef(pickDailyBook());

  const [node, setNode] = useState<HadithNode | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await hydrateCollection(bookRef.current, langCodes);
        if (cancelled) return;
        const daily = hadithOfTheDay(result.nodes);
        if (daily) {
          setNode(daily);
          setFailed(false);
          void commitView(daily);
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [langCodes, commitView]);

  const translationStrip = useMemo(() => {
    if (!node) return "";
    const shown = node.translations.filter((t) => t.text.trim());
    const langs = shown
      .map((t) => LANGUAGE_LABELS[t.langCode] ?? t.langCode)
      .filter((label) => label !== "English");
    const extra = TRANSLATION_LANGUAGES.filter(
      (l) => langCodes.includes(l.code) && !node.translations.some((t) => t.langCode === l.code),
    ).length;
    return langs.length ? langs.join(" · ") : extra ? "primary language" : "";
  }, [node, langCodes]);

  if (failed) return null;
  if (!node) {
    return (
      <section aria-label="Hadith of the Day" className="panel p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
            Hadith of the Day
          </span>
          <span className="h-3 w-40 bg-white/5" aria-hidden="true" />
        </div>
        <div className="mt-6 space-y-2" aria-hidden="true">
          <div className="h-4 w-full bg-white/5" />
          <div className="h-4 w-4/5 bg-white/5" />
          <div className="h-4 w-3/5 bg-white/5" />
        </div>
      </section>
    );
  }

  const collection = node.collection;

  const translations = node.translations.filter((t) => t.text.trim());

  return (
    <section aria-label="Hadith of the Day" className="panel p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
          Hadith of the Day
        </span>
        <span className="flex items-center gap-2 text-xs text-stone-mid">
          <CollectionGlyph
            glyph={
              requireCollectionGlyph(collection)
            }
            size="sm"
          />
          {node.bookTitle} · No. {node.hadithNumber}
        </span>
      </div>

      {node.arabicText && node.arabicText.trim() && (
        <p className="arabic-text mt-6 text-[1.6rem] sm:text-[1.8rem]">
          {node.arabicText}
        </p>
      )}

      {translations.map((t) => (
        <div key={t.langCode} className="mt-5 first:mt-6">
          {t.langCode !== "eng" && node.translations.length > 1 && (
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-mid/70">
              {LANGUAGE_LABELS[t.langCode] ?? t.langCode}
            </span>
          )}
          <p className="translation-text text-parchment">“{t.text}”</p>
        </div>
      ))}

      {translationStrip && (
        <p className="mt-3 text-[11px] text-stone-mid/70">{translationStrip}</p>
      )}

      {onOpenReader && (
        <button
          onClick={() => onOpenReader(node)}
          className="btn-ghost mt-4 border border-gold-muted text-gold hover:bg-hover-wash"
        >
          Open in reader
          <ArrowRightIcon />
        </button>
      )}
    </section>
  );
}

function requireCollectionGlyph(collectionKey: string): string {
  // Kept local to avoid importing the full COLLECTIONS table into this module.
  const glyphs: Record<string, string> = {
    bukhari: "ب",
    muslim: "م",
    nasai: "ن",
    abudawud: "د",
    tirmidhi: "ت",
    ibnmajah: "ق",
  };
  return glyphs[collectionKey] ?? "ح";
}
