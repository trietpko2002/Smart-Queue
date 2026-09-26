/**
 * Bộ gõ Tiếng Việt hỗ trợ Telex, VNI và Bỏ dấu trực quan (Direct Accent & Tone)
 * Thiết kế chuẩn cho màn hình cảm ứng Kiosk / Bàn quầy thông minh
 */

export type TypingMethod = 'TELEX' | 'VNI' | 'DIRECT';

// Bảng ánh xạ nguyên âm dấu thanh
export const VOWEL_TONE_TABLE: Record<string, string[]> = {
  // a: ngang, sac, huyen, hoi, nga, nang
  'a': ['a', 'á', 'à', 'ả', 'ã', 'ạ'],
  'ă': ['ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'],
  'â': ['â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'],
  'e': ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'],
  'ê': ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'],
  'i': ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
  'o': ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'],
  'ô': ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'],
  'ơ': ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
  'u': ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
  'ư': ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'],
  'y': ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'],
  // Uppercase
  'A': ['A', 'Á', 'À', 'Ả', 'Ã', 'Ạ'],
  'Ă': ['Ă', 'Ắ', 'Ằ', 'Ẳ', 'Ẵ', 'Ặ'],
  'Â': ['Â', 'Ấ', 'Ầ', 'Ẩ', 'Ẫ', 'Ậ'],
  'E': ['E', 'É', 'È', 'Ẻ', 'Ẽ', 'Ẹ'],
  'Ê': ['Ê', 'Ế', 'Ề', 'Ể', 'Ễ', 'Ệ'],
  'I': ['I', 'Í', 'Ì', 'Ỉ', 'Ĩ', 'Ị'],
  'O': ['O', 'Ó', 'Ò', 'Ỏ', 'Õ', 'Ọ'],
  'Ô': ['Ô', 'Ố', 'Ồ', 'Ổ', 'Ỗ', 'Ộ'],
  'Ơ': ['Ơ', 'Ớ', 'Ờ', 'Ở', 'Ỡ', 'Ợ'],
  'U': ['U', 'Ú', 'Ù', 'Ủ', 'Ũ', 'Ụ'],
  'Ư': ['Ư', 'Ứ', 'Ừ', 'Ử', 'Ữ', 'Ự'],
  'Y': ['Y', 'Ý', 'Ỳ', 'Ỷ', 'Ỹ', 'Ỵ'],
};

// Tìm thông tin nguyên âm gốc và dấu hiện tại (0: ngang, 1: sắc, 2: huyền, 3: hỏi, 4: ngã, 5: nặng)
export function getVowelInfo(char: string): { base: string; tone: number } | null {
  for (const [base, tones] of Object.entries(VOWEL_TONE_TABLE)) {
    const idx = tones.indexOf(char);
    if (idx !== -1) {
      return { base, tone: idx };
    }
  }
  return null;
}

// Chuyển đổi nguyên âm có mũ / móc
const ACCENT_TRANSFORMS: Record<string, Record<string, string>> = {
  // a + a -> â, a + w -> ă
  a: { a: 'â', w: 'ă' },
  A: { a: 'Â', A: 'Â', w: 'Ă', W: 'Ă' },
  â: { a: 'a' },
  Â: { a: 'A', A: 'A' },
  ă: { w: 'a' },
  Ă: { w: 'A', W: 'A' },

  // e + e -> ê
  e: { e: 'ê' },
  E: { e: 'Ê', E: 'Ê' },
  ê: { e: 'e' },
  Ê: { e: 'E', E: 'E' },

  // o + o -> ô, o + w -> ơ
  o: { o: 'ô', w: 'ơ' },
  O: { o: 'Ô', O: 'Ô', w: 'Ơ', W: 'Ơ' },
  ô: { o: 'o' },
  Ô: { o: 'O', O: 'O' },
  ơ: { w: 'o' },
  Ơ: { w: 'O', W: 'O' },

  // u + w -> ư
  u: { w: 'ư' },
  U: { w: 'Ư', W: 'Ư' },
  ư: { w: 'u' },
  Ư: { w: 'U', W: 'U' },

  // d + d -> đ
  d: { d: 'đ' },
  D: { d: 'Đ', D: 'Đ' },
  đ: { d: 'd' },
  Đ: { d: 'D', D: 'D' },
};

// VNI Numbers to Accent/Tone
// 1: sắc, 2: huyền, 3: hỏi, 4: ngã, 5: nặng
// 6: mũ (â, ê, ô), 7: móc (ơ, ư), 8: trăng (ă), 9: gạch (đ), 0: xóa dấu
const VNI_ACCENT_MAP: Record<string, Record<string, string>> = {
  '6': { a: 'â', A: 'Â', e: 'ê', E: 'Ê', o: 'ô', O: 'Ô', â: 'a', Â: 'A', ê: 'e', Ê: 'E', ô: 'o', Ô: 'O' },
  '7': { o: 'ơ', O: 'Ơ', u: 'ư', U: 'Ư', ơ: 'o', Ơ: 'O', ư: 'u', Ư: 'U' },
  '8': { a: 'ă', A: 'Ă', ă: 'a', Ă: 'A' },
  '9': { d: 'đ', D: 'Đ', đ: 'd', Đ: 'D' },
};

