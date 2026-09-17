/** Core data model types for the Al-Muhaddith engine. */

/** Scholar grading the narration (raw CDN field `name`). */
export interface GradeEntry {
  name: string;
  grade: string;
}

/** Raw hadith record exactly as shipped by the fawazahmed0/hadith-api CDN. */
export interface RawHadith {
  hadithnumber: number | string;
  arabicnumber?: number | string;
  text: string;
  grades?: GradeEntry[];
  reference?: { book: number | string; hadith: number | string };
}

export interface RawEditionPayload {
  metadata: {
    name: string;
    sections?: Record<string, string>;
    section?: Record<string, string>;
    section_detail?: Record<
      string,
      { hadithnumber_first: number; hadithnumber_last: number }
    >;
  };
  hadiths: RawHadith[];
}

/** One translation payload zipped onto a hadith record. */
export interface TranslationText {
  /** ISO-ish language code from the CDN edition, e.g. "eng", "urd". */
  langCode: string;
  text: string;
}

/** Fully hydrated node: Arabic zipped onto one or more translations. */
export interface HadithNode {
  id: string;
  hadithNumber: number | string;
  arabicText: string;
  /** Primary translation (first entry of `translations`). */
  translatedText: string;
  /** All requested translations that resolved for this narration. */
  translations: TranslationText[];
  collection: string;
  sectionId: number;
  sectionName: string;
  bookTitle: string;
  grades: GradeEntry[];
}

export type LayoutMode = "stacked" | "split";

export interface UserEngagementMetrics {
  viewsCount: number;
  lastScrollOffset: number;
  isBookmarked: boolean;
  assignedPlaylists: string[];
}

export interface CollectionInfo {
  key: string;
  name: string;
  arabicKey: string;
  /** Single Arabic letter used as the collection's typographic mark. */
  glyph: string;
}

export interface Playlist {
  id: string;
  name: string;
  hadithIds: string[];
  createdAt: number;
}
