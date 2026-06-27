// ── Local song "database" (free, no backend) ─────────────────────────────────
// Every song the user confirms/makes is stored in the browser. Future Auto-mode
// lookups search this growing library by title / English title / producer /
// lyric fragment — so "系统去数据库里找" works fully offline and for free.

export interface LibrarySong {
  id: string;
  title: string;
  englishTitle?: string;
  producer?: string;
  lyrics: string;
  englishLyrics?: string;
  updatedAt: number;
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
    updatedAt: Date.now(),
  };
  if (idx >= 0) lib[idx] = { ...lib[idx], ...entry, id: lib[idx].id };
  else lib.unshift(entry);
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(lib.slice(0, 500)));
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
