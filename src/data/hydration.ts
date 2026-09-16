import type { HadithNode, RawEditionPayload, RawHadith } from "../types";
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
 * Deterministic zip mapping: Arabic and translation records are joined on
 * their absolute index (array position), forming one hydrated node per hadith.
 */
function zipHydrate(
  translation: RawEditionPayload,
  arabic: RawEditionPayload,
  collectionKey: string,
): HadithNode[] {
  const collection = COLLECTIONS.find((c) => c.key === collectionKey);
  const sections =
    translation.metadata.sections ?? translation.metadata.section ?? {};
  const arabicByIndex = new Map<number, RawHadith>();
  arabic.hadiths.forEach((h, i) => arabicByIndex.set(i, h));

  return translation.hadiths.map((h, i) => {
    const sectionId = Number(h.reference?.book ?? 1);
    const arabicRecord = arabicByIndex.get(i);
    const sectionName =
      sections[String(sectionId)] ?? sections["0"] ?? "General Index";

    return {
      id: `${collectionKey}-${h.hadithnumber}`,
      hadithNumber: h.hadithnumber,
      arabicText: arabicRecord?.text ?? "",
      translatedText: h.text,
      collection: collectionKey,
      sectionId,
      sectionName,
      bookTitle: translation.metadata.name ?? collection?.name ?? collectionKey,
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
  editionUsed: string;
  bookTitle: string;
  fromCache: boolean;
  offline: boolean;
}

/**
 * Parallel hydration pipe: fetches the original Arabic edition and the target
 * translation edition concurrently, then zips them into unified nodes.
 */
export async function hydrateCollection(
  collectionKey: string,
  langCode: string,
): Promise<HydrationResult> {
  const info = COLLECTIONS.find((c) => c.key === collectionKey);
  if (!info) throw new Error(`Unknown collection: ${collectionKey}`);

  const translationEdition = await resolveTranslationEdition(
    langCode,
    collectionKey,
  );
  if (!translationEdition) {
    throw new Error(`No translation edition found for ${collectionKey}`);
  }

  const [translationResult, arabicResult] = await Promise.allSettled([
    loadEdition(translationEdition),
    loadEdition(info.arabicKey),
  ]);

  if (translationResult.status === "rejected") {
    throw translationResult.reason;
  }

  const translation = translationResult.value;
  const arabic =
    arabicResult.status === "fulfilled"
      ? arabicResult.value.payload
      : null;

  const nodes = zipHydrate(
    translation.payload,
    arabic ?? { metadata: { name: translation.payload.metadata.name }, hadiths: [] },
    collectionKey,
  );

  return {
    nodes,
    editionUsed: translationEdition,
    bookTitle: translation.payload.metadata.name ?? info.name,
    fromCache: translation.fromCache,
    offline: translation.fromCache && !navigator.onLine,
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
