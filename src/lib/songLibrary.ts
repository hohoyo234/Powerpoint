// ── Local song "database" (free, no backend) ─────────────────────────────────
// Every song the user confirms/makes is stored in the browser. Future Auto-mode
// lookups search this growing library by title / English title / producer /
// lyric fragment — so "系统去数据库里找" works fully offline and for free.

import type { BgOption } from './pptGenerator';

export interface LibrarySong {
  id: string;
  title: string;
  englishTitle?: string;
  producer?: string;
  lyrics: string;
  englishLyrics?: string;
  /** Saved background — including system-generated AI images — so a reused song
   *  brings its background back with it. */
  bg?: BgOption | null;
  updatedAt: number;
  /** Marks an entry that came from the built-in catalog (vs. user-created). */
  seed?: boolean;
}

const LIB_KEY = 'worship_song_library_v1';

// ── Cloud write-through hooks (registered by App when cloud sync is on) ───────
// Kept as a callback registry so this module never imports the cloud client —
// no import cycle, and it still works fully offline when no hooks are set.
type CloudHooks = { upsert?: (s: LibrarySong) => void; remove?: (title: string) => void };
let cloudHooks: CloudHooks = {};
export function setCloudHooks(h: CloudHooks) {
  cloudHooks = h;
}
// Let open UI (the 歌库 page) refresh after a background cloud sync lands.
const LIB_EVENT = 'worship-library-updated';
export function onLibraryChange(fn: () => void): () => void {
  const h = () => fn();
  window.addEventListener(LIB_EVENT, h);
  return () => window.removeEventListener(LIB_EVENT, h);
}
function emitChange() {
  try { window.dispatchEvent(new Event(LIB_EVENT)); } catch {}
}

export function loadLibrary(): LibrarySong[] {
  try {
    const raw = localStorage.getItem(LIB_KEY);
    if (raw) return JSON.parse(raw) as LibrarySong[];
  } catch {}
  return [];
}

export function saveToLibrary(song: Omit<LibrarySong, 'id' | 'updatedAt'> & { id?: string }) {
  const lib = loadLibrary();
  const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, '');
  // Replace an existing entry with the same (normalised) title, else prepend.
  const idx = lib.findIndex((e) => norm(e.title) === norm(song.title) && song.title.trim());
  const entry: LibrarySong = {
    id: song.id || crypto.randomUUID(),
    title: song.title,
    englishTitle: song.englishTitle || '',
    producer: song.producer || '',
    lyrics: song.lyrics,
    englishLyrics: song.englishLyrics || '',
    bg: song.bg ?? null,
    seed: song.seed,
    updatedAt: Date.now(),
  };
  if (idx >= 0) lib[idx] = { ...lib[idx], ...entry, id: lib[idx].id, seed: false };
  else lib.unshift(entry);
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(lib.slice(0, 1000)));
  } catch {}
  cloudHooks.upsert?.(idx >= 0 ? lib[idx] : entry);
  return entry;
}

export function deleteFromLibrary(id: string) {
  const all = loadLibrary();
  const removed = all.find((e) => e.id === id);
  const lib = all.filter((e) => e.id !== id);
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(lib));
  } catch {}
  if (removed?.title) cloudHooks.remove?.(removed.title);
}

// Edit an existing entry by id (used by the 歌库 management page).
export function updateById(id: string, patch: Partial<LibrarySong>) {
  const lib = loadLibrary();
  const idx = lib.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  lib[idx] = { ...lib[idx], ...patch, id: lib[idx].id, updatedAt: Date.now(), seed: false };
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(lib));
  } catch {}
  cloudHooks.upsert?.(lib[idx]);
  return lib[idx];
}

// Add a brand-new (empty) entry and return it.
export function addBlankSong(): LibrarySong {
  const entry: LibrarySong = {
    id: crypto.randomUUID(), title: '', englishTitle: '', producer: '',
    lyrics: '', englishLyrics: '', bg: null, updatedAt: Date.now(),
  };
  const lib = loadLibrary();
  lib.unshift(entry);
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(lib));
  } catch {}
  return entry;
}

// Export the whole library as a JSON string (for backup / moving devices).
export function exportLibraryJSON(): string {
  return JSON.stringify({ kind: 'worship-ppt-library', version: 1, songs: loadLibrary() }, null, 2);
}

