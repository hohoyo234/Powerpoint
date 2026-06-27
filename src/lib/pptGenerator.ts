// ── Standalone worship .pptx generator ────────────────────────────────────────
// Faithful port of the generation engine from the original GraceFlow app, with
// all Supabase / auth / church code removed. Given a list of songs and the deck
// settings, it builds a 16:9 PowerPoint that matches the on-screen preview and
// returns it as a Blob.

import { pinyin } from 'pinyin-pro';
import {
  resolveSlideColors,
  paginateLyrics,
  expandSongSections,
  pptShadow,
  type ShadowLevel,
} from './pptTheme';

// Hanyu Pinyin (tone marks) for a Chinese line. Non-Chinese text is kept as-is.
export const toPinyin = (s: string): string => {
  try {
    return pinyin(s || '', { toneType: 'symbol' });
  } catch {
    return '';
  }
};

export interface BgOption {
  id: string;
  label?: string;
  url?: string | null;
  color?: string | null;
  isAi?: boolean;
  isAiResult?: boolean;
}

export interface SongInput {
  id: string;
  title: string;
  englishTitle?: string;
  lyrics: string;
  englishLyrics?: string;
  /** Per-song background override (used when "unify background" is OFF). */
  customBg?: BgOption | null;
  /** Optional per-song overrides — fall back to the global settings. */
  lyricColor?: string;
  translationColor?: string;
  lyricFontSize?: number;
  translationFontSize?: number;
  linesPerSlide?: number;
  shadow?: boolean;
}

export interface DeckSettings {
  selectedBg: BgOption;
  linesPerSlide: number;
  lyricColor: string;
  translationColor: string;
  lyricFontSize: number;
  translationFontSize: number;
  enableShadow: boolean;
  shadowLevel: ShadowLevel;
  enablePinyin: boolean;
  showSongTitle: boolean;
  /** When ON every song uses the global font sizes (per-song sizes ignored). */
  unifyFontSize: boolean;
  /** When ON every song uses the global background (per-song bg ignored). */
  unifyBackground: boolean;
}

export interface GenerateResult {
  blob: Blob;
  /** True if any background image couldn't embed and fell back to a solid colour. */
  bgEmbedFailed: boolean;
}

// Pre-fetch an external image URL as base64 (for reliable .pptx embedding).
async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url || url.startsWith('data:')) return url || null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Failed to fetch image as base64:', url, e);
    return null;
  }
}

