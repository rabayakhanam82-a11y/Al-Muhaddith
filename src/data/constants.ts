import type { CollectionInfo } from "../types";

/** Primary distribution endpoint (fawazahmed0/hadith-api on jsDelivr). */
export const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

export const EDITIONS_URL =
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions.json";

/** Local cache shelf life before revalidation (7 days, in ms). */
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Circuit breaker thresholds for the network gateway. */
export const CIRCUIT_BREAKER = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
};

/** View-tracking rule: ms a card must remain in view to count. */
export const VIEW_COMMIT_MS = 3000;

/** IntersectionObserver visibility threshold. */
export const VIEW_THRESHOLD = 0.6;

/** Cards rendered per page. */
export const PAGE_SIZE = 50;

export const SEARCH_DEBOUNCE_MS = 350;

/** The six canonical collections surfaced in the side menu. */
export const COLLECTIONS: CollectionInfo[] = [
  {
    key: "bukhari",
    name: "Sahih al-Bukhari",
    arabicKey: "ara-bukhari",
    glyph: "ب",
  },
  {
    key: "muslim",
    name: "Sahih Muslim",
    arabicKey: "ara-muslim",
    glyph: "م",
  },
  {
    key: "nasai",
    name: "Sunan an-Nasa'i",
    arabicKey: "ara-nasai",
    glyph: "ن",
  },
  {
    key: "abudawud",
    name: "Sunan Abu Dawud",
    arabicKey: "ara-abudawud",
    glyph: "د",
  },
  {
    key: "tirmidhi",
    name: "Jami' at-Tirmidhi",
    arabicKey: "ara-tirmidhi",
    glyph: "ت",
  },
  {
    key: "ibnmajah",
    name: "Sunan Ibn Majah",
    arabicKey: "ara-ibnmajah",
    glyph: "ق",
  },
];

/**
 * Translation languages shipped by the fawazahmed0/hadith-api CDN
 * (verified against editions.json). Multiple can be active at once.
 */
export const TRANSLATION_LANGUAGES = [
  { code: "eng", label: "English" },
  { code: "urd", label: "Urdu" },
  { code: "ben", label: "Bengali" },
  { code: "tur", label: "Turkish" },
  { code: "fra", label: "French" },
  { code: "rus", label: "Russian" },
  { code: "ind", label: "Indonesian" },
  { code: "tam", label: "Tamil" },
] as const;

/** Language labels for edition codes the settings list may not include. */
export const LANGUAGE_LABELS: Record<string, string> = {
  ...Object.fromEntries(TRANSLATION_LANGUAGES.map((l) => [l.code, l.label])),
  ara: "Arabic",
};

export const DEFAULT_LANG_CODE = "eng";
