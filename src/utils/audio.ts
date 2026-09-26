// Web Audio chime generator and Vietnamese Voice Text-to-Speech synthesizer

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Gentle pleasant 2-tone airport/hospital chime
export function playChime(): Promise<void> {
  return new Promise(resolve => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: C5 (523.25 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.25);
      gain2.gain.setValueAtTime(0, now + 0.25);
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.9);

      setTimeout(() => resolve(), 900);
    } catch {
      resolve();
    }
  });
}

// Bảng phiên âm chữ cái Latin sang tiếng Việt chuẩn phục vụ đọc số thứ tự hành chính / bệnh viện / ngân hàng
const VIET_LETTERS: Record<string, string> = {
  A: 'A',
  B: 'Bê',
  C: 'Xê',
  D: 'Đê',
  E: 'E',
  F: 'Ép',
  G: 'Giê',
  H: 'Hắt',
  I: 'I',
  J: 'Giây',
  K: 'Ca',
  L: 'E-lờ',
  M: 'Em',
  N: 'En',
  O: 'O',
  P: 'Pê',
  Q: 'Quy',
  R: 'Rờ',
  S: 'Sờ',
  T: 'Tê',
  U: 'U',
  V: 'Vê',
  W: 'Vê kép',
  X: 'Ích',
  Y: 'I dài',
  Z: 'Dét',
};

const VIET_DIGITS: Record<string, string> = {
  '0': 'không',
  '1': 'một',
  '2': 'hai',
  '3': 'ba',
  '4': 'bốn',
  '5': 'năm',
  '6': 'sáu',
  '7': 'bảy',
  '8': 'tám',
  '9': 'chín',
};

// Chuyển mã số vé (ví dụ: CA-025, DD-001, 104) thành phát âm tiếng Việt chuẩn 100%
export function formatTicketForVietnameseSpeech(ticketNumber: string): string {
  if (!ticketNumber) return '';

  const clean = ticketNumber.trim();
  const parts = clean.split(/[-_\s]+/);

  const spokenParts = parts.map(part => {
    // Check if the part is pure letters (e.g. CA, DD, HT, KD)
    if (/^[A-Za-z]+$/.test(part)) {
      return part
        .toUpperCase()
        .split('')
        .map(char => VIET_LETTERS[char] || char)
        .join(' ');
    }

    // Check if the part is pure digits (e.g. 025, 001, 104)
    if (/^\d+$/.test(part)) {
      return part
        .split('')
        .map(digit => VIET_DIGITS[digit] || digit)
        .join(' ');
    }

    // Mixed alphanumeric (e.g. CS01)
    return part
      .split('')
      .map(char => {
        const upper = char.toUpperCase();
        if (VIET_LETTERS[upper]) return VIET_LETTERS[upper];
        if (VIET_DIGITS[char]) return VIET_DIGITS[char];
        return char;
      })
      .join(' ');
  });

  return spokenParts.join(', ');
}

// Chuyển mã quầy (ví dụ: "Quầy 01", "Quầy 2", "Quầy A") thành phát âm tiếng Việt chuẩn
export function formatCounterForVietnameseSpeech(counterCode: string): string {
  if (!counterCode) return 'quầy phục vụ';

  const clean = counterCode.trim();
  const match = clean.match(/^quầy\s*(\d+)$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    const numWords: Record<number, string> = {
      1: 'một',
      2: 'hai',
      3: 'ba',
      4: 'bốn',
      5: 'năm',
      6: 'sáu',
      7: 'bảy',
      8: 'tám',
      9: 'chín',
      10: 'mười',
    };
    if (numWords[num]) {
      return `quầy số ${numWords[num]}`;
    }
    return `quầy số ${num}`;
  }

  return clean;
}

// Phát âm thanh giọng đọc tiếng Việt chuẩn (Google Tiếng Việt qua /api/tts)
function playServerVietnameseTts(text: string): Promise<boolean> {
  return new Promise(resolve => {
    try {
      const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
      audio.preload = 'auto';

      let resolved = false;
      const cleanup = () => {
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
      };

      const onEnded = () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(true);
      };

      const onError = () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(false);
      };

      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(false);
          }
        });
      }

      // Safety timeout: 10 seconds max
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(true);
        }
      }, 10000);
    } catch {
      resolve(false);
    }
  });
}

// Phát âm thanh dự phòng bằng Web Speech API nếu offline
function playWebSpeechVietnamese(text: string): void {
  if (!('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const applyVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(
        v => v.lang.toLowerCase().startsWith('vi') || v.name.toLowerCase().includes('vietnam')
      );
      if (viVoice) {
        utterance.voice = viVoice;
      }
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      applyVoiceAndSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        applyVoiceAndSpeak();
        window.speechSynthesis.onvoiceschanged = null;
      };
      setTimeout(() => {
        if (!window.speechSynthesis.speaking) {
          window.speechSynthesis.speak(utterance);
        }
      }, 300);
    }
  } catch (err) {
    console.warn('Web Speech API error:', err);
  }
}

// Gọi loa thông báo số thứ tự hoàn toàn bằng tiếng Việt
export async function announceTicket(
  ticketNumber: string,
  counterCode: string,
  template = 'Xin kính mời số thứ tự: {ticket}, đến {counter}'
): Promise<void> {
  // 1. Phát chuông báo 2 tone nhẹ nhàng
  await playChime();

  // 2. Chuyển đổi mã số vé và tên quầy thành tiếng Việt chuẩn
  const spokenTicket = formatTicketForVietnameseSpeech(ticketNumber);
  const spokenCounter = formatCounterForVietnameseSpeech(counterCode);
  const message = template
    .replace('{ticket}', spokenTicket)
    .replace('{counter}', spokenCounter);

  // 3. Ưu tiên phát qua server TTS giọng đọc tiếng Việt chuẩn (Google Tiếng Việt)
  const played = await playServerVietnameseTts(message);
  if (played) return;

  // 4. Nếu không thể tải hoặc offline, phát qua Web Speech API
  playWebSpeechVietnamese(message);
}