// Build the deck and return it as a Blob. Mirrors the original generateSongSlides
// logic so the downloaded file looks identical to the live preview.
export async function generateDeck(
  songsToExport: SongInput[],
  s: DeckSettings,
): Promise<GenerateResult> {
  const { default: pptxgen } = await import('pptxgenjs');
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  let bgEmbedFailed = false;

  // Pre-fetch all background images as base64 to ensure they embed properly.
  const bgUrlCache = new Map<string, string>();
  const urlsToFetch = new Set<string>();
  songsToExport.forEach((song) => {
    const bg = s.unifyBackground ? s.selectedBg : song.customBg || s.selectedBg;
    if (bg?.url && !bg.url.startsWith('data:')) urlsToFetch.add(bg.url);
  });
  await Promise.all(
    Array.from(urlsToFetch).map(async (url) => {
      const b64 = await fetchImageAsBase64(url);
      if (b64) bgUrlCache.set(url, b64);
    }),
  );

  const titleFont = 'Microsoft YaHei';
  const bodyFont = 'Microsoft YaHei';

  const generateSongSlides = (song: SongInput, isMultiple: boolean) => {
    const activeBg = s.unifyBackground ? s.selectedBg : song.customBg || s.selectedBg;
    const userLc = song.lyricColor || s.lyricColor;
    const userTc = song.translationColor || s.translationColor;
    const colors = resolveSlideColors(activeBg, userLc, userTc);
    const lc = colors.lc.replace('#', '');
    const tc = colors.tc.replace('#', '');
    const lps = song.linesPerSlide || s.linesPerSlide;
    const lfs = s.unifyFontSize ? s.lyricFontSize : song.lyricFontSize || s.lyricFontSize;
    const tfs = s.unifyFontSize
      ? s.translationFontSize
      : song.translationFontSize || s.translationFontSize;
    const shadowOn = song.shadow !== undefined ? song.shadow : s.enableShadow;
    const textShadow = shadowOn ? pptShadow(s.shadowLevel) : undefined;

    const setSlideBg = (slide: any) => {
      if (activeBg?.url) {
        const cached = bgUrlCache.get(activeBg.url);
        if (cached) {
          slide.background = { data: cached };
        } else if (activeBg.url.startsWith('data:')) {
          slide.background = { data: activeBg.url };
        } else {
          // Couldn't embed (CORS / timeout). Fall back to a solid colour so the
          // file still generates, and remember it so we can warn the user.
          bgEmbedFailed = true;
          slide.background = { color: activeBg?.color || '064E3B' };
        }
      } else {
        slide.background = { color: activeBg?.color || '064E3B' };
      }
      if (colors.overlay) {
        slide.addShape(pres.ShapeType.rect, {
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
          fill: { color: '000000', transparency: 55 },
          line: { type: 'none' },
        });
      }
    };

    // Title (cover) slide(s) — only when "show song name" is on.
    if (s.showSongTitle) {
      if (isMultiple) {
        const headerSlide = pres.addSlide();
        setSlideBg(headerSlide);
        headerSlide.addText('SONG', {
          x: 0, y: 1.0, w: '100%', align: 'center',
          fontFace: bodyFont, fontSize: 14, color: 'A7F3D0', bold: true, charSpacing: 10,
        });
        headerSlide.addText(song.title, {
          x: 0, y: 2.2, w: '100%', h: 1.5, align: 'center',
          fontFace: titleFont, fontSize: 64, color: 'FFFFFF', bold: true, shadow: textShadow,
        });
        headerSlide.addShape(pres.ShapeType.rect, {
          x: 4.25, y: 4.2, w: 1.5, h: 0.05, fill: { color: 'A7F3D0' },
        });
      }

      const slide = pres.addSlide();
      setSlideBg(slide);
      if (isMultiple) {
        slide.addText('WORSHIP SONG', {
          x: 0, y: 0.8, w: '100%', align: 'center',
          fontFace: bodyFont, fontSize: 12, color: 'A7F3D0', bold: true, charSpacing: 15,
        });
      }
      slide.addText(song.title, {
        x: 0, y: 1.5, w: '100%', h: 2, align: 'center',
        fontFace: titleFont, fontSize: 48, color: lc, bold: true, shadow: textShadow,
      });
      slide.addText(song.englishTitle || '', {
        x: 0, y: 3.5, w: '100%', h: 1, align: 'center',
        fontFace: bodyFont, fontSize: 24, color: tc, shadow: textShadow,
      });
    }

    // Expand repeated [副歌]/[主歌] sections (chorus typed once), then paginate.
    const exp = expandSongSections(song.lyrics || '', song.englishLyrics || '');
    const slidesContent = paginateLyrics(exp.lyrics, exp.english, lps);
    const transRatio = lfs > 0 ? tfs / lfs : 0.5;
    const pinyinH = s.enablePinyin ? 0.4 : 0;

    slidesContent.forEach((slideLines) => {
      const lyricPt = Math.max(12, Math.min(72, lfs));
      const transPt = Math.max(10, Math.min(48, Math.round(lfs * transRatio)));
      const pinyinPt = Math.max(10, Math.round(lyricPt * 0.45));
      const lSlide = pres.addSlide();
      setSlideBg(lSlide);
      // Vertically centre the block so 2-line and 4-line pages both look good.
      const blockH = slideLines.reduce((h, l) => h + pinyinH + 0.8 + (l.en ? 0.8 : 0), 0);
      let currentY = Math.max(0.3, (5.625 - blockH) / 2);
      slideLines.forEach(({ cn, en }) => {
        if (s.enablePinyin) {
          const py = toPinyin(cn);
          if (py) {
            lSlide.addText(py, {
              x: 0, y: currentY, w: '100%', h: pinyinH, align: 'center',
              fontFace: bodyFont, fontSize: pinyinPt, color: lc, shadow: textShadow,
            });
          }
          currentY += pinyinH;
        }
        lSlide.addText(cn, {
          x: 0, y: currentY, w: '100%', h: 0.8, align: 'center',
          fontFace: titleFont, fontSize: lyricPt, color: lc, bold: true, shadow: textShadow,
        });
        currentY += 0.8;
        if (en) {
          lSlide.addText(en, {
            x: 0, y: currentY, w: '100%', h: 0.6, align: 'center',
            fontFace: bodyFont, fontSize: transPt, color: tc, italic: true, shadow: textShadow,
          });
          currentY += 0.8;
        }
      });
    });
  };

  const isMultiple = songsToExport.length > 1;
  songsToExport.forEach((song) => generateSongSlides(song, isMultiple));

  const blob = (await pres.write({ outputType: 'blob' })) as Blob;
  return { blob, bgEmbedFailed };
}

// Trigger a browser download of a generated deck Blob.
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.pptx') ? fileName : `${fileName}.pptx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