/**
 * Tìm vị trí nguyên âm nhận dấu thanh chính trong một từ tiếng Việt
 */
function findToneTargetIndex(word: string): number {
  const chars = Array.from(word);
  const vowelIndices: number[] = [];

  for (let i = 0; i < chars.length; i++) {
    if (getVowelInfo(chars[i])) {
      vowelIndices.push(i);
    }
  }

  if (vowelIndices.length === 0) return -1;
  if (vowelIndices.length === 1) return vowelIndices[0];

  // Nếu có nguyên âm mang mũ/móc (ê, ơ, ư, ô, â, ă) thì ưu tiên đặt dấu vào đó
  for (const idx of vowelIndices) {
    const char = chars[idx].toLowerCase();
    if (['ê', 'ơ', 'ư', 'ô', 'â', 'ă'].includes(char)) {
      return idx;
    }
  }

  // Trường hợp 2 nguyên âm
  if (vowelIndices.length === 2) {
    const [first, second] = vowelIndices;
    const pair = (chars[first] + chars[second]).toLowerCase();
    const hasConsonantAfter = second < chars.length - 1;

    // Các cặp oa, oe, uy, uê: nếu không có phụ âm cuối thì dấu ở nguyên âm thứ 2
    if (['oa', 'oe', 'uy', 'ue'].includes(pair)) {
      return hasConsonantAfter ? second : second;
    }

    // Nếu có phụ âm sau (ví dụ: "toàn", "hoàng", "thiên"): dấu ở nguyên âm thứ 2
    if (hasConsonantAfter) {
      return second;
    }

    // Mặc định cho trường hợp không có phụ âm cuối (ví dụ: "hóa" hoặc "hoà"): đặt ở âm thứ 1 hoặc thứ 2
    return second;
  }

  // Trường hợp 3 nguyên âm (oai, uao, oao, uyu): thường dấu ở nguyên âm giữa
  if (vowelIndices.length >= 3) {
    return vowelIndices[1];
  }

  return vowelIndices[vowelIndices.length - 1];
}

/**
 * Gán dấu thanh vào từ (0: không dấu, 1: sắc, 2: huyền, 3: hỏi, 4: ngã, 5: nặng)
 */
export function applyToneToWord(word: string, targetTone: number): string {
  const targetIdx = findToneTargetIndex(word);
  if (targetIdx === -1) return word;

  const chars = Array.from(word);
  const info = getVowelInfo(chars[targetIdx]);
  if (!info) return word;

  // Nếu gõ lại cùng dấu -> bỏ dấu (toggle off về tone 0)
  const finalTone = info.tone === targetTone ? 0 : targetTone;
  const baseTones = VOWEL_TONE_TABLE[info.base];
  if (baseTones && baseTones[finalTone]) {
    chars[targetIdx] = baseTones[finalTone];
    return chars.join('');
  }

  return word;
}

/**
 * Xử lý gõ phím kiểu TELEX
 */
