import type { HadithNode } from "../types";
import { COLLECTIONS } from "../data/constants";
import { CollectionGlyph, ArrowRightIcon } from "./icons";

/** Curated daily widget. Deterministic per calendar date across all users. */
export function HadithOfTheDay({
  node,
  onOpenReader,
}: {
  node: HadithNode | null;
  onOpenReader?: (node: HadithNode) => void;
}) {
  if (!node) return null;

  const collection = COLLECTIONS.find((c) => c.key === node.collection);

  return (
    <section
      aria-label="Hadith of the Day"
      className="panel border-l-2 border-l-gold p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
          Hadith of the Day
        </span>
        <span className="flex items-center gap-2 text-xs text-stone-mid">
          {collection && <CollectionGlyph glyph={collection.glyph} size="sm" />}
          {collection?.name} · No. {node.hadithNumber}
        </span>
      </div>

      {node.arabicText && (
        <p className="arabic-text mt-6 text-[1.6rem] sm:text-[1.8rem]">
          {node.arabicText}
        </p>
      )}

      <p className="translation-text mt-5 text-parchment">
        “{node.translatedText}”
      </p>

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
