import type {
  HadithNode,
  RawEditionPayload,
  RawHadith,
  TranslationText,
} from "../types";
import { COLLECTIONS } from "./constants";
import {
  fetchEdition,
  fetchEditionsIndex,
  resolveTranslationEdition,
} from "./cdn";
import {
  getCachedEdition,
  hasAnyEditionCache,
  isEditionFresh,
  putEdition,
} from "./db";

/**
 * Deterministic zip mapping: the Arabic record and every translation record
 * are joined on their absolute index (array position), forming one hydrated
 * node per hadith.
 */
function zipHydrate(
  translations: { langCode: string; payload: RawEditionPayload }[],
  arabic: RawEditionPayload | null,
  collectionKey: string,
): HadithNode[] {
  const collection = COLLECTIONS.find((c) => c.key === collectionKey);
  const sections =
    translations[0]?.payload.metadata.sections ??
    translations[0]?.payload.metadata.section ??
    {};
  const arabicByIndex = new Map<number, RawHadith>();
  arabic?.hadiths.forEach((h, i) => arabicByIndex.set(i, h));

  const first = translations[0];
  if (!first) throw new Error("No translation payload provided");

  return first.payload.hadiths.map((h, i) => {
    const sectionId = Number(h.reference?.book ?? 1);
    const arabicRecord = arabicByIndex.get(i);
    const sectionName =
      sections[String(sectionId)] ?? sections["0"] ?? "General Index";

    const texts: TranslationText[] = [];
    for (const t of translations) {
      const record = t.payload.hadiths[i];
      if (record && record.text) {
        texts.push({ langCode: t.langCode, text: record.text });
      }
    }

    return {
      id: `${collectionKey}-${h.hadithnumber}`,
      hadithNumber: h.hadithnumber,
      arabicText: arabicRecord?.text ?? "",
      translatedText: texts[0]?.text ?? "",
      translations: texts,
      collection: collectionKey,
      sectionId,
      sectionName,
      bookTitle: first.payload.metadata.name ?? collection?.name ?? collectionKey,
      grades: h.grades ?? [],
    };
  });
}

interface LoadedEdition {
  payload: RawEditionPayload;
  fromCache: boolean;
}

/**
 * Cache-through edition loader: IndexedDB first when fresh, network otherwise,
 * with automatic fallback to stale cache whenever the network gateway fails.
 */
async function loadEdition(editionName: string): Promise<LoadedEdition> {
  const fresh = await isEditionFresh(editionName);
  if (fresh) {
    const cached = await getCachedEdition(editionName);
    if (cached) return { payload: cached, fromCache: true };
  }

  try {
    const payload = await fetchEdition(editionName);
    await putEdition(payload, editionName);
    return { payload, fromCache: false };
  } catch (error) {
    const stale = await hasAnyEditionCache(editionName);
    if (stale) {
      const cached = await getCachedEdition(editionName);
      if (cached) return { payload: cached, fromCache: true };
    }
    throw error;
  }
}

export interface HydrationResult {
  nodes: HadithNode[];
  editionsUsed: string[];
  bookTitle: string;
  fromCache: boolean;
  offline: boolean;
}

/**
 * Parallel hydration pipe: fetches the original Arabic edition and every
 * requested translation edition concurrently, then zips them into unified
 * nodes keyed by language.
 */
export async function hydrateCollection(
  collectionKey: string,
  langCodes: string[],
): Promise<HydrationResult> {
  const info = COLLECTIONS.find((c) => c.key === collectionKey);
  if (!info) throw new Error(`Unknown collection: ${collectionKey}`);

  const primary = langCodes[0] ?? "eng";
  const resolved = await Promise.all(
    langCodes.map(async (lang) => ({
      lang,
      edition: await resolveTranslationEdition(lang, collectionKey),
    })),
  );

  // Resolve to at least one edition: primary language first, then any other
  // requested language, then English, else the collection has no translation.
  const ordered = resolved.filter((r): r is { lang: string; edition: string } =>
    Boolean(r.edition),
  );
  const fallback = ordered.find((r) => r.lang === primary) ?? ordered[0] ?? null;
  if (!fallback) {
    throw new Error(`No translation edition found for ${collectionKey}`);
  }
  const others = ordered.filter(
    (r) => r.edition !== fallback.edition && r.lang !== fallback.lang,
  );
  const unique = [fallback, ...others];

  const results = await Promise.allSettled([
    ...unique.map((r) => loadEdition(r.edition)),
    loadEdition(info.arabicKey),
  ]);

  const arabicResult = results[results.length - 1];
  if (unique[0] === undefined || results[0].status === "rejected") {
    throw (results[0].status === "rejected" ? results[0].reason : new Error("No translation payload"));
  }

  const translations: { langCode: string; payload: RawEditionPayload }[] = [];
  for (let i = 0; i < unique.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      translations.push({ langCode: unique[i].lang, payload: r.value.payload });
    }
  }

  const arabic =
    arabicResult.status === "fulfilled" ? arabicResult.value.payload : null;

  const nodes = zipHydrate(
    translations,
    arabic,
    collectionKey,
  );

  return {
    nodes,
    editionsUsed: unique.map((u) => u.edition),
    bookTitle: translations[0]?.payload.metadata.name ?? info.name,
    fromCache: results[0].status === "fulfilled" ? (results[0].value as LoadedEdition).fromCache : false,
    offline:
      (results[0].status === "fulfilled" ? (results[0].value as LoadedEdition).fromCache : false) &&
      !navigator.onLine,
  };
}

/** Editions index probe used by the settings panel for language availability. */
export async function languageAvailable(
  langCode: string,
  collectionKey: string,
): Promise<boolean> {
  try {
    await fetchEditionsIndex();
    const resolved = await resolveTranslationEdition(langCode, collectionKey);
    return resolved !== null;
  } catch {
    return false;
  }
}
