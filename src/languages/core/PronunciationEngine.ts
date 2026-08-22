// Dedicated Pronunciation & Phonology Engine for PAHAM Language Architecture
// Supports English IPA/Word Stress and Mandarin Initials, Finals, 4 Tones, Sandhi Rules, and Tone Pair Drills

import { TonePairItem } from './types';

export interface PinyinInitial {
  letter: string;
  ipa: string;
  description: string;
  audioExampleWord: string;
  category: 'LIP' | 'TONGUE_TIP' | 'TONGUE_ROOT' | 'TONGUE_SURFACE' | 'RETROFLEX' | 'DENTAL_SIBILANT';
}

export interface PinyinFinal {
  letters: string;
  ipa: string;
  description: string;
  audioExampleWord: string;
  category: 'SINGLE' | 'COMPOUND' | 'NASAL';
}

export interface ToneDefinition {
  toneNumber: number;
  name: string;
  chineseName: string;
  pitchContour: string; // e.g. "55" (High Flat)
  pitchDescription: string;
  diacriticExample: string;
  gestureMnemonic: string;
}

export class PronunciationEngine {
  private tonePairs: TonePairItem[] = [];

  /**
   * 4 Mandarin Tones + Neutral Tone Definitions
   */
  public getMandarinTones(): ToneDefinition[] {
    return [
      {
        toneNumber: 1,
        name: 'First Tone (High Flat)',
        chineseName: '第一声 (阴平)',
        pitchContour: '55',
        pitchDescription: 'Tinggi dan datar stabil (seperti menyanyi nada tinggi)',
        diacriticExample: 'mā (妈)',
        gestureMnemonic: 'Gerakan tangan datar ke kanan: —',
      },
      {
        toneNumber: 2,
        name: 'Second Tone (Rising)',
        chineseName: '第二声 (阳平)',
        pitchContour: '35',
        pitchDescription: 'Naik dari sedang ke tinggi (seperti bertanya "Hah?")',
        diacriticExample: 'má (麻)',
        gestureMnemonic: 'Gerakan tangan diagonal naik: /',
      },
      {
        toneNumber: 3,
        name: 'Third Tone (Low Dipping)',
        chineseName: '第三声 (上声)',
        pitchContour: '214',
        pitchDescription: 'Turun ke nada terendah lalu sedikit naik (bernada berat di tenggorokan)',
        diacriticExample: 'mǎ (马)',
        gestureMnemonic: 'Gerakan tangan melengkung turun lalu naik: V',
      },
      {
        toneNumber: 4,
        name: 'Fourth Tone (Falling)',
        chineseName: '第四声 (去声)',
        pitchContour: '51',
        pitchDescription: 'Turun tajam dan tegas dari tinggi ke rendah (seperti memberi perintah "Stop!")',
        diacriticExample: 'mà (骂)',
        gestureMnemonic: 'Gerakan tangan menghentak turun: \\',
      },
      {
        toneNumber: 0,
        name: 'Neutral Tone (Light)',
        chineseName: '轻声',
        pitchContour: 'Light',
        pitchDescription: 'Pendek, ringan, dan tidak bertekanan',
        diacriticExample: 'ma (吗)',
        gestureMnemonic: 'Titik lembut: •',
      },
    ];
  }

