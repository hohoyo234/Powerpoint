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
  return entry;
}

export function deleteFromLibrary(id: string) {
  const lib = loadLibrary().filter((e) => e.id !== id);
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(lib));
  } catch {}
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
