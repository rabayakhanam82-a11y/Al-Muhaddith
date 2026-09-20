import { COLLECTIONS } from "./constants";
import { fetchEdition, resolveTranslationEdition } from "./cdn";
import {
  deleteEdition,
  getAllCachedEditions,
  hasAnyEditionCache,
  putEdition,
} from "./db";

export interface CollectionOfflineStatus {
  key: string;
  name: string;
  glyph: string;
  isDownloaded: boolean;
  arabicDownloaded: boolean;
  translationsDownloaded: string[];
  totalHadiths?: number;
}

export interface OfflineSummary {
  isOnline: boolean;
  totalCachedEditions: number;
  estimatedStorageMb: number;
  collections: CollectionOfflineStatus[];
}

/**
 * Checks if a specific collection has its Arabic edition and active translation cached.
 */
export async function checkCollectionDownloaded(
  collectionKey: string,
  langCodes: string[] = ["eng"],
): Promise<boolean> {
  const info = COLLECTIONS.find((c) => c.key === collectionKey);
  if (!info) return false;

  const arabicCached = await hasAnyEditionCache(info.arabicKey);
  if (!arabicCached) return false;

  for (const lang of langCodes) {
    try {
      const edition = await resolveTranslationEdition(lang, collectionKey);
      if (edition) {
        const transCached = await hasAnyEditionCache(edition);
        if (!transCached) return false;
      }
    } catch {
      // Continue checking
    }
  }

  return true;
}

/**
 * Downloads a single collection for offline reading.
 */
export async function downloadCollection(
  collectionKey: string,
  langCodes: string[] = ["eng"],
  onProgress?: (msg: string, percent: number) => void,
): Promise<void> {
  const info = COLLECTIONS.find((c) => c.key === collectionKey);
  if (!info) throw new Error(`Collection not found: ${collectionKey}`);

  onProgress?.(`Fetching Arabic text for ${info.name}...`, 10);
  const arabicPayload = await fetchEdition(info.arabicKey);
  await putEdition(arabicPayload, info.arabicKey);

  const totalLangs = langCodes.length;
  for (let i = 0; i < totalLangs; i++) {
    const lang = langCodes[i];
    onProgress?.(`Resolving ${lang} translation...`, 20 + Math.round((i / totalLangs) * 40));
    try {
      const editionName = await resolveTranslationEdition(lang, collectionKey);
      if (editionName) {
        onProgress?.(`Downloading ${lang} edition for ${info.name}...`, 40 + Math.round(((i + 1) / totalLangs) * 55));
        const transPayload = await fetchEdition(editionName);
        await putEdition(transPayload, editionName);
      }
    } catch (err) {
      console.warn(`Could not download ${lang} for ${collectionKey}`, err);
    }
  }

  onProgress?.(`Completed ${info.name} download!`, 100);
}

/**
 * Downloads all 6 canonical collections in sequence with live progress feedback.
 */
export async function downloadAllCollections(
  langCodes: string[] = ["eng"],
  onProgress?: (currentCollection: string, overallPercent: number, stepMsg: string) => void,
): Promise<void> {
  const total = COLLECTIONS.length;

  for (let idx = 0; idx < total; idx++) {
    const col = COLLECTIONS[idx];
    const basePct = Math.round((idx / total) * 100);
    const nextPct = Math.round(((idx + 1) / total) * 100);

    onProgress?.(
      col.name,
      basePct,
      `Starting ${col.name} (${idx + 1}/${total})...`,
    );

    await downloadCollection(col.key, langCodes, (_msg, stepPct) => {
      const currentOverall = basePct + Math.round((stepPct / 100) * (nextPct - basePct));
      onProgress?.(col.name, currentOverall, `${col.name}: ${stepPct}%`);
    });
  }

  onProgress?.("All Collections", 100, "Complete offline library ready!");
}

/**
 * Removes a collection from offline cache.
 */
export async function removeCollectionFromOffline(
  collectionKey: string,
  langCodes: string[] = ["eng"],
): Promise<void> {
  const info = COLLECTIONS.find((c) => c.key === collectionKey);
  if (!info) return;

  await deleteEdition(info.arabicKey);

  for (const lang of langCodes) {
    try {
      const edition = await resolveTranslationEdition(lang, collectionKey);
      if (edition) {
        await deleteEdition(edition);
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * Computes an offline summary showing connection state, storage, and collection readiness.
 */
export async function getOfflineSummary(
  langCodes: string[] = ["eng"],
): Promise<OfflineSummary> {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  const cachedEditions = await getAllCachedEditions();

  let totalSizeEst = 0;
  for (const record of cachedEditions) {
    totalSizeEst += JSON.stringify(record.payload).length;
  }
  const estimatedStorageMb = Math.round((totalSizeEst / (1024 * 1024)) * 10) / 10;

  const collections: CollectionOfflineStatus[] = [];

  for (const col of COLLECTIONS) {
    const arabicDownloaded = cachedEditions.some((e) => e.edition === col.arabicKey);
    const translationsDownloaded: string[] = [];

    for (const lang of langCodes) {
      const edition = await resolveTranslationEdition(lang, col.key).catch(() => null);
      if (edition && cachedEditions.some((e) => e.edition === edition)) {
        translationsDownloaded.push(lang);
      }
    }

    const arabicRecord = cachedEditions.find((e) => e.edition === col.arabicKey);
    const totalHadiths = arabicRecord?.payload?.hadiths?.length;

    collections.push({
      key: col.key,
      name: col.name,
      glyph: col.glyph,
      isDownloaded: arabicDownloaded && translationsDownloaded.length > 0,
      arabicDownloaded,
      translationsDownloaded,
      totalHadiths,
    });
  }

  return {
    isOnline,
    totalCachedEditions: cachedEditions.length,
    estimatedStorageMb,
    collections,
  };
}
