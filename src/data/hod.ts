import type { HadithNode } from "../types";

/**
 * Hadith of the Day (HOD) Engine, deterministic pseudo-random selection.
 * The calendar date integer (YYYYMMDD) seeds the index, producing an
 * identical, repeatable selection globally for all users across 24h.
 */
export function hadithOfTheDay(nodes: HadithNode[]): HadithNode | null {
  if (nodes.length === 0) return null;
  const now = new Date();
  const seed =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return nodes[seed % nodes.length];
}
