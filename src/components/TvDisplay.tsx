import React, { useState, useEffect } from 'react';
import { Counter, Ticket, DisplayScreen } from '../types/queue.js';
import {
  Volume2,
  VolumeX,
  Clock,
  Radio,
  Tv,
  Maximize2,
  Minimize2,
  Sparkles,
  ChevronRight,
  Landmark,
  Flag,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { announceTicket, playChime } from '../utils/audio.js';
import { StatePropagandaBanner } from './StatePropagandaBanner.js';

interface TvDisplayProps {
  counters: Counter[];
  tickets: Ticket[];
  displays: DisplayScreen[];
  onOpenGuide?: () => void;
}

const DEFAULT_FALLBACK_COUNTERS: Counter[] = [
  { id: 'cnt_01', branchId: 'branch_01', code: 'Quầy 01', name: 'Tiếp nhận CCCD & VNeID', serviceIds: ['srv_ca'], status: 'SERVING', currentTicketNumber: 'CA-021' },
  { id: 'cnt_02', branchId: 'branch_01', code: 'Quầy 02', name: 'Hộ tịch & Chứng thực', serviceIds: ['srv_ht'], status: 'CALLING', currentTicketNumber: 'HT-015' },
  { id: 'cnt_03', branchId: 'branch_01', code: 'Quầy 03', name: 'Đất đai & Nhà ở', serviceIds: ['srv_dd'], status: 'SERVING', currentTicketNumber: 'DD-008' },
  { id: 'cnt_04', branchId: 'branch_01', code: 'Quầy 04', name: 'Hồ sơ Đất đai', serviceIds: ['srv_dd'], status: 'IDLE' },
  { id: 'cnt_05', branchId: 'branch_01', code: 'Quầy 05', name: 'Đăng ký kinh doanh', serviceIds: ['srv_kd'], status: 'SERVING', currentTicketNumber: 'KD-003' },
  { id: 'cnt_06', branchId: 'branch_01', code: 'Quầy 06', name: 'Trả kết quả & Thu phí', serviceIds: ['srv_kd'], status: 'IDLE' },
];

export const TvDisplay: React.FC<TvDisplayProps> = ({ counters: propCounters, tickets, displays, onOpenGuide }) => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [flashAnimation, setFlashAnimation] = useState(false);
  const [aspectMode, setAspectMode] = useState<'16:9' | 'FULL'>('16:9');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeCounters = propCounters && propCounters.length > 0 ? propCounters : DEFAULT_FALLBACK_COUNTERS;

  // Keep live digital clock updating every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor fullscreen
  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  // Find the latest called or actively serving ticket
  const activeTickets = tickets
    .filter(t => ['CALLED', 'SERVING'].includes(t.status))
    .sort((a, b) => {
      const timeA = new Date(a.calledAt || a.createdAt).getTime();
      const timeB = new Date(b.calledAt || b.createdAt).getTime();
      return timeB - timeA;
    });

  const latestTicket = activeTickets[0] || (tickets.length > 0 ? tickets[0] : {
    id: 'demo_tkt',
    ticketNumber: 'CA-021',
    serviceName: 'Cấp đổi Căn cước công dân & Định danh điện tử (VNeID)',
    currentCounterCode: 'Quầy 01',
    status: 'SERVING',
  });

  // Recently called history (next 6 tickets)
  const recentCalls = activeTickets.slice(1, 7);

  // Trigger flash animation & Vietnamese voice announcement when latest ticket changes
  useEffect(() => {
    if (latestTicket) {
      setFlashAnimation(true);
      if (audioEnabled && latestTicket.ticketNumber && latestTicket.id !== 'demo_tkt') {
        announceTicket(latestTicket.ticketNumber, latestTicket.currentCounterCode || 'Quầy 01');
      }
      const t = setTimeout(() => setFlashAnimation(false), 2500);
      return () => clearTimeout(t);
    }
  }, [latestTicket?.ticketNumber, latestTicket?.currentCounterCode]);

  const handleTestVoice = () => {
    if (latestTicket) {
      announceTicket(latestTicket.ticketNumber, latestTicket.currentCounterCode || 'Quầy 01');
    } else {
      announceTicket('CA-001', 'Quầy 01');
    }
  };

  // Fullscreen toggle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  const containerClasses =
    aspectMode === '16:9'
      ? 'w-full max-w-7xl mx-auto aspect-16-9 min-h-[85vh] rounded-3xl'
      : 'w-full min-h-[92vh] rounded-2xl';

  return (
    <div
      className={`${containerClasses} bg-gradient-to-br from-slate-950 via-[#090d16] to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden border border-slate-800/90 shadow-2xl transition-all duration-300 selection:bg-indigo-500 selection:text-white`}
    >
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between border-b border-slate-800/90 pb-3 gap-3 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 flex items-center justify-center font-bold text-white shadow-xl shadow-red-500/25 border border-amber-300/30">
            <Landmark className="w-6 h-6 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block font-heading">
                ỦY BAN NHÂN DÂN THÀNH PHỐ
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-600/30 border border-red-500/40 text-[9px] font-bold text-red-200 uppercase font-mono">
                MÀN HÌNH CHÍNH SẢNH CHỜ (16:9)
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight font-heading">
              TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG
            </h1>
          </div>
        </div>

        {/* Controls, Aspect Switcher & Live Digital Clock */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 16:9 Mode Switcher */}
          <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs backdrop-blur-md">
            <button
              onClick={() => setAspectMode('16:9')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                aspectMode === '16:9' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Khóa tỉ lệ chuẩn 16:9 màn hình TV"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>16:9</span>
            </button>
            <button
              onClick={() => setAspectMode('FULL')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                aspectMode === 'FULL' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Tự động co giãn tràn màn hình TV"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Tràn Màn</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 ${
                audioEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-xs shadow-emerald-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
              title="Bật/Tắt âm thanh đọc số tiếng Việt"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline font-bold">Loa đọc</span>
            </button>

            <button
              onClick={handleTestVoice}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1 text-xs font-medium cursor-pointer active:scale-95"
              title="Thử phát âm thanh gọi số bằng tiếng Việt"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline font-semibold">Thử đọc</span>
            </button>
          </div>

          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Xem hướng dẫn màn hình TV sảnh"
            >
              <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden lg:inline">Hướng dẫn</span>
            </button>
          )}

          <button
            onClick={toggleFullScreen}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all text-slate-300 cursor-pointer"
            title="Toàn màn hình TV"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <div className="text-right pl-2 sm:pl-3 border-l border-slate-800">
            <p className="text-xl sm:text-2xl font-mono font-black text-amber-300 tracking-tight drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]">
              {pad(currentTime.getHours())}:{pad(currentTime.getMinutes())}:{pad(currentTime.getSeconds())}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      {/* Main Display 16:9 Arena */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-auto py-3 flex-1 overflow-y-auto">
        {/* Left 7 Columns: Bento TV Hero Card with LIVE watermark & State Propaganda Banner */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {latestTicket ? (
            <div
              className={`rounded-3xl p-6 sm:p-8 text-center transition-all duration-700 border-2 relative overflow-hidden backdrop-blur-xl ${
                flashAnimation
                  ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-amber-400 shadow-2xl shadow-amber-500/30 ring-4 ring-amber-400/40 glow-amber'
                  : 'bg-gradient-to-br from-slate-900/90 to-slate-950/95 border-slate-800 shadow-2xl'
              }`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 uppercase font-black text-6xl sm:text-7xl text-white pointer-events-none select-none font-heading">
                LIVE
              </div>

              {/* Calling Badge with Radar Ring */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-black text-xs uppercase tracking-wider mb-2 shadow-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
                <span>ĐANG GỌI PHỤC VỤ</span>
              </div>

              {/* Bento Split layout: Số đang gọi & Vị trí quầy */}
              <div className="flex flex-col sm:flex-row items-center justify-around py-3 gap-4">
                <div className="text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mb-1 font-mono">
                    SỐ THỨ TỰ ĐANG GỌI
                  </p>
                  <p className="text-7xl sm:text-8xl md:text-9xl font-black font-heading text-white tracking-tighter drop-shadow-[0_4px_30px_rgba(255,255,255,0.3)] my-1">
                    {latestTicket.ticketNumber}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-300 font-bold uppercase mt-2 max-w-sm truncate mx-auto">
                    {latestTicket.serviceName}
                  </p>
                </div>

                <div className="hidden sm:block h-32 w-[2px] bg-gradient-to-b from-transparent via-slate-700 to-transparent" />

                <div className="text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mb-1 font-mono">
                    VỊ TRÍ BÀN TIẾP NHẬN
                  </p>
                  <p className="text-6xl sm:text-7xl md:text-8xl font-black font-heading text-amber-400 tracking-tighter drop-shadow-[0_4px_30px_rgba(251,191,36,0.35)] my-1">
                    {latestTicket.currentCounterCode || 'Quầy 01'}
                  </p>
                  <span className="inline-block mt-2 px-4 py-1.5 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm">
                    Kính mời công dân vào làm thủ tục
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl p-12 bg-slate-900/90 border border-slate-800 text-center relative overflow-hidden">
              <Radio className="w-12 h-12 mx-auto mb-3 text-blue-400 animate-pulse" />
              <h3 className="text-xl sm:text-2xl font-black text-slate-200 font-heading">CHƯA CÓ LƯỢT GỌI SỐ</h3>
              <p className="text-xs text-slate-400 mt-1">
                Hệ thống đang chuẩn bị gọi lượt tiếp theo...
              </p>
            </div>
          )}

          {/* Embedded State Propaganda Banner inside TV Display */}
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-800">
            <StatePropagandaBanner variant="hero-16-9" autoPlayInterval={9000} />
          </div>
        </div>

        {/* Right 5 Columns: Recent Calls & Counters Overview Grid */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl flex-1 flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200 font-heading">
                    CÁC SỐ VỪA GỌI GẦN ĐÂY
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Thời gian thực</span>
              </div>

              <div className="space-y-2">
                {recentCalls.length === 0 ? (
                  <div className="space-y-2">
                    {[
                      { num: 'CA-020', srv: 'Căn cước công dân & VNeID', cnt: 'Quầy 01' },
                      { num: 'HT-014', srv: 'Hộ tịch & Chứng thực tư pháp', cnt: 'Quầy 02' },
                      { num: 'DD-007', srv: 'Đất đai & Môi trường', cnt: 'Quầy 03' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black font-heading text-blue-400">{item.num}</span>
                          <span className="text-xs text-slate-300 font-medium truncate max-w-[160px]">{item.srv}</span>
                        </div>
                        <span className="px-3 py-1 bg-blue-900/40 text-blue-300 font-bold font-mono text-xs rounded-xl border border-blue-500/30">
                          {item.cnt}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  recentCalls.map(t => (
                    <div
                      key={t.id}
                      className="p-3 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 rounded-2xl flex items-center justify-between transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black font-heading text-blue-400">
                          {t.ticketNumber}
                        </span>
                        <span className="text-xs text-slate-300 font-medium truncate max-w-[160px] block">
                          {t.serviceName}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-blue-900/40 text-blue-300 font-bold font-mono text-xs rounded-xl border border-blue-500/30">
                        {t.currentCounterCode}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Counters Overview Grid */}
            <div className="pt-4 border-t border-slate-800/80 mt-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 font-heading">
                  TÌNH TRẠNG CÁC BÀN TIẾP NHẬN
                </span>
                <span className="text-[10px] text-emerald-400 font-bold font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {activeCounters.filter(c => c.status === 'SERVING' || c.status === 'CALLING').length}/{activeCounters.length} Quầy Hoạt Động
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {activeCounters.map(c => (
                  <div
                    key={c.id}
                    className={`p-2.5 rounded-2xl border transition-all ${
                      c.status === 'SERVING' || c.status === 'CALLING'
                        ? 'bg-blue-950/70 border-blue-500/50 text-blue-200 ring-1 ring-blue-400/20 shadow-xs'
                        : c.status === 'IDLE'
                        ? 'bg-slate-950/80 border-slate-800 text-slate-400'
                        : 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-60'
                    }`}
                  >
                    <span className="font-bold block text-xs">{c.code}</span>
                    <span className="text-[11px] font-mono font-black block truncate mt-0.5 text-amber-300">
                      {c.currentTicketNumber || (c.status === 'IDLE' ? 'Sẵn sàng' : 'Đóng')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Ticker Marquee with Official State Slogans */}
      <footer className="mt-2 shrink-0">
        <StatePropagandaBanner variant="marquee-only" />
      </footer>
    </div>
  );
};
