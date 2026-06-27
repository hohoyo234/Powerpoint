import type { SeedSong } from './songLibrary';

// Bump when the catalog below changes so existing users get the new songs.
export const SEED_VERSION = 1;

// ── Public-domain hymns (lyrics safe to ship; copyright long expired) ─────────
// These come ready-to-use as examples. Everything else is title-only — paste the
// lyrics once and they're saved to your local library forever.
const PD_HYMNS: SeedSong[] = [
  {
    title: '奇异恩典',
    englishTitle: 'Amazing Grace',
    producer: 'John Newton',
    lyrics:
      '奇异恩典 何等甘甜\n我罪已得赦免\n前我失丧 今被寻回\n瞎眼今得看见\n\n如此恩典 使我敬畏\n使我心得安慰\n初信之时 即蒙恩惠\n真是何等宝贵\n\n许多危险 试炼网罗\n我已安然经过\n靠主恩典 安全不怕\n更引导我归家\n\n将来禧年 圣徒欢聚\n恩光爱谊千年\n喜乐颂赞 在父座前\n深望那日快现',
    englishLyrics:
      'Amazing grace how sweet the sound\nThat saved a wretch like me\nI once was lost but now am found\nWas blind but now I see',
  },
  {
    title: '圣哉，圣哉，圣哉',
    englishTitle: 'Holy, Holy, Holy',
    producer: 'Reginald Heber',
    lyrics:
      '圣哉 圣哉 圣哉\n全能大主宰\n清晨我众歌声\n穿云上达至尊\n圣哉 圣哉 圣哉\n慈悲与全能\n荣耀与赞美\n归三一真神',
  },
  {
    title: '这是天父世界',
    englishTitle: 'This Is My Father’s World',
    producer: 'Maltbie D. Babcock',
    lyrics:
      '这是天父世界\n我们侧耳要听\n宇宙歌唱 四围响应\n星辰作乐同声\n这是天父世界\n我心满有安宁\n花草树木 苍天碧海\n述说天父全能',
  },
  {
    title: '我心灵得安宁',
    englishTitle: 'It Is Well with My Soul',
    producer: 'Horatio Spafford',
    lyrics:
      '有时享平安 如江河又稳又静\n有时遇悲伤 像海浪滚滚而来\n不论何环境 我已蒙主引领\n我心灵得安宁 得安宁\n我心灵 我心灵得安宁',
  },
  {
    title: '靠近主怀',
    englishTitle: 'Nearer, My God, to Thee',
    producer: 'Sarah F. Adams',
  },
];

