import type { RawEditionPayload } from "../types";
import {
  CDN_BASE,
  CIRCUIT_BREAKER,
  EDITIONS_URL,
  TRANSLATION_LANGUAGES,
} from "./constants";

/**
 * Network gateway with exponential-backoff retries and a circuit breaker.
 * Failed fetches are transparently re-served from the IndexedDB cache layer.
 */

interface CircuitState {
  failures: number;
  openedAt: number | null;
}

const circuit: CircuitState = { failures: 0, openedAt: null };

function isCircuitOpen(): boolean {
  if (circuit.openedAt === null) return false;
  if (Date.now() - circuit.openedAt > CIRCUIT_BREAKER.resetTimeoutMs) {
    circuit.failures = 0;
    circuit.openedAt = null;
    return false;
  }
  return true;
}

function recordSuccess() {
  circuit.failures = 0;
  circuit.openedAt = null;
}

function recordFailure() {
  circuit.failures += 1;
  if (circuit.failures >= CIRCUIT_BREAKER.failureThreshold) {
    circuit.openedAt = Date.now();
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class NetworkError extends Error {}

/** fetch() with retry + circuit breaker, parsed as JSON. */
export async function fetchJson<T>(url: string): Promise<T> {
  if (isCircuitOpen()) {
    throw new NetworkError("Circuit breaker open: serving from cache only");
  }

  const attempts = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new NetworkError(`HTTP ${response.status}`);
      recordSuccess();
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await sleep(400 * 2 ** attempt);
    }
  }

  recordFailure();
  throw lastError instanceof Error
    ? lastError
    : new NetworkError("Unknown network failure");
}

/** Full-book edition payload (large; callers should cache the result). */
export async function fetchEdition(
  editionName: string,
): Promise<RawEditionPayload> {
  return fetchJson<RawEditionPayload>(
    `${CDN_BASE}/${editionName}.min.json`,
  );
}

/** Single section module of a collection. */
export async function fetchSection(
  editionName: string,
  sectionNo: number,
): Promise<RawEditionPayload> {
  return fetchJson<RawEditionPayload>(
    `${CDN_BASE}/${editionName}/sections/${sectionNo}.min.json`,
  );
}

export interface EditionSummary {
  name: string;
  language: string;
  hasSections: boolean;
  collection: string;
}

let editionsCache: Map<string, EditionSummary> | null = null;

/** Map available semantic distributions from editions.json (handshake step). */
export async function fetchEditionsIndex(): Promise<
  Map<string, EditionSummary>
> {
  if (editionsCache) return editionsCache;

  const raw = await fetchJson<Record<string, any>>(EDITIONS_URL);
  const map = new Map<string, EditionSummary>();

  for (const [collectionKey, group] of Object.entries(raw)) {
    if (!group || typeof group !== "object") continue;
    const collectionName = (group as { name?: string }).name ?? collectionKey;
    for (const edition of (group as { collection?: any[] }).collection ?? []) {
      if (!edition?.name) continue;
      map.set(edition.name, {
        name: edition.name,
        language: edition.language ?? "Unknown",
        hasSections: Boolean(edition.has_sections),
        collection: collectionName,
      });
    }
  }

  editionsCache = map;
  return map;
}

/**
 * Resolve the translation edition name for a language code + collection key.
 * Falls back progressively (requested lang → eng) and returns null when the
 * edition simply does not exist upstream.
 */
export async function resolveTranslationEdition(
  langCode: string,
  collectionKey: string,
): Promise<string | null> {
  const editions = await fetchEditionsIndex();

  const preferred = `${langCode}-${collectionKey}`;
  if (editions.has(preferred)) return preferred;

  if (langCode !== "eng") {
    const fallback = `eng-${collectionKey}`;
    if (editions.has(fallback)) return fallback;
  }

  // Some collections ship under slightly different keys upstream.
  const loose = [...editions.keys()].find(
    (name) =>
      name.endsWith(`-${collectionKey}`) &&
      name.startsWith(`${langCode}-`) &&
      TRANSLATION_LANGUAGES.some((l) => l.code === langCode),
  );
  return loose ?? null;
}
