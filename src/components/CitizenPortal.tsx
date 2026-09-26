import React, { useState, useEffect } from 'react';
import { Service, Ticket, PriorityLevel } from '../types/queue.js';
import { TicketPrintModal } from './TicketPrintModal.js';
import {
  FileText,
  Clock,
  Users,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Share2,
  Printer,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  QrCode,
  Touchpad,
  Tv,
  ExternalLink,
  Copy,
  Check,
  Download,
  RefreshCw,
  HelpCircle,
  Search,
  X,
} from 'lucide-react';
import { downloadTicketImage } from '../utils/ticketImageGenerator.js';

import { getPublicUrl } from '../utils/url.js';

interface CitizenPortalProps {
  services: Service[];
  onTrackTicket: (token: string) => void;
  branchId: string;
  publicBaseUrl?: string;
  onOpenGuide?: () => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({ services, onTrackTicket, branchId, publicBaseUrl, onOpenGuide }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [priorityReason, setPriorityReason] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [issuedTicket, setIssuedTicket] = useState<Ticket | null>(null);
  const [waitInfo, setWaitInfo] = useState<{ peopleAhead: number; estimatedMinutes: number; timeRangeText: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isExistingWarning, setIsExistingWarning] = useState(false);
  const [copiedDeviceUrl, setCopiedDeviceUrl] = useState<string | null>(null);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadTicket = async () => {
    if (!issuedTicket) return;
    setDownloadingImage(true);
    const res = await downloadTicketImage(issuedTicket, waitInfo || undefined, publicBaseUrl);
    setDownloadingImage(false);
    if (res.success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }
  };

  const copyLink = (path: string) => {
    const fullUrl = getPublicUrl(path, publicBaseUrl);
    navigator.clipboard.writeText(fullUrl);
    setCopiedDeviceUrl(path);
    setTimeout(() => setCopiedDeviceUrl(null), 2000);
  };

  // Reset form state when choosing a service
  const handleSelectService = (srv: Service) => {
    setSelectedService(srv);
    setFormData({});
    setPriority('NORMAL');
    setPriorityReason('');
    setAgreeTerms(false);
    setErrorMsg(null);
    setIssuedTicket(null);
    setIsExistingWarning(false);
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    // Validate required fields
    for (const f of selectedService.fields) {
      if (f.required && (!formData[f.id] || String(formData[f.id]).trim() === '')) {
        setErrorMsg(`Vui lòng nhập đầy đủ "${f.label}"`);
        return;
      }
      if (f.validation && formData[f.id]) {
        try {
          const reg = new RegExp(f.validation);
          if (!reg.test(formData[f.id])) {
            setErrorMsg(`"${f.label}" chưa đúng định dạng quy định`);
            return;
          }
        } catch {
          // ignore invalid regex
        }
      }
    }

    setSubmitting(true);
    setErrorMsg(null);
    setIsExistingWarning(false);

    try {
      const res = await fetch('/api/tickets/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          serviceId: selectedService.id,
          sourceChannel: 'ONLINE_PHONE',
          priority,
          priorityReason: priority !== 'NORMAL' ? priorityReason : undefined,
          customerData: formData,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Anti-duplicate detected: already issued in this session
        setIsExistingWarning(true);
        setIssuedTicket(data.ticket);
        setWaitInfo(data.waitInfo);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi lấy số.');
      }

      setIssuedTicket(data.ticket);
      setWaitInfo(data.waitInfo);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  // Electronic Ticket Display when issued
  if (issuedTicket) {
    return (
      <div className="max-w-xl mx-auto py-6 px-4 sm:px-6 animate-in fade-in zoom-in-95 duration-300">
        {isExistingWarning && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-amber-900">Bạn đã lấy số trong phiên làm việc này!</p>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Hệ thống áp dụng quy tắc chống trùng số tự động. Dưới đây là thông tin phiếu số đã cấp trước đó của bạn.
              </p>
            </div>
          </div>
        )}

        {/* Boarding-Pass Style Electronic Ticket */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden relative">
          {/* Card Top Banner with Civic Gradient & Watermark */}
          <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-7 text-white text-center relative overflow-hidden">
            {/* Ambient background glow & watermark */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white/15 text-white backdrop-blur-md border border-white/20 mb-3 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>PHIẾU SỐ ĐIỆN TỬ HỢP LỆ</span>
              </span>

              <h2 className="text-xs sm:text-sm text-blue-100 font-semibold uppercase tracking-wider px-2">
                {issuedTicket.serviceName}
              </h2>

              {/* Central Number Display Box */}
              <div className="my-5 py-5 px-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/25 shadow-inner">
                <p className="text-[11px] uppercase tracking-widest text-blue-200 font-bold">
                  SỐ THỨ TỰ CỦA BẠN
                </p>
                <h1 className="text-6xl sm:text-7xl font-black font-heading tracking-tight text-white my-1 drop-shadow-md">
                  {issuedTicket.ticketNumber}
                </h1>
                {issuedTicket.priority && issuedTicket.priority !== 'NORMAL' && (
                  <span className="inline-block mt-2 px-3 py-1 text-xs font-bold bg-amber-400 text-slate-950 rounded-full shadow-xs">
                    Ưu tiên: {issuedTicket.priorityReason || issuedTicket.priority}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-blue-200 font-medium">
                <span>Mã tra cứu phiếu:</span>
                <span className="font-mono font-black text-white bg-white/20 px-2.5 py-0.5 rounded-lg border border-white/25">
                  {issuedTicket.token}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Perforated Divider */}
          <div className="relative flex items-center justify-between px-3 py-1 bg-white">
            <div className="w-5 h-5 -ml-6 rounded-full bg-[#f8fafc] border-r border-slate-200" />
            <div className="flex-1 border-b-2 border-dashed border-slate-200 mx-2" />
            <div className="w-5 h-5 -mr-6 rounded-full bg-[#f8fafc] border-l border-slate-200" />
          </div>

          {/* Queue Real-time Wait Info */}
          <div className="p-6 sm:p-7 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 text-center">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                  Người trước bạn
                </span>
                <p className="text-3xl font-black text-amber-600 mt-1 font-heading">
                  {waitInfo ? waitInfo.peopleAhead : 0}
                  <span className="text-xs font-semibold text-slate-500 ml-1">người</span>
                </p>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 text-center">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                  Thời gian chờ dự kiến
                </span>
                <p className="text-base font-bold text-blue-700 mt-2 font-mono">
                  {waitInfo?.timeRangeText || '~10-15 phút'}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Thời gian cấp phiếu:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {new Date(issuedTicket.createdAt).toLocaleTimeString('vi-VN')} ({new Date(issuedTicket.createdAt).toLocaleDateString('vi-VN')})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Trạng thái hàng đợi:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đang trong hàng đợi chờ gọi
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              {/* Primary Mobile Action: Download Ticket Image */}
              <button
                type="button"
                onClick={handleDownloadTicket}
                disabled={downloadingImage}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/25 cursor-pointer border border-emerald-400/30"
              >
                {downloadingImage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang tạo ảnh phiếu số...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Đã lưu ảnh phiếu số về thiết bị!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Tải ảnh vé về điện thoại (Lưu vào máy)</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all shadow-xs cursor-pointer border border-slate-700/60"
                >
                  <Printer className="w-4 h-4 text-slate-300" />
                  <span>Xem / In phiếu số</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTrackTicket(issuedTicket.token)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/25 cursor-pointer border border-blue-400/30"
                >
                  <QrCode className="w-4 h-4 text-blue-200" />
                  <span>Theo dõi trực tiếp</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setIssuedTicket(null);
                setSelectedService(null);
              }}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors text-center cursor-pointer mt-2"
            >
              ← Trở về danh sách dịch vụ
            </button>
          </div>
        </div>

        {showPrintModal && (
          <TicketPrintModal
            ticket={issuedTicket}
            waitInfo={waitInfo || undefined}
            publicBaseUrl={publicBaseUrl}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </div>
    );
  }

  // Step 2: Dynamic Form for selected service
  if (selectedService) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedService(null)}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Chọn dịch vụ khác</span>
          </button>

          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors border border-indigo-200 cursor-pointer shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Hướng dẫn lấy số</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
              <span className="px-2 py-0.5 bg-blue-100 rounded-md font-mono">{selectedService.prefix}</span>
              <span>Dịch vụ hành chính</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{selectedService.name}</h2>
            <p className="text-xs text-slate-500 mt-1">{selectedService.description}</p>
            <div className="flex items-center gap-4 text-xs text-slate-600 mt-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Trung bình: ~{selectedService.avgServiceTimeMinutes} phút/lượt
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Giới hạn hôm nay: {selectedService.dailyMax} số
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Dynamic Fields */}
            {selectedService.fields
              .slice()
              .sort((a, b) => a.order - b.order)
              .map(field => {
                if (!field.visibility) return null;

                return (
                  <div key={field.id} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                      {field.antiDuplicateKey && (
                        <span className="ml-1.5 text-[10px] text-blue-600 font-normal">
                          (Dùng kiểm tra trùng số)
                        </span>
                      )}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        value={formData[field.id] || ''}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      >
                        <option value="">-- Vui lòng chọn --</option>
                        {field.options?.map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.id] || ''}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        rows={3}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      />
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData[field.id]}
                          onChange={e => handleInputChange(field.id, e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{field.placeholder || field.label}</span>
                      </label>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={formData[field.id] || ''}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      />
                    )}
                  </div>
                );
              })}

            {/* Priority Option (Section 27) */}
            {selectedService.isPriorityEnabled && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                  <HeartHandshake className="w-4 h-4 text-amber-700" />
                  <span>Chế độ ưu tiên đặc biệt (nếu thuộc đối tượng)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'NORMAL', label: 'Không ưu tiên' },
                    { id: 'ELDERLY', label: 'Người cao tuổi (≥70 tuổi)' },
                    { id: 'PREGNANT', label: 'Phụ nữ mang thai' },
                    { id: 'DISABILITY', label: 'Người khuyết tật' },
                  ].map(p => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => {
                        setPriority(p.id as PriorityLevel);
                        if (p.id !== 'NORMAL') setPriorityReason(p.label);
                      }}
                      className={`p-2 rounded-lg border text-left font-medium transition-all ${priority === p.id
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Anti-Duplicate & Terms agreement */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>
                  Tôi cam kết thông tin kê khai là chính xác, không lấy nhiều số trùng lặp trái quy định và chấp hành quy chế sảnh chờ.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting || !agreeTerms}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Hệ thống đang kiểm tra & cấp số...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-200" />
                    <span>XÁC NHẬN BỐC SỐ THỨ TỰ</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 1: Browse Services List
  const filteredServices = services.filter(srv => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      srv.name.toLowerCase().includes(q) ||
      srv.prefix.toLowerCase().includes(q) ||
      (srv.description && srv.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-5xl mx-auto py-6 px-2 sm:px-4 font-sans">
      {/* Hero Banner with Modern GovTech Branding */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 mb-8 border border-slate-800 shadow-xl overflow-hidden">
        {/* Subtle decorative mesh background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-4 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>HỆ THỐNG MỘT CỬA ĐIỆN TỬ • ĐỀ ÁN 06/CP</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-heading">
            Cổng Lấy Số Thứ Tự Trực Tuyến
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium leading-relaxed">
            Hàng đợi thông minh liên thông đa kênh. Quý khách bốc số từ xa, theo dõi tiến độ thời gian thực và nhận thông báo khi gần đến lượt.
          </p>

          {/* Quick Service Search Bar */}
          <div className="mt-6 max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm thủ tục hành chính (CCCD, Hộ tịch, Đất đai...)"
                className="w-full pl-12 pr-10 py-3.5 bg-white/10 hover:bg-white/15 focus:bg-white focus:text-slate-900 text-white placeholder-slate-400 rounded-2xl border border-white/20 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-200 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {searchQuery && (
              <p className="text-left text-xs text-indigo-200 mt-2 px-1 font-medium">
                Tìm thấy {filteredServices.length} thủ tục phù hợp với "{searchQuery}"
              </p>
            )}
          </div>

          {onOpenGuide && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenGuide}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all border border-white/15 shadow-xs cursor-pointer active:scale-95"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Hướng dẫn quy trình bốc số</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Services Header and Count */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-lg font-black text-slate-900 font-heading">
            Danh Mục Lĩnh Vực Tiếp Nhận
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Chọn đúng lĩnh vực dịch vụ công để nhận số thứ tự tương ứng
          </p>
        </div>
        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full font-mono">
          {filteredServices.length} lĩnh vực
        </span>
      </div>

      {/* Services Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map(srv => (
          <div
            key={srv.id}
            onClick={() => handleSelectService(srv)}
            className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
          >
            {/* Top Hover Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="px-3 py-1.5 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-700 font-mono font-black text-xs rounded-xl border border-indigo-200/80 shadow-2xs">
                  {srv.prefix}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đang mở tiếp nhận
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors font-heading leading-snug">
                {srv.name}
              </h3>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                {srv.description}
              </p>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-mono font-medium text-slate-600">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                ~{srv.avgServiceTimeMinutes} phút/lượt
              </span>
              <span className="flex items-center gap-1 text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">
                <span>Chọn dịch vụ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Không tìm thấy dịch vụ phù hợp</p>
          <p className="text-xs text-slate-500 mt-1">Vui lòng thử lại với từ khóa khác</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-3 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 cursor-pointer"
          >
            Xem tất cả dịch vụ
          </button>
        </div>
      )}

      {/* Dedicated Physical Hardware Links Bento Grid (Separated URLs for Kiosk & TV) */}
      <div className="mt-12 pt-8 border-t border-slate-200/80">
        <div className="mb-5 px-1">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
            KẾT NỐI THIẾT BỊ VẬT LÝ TẠI SẢNH
          </span>
          <h2 className="text-lg font-black text-slate-900 mt-0.5 font-heading">
            Màn Hình Kiosk Cảm Ứng & Màn Hình TV Sảnh Chờ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Mỗi thiết bị chuyên dụng tại trung tâm sử dụng một đường dẫn URL độc lập, tối ưu hoá toàn màn hình (16:9) và thao tác cảm ứng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Touchscreen Kiosk */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-md flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                    <Touchpad className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">Máy Kiosk Cảm Ứng Sảnh</h3>
                    <span className="text-[11px] text-indigo-300 font-mono">Đường dẫn: /kiosk</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold rounded-lg border border-indigo-500/30">
                  Link riêng
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Giao diện cảm ứng toàn màn hình, tích hợp bàn phím ảo tiếng Việt, camera quét CCCD/QR và máy in nhiệt tự động cấp số.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <a
                href="/kiosk"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
              >
                <span>Mở Kiosk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copyLink('/kiosk')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer border border-slate-700/60"
                  title="Sao chép link /kiosk"
                >
                  {copiedDeviceUrl === '/kiosk' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px] font-bold">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Chép link</span>
                    </>
                  )}
                </button>

                <a
                  href="/kiosk"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700/60"
                  title="Mở Kiosk trong tab riêng"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: TV Display Screen */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-md flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">Màn Hình TV Trung Tâm</h3>
                    <span className="text-[11px] text-blue-300 font-mono">Đường dẫn: /tv</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold rounded-lg border border-blue-500/30">
                  Link riêng
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Màn hình kích thước lớn (TV/Máy chiếu sảnh) hiển thị số thứ tự đang gọi tại các quầy, tích hợp bộ âm thanh đọc số tự động.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <a
                href="/tv"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/25"
              >
                <span>Mở TV Display</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copyLink('/tv')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer border border-slate-700/60"
                  title="Sao chép link /tv"
                >
                  {copiedDeviceUrl === '/tv' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px] font-bold">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Chép link</span>
                    </>
                  )}
                </button>

                <a
                  href="/tv"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700/60"
                  title="Mở TV Display trong tab riêng"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