// ── Title catalog (findable by name; lyrics filled on first use & saved) ──────
// Titles/producers are factual references, not copyrighted lyrics.
const TITLES: [string, string?, string?][] = [
  // 赞美之泉 Stream of Praise
  ['这一生最美的祝福', "The Greatest Blessing in Life", '赞美之泉'],
  ['一无所缺', undefined, '赞美之泉'],
  ['全然为你', undefined, '赞美之泉'],
  ['唯有耶稣', undefined, '赞美之泉'],
  ['不一样', undefined, '赞美之泉'],
  ['彩虹下的约定', undefined, '赞美之泉'],
  ['我要向高山举目', undefined, '赞美之泉'],
  ['每一天', undefined, '赞美之泉'],
  ['天父的花园', undefined, '赞美之泉'],
  ['宝贵十架', undefined, '赞美之泉'],
  ['差遣我', undefined, '赞美之泉'],
  ['注目看耶稣', undefined, '赞美之泉'],
  ['永远爱你', undefined, '赞美之泉'],
  ['不再一样', undefined, '赞美之泉'],
  ['赞美之泉', undefined, '赞美之泉'],
  // 约书亚乐团 Joshua Band
  ['活着为要荣耀你', undefined, '约书亚乐团'],
  ['全地都要赞美主', undefined, '约书亚乐团'],
  ['有一件礼物', undefined, '约书亚乐团'],
  ['幸福', undefined, '约书亚乐团'],
  ['永不止息', undefined, '约书亚乐团'],
  ['爱是不保留', undefined, '约书亚乐团'],
  ['复活在我', undefined, '约书亚乐团'],
  ['磐石', undefined, '约书亚乐团'],
  ['君王的爱', undefined, '约书亚乐团'],
  ['宝贵的十字架', undefined, '约书亚乐团'],
  // 我心旋律 / 赞美工程 / 角声
  ['主你永远与我同在', undefined, '我心旋律'],
  ['我知谁掌管明天', undefined, undefined],
  ['一闪一闪亮晶晶', undefined, undefined],
  ['你是我的主', undefined, undefined],
  ['深触我心', undefined, undefined],
  ['让赞美飞扬', undefined, undefined],
  ['我们成为一家人', undefined, undefined],
  ['宣教的中国', undefined, undefined],
  ['古旧十架', 'The Old Rugged Cross', undefined],
  ['你是我的一切', 'You Are My All in All', undefined],
  // 经典圣诗 Classic hymns
  ['普天颂赞', undefined, undefined],
  ['万民颂扬歌', 'Doxology', undefined],
  ['你真伟大', 'How Great Thou Art', undefined],
  ['主活着', 'He Lives', undefined],
  ['恩友歌', 'What a Friend We Have in Jesus', undefined],
  ['坚固保障', 'A Mighty Fortress Is Our God', '马丁路德'],
  ['慈光歌', 'Lead, Kindly Light', undefined],
  ['在花园里', 'In the Garden', undefined],
  ['主爱长阔高深', 'The Love of God', undefined],
  ['全所有献与主', 'I Surrender All', undefined],
  ['有福的确据', 'Blessed Assurance', 'Fanny Crosby'],
  ['因主活着', 'Because He Lives', 'Gloria Gaither'],
  ['一件礼物', undefined, undefined],
  ['野地的花', undefined, undefined],
  ['一沙一世界', undefined, undefined],
  ['活水', undefined, undefined],
  ['脚步', undefined, undefined],
  ['以马内利', undefined, undefined],
  ['你是王', undefined, undefined],
  ['尊贵的王', undefined, undefined],
  ['唱出爱', undefined, undefined],
  ['全新的你', undefined, undefined],
  // Hillsong / Bethel / Elevation (English worship)
  ['What a Beautiful Name', 'What a Beautiful Name', 'Hillsong Worship'],
  ['Oceans', 'Oceans (Where Feet May Fail)', 'Hillsong United'],
  ['Mighty to Save', 'Mighty to Save', 'Hillsong'],
  ['Cornerstone', 'Cornerstone', 'Hillsong'],
  ['Who You Say I Am', 'Who You Say I Am', 'Hillsong Worship'],
  ['King of Kings', 'King of Kings', 'Hillsong Worship'],
  ['Goodness of God', 'Goodness of God', 'Bethel Music'],
  ['Reckless Love', 'Reckless Love', 'Cory Asbury'],
  ['No Longer Slaves', 'No Longer Slaves', 'Bethel Music'],
  ['This Is Amazing Grace', 'This Is Amazing Grace', 'Phil Wickham'],
  ['Living Hope', 'Living Hope', 'Phil Wickham'],
  ['Raise a Hallelujah', 'Raise a Hallelujah', 'Bethel Music'],
  ['Build My Life', 'Build My Life', 'Pat Barrett'],
  ['Graves Into Gardens', 'Graves Into Gardens', 'Elevation Worship'],
  ['The Blessing', 'The Blessing', 'Elevation Worship'],
  ['Way Maker', 'Way Maker', 'Sinach'],
  ['10,000 Reasons', '10,000 Reasons (Bless the Lord)', 'Matt Redman'],
  ['How Great Is Our God', 'How Great Is Our God', 'Chris Tomlin'],
  ['Good Good Father', 'Good Good Father', 'Chris Tomlin'],
  ['Amazing Grace (My Chains Are Gone)', 'Amazing Grace (My Chains Are Gone)', 'Chris Tomlin'],
  ['Great Are You Lord', 'Great Are You Lord', 'All Sons & Daughters'],
  ['In Christ Alone', 'In Christ Alone', 'Keith Getty'],
  ['Holy Spirit', 'Holy Spirit', 'Francesca Battistelli'],
  ['Here I Am to Worship', 'Here I Am to Worship', 'Tim Hughes'],
  ['Shout to the Lord', 'Shout to the Lord', 'Darlene Zschech'],
  ['Open the Eyes of My Heart', 'Open the Eyes of My Heart', 'Paul Baloche'],
  ['Lord I Lift Your Name on High', 'Lord I Lift Your Name on High', undefined],
  ['Forever', 'Forever', 'Kari Jobe'],
  ['Revelation Song', 'Revelation Song', 'Kari Jobe'],
  ['O Come to the Altar', 'O Come to the Altar', 'Elevation Worship'],
  ['Yes I Will', 'Yes I Will', 'Vertical Worship'],
  ['Tremble', 'Tremble', 'Mosaic MSC'],
  ['Do It Again', 'Do It Again', 'Elevation Worship'],
  ['Battle Belongs', 'Battle Belongs', 'Phil Wickham'],
  ['Gratitude', 'Gratitude', 'Brandon Lake'],
  ['Same God', 'Same God', 'Elevation Worship'],
  ['Champion', 'Champion', 'Bethel Music'],
  ['Praise', 'Praise', 'Elevation Worship'],
  ['Firm Foundation', 'Firm Foundation (He Won’t)', 'Cody Carnes'],
];

const FROM_TITLES: SeedSong[] = TITLES.map(([title, englishTitle, producer]) => ({ title, englishTitle, producer }));

export const SEED_SONGS: SeedSong[] = [...PD_HYMNS, ...FROM_TITLES];
