import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Keyboard,
  X,
  ChevronDown,
  Volume2,
  VolumeX,
  Sparkles,
  Delete,
  CornerDownLeft,
  ArrowUp,
  RotateCcw,
  Minimize2,
  Maximize2,
  GripHorizontal,
  Move,
  Compass,
  Shrink,
  Expand,
} from 'lucide-react';
import {
  TypingMethod,
  processTelexKey,
  processVniKey,
  applyToneToWord,
  VIETNAMESE_ACCENT_KEYS_DIRECT,
  VIETNAMESE_ACCENTED_PALETTE,
} from '../utils/vietnameseIME.js';

interface VirtualKeyboardProps {
  isOpen?: boolean;
  onClose?: () => void;
  onKeyInput?: (char: string) => void;
  onBackspace?: () => void;
  onClear?: () => void;
  targetLabel?: string;
}

interface Position {
  x: number;
  y: number;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onKeyInput,
  onBackspace,
  onClear,
  targetLabel: propTargetLabel,
}) => {
  // Master visibility toggle
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_queue_vkeyboard_visible');
    return saved !== null ? saved === 'true' : false;
  });

  // Auto open when an input is focused
  const [autoOpenOnFocus, setAutoOpenOnFocus] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_queue_vkeyboard_auto_open');
    return saved !== null ? saved === 'true' : true;
  });

  // Typing Method: 'DIRECT' (Bỏ dấu sẵn / Trực quan), 'TELEX', 'VNI'
  const [typingMethod, setTypingMethod] = useState<TypingMethod>(() => {
    const saved = localStorage.getItem('smart_queue_vkeyboard_method') as TypingMethod;
    return saved === 'TELEX' || saved === 'VNI' || saved === 'DIRECT' ? saved : 'DIRECT';
  });

  // Size mode: 'COMPACT' (nhỏ gọn ~ 480px) vs 'STANDARD' (~ 580px)
  const [sizeMode, setSizeMode] = useState<'COMPACT' | 'STANDARD'>(() => {
    const saved = localStorage.getItem('smart_queue_vkeyboard_size');
    return saved === 'STANDARD' ? 'STANDARD' : 'COMPACT';
  });

  // Position for dragging (null means calculate default center bottom)
  const [position, setPosition] = useState<Position | null>(() => {
    try {
      const saved = localStorage.getItem('smart_queue_vkeyboard_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Keyboard States
  const [isShift, setIsShift] = useState<boolean>(false);
  const [isCapsLock, setIsCapsLock] = useState<boolean>(false);
  const [keyLayout, setKeyLayout] = useState<'ALPHA' | 'NUM_SYM'>('ALPHA');
  const [showVowelPalette, setShowVowelPalette] = useState<boolean>(false);
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Active targeted DOM element
  const [activeElement, setActiveElement] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [inputTargetName, setInputTargetName] = useState<string>('');
  const [currentInputValue, setCurrentInputValue] = useState<string>('');

  // Refs for dragging and container
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });

  // Audio click context
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playKeyClick = useCallback(() => {
    if (!audioFeedback) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtxRef.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtxRef.current.currentTime + 0.04);
        gain.gain.setValueAtTime(0.06, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.04);
      }
    } catch {
      // Ignore audio failure
    }
  }, [audioFeedback]);

  // Synchronize with external prop if provided
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsVisible(propIsOpen);
    }
  }, [propIsOpen]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('smart_queue_vkeyboard_visible', String(isVisible));
  }, [isVisible]);

  useEffect(() => {
    localStorage.setItem('smart_queue_vkeyboard_auto_open', String(autoOpenOnFocus));
  }, [autoOpenOnFocus]);

  useEffect(() => {
    localStorage.setItem('smart_queue_vkeyboard_method', typingMethod);
  }, [typingMethod]);

  useEffect(() => {
    localStorage.setItem('smart_queue_vkeyboard_size', sizeMode);
  }, [sizeMode]);

  // Clamp position within window bounds
  const clampPosition = useCallback((pos: Position): Position => {
    const el = containerRef.current;
    const w = el ? el.offsetWidth : (sizeMode === 'COMPACT' ? 480 : 580);
    const h = el ? el.offsetHeight : 340;
    const maxX = Math.max(8, window.innerWidth - w - 8);
    const maxY = Math.max(8, window.innerHeight - h - 8);
    return {
      x: Math.max(8, Math.min(maxX, pos.x)),
      y: Math.max(8, Math.min(maxY, pos.y)),
    };
  }, [sizeMode]);

  // Reset to default bottom-center position
  const resetToBottomCenter = useCallback(() => {
    const el = containerRef.current;
    const w = el ? el.offsetWidth : (sizeMode === 'COMPACT' ? 480 : 580);
    const h = el ? el.offsetHeight : 340;
    const defaultX = Math.max(8, Math.floor((window.innerWidth - w) / 2));
    const defaultY = Math.max(8, window.innerHeight - h - 20);
    const newPos = { x: defaultX, y: defaultY };
    setPosition(newPos);
    try {
      localStorage.setItem('smart_queue_vkeyboard_pos', JSON.stringify(newPos));
    } catch {}
  }, [sizeMode]);

  // Initialize position if not set
  useEffect(() => {
    if (isVisible && !position) {
      resetToBottomCenter();
    }
  }, [isVisible, position, resetToBottomCenter]);

  // Re-clamp on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => (prev ? clampPosition(prev) : null));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  // Dragging event handlers via Pointer Capture
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // Don't drag if clicking buttons inside the header
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    dragOffsetRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    isDraggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();

    const rawX = e.clientX - dragOffsetRef.current.offsetX;
    const rawY = e.clientY - dragOffsetRef.current.offsetY;
    const clamped = clampPosition({ x: rawX, y: rawY });
    setPosition(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    if (position) {
      try {
        localStorage.setItem('smart_queue_vkeyboard_pos', JSON.stringify(position));
      } catch {}
    }
  };

  // Global listener for focused input / textarea elements
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const inputEl = target as HTMLInputElement | HTMLTextAreaElement;
        const type = (inputEl.getAttribute('type') || 'text').toLowerCase();
        if (['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image', 'hidden'].includes(type)) {
          return;
        }

        setActiveElement(inputEl);
        setCurrentInputValue(inputEl.value || '');

        let label = inputEl.getAttribute('placeholder') || '';
        if (!label) {
          const id = inputEl.id;
          if (id) {
            const labelEl = document.querySelector(`label[for="${id}"]`);
            if (labelEl) label = labelEl.textContent?.trim() || '';
          }
        }
        if (!label) {
          label = inputEl.getAttribute('name') || inputEl.getAttribute('aria-label') || 'Ô nhập liệu';
        }
        setInputTargetName(label);

        if (autoOpenOnFocus) {
          setIsVisible(true);
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [autoOpenOnFocus]);

  // Sync active input value changes
  useEffect(() => {
    if (!activeElement) return;

    const handleInput = () => {
      setCurrentInputValue(activeElement.value || '');
    };

    activeElement.addEventListener('input', handleInput);
    return () => {
      activeElement.removeEventListener('input', handleInput);
    };
  }, [activeElement]);

  // Dispatch text value changes into the active input element
  const dispatchValueToInput = useCallback((element: HTMLInputElement | HTMLTextAreaElement, newValue: string, newCursorPos?: number) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
      nativeTextAreaValueSetter.call(element, newValue);
    } else if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, newValue);
    } else {
      element.value = newValue;
    }

    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    const changeEvent = new Event('change', { bubbles: true, cancelable: true });
    element.dispatchEvent(inputEvent);
    element.dispatchEvent(changeEvent);

    if (newCursorPos !== undefined) {
      try {
        element.setSelectionRange(newCursorPos, newCursorPos);
      } catch {}
    }

    setCurrentInputValue(newValue);
  }, []);

  // Handle Key Click
  const handleKeyClick = useCallback((char: string) => {
    playKeyClick();
    if (onKeyInput) onKeyInput(char);
    if (!activeElement) return;

    const fullText = activeElement.value || '';
    const start = activeElement.selectionStart ?? fullText.length;
    const end = activeElement.selectionEnd ?? fullText.length;

    if (typingMethod === 'TELEX') {
      const textBefore = fullText.slice(0, start);
      const textAfter = fullText.slice(end);
      const match = textBefore.match(/([a-zA-Zà-ỹÀ-Ỹ0-9]+)$/);

      if (match && match[1]) {
        const lastWord = match[1];
        const prefix = textBefore.slice(0, textBefore.length - lastWord.length);
        const { newWord, handled } = processTelexKey(lastWord, char);
        const updatedText = prefix + newWord + textAfter;
        const newPos = (prefix + newWord).length;
        dispatchValueToInput(activeElement, updatedText, newPos);
        return;
      }
    } else if (typingMethod === 'VNI') {
      const textBefore = fullText.slice(0, start);
      const textAfter = fullText.slice(end);
      const match = textBefore.match(/([a-zA-Zà-ỹÀ-Ỹ0-9]+)$/);

      if (match && match[1]) {
        const lastWord = match[1];
        const prefix = textBefore.slice(0, textBefore.length - lastWord.length);
        const { newWord, handled } = processVniKey(lastWord, char);
        if (handled) {
          const updatedText = prefix + newWord + textAfter;
          const newPos = (prefix + newWord).length;
          dispatchValueToInput(activeElement, updatedText, newPos);
          return;
        }
      }
    }

    // Default DIRECT character insertion
    const updatedText = fullText.slice(0, start) + char + fullText.slice(end);
    const newPos = start + char.length;
    dispatchValueToInput(activeElement, updatedText, newPos);

    if (isShift) setIsShift(false);
  }, [activeElement, dispatchValueToInput, isShift, onKeyInput, playKeyClick, typingMethod]);

  // Handle Direct Tone Application
  const handleDirectTone = useCallback((toneIndex: number) => {
    playKeyClick();
    if (!activeElement) return;

    const fullText = activeElement.value || '';
    const start = activeElement.selectionStart ?? fullText.length;
    const end = activeElement.selectionEnd ?? fullText.length;
    const textBefore = fullText.slice(0, start);
    const textAfter = fullText.slice(end);

    const match = textBefore.match(/([a-zA-Zà-ỹÀ-Ỹ0-9]+)$/);
    if (!match || !match[1]) return;

    const lastWord = match[1];
    const prefix = textBefore.slice(0, textBefore.length - lastWord.length);
    const updatedWord = applyToneToWord(lastWord, toneIndex);
    const updatedText = prefix + updatedWord + textAfter;
    const newPos = (prefix + updatedWord).length;

    dispatchValueToInput(activeElement, updatedText, newPos);
  }, [activeElement, dispatchValueToInput, playKeyClick]);

  // Handle Direct Character Insert (Ă, Â, Đ, Ê, Ô, Ơ, Ư, etc.)
  const handleDirectCharInsert = useCallback((char: string) => {
    playKeyClick();
    if (!activeElement) return;

    const isUpper = isShift || isCapsLock;
    const insertChar = isUpper ? char.toUpperCase() : char.toLowerCase();
    const fullText = activeElement.value || '';
    const start = activeElement.selectionStart ?? fullText.length;
    const end = activeElement.selectionEnd ?? fullText.length;

    const updatedText = fullText.slice(0, start) + insertChar + fullText.slice(end);
    const newPos = start + insertChar.length;

    dispatchValueToInput(activeElement, updatedText, newPos);
    if (isShift) setIsShift(false);
  }, [activeElement, dispatchValueToInput, isCapsLock, isShift, playKeyClick]);

  // Handle Backspace
  const handleBackspace = useCallback(() => {
    playKeyClick();
    if (onBackspace) onBackspace();
    if (!activeElement) return;

    const fullText = activeElement.value || '';
    const start = activeElement.selectionStart ?? fullText.length;
    const end = activeElement.selectionEnd ?? fullText.length;

    if (start !== end) {
      const newFullText = fullText.slice(0, start) + fullText.slice(end);
      dispatchValueToInput(activeElement, newFullText, start);
      return;
    }

    if (start <= 0) return;

    const newFullText = fullText.slice(0, start - 1) + fullText.slice(start);
    dispatchValueToInput(activeElement, newFullText, start - 1);
  }, [activeElement, onBackspace, playKeyClick, dispatchValueToInput]);

  // Handle Clear Input
  const handleClear = useCallback(() => {
    playKeyClick();
    if (onClear) onClear();
    if (!activeElement) return;
    dispatchValueToInput(activeElement, '', 0);
  }, [activeElement, onClear, playKeyClick, dispatchValueToInput]);

  // Handle Space
  const handleSpace = useCallback(() => {
    handleKeyClick(' ');
  }, [handleKeyClick]);

  // Handle Enter
  const handleEnter = useCallback(() => {
    playKeyClick();
    if (!activeElement) return;

    if (activeElement.tagName === 'TEXTAREA') {
      handleKeyClick('\n');
      return;
    }

    const form = activeElement.closest('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    } else {
      activeElement.blur();
    }
  }, [activeElement, handleKeyClick, playKeyClick]);

  const toggleOpen = () => {
    const next = !isVisible;
    setIsVisible(next);
    if (next) setIsMinimized(false);
    if (!next && propOnClose) propOnClose();
  };

  const isUpperCase = isShift || isCapsLock;

  // QWERTY rows
  const alphaRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  // Number & Symbol rows
  const numSymRows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['@', '#', '$', '%', '&', '*', '-', '+', '=', '/'],
    ['(', ')', '!', '?', '"', "'", ':', ';', ',', '.'],
  ];

  return (
    <>
      {/* Floating Corner Toggle Pill (Bật/tắt nhanh khi bàn phím đang đóng) */}
      {!isVisible && (
        <div className="fixed bottom-4 right-4 z-40 print:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={toggleOpen}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl font-black text-xs shadow-xl transition-all cursor-pointer border bg-slate-900/90 backdrop-blur-md text-amber-300 hover:text-amber-200 hover:bg-slate-900 border-slate-700 shadow-slate-950/40 hover:scale-105"
            title="Mở bàn phím ảo cảm ứng di chuyển được (Telex / VNI / Dấu sẵn)"
          >
            <Keyboard className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline tracking-tight">Phím Ảo</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/30 text-[10px] font-mono uppercase font-bold text-amber-300">
              {typingMethod === 'DIRECT' ? 'Dấu sẵn' : typingMethod}
            </span>
          </button>
        </div>
      )}

      {/* Movable, Compact Virtual Keyboard Window */}
      {isVisible && (
        <div
          ref={containerRef}
          style={
            position
              ? { left: `${position.x}px`, top: `${position.y}px` }
              : { left: '50%', transform: 'translateX(-50%)', bottom: '16px' }
          }
          className={`fixed z-50 select-none print:hidden transition-shadow ${
            sizeMode === 'COMPACT' ? 'w-[96vw] max-w-[490px]' : 'w-[96vw] max-w-[590px]'
          } rounded-2xl bg-slate-900/98 backdrop-blur-md border border-slate-700/80 shadow-2xl shadow-black/70 ring-1 ring-white/10`}
          onMouseDown={e => {
            // CRITICAL: Prevent keyboard from stealing focus from the active input!
            e.preventDefault();
          }}
        >
          {/* Draggable Header Bar */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="px-3 py-2 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-t-2xl border-b border-slate-800 flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing text-xs touch-none"
            title="Nhấn giữ và kéo để di chuyển bàn phím"
          >
            {/* Left: Drag grip indicator & Target name */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-1 text-slate-400 shrink-0 hover:text-white transition-colors">
                <GripHorizontal className="w-4 h-4 text-slate-500" />
                <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              </div>

              <div className="flex items-center gap-1 text-[11px] truncate">
                <span className="font-semibold text-slate-400 hidden xs:inline">Ô:</span>
                <span className="font-bold text-amber-300 truncate max-w-[130px] sm:max-w-[170px]">
                  {propTargetLabel || inputTargetName || 'Chạm ô để gõ'}
                </span>
              </div>
            </div>

            {/* Center: Typing Method Pills (Dấu sẵn / Telex / VNI) */}
            {!isMinimized && (
              <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] shrink-0">
                <button
                  type="button"
                  onClick={() => setTypingMethod('DIRECT')}
                  className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    typingMethod === 'DIRECT'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Bỏ dấu sẵn trực quan (hiện sẵn các dấu thanh và ký tự Ă, Â, Đ...)"
                >
                  Dấu sẵn
                </button>
                <button
                  type="button"
                  onClick={() => setTypingMethod('TELEX')}
                  className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    typingMethod === 'TELEX'
                      ? 'bg-indigo-600 text-white font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Gõ Telex (aa, aw, ee, oo, s, f, r, x, j)"
                >
                  Telex
                </button>
                <button
                  type="button"
                  onClick={() => setTypingMethod('VNI')}
                  className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    typingMethod === 'VNI'
                      ? 'bg-blue-600 text-white font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Gõ VNI (1-5 dấu thanh, 6-9 mũ móc)"
                >
                  VNI
                </button>
              </div>
            )}

            {/* Right: Window Controls (Size Toggle, Reset Pos, Audio, Minimize, Close) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Size Mode Toggle: COMPACT vs STANDARD */}
              {!isMinimized && (
                <button
                  type="button"
                  onClick={() => setSizeMode(prev => (prev === 'COMPACT' ? 'STANDARD' : 'COMPACT'))}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  title={sizeMode === 'COMPACT' ? 'Phóng to bàn phím chuẩn' : 'Thu nhỏ bàn phím cực gọn'}
                >
                  {sizeMode === 'COMPACT' ? <Expand className="w-3 h-3 text-slate-300" /> : <Shrink className="w-3 h-3 text-slate-300" />}
                </button>
              )}

              {/* Reset to Center Bottom */}
              <button
                type="button"
                onClick={resetToBottomCenter}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                title="Đặt lại vị trí giữa đáy màn hình"
              >
                <Compass className="w-3 h-3" />
              </button>

              {/* Audio feedback */}
              <button
                type="button"
                onClick={() => setAudioFeedback(prev => !prev)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                title={audioFeedback ? 'Tắt âm gõ phím' : 'Bật âm gõ phím'}
              >
                {audioFeedback ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <VolumeX className="w-3 h-3 text-slate-500" />}
              </button>

              {/* Minimize / Expand */}
              <button
                type="button"
                onClick={() => setIsMinimized(prev => !prev)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                title={isMinimized ? 'Mở rộng bàn phím' : 'Thu nhỏ bàn phím'}
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={toggleOpen}
                className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-800 text-rose-300 border border-rose-700/60 cursor-pointer"
                title="Đóng bàn phím"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Collapsible Compact Keyboard Body */}
          {!isMinimized && (
            <div className={`p-2 sm:p-2.5 space-y-1.5 ${sizeMode === 'COMPACT' ? 'text-xs' : 'text-sm'}`}>
              {/* 1. Direct Tone Bar (Thanh 5 dấu thanh + Bỏ dấu) */}
              <div className="grid grid-cols-6 gap-1">
                <button
                  type="button"
                  onClick={() => handleDirectTone(1)}
                  className="py-1 px-1 rounded-lg bg-amber-950/40 hover:bg-amber-800/60 active:bg-amber-600 border border-amber-500/40 text-amber-200 text-[11px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer shadow-xs"
                  title="Dấu Sắc (ví dụ: á, ế, ố)"
                >
                  <span className="text-amber-400 font-black text-sm leading-none">´</span>
                  <span>Sắc</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectTone(2)}
                  className="py-1 px-1 rounded-lg bg-blue-950/40 hover:bg-blue-800/60 active:bg-blue-600 border border-blue-500/40 text-blue-200 text-[11px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer shadow-xs"
                  title="Dấu Huyền (ví dụ: à, è, ồ)"
                >
                  <span className="text-blue-400 font-black text-sm leading-none">`</span>
                  <span>Huyền</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectTone(3)}
                  className="py-1 px-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-800/60 active:bg-emerald-600 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer shadow-xs"
                  title="Dấu Hỏi (ví dụ: ả, ẻ, ổ)"
                >
                  <span className="text-emerald-400 font-black text-sm leading-none">?</span>
                  <span>Hỏi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectTone(4)}
                  className="py-1 px-1 rounded-lg bg-purple-950/40 hover:bg-purple-800/60 active:bg-purple-600 border border-purple-500/40 text-purple-200 text-[11px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer shadow-xs"
                  title="Dấu Ngã (ví dụ: ã, ẽ, ỗ)"
                >
                  <span className="text-purple-400 font-black text-sm leading-none">~</span>
                  <span>Ngã</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectTone(5)}
                  className="py-1 px-1 rounded-lg bg-rose-950/40 hover:bg-rose-800/60 active:bg-rose-600 border border-rose-500/40 text-rose-200 text-[11px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer shadow-xs"
                  title="Dấu Nặng (ví dụ: ạ, ẹ, ộ)"
                >
                  <span className="text-rose-400 font-black text-sm leading-none">.</span>
                  <span>Nặng</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectTone(0)}
                  className="py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                  title="Bỏ dấu thanh của từ hiện tại"
                >
                  <RotateCcw className="w-2.5 h-2.5 text-slate-400" />
                  <span>Bỏ dấu</span>
                </button>
              </div>

              {/* 2. Direct Vietnamese Accents Row: Ă, Â, Đ, Ê, Ô, Ơ, Ư + Drawer toggle */}
              <div className="flex items-center gap-1">
                {VIETNAMESE_ACCENT_KEYS_DIRECT.map(char => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => handleDirectCharInsert(char)}
                    className="flex-1 py-1.5 bg-gradient-to-b from-slate-800 to-slate-900 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 text-amber-300 hover:text-white font-black text-xs sm:text-sm rounded-lg border border-slate-700/90 transition-all cursor-pointer shadow-xs flex items-center justify-center"
                  >
                    {isUpperCase ? char.toUpperCase() : char.toLowerCase()}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowVowelPalette(prev => !prev)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                    showVowelPalette
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Mở bảng chọn tất cả nguyên âm có dấu sẵn"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="hidden xs:inline">Dấu sẵn</span>
                </button>
              </div>

              {/* 3. Full Accented Vowels Drawer */}
              {showVowelPalette && (
                <div className="p-2 bg-slate-950/95 rounded-xl border border-slate-800 space-y-1.5 max-h-40 overflow-y-auto">
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-300 border-b border-slate-800 pb-1">
                    <span>CHẠM NGUYÊN ÂM ĐỂ CHÈN NHANH</span>
                    <button
                      type="button"
                      onClick={() => setShowVowelPalette(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(VIETNAMESE_ACCENTED_PALETTE).map(([group, vowels]) => (
                      <div key={group} className="flex items-center gap-1 flex-wrap">
                        <span className="w-3 text-[10px] font-bold text-slate-500">{group}:</span>
                        {vowels.map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => handleDirectCharInsert(v)}
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-[11px] font-bold rounded border border-slate-700 cursor-pointer transition-colors"
                          >
                            {isUpperCase ? v.toUpperCase() : v}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Main QWERTY / Symbol Key Rows */}
              <div className="space-y-1">
                {(keyLayout === 'ALPHA' ? alphaRows : numSymRows).map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-center gap-1">
                    {/* Shift button on Row 2 Left */}
                    {rIdx === 2 && keyLayout === 'ALPHA' && (
                      <button
                        type="button"
                        onClick={() => {
                          playKeyClick();
                          setIsShift(prev => !prev);
                        }}
                        className={`px-2.5 py-1.5 sm:py-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isShift
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title="Phím Shift"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                    )}

                    {row.map(char => {
                      const displayChar = isUpperCase ? char.toUpperCase() : char;
                      return (
                        <button
                          key={char}
                          type="button"
                          onClick={() => handleKeyClick(displayChar)}
                          className="flex-1 max-w-[50px] py-1.5 sm:py-2 bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-lg border border-slate-700/80 hover:border-indigo-400 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                        >
                          {displayChar}
                        </button>
                      );
                    })}

                    {/* Backspace button on Row 2 Right */}
                    {rIdx === 2 && (
                      <button
                        type="button"
                        onClick={handleBackspace}
                        className="px-2.5 py-1.5 sm:py-2 bg-rose-950/60 hover:bg-rose-900 active:bg-rose-700 text-rose-200 rounded-lg border border-rose-800/80 active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
                        title="Xóa lùi (Backspace)"
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {/* 5. Bottom Functional Row (Caps, 123/ABC, Spacebar, Clear, Done) */}
                <div className="flex items-center gap-1 pt-0.5">
                  {/* Caps Lock Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      playKeyClick();
                      setIsCapsLock(prev => !prev);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                      isCapsLock
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="Khóa chữ hoa (Caps Lock)"
                  >
                    CAPS
                  </button>

                  {/* 123 / ABC Switcher */}
                  <button
                    type="button"
                    onClick={() => {
                      playKeyClick();
                      setKeyLayout(prev => (prev === 'ALPHA' ? 'NUM_SYM' : 'ALPHA'));
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] rounded-lg border border-slate-700 cursor-pointer"
                  >
                    {keyLayout === 'ALPHA' ? '123' : 'ABC'}
                  </button>

                  {/* Spacebar */}
                  <button
                    type="button"
                    onClick={handleSpace}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-bold text-xs rounded-lg border border-slate-700 cursor-pointer shadow-xs"
                  >
                    Dấu cách [Space]
                  </button>

                  {/* Clear Button */}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 font-bold text-[11px] rounded-lg border border-slate-700 cursor-pointer"
                    title="Xóa hết chữ trong ô đang nhập"
                  >
                    Xóa
                  </button>

                  {/* Enter / Done Button */}
                  <button
                    type="button"
                    onClick={handleEnter}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs rounded-lg shadow-md shadow-emerald-900/30 flex items-center gap-1 cursor-pointer"
                    title="Xác nhận xong hoặc chuyển dòng"
                  >
                    <CornerDownLeft className="w-3 h-3" />
                    <span>Xong</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