export function processTelexKey(currentWord: string, key: string): { newWord: string; handled: boolean } {
  const lk = key.toLowerCase();

  // 1. Kiểm tra phím dấu thanh Telex (s: sắc, f: huyền, r: hỏi, x: ngã, j: nặng, z: xóa dấu)
  const telexTones: Record<string, number> = {
    s: 1, // Sắc
    f: 2, // Huyền
    r: 3, // Hỏi
    x: 4, // Ngã
    j: 5, // Nặng
    z: 0, // Xóa dấu
  };

  if (telexTones[lk] !== undefined && currentWord.length > 0) {
    const hasVowels = findToneTargetIndex(currentWord) !== -1;
    if (hasVowels) {
      const updated = applyToneToWord(currentWord, telexTones[lk]);
      if (updated !== currentWord) {
        return { newWord: updated, handled: true };
      }
    }
  }

  // 2. Kiểm tra phím mũ / móc Telex (a, e, o, w, d)
  if (currentWord.length > 0) {
    const lastChar = currentWord[currentWord.length - 1];
    const lastLower = lastChar.toLowerCase();

    // d + d -> đ
    if (lastLower === 'd' && lk === 'd') {
      const isUpper = lastChar === 'D';
      const replacement = isUpper ? (key === 'D' ? 'Đ' : 'Đ') : 'đ';
      const newWord = currentWord.slice(0, -1) + replacement;
      return { newWord, handled: true };
    }
    if (lastLower === 'đ' && lk === 'd') {
      const isUpper = lastChar === 'Đ';
      const newWord = currentWord.slice(0, -1) + (isUpper ? 'D' : 'd');
      return { newWord, handled: true };
    }

    // Các nguyên âm: a+a -> â, a+w -> ă, e+e -> ê, o+o -> ô, o+w -> ơ, u+w -> ư
    // Lưu ý giữ nguyên dấu thanh nếu ký tự trước đó đã có dấu
    const lastInfo = getVowelInfo(lastChar);
    if (lastInfo) {
      const transforms = ACCENT_TRANSFORMS[lastInfo.base];
      if (transforms && transforms[lk]) {
        const newBase = transforms[lk];
        const newVowel = VOWEL_TONE_TABLE[newBase]?.[lastInfo.tone] || newBase;
        const newWord = currentWord.slice(0, -1) + newVowel;
        return { newWord, handled: true };
      }
    }

    // Đặc biệt với phím 'w': nếu chữ cuối không phải a/o/u nhưng từ có u/o đứng trước (như "duw" -> "dư", "tuw" -> "tư", "quow" -> "quơ")
    if (lk === 'w') {
      const chars = Array.from(currentWord);
      for (let i = chars.length - 1; i >= 0; i--) {
        const info = getVowelInfo(chars[i]);
        if (info && (info.base.toLowerCase() === 'u' || info.base.toLowerCase() === 'o' || info.base.toLowerCase() === 'a')) {
          const transforms = ACCENT_TRANSFORMS[info.base];
          if (transforms && transforms['w']) {
            const newBase = transforms['w'];
            chars[i] = VOWEL_TONE_TABLE[newBase]?.[info.tone] || newBase;
            return { newWord: chars.join(''), handled: true };
          }
        }
      }
    }
  }

  return { newWord: currentWord + key, handled: false };
}

/**
 * Xử lý gõ phím kiểu VNI
 */
export function processVniKey(currentWord: string, key: string): { newWord: string; handled: boolean } {
  // 1: sắc, 2: huyền, 3: hỏi, 4: ngã, 5: nặng, 0: xóa dấu
  const vniTones: Record<string, number> = {
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '0': 0,
  };

  if (vniTones[key] !== undefined && currentWord.length > 0) {
    const hasVowels = findToneTargetIndex(currentWord) !== -1;
    if (hasVowels) {
      const updated = applyToneToWord(currentWord, vniTones[key]);
      return { newWord: updated, handled: true };
    }
  }

  // 6: mũ (â, ê, ô), 7: móc (ơ, ư), 8: trăng (ă), 9: gạch (đ)
  if (['6', '7', '8', '9'].includes(key) && currentWord.length > 0) {
    const map = VNI_ACCENT_MAP[key];
    const chars = Array.from(currentWord);

    // Duyệt ngược từ cuối từ để tìm ký tự thích hợp biến đổi
    for (let i = chars.length - 1; i >= 0; i--) {
      const c = chars[i];
      const info = getVowelInfo(c);

      if (key === '9') {
        if (c.toLowerCase() === 'd') {
          chars[i] = c === 'D' ? 'Đ' : 'đ';
          return { newWord: chars.join(''), handled: true };
        } else if (c.toLowerCase() === 'đ') {
          chars[i] = c === 'Đ' ? 'D' : 'd';
          return { newWord: chars.join(''), handled: true };
        }
      } else if (info && map && map[info.base]) {
        const newBase = map[info.base];
        chars[i] = VOWEL_TONE_TABLE[newBase]?.[info.tone] || newBase;
        return { newWord: chars.join(''), handled: true };
      }
    }
  }

  return { newWord: currentWord + key, handled: false };
}

/**
 * Danh sách nguyên âm tiếng Việt đầy đủ phục vụ bảng chọn trực quan
 */
export const VIETNAMESE_ACCENTED_PALETTE = {
  A: ['a', 'à', 'á', 'ả', 'ã', 'ạ', 'ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ', 'â', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ'],
  E: ['e', 'è', 'é', 'ẻ', 'ẽ', 'ẹ', 'ê', 'ề', 'ế', 'ể', 'ễ', 'ệ'],
  I: ['i', 'ì', 'í', 'ỉ', 'ĩ', 'ị'],
  O: ['o', 'ò', 'ó', 'ỏ', 'õ', 'ọ', 'ô', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ', 'ơ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ'],
  U: ['u', 'ù', 'ú', 'ủ', 'ũ', 'ụ', 'ư', 'ừ', 'ứ', 'ử', 'ữ', 'ự'],
  Y: ['y', 'ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ'],
  D: ['d', 'đ'],
};

export const VIETNAMESE_ACCENT_KEYS_DIRECT = [
  'Ă', 'Â', 'Đ', 'Ê', 'Ô', 'Ơ', 'Ư'
];
