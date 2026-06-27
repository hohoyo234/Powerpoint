import { useEffect, useState } from 'react';
import ManualMode from './modes/ManualMode';
import AutoMode from './modes/AutoMode';
import LibraryMode from './modes/LibraryMode';
import { seedLibrary, setCloudHooks, mergeCloudSongs, loadLibrary } from './lib/songLibrary';
import { SEED_SONGS, SEED_VERSION } from './lib/seedSongs';
import { cloudEnabled, cloudFetchAll, cloudUpsert, cloudDelete, cloudBulkInsert } from './lib/cloud';

type Mode = 'auto' | 'manual' | 'library';

const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, '').trim();

export default function App() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('ppt_mode') as Mode) || 'auto');

  useEffect(() => {
    // 1) Seed the local catalog once per version.
    seedLibrary(SEED_SONGS, SEED_VERSION);

    // 2) Cloud sync (shared library). Fire-and-forget; the app works offline if
    //    any of this fails.
    if (!cloudEnabled) return;
    setCloudHooks({
      upsert: (s) => { cloudUpsert(s).catch(() => {}); },
      remove: (t) => { cloudDelete(t).catch(() => {}); },
    });
    (async () => {
      try {
        const cloud = await cloudFetchAll();
        if (cloud.length === 0) {
          // First ever run: populate the cloud with the local (seeded) library.
          await cloudBulkInsert(loadLibrary());
        } else {
          // Pull cloud → local (cloud wins), then push any local-only songs up.
          mergeCloudSongs(cloud);
          const have = new Set(cloud.map((s) => norm(s.title)));
          const localOnly = loadLibrary().filter((s) => s.title && !have.has(norm(s.title)));
          if (localOnly.length) await cloudBulkInsert(localOnly);
        }
      } catch (e) {
        console.warn('Cloud sync skipped:', e);
      }
    })();
  }, []);

  const change = (m: Mode) => {
    setMode(m);
    try { localStorage.setItem('ppt_mode', m); } catch {}
  };

  // Shared brand + Auto/Manual switch, rendered inside each mode's header.
  const modeToggle = (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] shrink-0" />
      <div className="hidden md:block min-w-0">
        <h1 className="font-serif font-black text-[#2C2C2C] text-lg tracking-tight leading-none truncate">
          敬拜 <span className="text-emerald-500/80 italic">PPT</span> 制作器
        </h1>
      </div>
      <div className="flex bg-white rounded-2xl p-1 border border-[#E5E0DA]/60 shadow-sm ml-1">
        <button onClick={() => change('auto')} className={`px-3.5 h-9 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${mode === 'auto' ? 'bg-emerald-600 text-white shadow' : 'text-outline/50 hover:text-[#2C2C2C]'}`}>
          <span className="material-symbols-outlined text-[16px]">auto_awesome</span><span className="hidden sm:inline">Auto</span>
        </button>
        <button onClick={() => change('manual')} className={`px-3.5 h-9 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${mode === 'manual' ? 'bg-emerald-600 text-white shadow' : 'text-outline/50 hover:text-[#2C2C2C]'}`}>
          <span className="material-symbols-outlined text-[16px]">tune</span><span className="hidden sm:inline">手动</span>
        </button>
        <button onClick={() => change('library')} className={`px-3.5 h-9 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${mode === 'library' ? 'bg-emerald-600 text-white shadow' : 'text-outline/50 hover:text-[#2C2C2C]'}`}>
          <span className="material-symbols-outlined text-[16px]">library_music</span><span className="hidden sm:inline">歌库</span>
        </button>
      </div>
    </div>
  );

  if (mode === 'library') return <LibraryMode modeToggle={modeToggle} />;
  return mode === 'auto' ? <AutoMode modeToggle={modeToggle} /> : <ManualMode modeToggle={modeToggle} />;
}