  /**
   * 21 Pinyin Initials (声母)
   */
  public getMandarinInitials(): PinyinInitial[] {
    return [
      { letter: 'b', ipa: '[p]', description: 'Bibir rapat tanpa hembusan napas (mirip "b" tegas)', audioExampleWord: '爸爸 (bàba)', category: 'LIP' },
      { letter: 'p', ipa: '[pʰ]', description: 'Bibir rapat dengan hembusan napas kuat (aspirasi)', audioExampleWord: '苹果 (píngguǒ)', category: 'LIP' },
      { letter: 'm', ipa: '[m]', description: 'Sengau bibir (sama seperti "m" Indonesia)', audioExampleWord: '妈妈 (māma)', category: 'LIP' },
      { letter: 'f', ipa: '[f]', description: 'Gigi atas menyentuh bibir bawah ("f")', audioExampleWord: '飞机 (fēijī)', category: 'LIP' },
      { letter: 'd', ipa: '[t]', description: 'Ujung lidah ke gusi atas tanpa hembusan napas', audioExampleWord: '弟弟 (dìdi)', category: 'TONGUE_TIP' },
      { letter: 't', ipa: '[tʰ]', description: 'Ujung lidah ke gusi atas dengan hembusan napas kuat', audioExampleWord: '太阳 (tàiyáng)', category: 'TONGUE_TIP' },
      { letter: 'n', ipa: '[n]', description: 'Sengau ujung lidah ("n")', audioExampleWord: '你好 (nǐhǎo)', category: 'TONGUE_TIP' },
      { letter: 'l', ipa: '[l]', description: 'Lidah menyentuh langit-langit depan ("l")', audioExampleWord: '老师 (lǎoshī)', category: 'TONGUE_TIP' },
      { letter: 'g', ipa: '[k]', description: 'Pangkal lidah ke langit-langit belakang tanpa hembusan', audioExampleWord: '哥哥 (gēge)', category: 'TONGUE_ROOT' },
      { letter: 'k', ipa: '[kʰ]', description: 'Pangkal lidah dengan hembusan napas kuat ("k")', audioExampleWord: '咖啡 (kāfēi)', category: 'TONGUE_ROOT' },
      { letter: 'h', ipa: '[x]', description: 'Gesekan ringan di tenggorokan ("h" dalam)', audioExampleWord: '汉语 (hànyǔ)', category: 'TONGUE_ROOT' },
      { letter: 'j', ipa: '[tɕ]', description: 'Badan lidah menempel langit-langit keras ("c/j" tipis)', audioExampleWord: '今天 (jīntiān)', category: 'TONGUE_SURFACE' },
      { letter: 'q', ipa: '[tɕʰ]', description: 'Badan lidah dengan hembusan napas kuat ("ch" tipis)', audioExampleWord: '七 (qī)', category: 'TONGUE_SURFACE' },
      { letter: 'x', ipa: '[ɕ]', description: 'Gesekan lidah halus mirip "sy/sh" tersenyum', audioExampleWord: '谢谢 (xièxie)', category: 'TONGUE_SURFACE' },
      { letter: 'zh', ipa: '[ʈʂ]', description: 'Ujung lidah ditekuk ke belakang (retroflex) tanpa hembusan', audioExampleWord: '中国 (zhōngguó)', category: 'RETROFLEX' },
      { letter: 'ch', ipa: '[ʈʂʰ]', description: 'Ujung lidah ditekuk ke belakang dengan hembusan napas kuat', audioExampleWord: '吃饭 (chīfàn)', category: 'RETROFLEX' },
      { letter: 'sh', ipa: '[ʂ]', description: 'Ujung lidah ditekuk ke belakang ("sh" tebal)', audioExampleWord: '书 (shū)', category: 'RETROFLEX' },
      { letter: 'r', ipa: '[ʐ]', description: 'Ujung lidah ditekuk ke belakang dengan getaran vokal ("r" lembut)', audioExampleWord: '日 (rì)', category: 'RETROFLEX' },
      { letter: 'z', ipa: '[ts]', description: 'Ujung lidah ke belakang gigi seri depan ("dz/ts" datar)', audioExampleWord: '早上 (zǎoshang)', category: 'DENTAL_SIBILANT' },
      { letter: 'c', ipa: '[tsʰ]', description: 'Ujung lidah ke gigi seri dengan hembusan napas kuat ("ts")', audioExampleWord: '菜 (cài)', category: 'DENTAL_SIBILANT' },
      { letter: 's', ipa: '[s]', description: 'Gesekan gigi seri datar ("s")', audioExampleWord: '三 (sān)', category: 'DENTAL_SIBILANT' },
    ];
  }

  /**
   * Register Tone Pair drills for Mandarin practice
   */
  public registerTonePairs(pairs: TonePairItem[]): void {
    this.tonePairs.push(...pairs);
  }

  /**
   * Get all Tone Pairs
   */
  public getAllTonePairs(): TonePairItem[] {
    return this.tonePairs;
  }

  /**
   * Get Tone Pairs by tone combination (e.g. Tone 1 + Tone 4)
   */
  public getTonePairsByCombination(t1: number, t2: number): TonePairItem[] {
    return this.tonePairs.filter(p => p.tonePair[0] === t1 && p.tonePair[1] === t2);
  }
}

export const pronunciationEngine = new PronunciationEngine();
