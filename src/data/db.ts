import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Playlist, RawEditionPayload } from "../types";
import { CACHE_TTL_MS } from "./constants";

/**
 * Client-side storage engine (IndexedDB). Stores:
 * editions, views, bookmarks, playlists, and reading history.
 */

export interface EditionRecord {
  edition: string;
  payload: RawEditionPayload;
  cachedAt: number;
}

export interface ViewRecord {
  id: string;
  views: number;
  lastViewedAt: number;
}

export interface BookmarkRecord {
  id: string;
  savedAt: number;
  collectionKey: string;
  hadithNumber: number | string;
  snippet: string;
}

export interface HistoryRecord {
  id: string;
  visitedAt: number;
  collectionKey: string;
}

interface AlMuhaddithDB extends DBSchema {
  editions: { key: string; value: EditionRecord };
  views: { key: string; value: ViewRecord };
  bookmarks: { key: string; value: BookmarkRecord };
  playlists: { key: string; value: Playlist };
  history: { key: string; value: HistoryRecord };
}

let dbPromise: Promise<IDBPDatabase<AlMuhaddithDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AlMuhaddithDB>("al-muhaddith", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("editions"))
          db.createObjectStore("editions", { keyPath: "edition" });
        if (!db.objectStoreNames.contains("views"))
          db.createObjectStore("views", { keyPath: "id" });
        if (!db.objectStoreNames.contains("bookmarks"))
          db.createObjectStore("bookmarks", { keyPath: "id" });
        if (!db.objectStoreNames.contains("playlists"))
          db.createObjectStore("playlists", { keyPath: "id" });
        if (!db.objectStoreNames.contains("history"))
          db.createObjectStore("history", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

/* ----------------------------- Edition cache ----------------------------- */

export async function getCachedEdition(
  edition: string,
): Promise<RawEditionPayload | null> {
  const db = await getDB();
  const record = await db.get("editions", edition);
  return record?.payload ?? null;
}

export async function isEditionFresh(edition: string): Promise<boolean> {
  const db = await getDB();
  const record = await db.get("editions", edition);
  if (!record) return false;
  return Date.now() - record.cachedAt < CACHE_TTL_MS;
}

export async function putEdition(payload: RawEditionPayload, edition: string) {
  const db = await getDB();
  await db.put("editions", { edition, payload, cachedAt: Date.now() });
}

/** True when the payload exists locally even if stale (offline fallback). */
export async function hasAnyEditionCache(edition: string): Promise<boolean> {
  const db = await getDB();
  const record = await db.get("editions", edition);
  return Boolean(record);
}

export async function deleteEdition(edition: string): Promise<void> {
  const db = await getDB();
  await db.delete("editions", edition);
}

export async function getAllCachedEditions(): Promise<EditionRecord[]> {
  const db = await getDB();
  return db.getAll("editions");
}

/* ------------------------------- Views log ------------------------------- */

export async function getAllViews(): Promise<Map<string, ViewRecord>> {
  const db = await getDB();
  const all = await db.getAll("views");
  return new Map(all.map((v) => [v.id, v]));
}

export async function incrementView(id: string): Promise<number> {
  const db = await getDB();
  const existing = await db.get("views", id);
  const views = (existing?.views ?? 0) + 1;
  await db.put("views", { id, views, lastViewedAt: Date.now() });
  return views;
}

/* ------------------------------- Bookmarks ------------------------------- */

export async function getAllBookmarks(): Promise<BookmarkRecord[]> {
  const db = await getDB();
  const all = await db.getAll("bookmarks");
  return all.sort((a, b) => b.savedAt - a.savedAt);
}

export async function addBookmark(record: BookmarkRecord) {
  const db = await getDB();
  await db.put("bookmarks", record);
}

export async function removeBookmark(id: string) {
  const db = await getDB();
  await db.delete("bookmarks", id);
}

/* ------------------------------- Playlists ------------------------------- */

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.getAll("playlists");
}

export async function putPlaylist(playlist: Playlist) {
  const db = await getDB();
  await db.put("playlists", playlist);
}

export async function deletePlaylist(id: string) {
  const db = await getDB();
  await db.delete("playlists", id);
}

/* -------------------------------- History -------------------------------- */

const HISTORY_LIMIT = 200;

export async function recordHistory(
  id: string,
  collectionKey: string,
): Promise<void> {
  const db = await getDB();
  await db.put("history", { id, visitedAt: Date.now(), collectionKey });
  const all = await db.getAll("history");
  if (all.length > HISTORY_LIMIT) {
    const sorted = all.sort((a, b) => b.visitedAt - a.visitedAt);
    for (const stale of sorted.slice(HISTORY_LIMIT)) {
      await db.delete("history", stale.id);
    }
  }
}

export async function getRecentHistory(
  limit = 30,
): Promise<HistoryRecord[]> {
  const db = await getDB();
  const all = await db.getAll("history");
  return all.sort((a, b) => b.visitedAt - a.visitedAt).slice(0, limit);
}
