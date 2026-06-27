import { useEffect, useState } from 'react';
import ManualMode from './modes/ManualMode';
import AutoMode from './modes/AutoMode';
import { seedLibrary } from './lib/songLibrary';
import { SEED_SONGS, SEED_VERSION } from './lib/seedSongs';

type Mode = 'auto' | 'manual';

export default function App() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('ppt_mode') as Mode) || 'auto');

  // Top up the local song "database" with the built-in catalog (once per version).
  useEffect(() => {
    seedLibrary(SEED_SONGS, SEED_VERSION);
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
        <button onClick={() => change('auto')} className={`px-4 h-9 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${mode === 'auto' ? 'bg-emerald-600 text-white shadow' : 'text-outline/50 hover:text-[#2C2C2C]'}`}>
          <span className="material-symbols-outlined text-[16px]">auto_awesome</span>Auto
        </button>
        <button onClick={() => change('manual')} className={`px-4 h-9 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${mode === 'manual' ? 'bg-emerald-600 text-white shadow' : 'text-outline/50 hover:text-[#2C2C2C]'}`}>
          <span className="material-symbols-outlined text-[16px]">tune</span>手动
        </button>
      </div>
    </div>
  );

  return mode === 'auto' ? <AutoMode modeToggle={modeToggle} /> : <ManualMode modeToggle={modeToggle} />;
}
