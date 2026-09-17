import type { HadithNode } from "../types";

/**
 * Hadith of the Day (HOD) Engine, deterministic pseudo-random selection.
 * The calendar date integer (YYYYMMDD) seeds the index, producing an
 * identical, repeatable selection globally for all users across 24h.
 * Records with no readable Arabic or translation text are skipped by
 * scanning forward from the seed, so the widget never renders empty.
 */
export function hadithOfTheDay(nodes: HadithNode[]): HadithNode | null {
  if (nodes.length === 0) return null;
  const now = new Date();
  const seed =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const start = seed % nodes.length;

  for (let i = 0; i < nodes.length; i++) {
    const candidate = nodes[(start + i) % nodes.length];
    const hasArabic = Boolean(candidate.arabicText.trim());
    const hasTranslation = candidate.translations.some((t) => t.text.trim());
    if (hasArabic || hasTranslation) return candidate;
  }
  return null;
}
