import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Service, Ticket, KioskDevice, PriorityLevel } from '../types/queue.js';
import {
  Touchpad,
  Printer,
  QrCode,
  RotateCcw,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Clock,
  HeartHandshake,
  CheckCircle2,
  Delete,
  Maximize2,
  Minimize2,
  Volume2,
  Flag,
  ShieldCheck,
  Award,
  Landmark,
  Tv,
  Smartphone,
  Info,
  Download,
  Check,
  HelpCircle,
  Keyboard,
} from 'lucide-react';
import { playChime } from '../utils/audio.js';
import { StatePropagandaBanner } from './StatePropagandaBanner.js';
import { downloadTicketImage } from '../utils/ticketImageGenerator.js';
import { getPublicUrl } from '../utils/url.js';
import {
  TypingMethod,
  processTelexKey,
  processVniKey,
  applyToneToWord,
  VIETNAMESE_ACCENT_KEYS_DIRECT,
} from '../utils/vietnameseIME.js';

interface KioskModeProps {
  services: Service[];
  kiosk: KioskDevice;
  branchId: string;
  publicBaseUrl?: string;
  onOpenGuide?: () => void;
}

// Default fallback services if network or branchId filter was delayed
const DEFAULT_FALLBACK_SERVICES: Service[] = [
  {
    id: 'srv_ca',
    branchId: 'branch_01',
    name: 'Cấp đổi Căn cước công dân & Định danh điện tử (VNeID)',
    code: 'CONG_AN',
    prefix: 'CA',
    description: 'Làm mới, cấp đổi thẻ CCCD gắn chip và kích hoạt tài khoản định danh VNeID mức độ 2',
    dailyMax: 150,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 12,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: true,
    isPreBookingEnabled: true,
    active: true,
    fields: [
      { id: 'fullname', label: 'Họ và tên người yêu cầu', type: 'text', required: true, placeholder: 'Ví dụ: Nguyễn Văn An', order: 1, visibility: true },
      { id: 'citizen_id', label: 'Số định danh cá nhân (CCCD/CMND)', type: 'text', required: true, validation: '^[0-9]{9,12}$', placeholder: 'Nhập 12 số định danh công dân', order: 2, visibility: true, antiDuplicateKey: true },
      { id: 'phone', label: 'Số điện thoại liên hệ', type: 'text', required: true, placeholder: '090xxxxxxx', order: 3, visibility: true },
    ],
  },
  {
    id: 'srv_ht',
    branchId: 'branch_01',
    name: 'Đăng ký Hộ tịch & Chứng thực tư pháp',
    code: 'HO_TICH',
    prefix: 'HT',
    description: 'Đăng ký kết hôn, khai sinh, khai tử, cấp bản sao trích lục và chứng thực bản sao từ bản chính',
    dailyMax: 200,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 8,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: true,
    isPreBookingEnabled: true,
    active: true,
    fields: [
      { id: 'fullname', label: 'Họ và tên người nộp hồ sơ', type: 'text', required: true, placeholder: 'Ví dụ: Trần Thị Mai', order: 1, visibility: true },
      { id: 'phone', label: 'Số điện thoại liên hệ', type: 'text', required: true, placeholder: '091xxxxxxx', order: 2, visibility: true },
    ],
  },
  {
    id: 'srv_dd',
    branchId: 'branch_01',
    name: 'Đất đai & Tài nguyên Môi trường',
    code: 'DAT_DAI',
    prefix: 'DD',
    description: 'Đăng ký biến động quyền sử dụng đất, cấp đổi Giấy chứng nhận (Sổ hồng), xóa thế chấp giao dịch bảo đảm',
    dailyMax: 100,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 18,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: true,
    isPreBookingEnabled: true,
    active: true,
    fields: [
      { id: 'fullname', label: 'Họ và tên chủ sử dụng đất', type: 'text', required: true, placeholder: 'Ví dụ: Lê Minh Tuấn', order: 1, visibility: true },
      { id: 'citizen_id', label: 'Số CCCD chủ sở hữu', type: 'text', required: true, placeholder: 'Nhập 12 số CCCD', order: 2, visibility: true, antiDuplicateKey: true },
      { id: 'phone', label: 'Số điện thoại', type: 'text', required: true, placeholder: '098xxxxxxx', order: 3, visibility: true },
    ],
  },
  {
    id: 'srv_kd',
    branchId: 'branch_01',
    name: 'Đăng ký kinh doanh & Giấy phép hộ cá thể',
    code: 'KINH_DOANH',
    prefix: 'KD',
    description: 'Cấp mới, thay đổi nội dung đăng ký hộ kinh doanh cá thể, cấp phép bán lẻ và chứng chỉ ngành nghề',
    dailyMax: 80,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 15,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: false,
    isPreBookingEnabled: true,
    active: true,
    fields: [
      { id: 'fullname', label: 'Họ và tên đại diện hộ kinh doanh', type: 'text', required: true, placeholder: 'Ví dụ: Phạm Hoàng Long', order: 1, visibility: true },
      { id: 'phone', label: 'Số điện thoại', type: 'text', required: true, placeholder: '090xxxxxxx', order: 2, visibility: true },
    ],
  },
];