// Import a library JSON, merging by title (imported wins). Returns #added/#updated.
export function importLibraryJSON(json: string): { added: number; updated: number } {
  const parsed = JSON.parse(json);
  const incoming: LibrarySong[] = Array.isArray(parsed) ? parsed : parsed.songs;
  if (!Array.isArray(incoming)) throw new Error('格式不正确');
  const lib = loadLibrary();
  const byTitle = new Map(lib.map((e, i) => [normalize(e.title), i] as const));
  let added = 0, updated = 0;
  for (const s of incoming) {
    if (!s?.title) continue;
    const key = normalize(s.title);
    const at = byTitle.get(key);
    const norm: LibrarySong = {
      id: at != null ? lib[at].id : s.id || crypto.randomUUID(),
      title: s.title, englishTitle: s.englishTitle || '', producer: s.producer || '',
      lyrics: s.lyrics || '', englishLyrics: s.englishLyrics || '', bg: s.bg ?? null,
      updatedAt: Date.now(), seed: false,
    };
    if (at != null) { lib[at] = norm; updated++; }
    else { lib.unshift(norm); byTitle.set(key, 0); added++; }
    cloudHooks.upsert?.(norm);
  }
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(lib.slice(0, 1000)));
  } catch {}
  return { added, updated };
}

// Merge songs pulled from the cloud into the local cache (cloud wins by title),
// then notify the UI to refresh. Does NOT write back to the cloud.
export function mergeCloudSongs(cloudSongs: LibrarySong[]): { added: number; updated: number } {
  const lib = loadLibrary();
  const byTitle = new Map(lib.map((e, i) => [normalize(e.title), i] as const));
  let added = 0, updated = 0;
  for (const s of cloudSongs) {
    if (!s?.title) continue;
    const key = normalize(s.title);
    const at = byTitle.get(key);
    const entry: LibrarySong = { ...s, bg: s.bg ?? null, seed: false };
    if (at != null) { entry.id = lib[at].id; lib[at] = entry; updated++; }
    else { lib.unshift(entry); byTitle.set(key, 0); added++; }
  }
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(lib.slice(0, 1000)));
  } catch {}
  emitChange();
  return { added, updated };
}

const normalize = (s: string) =>
  (s || '').toLowerCase().replace(/[\s,，。.、!！?？]/g, '').trim();

export interface SeedSong {
  title: string;
  englishTitle?: string;
  producer?: string;
  lyrics?: string;
  englishLyrics?: string;
}

const SEED_FLAG = 'worship_lib_seed_version';

// Top up the library with built-in catalog songs the user doesn't already have.
// Versioned so a future, larger catalog can add the new ones without resurrecting
// entries the user deleted at an earlier version.
export function seedLibrary(seeds: SeedSong[], version: number) {
  try {
    const done = Number(localStorage.getItem(SEED_FLAG) || '0');
    if (done >= version) return;
    const lib = loadLibrary();
    const have = new Set(lib.map((e) => normalize(e.title)));
    const additions: LibrarySong[] = seeds
      .filter((s) => s.title && !have.has(normalize(s.title)))
      .map((s) => ({
        id: crypto.randomUUID(),
        title: s.title,
        englishTitle: s.englishTitle || '',
        producer: s.producer || '',
        lyrics: s.lyrics || '',
        englishLyrics: s.englishLyrics || '',
        bg: null,
        seed: true,
        updatedAt: 0,
      }));
    if (additions.length) localStorage.setItem(LIB_KEY, JSON.stringify([...lib, ...additions].slice(0, 1000)));
    localStorage.setItem(SEED_FLAG, String(version));
  } catch {}
}

export function libraryStats() {
  const lib = loadLibrary();
  return { total: lib.length, withLyrics: lib.filter((e) => (e.lyrics || '').trim()).length };
}

// Fuzzy-match a one-line query (a title, a lyric line, or a producer name)
// against the local library. Returns the best match + a score (0 = no match).
export function searchLibrary(query: string): { song: LibrarySong; score: number } | null {
  const q = normalize(query);
  if (!q) return null;
  const lib = loadLibrary();
  let best: { song: LibrarySong; score: number } | null = null;

  for (const song of lib) {
    const title = normalize(song.title);
    const eng = normalize(song.englishTitle || '');
    const prod = normalize(song.producer || '');
    let score = 0;

    if (title && title === q) score = 100;
    else if (title && (title.includes(q) || q.includes(title))) score = Math.max(score, 80);
    if (eng && (eng.includes(q) || q.includes(eng))) score = Math.max(score, 75);
    if (prod && prod.includes(q)) score = Math.max(score, 50);

    // Lyric-fragment match: does any lyric line contain the query (or vice versa)?
    if (score < 70) {
      const lyricLines = (song.lyrics || '').split('\n').map(normalize).filter(Boolean);
      for (const line of lyricLines) {
        if (line.includes(q) || (q.length >= 4 && q.includes(line) && line.length >= 4)) {
          score = Math.max(score, 65);
          break;
        }
      }
    }

    if (score > 0 && (!best || score > best.score)) best = { song, score };
  }
  return best;
}
