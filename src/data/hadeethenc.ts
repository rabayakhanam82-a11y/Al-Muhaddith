import { LANGUAGE_LABELS } from "./constants";

// LANGUAGE_LABELS is re-exported at the bottom for label lookups.
/**
 * HadeethEnc.com topic-tree gateway (api/v1, public, CORS-open).
 *
 * The Encyclopedia of Translated Prophetic Hadiths organizes its corpus as a
 * strict category tree. This module powers the topic search layer: category
 * suggestions get priority, and each topic resolves to the hadith ids that
 * open directly in the app's own reader.
 *
 * Source attribution is mandatory per the project's terms: content is shown
 * with a HadeethEnc.com reference, unmodified.
 */

const ENC_API = "https://hadeethenc.com/api/v1";

/** Map the app's translation codes to HadeethEnc language codes. */
const ENC_LANGUAGE: Record<string, string> = {
  eng: "en",
  urd: "ur",
  ben: "bn",
  tur: "tr",
  fra: "fr",
  rus: "ru",
  ind: "id",
  tam: "ta",
};

export function encLanguageCode(langCode: string): string {
  return ENC_LANGUAGE[langCode] ?? "en";
}

/* ------------------------------- Types ---------------------------------- */

export interface EncCategory {
  id: string;
  title: string;
  hadeeths_count: string;
  parent_id: string | null;
}

export interface EncCategoryNode extends EncCategory {
  /** Flat tree depth resolved at load time (root = 0). */
  depth: number;
  /** True when no child categories exist under this node. */
  isLeaf: boolean;
}

export interface EncSearchHit {
  /** HadeethEnc hadith id. */
  id: string;
  title: string;
  /** Full narration text with <mark> highlights removed. */
  hadithText: string;
  /** Narration text with matches wrapped for highlighting. */
  hadithTextHighlights: string;
}

export interface EncHadith {
  id: string;
  title: string;
  hadeeth: string;
  attribution: string;
  grade: string;
  explanation: string;
  /** Arabic narration when requested with with_ar=1. */
  hadeethAr: string;
  /** Category ids this narration belongs to. */
  categories: string[];
}

/** Resolved link from an ENC result to the app's own CDN-indexed reader. */
export interface MatchCandidate {
  id: string;
  collectionKey: string;
  hadithNumber: number | string;
  /** Lowercased translation text used for scoring. */
  text: string;
  /** Raw Arabic text; ENC-to-CDN matching is most reliable in Arabic. */
  arabicText: string;
}

/** Resolved link from an ENC result to the app's own CDN-indexed reader. */
export interface ReaderResolution {
  kind: "exact" | "reference" | "unresolved";
  node?: {
    id: string;
    collectionKey: string;
    hadithNumber: number | string;
  };
}

/* ----------------------------- Low-level fetch --------------------------- */

export class EncApiError extends Error {}