export const KioskMode: React.FC<KioskModeProps> = ({ services: propServices, kiosk, branchId, publicBaseUrl, onOpenGuide }) => {
  const [step, setStep] = useState<'WELCOME' | 'SELECT_SERVICE' | 'INPUT_FORM' | 'TICKET_ISSUED'>('WELCOME');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeFieldId, setActiveFieldId] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [priorityReason, setPriorityReason] = useState('');
  const [issuedTicket, setIssuedTicket] = useState<Ticket | null>(null);
  const [waitInfo, setWaitInfo] = useState<{ peopleAhead: number; estimatedMinutes: number; timeRangeText: string } | null>(null);
  const [countdown, setCountdown] = useState<number>(kiosk.autoResetSeconds && kiosk.autoResetSeconds >= 20 ? kiosk.autoResetSeconds : 60);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(true); // Hold screen by default so ticket is not lost!
  const [downloadingImage, setDownloadingImage] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExistingWarning, setIsExistingWarning] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Aspect Ratio & Layout Mode: '16:9' (Widescreen standard), 'FULL' (Full viewport auto-stretch), 'PORTRAIT' (9:16 Standing Totem Kiosk)
  const [aspectMode, setAspectMode] = useState<'16:9' | 'FULL' | 'PORTRAIT'>('16:9');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Kiosk Touch Keyboard States (Bàn phím cảm ứng Kiosk)
  const [kioskTypingMethod, setKioskTypingMethod] = useState<TypingMethod>('DIRECT');
  const [isKeypadUppercase, setIsKeypadUppercase] = useState<boolean>(true);
  const [isKeypadVisible, setIsKeypadVisible] = useState<boolean>(true);

  // Local state for services with fallback
  const [availableServices, setAvailableServices] = useState<Service[]>(
    propServices && propServices.length > 0 ? propServices : DEFAULT_FALLBACK_SERVICES
  );

  // Sync prop services or fallback fetch
  useEffect(() => {
    if (propServices && propServices.length > 0) {
      setAvailableServices(propServices);
    } else {
      fetch(`/api/services?branchId=${branchId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setAvailableServices(data);
          } else {
            setAvailableServices(DEFAULT_FALLBACK_SERVICES);
          }
        })
        .catch(() => {
          setAvailableServices(DEFAULT_FALLBACK_SERVICES);
        });
    }
  }, [propServices, branchId]);

  const timerRef = useRef<any>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Countdown timer for automatic reset after ticket issuance (with pause/resume support)
  useEffect(() => {
    if (step === 'TICKET_ISSUED') {
      if (isTimerPaused) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleReset();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, isTimerPaused]);

  // Generate QR code when ticket is issued
  useEffect(() => {
    if (issuedTicket?.token) {
      const publicUrl = getPublicUrl(`/ticket/${issuedTicket.token}`, publicBaseUrl);
      QRCode.toDataURL(publicUrl, {
        width: 260,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [issuedTicket, publicBaseUrl]);

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerPaused(true);
    setCountdown(kiosk.autoResetSeconds && kiosk.autoResetSeconds >= 20 ? kiosk.autoResetSeconds : 60);
    setDownloadingImage(false);
    setDownloadSuccess(false);
    setStep('WELCOME');
    setSelectedService(null);
    setFormData({});
    setActiveFieldId('');
    setPriority('NORMAL');
    setPriorityReason('');
    setIssuedTicket(null);
    setWaitInfo(null);
    setErrorMsg(null);
    setIsExistingWarning(false);
    setQrDataUrl('');
  };

  const handleSelectService = (srv: Service) => {
    setSelectedService(srv);
    setFormData({});
    const firstField = srv.fields.find(f => f.visibility);
    if (firstField) setActiveFieldId(firstField.id);
    setStep('INPUT_FORM');
  };

  const handleVirtualKeypad = (char: string) => {
    if (!activeFieldId) return;

    const inputChar = isKeypadUppercase ? char.toUpperCase() : char.toLowerCase();

    setFormData(prev => {
      const currentVal = prev[activeFieldId] || '';

      if (kioskTypingMethod === 'TELEX') {
        const words = currentVal.split(/(\s+)/);
        const lastIdx = words.length - 1;
        const lastWord = words[lastIdx] || '';
        const res = processTelexKey(lastWord, inputChar);
        words[lastIdx] = res.newWord;
        return {
          ...prev,
          [activeFieldId]: words.join(''),
        };
      } else if (kioskTypingMethod === 'VNI') {
        const words = currentVal.split(/(\s+)/);
        const lastIdx = words.length - 1;
        const lastWord = words[lastIdx] || '';
        const res = processVniKey(lastWord, inputChar);
        words[lastIdx] = res.newWord;
        return {
          ...prev,
          [activeFieldId]: words.join(''),
        };
      }

      // DIRECT
      return {
        ...prev,
        [activeFieldId]: currentVal + inputChar,
      };
    });
  };

  const handleVirtualDirectTone = (toneIndex: number) => {
    if (!activeFieldId) return;
    setFormData(prev => {
      const currentVal = prev[activeFieldId] || '';
      if (!currentVal) return prev;
      const words = currentVal.split(/(\s+)/);
      const lastIdx = words.length - 1;
      const lastWord = words[lastIdx] || '';
      const updatedWord = applyToneToWord(lastWord, toneIndex);
      words[lastIdx] = updatedWord;
      return {
        ...prev,
        [activeFieldId]: words.join(''),
      };
    });
  };

  const handleVirtualDirectChar = (char: string) => {
    if (!activeFieldId) return;
    const c = isKeypadUppercase ? char.toUpperCase() : char.toLowerCase();
    setFormData(prev => ({
      ...prev,
      [activeFieldId]: (prev[activeFieldId] || '') + c,
    }));
  };

  const handleVirtualBackspace = () => {
    if (!activeFieldId) return;
    setFormData(prev => ({
      ...prev,
      [activeFieldId]: (prev[activeFieldId] || '').slice(0, -1),
    }));
  };

  const handleVirtualClear = () => {
    if (!activeFieldId) return;
    setFormData(prev => ({
      ...prev,
      [activeFieldId]: '',
    }));
  };

  const handleIssueTicket = async () => {
    if (!selectedService) return;

    for (const f of selectedService.fields) {
      if (f.required && (!formData[f.id] || String(formData[f.id]).trim() === '')) {
        setErrorMsg(`Vui lòng nhập "${f.label}"`);
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/tickets/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedService.branchId || branchId,
          serviceId: selectedService.id,
          sourceChannel: 'KIOSK',
          priority,
          priorityReason: priority !== 'NORMAL' ? priorityReason : undefined,
          customerData: formData,
        }),
      });

      const data = await res.json();
      if (!res.ok && res.status !== 409) {
        throw new Error(data.error || 'Lỗi cấp phiếu số thứ tự');
      }

      setIssuedTicket(data.ticket);
      setWaitInfo(data.waitInfo || data.estimatedWait || null);
      setIsExistingWarning(Boolean(data.isExisting || data.isExistingTicket));
      // IMPORTANT: Keep screen paused so confirmation screen with QR code is NOT lost
      setIsTimerPaused(true);
      setCountdown(kiosk.autoResetSeconds && kiosk.autoResetSeconds >= 20 ? kiosk.autoResetSeconds : 60);
      setDownloadingImage(false);
      setDownloadSuccess(false);
      setStep('TICKET_ISSUED');
      playChime();
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Outer container styling according to aspectMode
  const getContainerClasses = () => {
    if (aspectMode === 'PORTRAIT') {
      return 'w-full max-w-xl mx-auto min-h-[95vh] rounded-3xl';
    }
    if (aspectMode === '16:9') {
      return 'w-full max-w-7xl mx-auto aspect-16-9 min-h-[85vh] rounded-3xl';
    }
    // FULL mode
    return 'w-full min-h-[92vh] rounded-2xl';
  };

  // Top Universal Kiosk Bar
  const renderKioskTopBar = () => (
    <header className="w-full flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-white select-none shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 flex items-center justify-center font-bold text-white shadow-lg shadow-red-500/20">
          <Landmark className="w-5 h-5 text-amber-200" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
              UBND THÀNH PHỐ • TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
            HỆ THỐNG KIOSK BỐC SỐ THỨ TỰ TỰ ĐỘNG
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 16:9 Aspect Ratio / Format Switcher */}
        <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex items-center gap-1 text-xs">
          <button
            onClick={() => setAspectMode('16:9')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              aspectMode === '16:9'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Tỉ lệ màn hình 16:9 chuẩn Kiosk & TV"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">16:9 Chuẩn</span>
          </button>

          <button
            onClick={() => setAspectMode('FULL')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              aspectMode === 'FULL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Tự co giãn tràn toàn màn hình"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tràn Màn Hình</span>
          </button>

          <button
            onClick={() => setAspectMode('PORTRAIT')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              aspectMode === 'PORTRAIT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Kiosk cảm ứng dạng đứng (9:16 Totem)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kiosk Đứng</span>
          </button>
        </div>

        {/* Hardware Status Badges */}
        <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{kiosk.printerStatus === 'OK' ? 'Máy in sẵn sàng' : 'Kiểm tra giấy'}</span>
        </span>

        {/* Hướng Dẫn Kiosk button */}
        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Xem hướng dẫn sử dụng máy Kiosk"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Hướng dẫn Kiosk</span>
          </button>
        )}

        {/* Fullscreen toggle button */}
        <button
          onClick={toggleFullScreen}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình Kiosk'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );

  // 1. WELCOME SCREEN
  if (step === 'WELCOME') {
    return (
      <div
        className={`${getContainerClasses()} flex flex-col justify-between bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 text-white p-4 sm:p-6 select-none relative overflow-hidden border border-slate-800 shadow-2xl transition-all duration-300 selection:bg-indigo-500 selection:text-white`}
      >
        {renderKioskTopBar()}

        {/* Main Touch-to-Start Hero Area */}
        <div
          onClick={() => setStep('SELECT_SERVICE')}
          className="flex-1 my-3 flex flex-col items-center justify-center text-center cursor-pointer group p-8 rounded-3xl bg-gradient-to-b from-blue-900/25 via-indigo-950/35 to-slate-900/60 border border-blue-500/20 hover:border-blue-400/50 transition-all duration-300 relative overflow-hidden shadow-2xl"
        >
          {/* Subtle decorative background watermarks */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Touch Icon with Animated Pulse Ring */}
          <div className="relative mb-6">
            <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[2px] rounded-full shadow-2xl shadow-blue-500/40 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950/60 backdrop-blur-md rounded-full flex items-center justify-center">
                <Touchpad className="w-14 h-14 sm:w-16 sm:h-16 text-cyan-300 animate-pulse" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          </div>

          <span className="px-4 py-1.5 bg-amber-500/15 text-amber-300 text-xs font-bold uppercase rounded-full border border-amber-400/30 mb-3 tracking-wider font-heading">
            HỆ THỐNG ĐIỆN TỬ MỘT CỬA LIÊN THÔNG
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-2 font-heading drop-shadow-md">
            CHẠM MÀN HÌNH ĐỂ LẤY SỐ
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-7 font-medium leading-relaxed">
            Chạm vào màn hình để chọn thủ tục hành chính, nhập số điện thoại hoặc quét CCCD để nhận phiếu số thứ tự tự động
          </p>

          <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-lg sm:text-xl rounded-2xl shadow-xl shadow-blue-600/30 group-hover:scale-103 transition-transform border border-white/20">
            <span>BẮT ĐẦU CHỌN DỊCH VỤ</span>
            <ChevronRight className="w-6 h-6 animate-bounce-x" />
          </div>
        </div>

        {/* State Propaganda & Legal Announcement Banner Section */}
        <div className="my-2 shrink-0">
          <StatePropagandaBanner variant="hero-16-9" autoPlayInterval={7000} />
        </div>

        {/* Bottom Slogan Marquee */}
        <div className="mt-2 shrink-0">
          <StatePropagandaBanner variant="marquee-only" />
        </div>
      </div>
    );
  }

  // 2. SELECT SERVICE SCREEN (Optimized for 16:9 with State Propaganda Banner & Legal Notice)
  if (step === 'SELECT_SERVICE') {
    return (
      <div
        className={`${getContainerClasses()} flex flex-col justify-between bg-slate-950 text-white p-4 sm:p-6 select-none border border-slate-800 shadow-2xl transition-all duration-300`}
      >
        {renderKioskTopBar()}

        {/* Step Navigation Bar */}
        <div className="flex items-center justify-between py-3 border-b border-slate-800 shrink-0">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">
              BƯỚC 1 TRÊN 2: CHỌN DỊCH VỤ CẦN LÀM THỦ TỤC
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
              DANH SÁCH LĨNH VỰC TIẾP NHẬN HỒ SƠ
            </h2>
          </div>

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-blue-400" />
            <span>Về trang đầu</span>
          </button>
        </div>

        {/* Main 16:9 Arena: 2-Column Split (Services Grid on Left + State Propaganda on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-auto py-3 flex-1 overflow-y-auto">
          {/* Left 7 Columns: Big Touch Service Cards */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {availableServices.map(srv => (
                <button
                  key={srv.id}
                  onClick={() => handleSelectService(srv)}
                  className="p-5 bg-slate-900/90 hover:bg-blue-950/60 active:bg-blue-900 border-2 border-slate-800 hover:border-blue-400 rounded-3xl text-left transition-all flex flex-col justify-between group shadow-lg cursor-pointer hover:shadow-blue-500/20 active:scale-98"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="px-3 py-1 bg-blue-600/30 text-blue-300 font-mono font-black text-sm rounded-xl border border-blue-400/40 shadow-xs">
                        Mã: {srv.prefix}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium font-mono">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        ~{srv.avgServiceTimeMinutes} phút
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white group-hover:text-blue-200 transition-colors leading-snug line-clamp-2 font-heading">
                      {srv.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-black text-blue-400 group-hover:text-amber-300">
                    <span>Chạm để chọn thủ tục này</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>

            {/* Helper guidance note */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Quý công dân chạm vào ô dịch vụ tương ứng. Nếu cần trợ giúp, xin liên hệ cán bộ đón tiếp tại sảnh.
              </span>
            </div>
          </div>

          {/* Right 5 Columns: State Propaganda & Legal Guidelines Banner */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-red-500 fill-red-500" />
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                    TUYÊN TRUYỀN & PHỔ BIẾN PHÁP LUẬT
                  </span>
                </div>
                <span className="text-[10px] bg-red-600/30 text-red-300 px-2 py-0.5 rounded-md font-bold">
                  NHÀ NƯỚC
                </span>
              </div>

              {/* Dynamic State Propaganda Banner Component */}
              <div className="my-auto">
                <StatePropagandaBanner variant="hero-16-9" autoPlayInterval={6000} />
              </div>
            </div>

            {/* Legal Notice: Anti-corruption & hotline box */}
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center justify-between text-xs text-red-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                <span>Nói không với "cò mồi", nhũng nhiễu làm hồ sơ</span>
              </div>
              <span className="font-bold text-amber-300">Đường dây nóng: 1022</span>
            </div>
          </div>
        </div>

        {/* Bottom Slogan Marquee */}
        <div className="mt-2 shrink-0">
          <StatePropagandaBanner variant="marquee-only" />
        </div>
      </div>
    );
  }

  // 3. INPUT FORM WITH TOUCH KEYPAD & PRIORITY SELECTION
  if (step === 'INPUT_FORM' && selectedService) {
    const isNumPadField =
      selectedService.fields.find(f => f.id === activeFieldId)?.type === 'number' ||
      activeFieldId.includes('phone') ||
      activeFieldId.includes('citizen_id') ||
      activeFieldId.includes('tax_code');

    return (
      <div
        className={`${getContainerClasses()} flex flex-col justify-between bg-slate-950 text-white p-4 sm:p-6 select-none border border-slate-800 shadow-2xl transition-all duration-300`}
      >
        {renderKioskTopBar()}

        {/* Header */}
        <div className="flex items-center justify-between py-3 border-b border-slate-800 shrink-0">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              BƯỚC 2 TRÊN 2: NHẬP THÔNG TIN CÔNG DÂN
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {selectedService.name} (Mã: {selectedService.prefix})
            </h2>
          </div>

          <button
            onClick={() => setStep('SELECT_SERVICE')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chọn dịch vụ khác</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="my-2 p-3 bg-rose-950/80 border border-rose-500 text-rose-200 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form & Touch Keyboard Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-auto py-2 flex-1 overflow-y-auto">
          {/* Left 6 Cols: Fields + Priority */}
          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-3">
              {selectedService.fields
                .filter(f => f.visibility)
                .map(field => {
                  const isActive = activeFieldId === field.id;
                  return (
                    <div
                      key={field.id}
                      onClick={() => setActiveFieldId(field.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-950/50 border-blue-400 shadow-md ring-2 ring-blue-500/20'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <label className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                        <span>
                          {field.label} {field.required && <span className="text-rose-400">*</span>}
                        </span>
                        {isActive && (
                          <span className="text-[10px] text-blue-400 uppercase font-black">
                            ĐANG NHẬP
                          </span>
                        )}
                      </label>
                      <div className="min-h-[38px] flex items-center px-3 bg-slate-950 rounded-xl border border-slate-800 text-sm font-mono text-white">
                        {formData[field.id] ? (
                          <span className="text-white font-bold">{formData[field.id]}</span>
                        ) : (
                          <span className="text-slate-600">{field.placeholder || 'Chạm để nhập...'}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Priority Option */}
            {selectedService.isPriorityEnabled && (
              <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-2">
                  <HeartHandshake className="w-4 h-4 text-amber-400" />
                  <span>ĐỐI TƯỢNG ƯU TIÊN THEO QUY ĐỊNH</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPriority('NORMAL');
                      setPriorityReason('');
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      priority === 'NORMAL'
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Bình thường
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriority('ELDERLY');
                      setPriorityReason('Người cao tuổi (trên 70 tuổi)');
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      priority === 'ELDERLY'
                        ? 'bg-amber-600 border-amber-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Người cao tuổi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriority('PREGNANT');
                      setPriorityReason('Phụ nữ có thai hoặc nuôi con nhỏ');
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      priority === 'PREGNANT'
                        ? 'bg-amber-600 border-amber-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Thai phụ / Trẻ nhỏ
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right 6 Cols: Virtual Touch Keypad */}
          <div className="lg:col-span-6 bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-amber-400" />
                  <span>Bàn Phím Cảm Ứng</span>
                </span>

                {/* Switch Typing Mode: DIRECT / TELEX / VNI */}
                {!isNumPadField && isKeypadVisible && (
                  <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setKioskTypingMethod('DIRECT')}
                      className={`px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                        kioskTypingMethod === 'DIRECT'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Bỏ dấu trực quan: hiện sẵn phím dấu thanh và Ă, Â, Đ, Ê, Ô, Ơ, Ư"
                    >
                      Dấu sẵn
                    </button>
                    <button
                      type="button"
                      onClick={() => setKioskTypingMethod('TELEX')}
                      className={`px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                        kioskTypingMethod === 'TELEX'
                          ? 'bg-indigo-600 text-white font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Gõ Telex: aa, aw, ee, oo, ow, uw, dd, s, f, r, x, j"
                    >
                      Telex
                    </button>
                    <button
                      type="button"
                      onClick={() => setKioskTypingMethod('VNI')}
                      className={`px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                        kioskTypingMethod === 'VNI'
                          ? 'bg-blue-600 text-white font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Gõ VNI: 1-5 dấu thanh, 6-9 mũ móc"
                    >
                      VNI
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsKeypadVisible(prev => !prev)}
                  className="text-xs text-slate-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                  title="Ẩn hoặc hiện bàn phím cảm ứng"
                >
                  <span>{isKeypadVisible ? 'Ẩn phím' : 'Hiện phím'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleVirtualClear}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa hết</span>
                </button>
              </div>
            </div>

            {/* Keypad Buttons Body */}
            {!isKeypadVisible ? (
              <div className="my-auto py-8 text-center text-slate-500 space-y-2">
                <Keyboard className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">Bàn phím cảm ứng đang ẩn. Nếu không cắm bàn phím rời:</p>
                <button
                  type="button"
                  onClick={() => setIsKeypadVisible(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  Mở lại bàn phím cảm ứng
                </button>
              </div>
            ) : isNumPadField ? (
              <div className="grid grid-cols-3 gap-2.5 my-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleVirtualKeypad(num)}
                    className="py-4 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-2xl font-black rounded-xl border border-slate-700 text-white transition-all cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleVirtualBackspace}
                  className="py-4 bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-bold rounded-xl border border-rose-700 flex items-center justify-center cursor-pointer"
                >
                  <Delete className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => handleVirtualKeypad('0')}
                  className="py-4 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 text-2xl font-black rounded-xl border border-slate-700 text-white transition-all cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleVirtualClear}
                  className="py-4 bg-slate-800 hover:bg-slate-700 text-xs font-bold uppercase rounded-xl border border-slate-700 text-slate-400 cursor-pointer"
                >
                  XÓA
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 my-1">
                {/* 1. Direct Tone Bar */}
                <div className="grid grid-cols-6 gap-1 pb-1">
                  <button
                    type="button"
                    onClick={() => handleVirtualDirectTone(1)}
                    className="py-1 px-1 bg-amber-950/40 hover:bg-amber-800/60 text-amber-200 border border-amber-500/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                    title="Dấu Sắc"
                  >
                    <span className="font-black text-amber-400">´</span> Sắc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVirtualDirectTone(2)}
                    className="py-1 px-1 bg-blue-950/40 hover:bg-blue-800/60 text-blue-200 border border-blue-500/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                    title="Dấu Huyền"
                  >
                    <span className="font-black text-blue-400">`</span> Huyền
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVirtualDirectTone(3)}
                    className="py-1 px-1 bg-emerald-950/40 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-500/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                    title="Dấu Hỏi"
                  >
                    <span className="font-black text-emerald-400">?</span> Hỏi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVirtualDirectTone(4)}
                    className="py-1 px-1 bg-purple-950/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                    title="Dấu Ngã"
                  >
                    <span className="font-black text-purple-400">~</span> Ngã
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVirtualDirectTone(5)}
                    className="py-1 px-1 bg-rose-950/40 hover:bg-rose-800/60 text-rose-200 border border-rose-500/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                    title="Dấu Nặng"
                  >
                    <span className="font-black text-rose-400">.</span> Nặng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVirtualDirectTone(0)}
                    className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                    title="Bỏ dấu thanh"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Bỏ dấu
                  </button>
                </div>

                {/* 2. Direct Accents Row: Ă, Â, Đ, Ê, Ô, Ơ, Ư */}
                <div className="flex justify-between gap-1 pb-1">
                  {VIETNAMESE_ACCENT_KEYS_DIRECT.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleVirtualDirectChar(c)}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-indigo-600 text-amber-300 hover:text-white font-black text-sm rounded-lg border border-slate-700 transition-all cursor-pointer"
                    >
                      {isKeypadUppercase ? c.toUpperCase() : c.toLowerCase()}
                    </button>
                  ))}
                </div>

                {/* 3. Main QWERTY Rows */}
                {[
                  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
                ].map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-center gap-1.5">
                    {rIdx === 2 && (
                      <button
                        type="button"
                        onClick={() => setIsKeypadUppercase(prev => !prev)}
                        className={`px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          isKeypadUppercase
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                        title="Viết hoa / Viết thường"
                      >
                        CAPS
                      </button>
                    )}

                    {row.map(char => {
                      const displayChar = isKeypadUppercase ? char.toUpperCase() : char.toLowerCase();
                      return (
                        <button
                          key={char}
                          type="button"
                          onClick={() => handleVirtualKeypad(displayChar)}
                          className="flex-1 py-2.5 bg-slate-800 hover:bg-blue-600 text-sm font-bold rounded-lg border border-slate-700 text-white transition-all cursor-pointer"
                        >
                          {displayChar}
                        </button>
                      );
                    })}

                    {rIdx === 2 && (
                      <button
                        type="button"
                        onClick={handleVirtualBackspace}
                        className="px-4 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg flex items-center justify-center cursor-pointer"
                      >
                        <Delete className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleVirtualKeypad(' ')}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-white cursor-pointer"
                  >
                    Dấu cách [Space]
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Issue Ticket Button */}
            <div className="pt-3 border-t border-slate-800 mt-2">
              <button
                type="button"
                onClick={handleIssueTicket}
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Đang xử lý cấp số...</span>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>XÁC NHẬN BỐC SỐ THỨ TỰ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Slogan Marquee */}
        <div className="mt-2 shrink-0">
          <StatePropagandaBanner variant="marquee-only" />
        </div>
      </div>
    );
  }

  // 4. TICKET ISSUED SCREEN (Confirmation Screen with QR Code & Ticket Download)
  if (step === 'TICKET_ISSUED' && issuedTicket) {
    const handleDownloadTicketImg = async () => {
      if (!issuedTicket) return;
      setDownloadingImage(true);
      const res = await downloadTicketImage(issuedTicket, waitInfo || undefined, publicBaseUrl);
      setDownloadingImage(false);
      if (res.success) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      }
    };

    const customerName =
      issuedTicket.customerData?.fullname ||
      issuedTicket.customerData?.rep_name ||
      issuedTicket.customerData?.name;
    const citizenCccd =
      issuedTicket.customerData?.citizen_id ||
      issuedTicket.customerData?.cccd;
    const customerMst =
      issuedTicket.customerData?.tax_id ||
      issuedTicket.customerData?.mst;

    return (
      <div
        className={`${getContainerClasses()} flex flex-col justify-between items-center bg-slate-950 text-white p-3 sm:p-5 select-none border border-slate-800 shadow-2xl transition-all duration-300`}
      >
        {renderKioskTopBar()}

        {/* Confirmation Status Banner (Kept Fixed - No Auto-Wipe) */}
        <div className="w-full max-w-xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-blue-950/90 border border-emerald-600/50 px-4 py-2.5 rounded-2xl my-2 shrink-0 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-emerald-300 block text-sm">
                BỐC SỐ THÀNH CÔNG! ĐÃ CẤP SỐ THỨ TỰ
              </span>
              <span className="text-[11px] text-slate-300">
                {isTimerPaused
                  ? 'Màn hình giữ cố định để bạn quét mã QR hoặc lưu ảnh. Không tự động tắt.'
                  : `Tự động quay về màn hình chính sau: ${countdown}s`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTimerPaused(prev => !prev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                isTimerPaused
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-600'
              }`}
              title="Chuyển đổi chế độ giữ màn hình"
            >
              {isTimerPaused ? '✓ Đang giữ màn hình' : '⏸ Giữ màn hình'}
            </button>
          </div>
        </div>

        {/* Existing ticket notification */}
        {isExistingWarning && (
          <div className="w-full max-w-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 px-4 py-2 rounded-xl text-xs flex items-center gap-2.5 my-1 shadow-sm shrink-0">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Bạn đã được cấp số trong ngày hôm nay. Hệ thống hiển thị lại số thứ tự để bạn tiếp tục thực hiện thủ tục.
            </span>
          </div>
        )}

        {/* Main Ticket Receipt Voucher Card */}
        <div className="my-auto w-full max-w-md bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 text-center shrink-0">
          <div className="border-b border-slate-200 pb-2 mb-2">
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
              UBND THÀNH PHỐ - TT PHỤC VỤ HÀNH CHÍNH CÔNG
            </p>
            <p className="text-xs font-bold text-blue-800 mt-0.5">
              {issuedTicket.serviceName}
            </p>
          </div>

          <div className="my-2.5 py-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              SỐ THỨ TỰ CỦA BẠN
            </span>
            <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-blue-700 block my-1">
              {issuedTicket.ticketNumber}
            </span>
            {issuedTicket.priority && issuedTicket.priority !== 'NORMAL' && (
              <span className="inline-block px-3 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                Ưu tiên: {issuedTicket.priorityReason || issuedTicket.priority}
              </span>
            )}
          </div>

          {/* Details breakdown */}
          <div className="space-y-1 text-xs text-slate-600 border-y border-dashed border-slate-200 py-2 my-2 text-left">
            <div className="flex justify-between">
              <span>Thời gian cấp số:</span>
              <span className="font-semibold text-slate-900">
                {new Date(issuedTicket.createdAt).toLocaleTimeString('vi-VN')} ({new Date(issuedTicket.createdAt).toLocaleDateString('vi-VN')})
              </span>
            </div>
            <div className="flex justify-between">
              <span>Người đang chờ trước bạn:</span>
              <span className="font-bold text-amber-600">
                {waitInfo ? `${waitInfo.peopleAhead} người` : '0 người'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Khung giờ dự kiến phục vụ:</span>
              <span className="font-semibold text-blue-700">
                {waitInfo?.timeRangeText || 'Khoảng 10 - 20 phút'}
              </span>
            </div>
            {customerName && (
              <div className="flex justify-between">
                <span>Họ tên:</span>
                <span className="font-semibold text-slate-800">{customerName}</span>
              </div>
            )}
            {citizenCccd && (
              <div className="flex justify-between">
                <span>Số CCCD:</span>
                <span className="font-mono font-semibold text-slate-800">{citizenCccd}</span>
              </div>
            )}
            {customerMst && (
              <div className="flex justify-between">
                <span>Mã số thuế:</span>
                <span className="font-mono font-semibold text-slate-800">{customerMst}</span>
              </div>
            )}
          </div>

          {/* Large QR Code with Frame */}
          <div className="my-2.5 flex flex-col items-center">
            <div className="p-2 bg-slate-50 border-2 border-blue-500/40 rounded-2xl relative shadow-inner">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Tra cứu số thứ tự"
                  className="w-36 h-36 rounded-xl block"
                />
              ) : (
                <div className="w-36 h-36 bg-slate-100 flex items-center justify-center rounded-xl animate-pulse text-xs text-slate-400">
                  Đang tạo mã QR...
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-blue-900 mt-2">
              Quét mã QR bằng Camera điện thoại hoặc Zalo
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              Theo dõi lượt gọi trực tiếp từ xa mà không sợ lỡ lượt
            </p>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              Mã theo dõi: {issuedTicket.token}
            </p>
          </div>
        </div>

        {/* Action Buttons: Tải ảnh vé, In phiếu, Hoàn tất */}
        <div className="w-full max-w-md flex flex-col gap-2.5 my-2 shrink-0">
          {/* Main Download Ticket Image Button */}
          <button
            type="button"
            onClick={handleDownloadTicketImg}
            disabled={downloadingImage}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-900/30 cursor-pointer transition-all"
          >
            {downloadingImage ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Đang xuất ảnh phiếu số...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Đã lưu ảnh phiếu số vào thiết bị!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Tải ảnh phiếu số về điện thoại / máy</span>
              </>
            )}
          </button>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-xs border border-slate-700 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>In lại phiếu</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow-md shadow-blue-900/30 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Hoàn tất / Người tiếp</span>
            </button>
          </div>
        </div>

        {/* Bottom Slogan Marquee */}
        <div className="mt-2 shrink-0 w-full">
          <StatePropagandaBanner variant="marquee-only" />
        </div>
      </div>
    );
  }

  return null;
};
