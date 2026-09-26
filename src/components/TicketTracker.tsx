import React, { useState, useEffect } from 'react';
import { Ticket, TicketEvent } from '../types/queue.js';
import { TicketPrintModal } from './TicketPrintModal.js';
import {
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Share2,
  Printer,
  Star,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { playChime } from '../utils/audio.js';

interface TicketTrackerProps {
  initialToken?: string;
  onSelectToken?: (token: string) => void;
  onOpenGuide?: () => void;
}

export const TicketTracker: React.FC<TicketTrackerProps> = ({ initialToken, onSelectToken, onOpenGuide }) => {
  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [waitInfo, setWaitInfo] = useState<{ peopleAhead: number; estimatedMinutes: number; timeRangeText: string } | null>(null);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Rating state
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const fetchTicket = async (token: string) => {
    if (!token.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/tickets/token/${encodeURIComponent(token.trim().toUpperCase())}`);
      if (!res.ok) {
        throw new Error('Không tìm thấy số thứ tự này hoặc mã theo dõi không đúng.');
      }
      const data = await res.json();
      setTicket(data.ticket);
      setWaitInfo(data.waitInfo);
      setEvents(data.events || []);

      if (data.ticket.rating) {
        setRating(data.ticket.rating);
        setRatingSubmitted(true);
      }

      if (data.ticket.status === 'CALLED') {
        playChime();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kiểm tra vé.');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      fetchTicket(initialToken);
    }
  }, [initialToken]);

  // Auto-refresh every 10 seconds for real-time progress
  useEffect(() => {
    if (!ticket) return;
    const interval = setInterval(() => {
      fetchTicket(ticket.token);
    }, 10000);
    return () => clearInterval(interval);
  }, [ticket?.token]);

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    try {
      const res = await fetch(`/api/tickets/${ticket.token}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedbackComment: comment }),
      });
      if (res.ok) {
        setRatingSubmitted(true);
      }
    } catch {
      // ignore
    }
  };

  // Calculate active step index (0 to 3)
  const getStepIndex = (status?: string) => {
    if (!status) return 0;
    if (status === 'COMPLETED') return 3;
    if (status === 'SERVING') return 3;
    if (status === 'CALLED') return 2;
    if (status === 'WAITING') return 1;
    return 0;
  };

  const stepIndex = getStepIndex(ticket?.status);

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 font-sans">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-heading">
              Tra cứu tiến trình phiếu số (Token)
            </label>
          </div>
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Hướng dẫn</span>
            </button>
          )}
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            fetchTicket(tokenInput);
          }}
          className="flex gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value.toUpperCase())}
              placeholder="Nhập mã phiếu (Ví dụ: TK78A29B)"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-sm transition-all flex items-center gap-2 shadow-md shadow-indigo-600/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Kiểm tra</span>
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5 mb-6 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Ticket Details View */}
      {ticket && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Visual Progress Stepper (4 Steps) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between relative">
              {/* Connecting Line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
              <div
                className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 -z-0 transition-all duration-500"
                style={{ width: `${(stepIndex / 3) * 100}%` }}
              />

              {[
                { label: 'Đã cấp số', desc: 'Hệ thống nhận' },
                { label: 'Chờ lượt', desc: 'Đang xếp hàng' },
                { label: 'Gọi quầy', desc: 'Vào làm thủ tục' },
                { label: 'Tiếp nhận', desc: 'Xử lý hoàn tất' },
              ].map((st, i) => {
                const isPassed = i <= stepIndex;
                const isCurrent = i === stepIndex;
                return (
                  <div key={i} className="flex flex-col items-center relative z-10 text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 shadow-md shadow-indigo-600/30'
                          : isPassed
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 font-bold ${
                        isCurrent ? 'text-indigo-700' : isPassed ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {st.label}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">
                      {st.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Alert Banner */}
          {ticket.status === 'CALLED' ? (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl animate-pulse flex items-center justify-between border border-emerald-400/40">
              <div>
                <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider mb-1">
                  THÔNG BÁO LƯỢT GỌI
                </span>
                <h3 className="text-2xl font-black font-heading mt-0.5">
                  ĐÃ ĐẾN LƯỢT CỦA BẠN!
                </h3>
                <p className="text-xs text-emerald-50 mt-1 font-medium">
                  Kính mời Quý khách di chuyển ngay đến <strong className="underline font-bold text-white text-sm">{ticket.currentCounterCode || 'Quầy tiếp nhận'}</strong>
                </p>
              </div>
              <Volume2 className="w-12 h-12 text-emerald-100 shrink-0" />
            </div>
          ) : ticket.status === 'SERVING' ? (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg flex items-center justify-between border border-blue-400/30">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-blue-200 font-bold block">TIẾP NHẬN HỒ SƠ</span>
                <h3 className="text-xl font-bold mt-0.5 font-heading">Đang được xử lý tại {ticket.currentCounterCode}</h3>
                <p className="text-xs text-blue-100 mt-0.5">Cán bộ đang thẩm tra hồ sơ giấy tờ của Quý khách</p>
              </div>
              <Clock className="w-9 h-9 text-blue-200" />
            </div>
          ) : waitInfo && waitInfo.peopleAhead <= 2 ? (
            <div className="p-5 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-900 flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Bạn sắp đến lượt phục vụ!</p>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Chỉ còn {waitInfo.peopleAhead} người phía trước. Quý khách vui lòng chuẩn bị CCCD, giấy tờ và có mặt tại sảnh chờ.
                </p>
              </div>
            </div>
          ) : null}

          {/* Main Ticket Summary Card */}
          <div className="bg-white rounded-3xl shadow-md border border-slate-200/90 overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

              <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold">
                {ticket.serviceName}
              </p>
              <h1 className="text-6xl sm:text-7xl font-black font-heading tracking-tight text-white my-2 drop-shadow-md">
                {ticket.ticketNumber}
              </h1>

              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20 backdrop-blur-md">
                <span>Trạng thái:</span>
                <span className="text-amber-300 font-mono">
                  {ticket.status === 'WAITING' ? 'Đang chờ gọi' :
                   ticket.status === 'CALLED' ? 'ĐANG GỌI VÀO QUẦY' :
                   ticket.status === 'SERVING' ? 'Đang tiếp nhận' :
                   ticket.status === 'COMPLETED' ? 'Đã hoàn tất' :
                   ticket.status === 'NO_SHOW' ? 'Vắng mặt' : ticket.status}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50/50">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/70 text-center shadow-2xs">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Người phía trước</span>
                <span className="text-3xl font-black text-amber-600 font-heading mt-1 block">
                  {waitInfo ? waitInfo.peopleAhead : 0}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">người đang chờ</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/70 text-center shadow-2xs">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Dự kiến gọi</span>
                <span className="text-base font-bold text-blue-700 mt-2 block font-mono">
                  {waitInfo?.timeRangeText || '~10-20 phút'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">theo tiến độ quầy</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 bg-slate-50 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setShowPrintModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Xem / In phiếu điện tử</span>
              </button>
            </div>
          </div>

          {/* Event History Timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
              Lịch Sử Tiến Trình Phục Vụ
            </h3>

            <div className="relative pl-6 space-y-4 border-l-2 border-slate-200">
              {events.map((evt, idx) => (
                <div key={evt.id || idx} className="relative group">
                  <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {evt.eventType === 'CREATED' ? 'Lấy số thành công' :
                         evt.eventType === 'CALLED' ? `Được gọi vào ${evt.counterCode || 'Quầy'}` :
                         evt.eventType === 'RECALLED' ? `Gọi nhắc lại lần tiếp` :
                         evt.eventType === 'SERVING' ? 'Bắt đầu tiếp nhận giải quyết' :
                         evt.eventType === 'COMPLETED' ? 'Hoàn tất thủ tục' :
                         evt.eventType === 'NO_SHOW' ? 'Đánh dấu vắng mặt' :
                         evt.eventType === 'TRANSFERRED' ? 'Chuyển quầy/dịch vụ' : evt.eventType}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(evt.timestamp).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                    {evt.note && (
                      <p className="text-xs text-slate-500 mt-0.5">{evt.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Citizen Rating & Feedback (Section 25) */}
          {ticket.status === 'COMPLETED' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Đánh Giá Chất Lượng Phục Vụ</h3>
              <p className="text-xs text-slate-500 mb-4">
                Ý kiến của Quý khách giúp cơ quan không ngừng nâng cao chất lượng phục vụ nhân dân.
              </p>

              {ratingSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center text-xs font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Trân trọng cảm ơn Quý khách đã gửi phản hồi và đánh giá!</span>
                </div>
              ) : (
                <form onSubmit={handleRatingSubmit} className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1.5 focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Góp ý hoặc phản ánh thêm (tùy chọn)..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors"
                  >
                    Gửi đánh giá
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {showPrintModal && ticket && (
        <TicketPrintModal
          ticket={ticket}
          waitInfo={waitInfo || undefined}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