async function encFetch<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new EncApiError(`HadeethEnc HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/* --------------------------- Categories (tree) --------------------------- */

let categoriesCache: EncCategoryNode[] | null = null;

/** Fetch the full category tree once per session, resolved with depth/leaf. */
export async function fetchEncCategories(): Promise<EncCategoryNode[]> {
  if (categoriesCache) return categoriesCache;
  const raw = await encFetch<EncCategory[]>(
    `${ENC_API}/categories/list?language=en`,
  );
  const childrenOf = new Map<string, EncCategory[]>();
  for (const c of raw) {
    const parent = c.parent_id ?? "root";
    const list = childrenOf.get(parent) ?? [];
    list.push(c);
    childrenOf.set(parent, list);
  }
  const nodes: EncCategoryNode[] = [];
  const walk = (parentId: string, depth: number) => {
    for (const c of childrenOf.get(parentId) ?? []) {
      const children = childrenOf.get(c.id) ?? [];
      nodes.push({ ...c, depth, isLeaf: children.length === 0 });
      walk(c.id, depth + 1);
    }
  };
  walk("root", 0);
  categoriesCache = nodes;
  return nodes;
}

/** Case-insensitive category title search, ranked parents-first. */
export async function searchEncCategories(
  query: string,
  limit = 8,
): Promise<EncCategoryNode[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = await fetchEncCategories();
  const words = q.split(/\s+/);
  const scored = all
    .map((c) => {
      const title = c.title.toLowerCase();
      let score = 0;
      if (title === q) score = 100;
      else if (title.startsWith(q)) score = 80;
      else if (words.every((w) => title.includes(w))) score = 60;
      else if (title.includes(q)) score = 40;
      if (score > 0 && c.depth === 0) score += 5;
      if (score > 0 && !c.isLeaf) score += 2;
      return { c, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((s) => s.c);
}

/* ------------------------------ Hadith reads ----------------------------- */

interface EncListMeta {
  current_page: number | string;
  last_page: number | string;
  total_items: number | string;
  per_page: number | string;
}

function stripMarks(html: string): string {
  return html.replace(/<\/?mark>/g, "");
}

/**
 * Search ENC narrations. Returns the first page of text matches with
 * highlight markup preserved for the UI (marks stripped from plain text).
 */
export async function searchEncHadiths(
  phrase: string,
  language: string,
): Promise<EncSearchHit[]> {
  const url = `${ENC_API}/hadeeths/search/?search_phrase=${encodeURIComponent(
    phrase,
  )}&language=${encodeURIComponent(language)}`;
  const raw = await encFetch<
    {
      id: string;
      title: string;
      hadith_text: string;
      hadith_text_highlights: string;
    }[]
  >(url);
  return raw.map((h) => ({
    id: h.id,
    title: h.title,
    hadithText: stripMarks(h.hadith_text ?? ""),
    hadithTextHighlights: h.hadith_text_highlights ?? "",
  }));
}

/** All narrations of a category (auto-paginated, capped for safety). */
export async function fetchEncCategoryHadiths(
  categoryId: string,
  language: string,
  max = 60,
): Promise<EncSearchHit[]> {
  const out: EncSearchHit[] = [];
  let page = 1;
  for (;;) {
    const url = `${ENC_API}/hadeeths/list?category_id=${encodeURIComponent(
      categoryId,
    )}&language=${encodeURIComponent(language)}&page=${page}&per_page=20`;
    const payload = await encFetch<{ data: EncListResponseItem[]; meta: EncListMeta }>(url);
    for (const item of payload.data) {
      out.push({
        id: item.id,
        title: item.title,
        hadithText: stripMarks(item.hadith_text ?? ""),
        hadithTextHighlights: "",
      });
    }
    const last = Number(payload.meta?.last_page ?? 1);
    if (page >= last || out.length >= max) break;
    page += 1;
  }
  return out.slice(0, max);
}

interface EncListResponseItem {
  id: string;
  title: string;
  hadith_text: string;
}

/** One full ENC hadith (explanation, grade, attribution, Arabic). */
export async function fetchEncHadith(
  id: string,
  language: string,
  withArabic = true,
): Promise<EncHadith> {
  const url = `${ENC_API}/hadeeths/one/?id=${encodeURIComponent(id)}&language=${encodeURIComponent(
    language,
  )}${withArabic ? "&with_ar=1" : ""}`;
  const raw = await encFetch<{
    id: string;
    title: string;
    hadeeth: string;
    attribution: string;
    grade: string;
    explanation: string;
    hadeeth_ar: string | null;
    categories: string[];
  }>(url);
  return {
    id: raw.id,
    title: raw.title,
    hadeeth: raw.hadeeth,
    attribution: raw.attribution,
    grade: raw.grade,
    explanation: raw.explanation,
    hadeethAr: raw.hadeeth_ar ?? "",
    categories: raw.categories ?? [],
  };
}

/* --------------------- Reference resolution system ----------------------- */

/**
 * The system that sends an ENC result to the same hadith in the project's
 * own API (the fawazahmed0 CDN editions). The ENC corpus is drawn from the
 * canonical books, so narration text is matched against the app's hydrated
 * index. Matching is scored: exact normalized full-text first, then a
 * keyword-overlap Jaccard score, then a shared distinctive-phrase check.
 */
export interface MatchCandidate {
  id: string;
  collectionKey: string;
  hadithNumber: number | string;
  /** Lowercased translation text used for scoring. */
  text: string;
}

const STOP_WORDS = new Set([
  "the", "and", "that", "with", "from", "for", "was", "were", "his", "her",
  "him", "she", "said", "unto", "upon", "not", "all", "who", "whom", "when",
  "then", "they", "them", "their", "there", "this", "these", "those", "have",
  "has", "had", "will", "would", "been", "being", "may", "peace", "blessings",
  "allah", "messenger", "prophet", "reported", "narrated", "it", "its", "on",
  "in", "of", "to", "a", "an", "as", "at", "by", "or", "be", "is", "are",
]);

const AR_STOP_WORDS = new Set([
  "في", "من", "عن", "على", "الى", "إلى", "ان", "أن", "إن", "ما", "لا",
  "هذا", "هذه", "ذلك", "التي", "الذي", "قال", "يقول", "كان", "قد",
  "الله", "رسول", "النبي", "صلعم", "عنه", "به",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Arabic normalizer: strips diacritics and tatweel, unifies alef/hamza
 * forms, alef maqsura, and ta marbuta so both corpora reduce to the same
 * rasm before tokenizing.
 */
function normalizeAr(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[\u0622\u0623\u0625\u0627]/g, "\u0627")
    .replace(/\u0629/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0624/g, "\u0648")
    .replace(/\u0626/g, "\u064A")
    .replace(/[^\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function tokenizeAr(text: string): string[] {
  return normalizeAr(text)
    .split(" ")
    .filter((w) => w.length >= 2 && !AR_STOP_WORDS.has(w));
}

function jaccardScore(tokensA: string[], tokensB: Set<string>): number {
  if (tokensA.length === 0 || tokensB.size === 0) return 0;
  let overlap = 0;
  for (const w of tokensA) if (tokensB.has(w)) overlap += 1;
  return overlap / (tokensA.length + tokensB.size - overlap);
}

function phraseHit(normalizedA: string, normalizedB: string, window: number): number {
  const words = normalizedA.split(" ");
  for (let i = 0; i + window <= words.length; i++) {
    if (normalizedB.includes(words.slice(i, i + window).join(" "))) return 1;
  }
  return 0;
}

/** Score one candidate against the ENC narration text (0..1). */
export function scoreMatch(encText: string, candidateText: string): number {
  const a = normalize(encText);
  const b = normalize(candidateText);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const score =
    jaccardScore(tokenize(encText), new Set(tokenize(candidateText))) * 0.7 +
    phraseHit(a, b, 6) * 0.45;
  return Math.min(1, score);
}

/** Arabic-text score: the strongest signal (same rasm across corpora). */
export function scoreMatchArabic(encArabic: string, candidateArabic: string): number {
  const a = normalizeAr(encArabic);
  const b = normalizeAr(candidateArabic);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const score =
    jaccardScore(tokenizeAr(encArabic), new Set(tokenizeAr(candidateArabic))) * 0.8 +
    phraseHit(a, b, 5) * 0.4;
  return Math.min(1, score);
}

/**
 * Resolve an ENC narration to the app's own hydrated index. Candidates come
 * from the app's loaded collections. Arabic text is matched first (both
 * corpora share the original wording); English similarity acts as a
 * secondary signal for records missing Arabic on either side.
 */
export function resolveToReader(
  encArabic: string,
  encEnglish: string,
  candidates: MatchCandidate[],
): ReaderResolution {
  let best: { c: MatchCandidate; score: number } | null = null;
  for (const c of candidates) {
    const arScore = scoreMatchArabic(encArabic, c.arabicText);
    const enScore = scoreMatch(encEnglish, c.text) * 0.9;
    const score = Math.max(arScore, enScore);
    if (score >= 0.22 && (!best || score > best.score)) {
      best = { c, score };
    }
  }
  if (best) {
    return {
      kind: best.score >= 0.4 ? "exact" : "reference",
      node: {
        id: best.c.id,
        collectionKey: best.c.collectionKey,
        hadithNumber: best.c.hadithNumber,
      },
    };
  }
  return { kind: "unresolved" };
}

/* ---------------------------- Quick reach set ---------------------------- */

/**
 * Curated quick-reach topics (verified category ids in the ENC tree):
 * everyday themes users search for most, with their ENC category ids.
 */
export const ENC_QUICK_TOPICS: { label: string; categoryId: string }[] = [
  { label: "Prayer", categoryId: "134" },
  { label: "Purification", categoryId: "133" },
  { label: "Fasting", categoryId: "137" },
  { label: "Zakah", categoryId: "136" },
  { label: "Hajj and Umrah", categoryId: "138" },
  { label: "Marriage", categoryId: "191" },
  { label: "Transactions", categoryId: "122" },
  { label: "Travel", categoryId: "292" },
  { label: "Food and Drink", categoryId: "126" },
  { label: "Neighbors", categoryId: "150" },
  { label: "Voluntary Charity", categoryId: "511" },
  { label: "Supplications", categoryId: "268" },
];

/** Category title from the tree cache, for labels after deep-link refresh. */
export async function encCategoryTitle(categoryId: string): Promise<string> {
  try {
    const all = await fetchEncCategories();
    return all.find((c) => c.id === categoryId)?.title ?? "Topic";
  } catch {
    return "Topic";
  }
}

/** Re-export for label lookups without extra imports in components. */
export { LANGUAGE_LABELS };

/**
 * Public HadeethEnc reader URL for a hadith (their app is hash-routed).
 * Used as the external fallback when a narration lives outside the app's
 * six-book CDN index.
 */
export function encHadithUrl(hadithId: string, langCode: string): string {
  return `https://hadeethenc.com/app/#/hadeeth?hadeeth=${encodeURIComponent(
    hadithId,
  )}&lang=${encodeURIComponent(encLanguageCode(langCode))}`;
}
