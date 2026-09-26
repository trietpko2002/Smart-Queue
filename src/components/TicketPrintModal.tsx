import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Ticket } from '../types/queue.js';
import { Printer, X, Download, Share2, Check, RotateCcw } from 'lucide-react';
import { downloadTicketImage } from '../utils/ticketImageGenerator.js';
import { getPublicUrl } from '../utils/url.js';

interface TicketPrintModalProps {
  ticket: Ticket;
  waitInfo?: { peopleAhead: number; estimatedMinutes: number; timeRangeText: string };
  publicBaseUrl?: string;
  onClose: () => void;
}

export const TicketPrintModal: React.FC<TicketPrintModalProps> = ({ ticket, waitInfo, publicBaseUrl, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [printFormat, setPrintFormat] = useState<'80mm' | '58mm' | 'a4'>('80mm');
  const [copied, setCopied] = useState(false);
  const [downloadingImg, setDownloadingImg] = useState(false);
  const [downloadedImg, setDownloadedImg] = useState(false);

  useEffect(() => {
    // Generate QR containing public url with token (zero PII)
    const publicUrl = getPublicUrl(`/ticket/${ticket.token}`, publicBaseUrl);
    QRCode.toDataURL(publicUrl, { width: 240, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(url => setQrDataUrl(url))
      .catch(console.error);
  }, [ticket.token, publicBaseUrl]);

  const handleDownloadImg = async () => {
    setDownloadingImg(true);
    const res = await downloadTicketImage(ticket, waitInfo, publicBaseUrl);
    setDownloadingImg(false);
    if (res.success) {
      setDownloadedImg(true);
      setTimeout(() => setDownloadedImg(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const publicUrl = getPublicUrl(`/ticket/${ticket.token}`, publicBaseUrl);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Phiếu số thứ tự: ${ticket.ticketNumber}`,
          text: `Theo dõi lượt gọi số ${ticket.ticketNumber} - ${ticket.serviceName}`,
          url: publicUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Printer className="w-5 h-5 text-blue-600" />
            <span>Phiếu Lấy Số Điện Tử</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper format selector */}
        <div className="px-6 pt-4 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
          <span>Khổ in mô phỏng:</span>
          <div className="flex gap-1.5">
            {(['80mm', '58mm', 'a4'] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => setPrintFormat(fmt)}
                className={`px-2.5 py-1 rounded-md font-medium uppercase tracking-wider transition-all ${
                  printFormat === fmt
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Printable Ticket Receipt Area */}
        <div className="p-6 bg-slate-100 flex justify-center">
          <div
            id="printable-ticket"
            className={`bg-white border border-dashed border-slate-300 rounded-xl p-6 shadow-sm text-center transition-all ${
              printFormat === '58mm' ? 'w-64 text-xs' : printFormat === '80mm' ? 'w-80 text-sm' : 'w-96 text-sm'
            }`}
          >
            {/* Agency logo / header */}
            <div className="border-b border-slate-200 pb-3 mb-3">
              <p className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                UBND THÀNH PHỐ
              </p>
              <p className="font-semibold text-blue-800 text-xs mt-0.5">
                TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Hotline: 1900 1234 • Giờ làm việc: 08:00 - 17:00
              </p>
            </div>

            {/* Service & Ticket Big Number */}
            <p className="text-slate-600 font-medium text-xs mb-1 uppercase tracking-wider">
              {ticket.serviceName}
            </p>
            <div className="my-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                SỐ THỨ TỰ CỦA BẠN
              </span>
              <span className="text-4xl sm:text-5xl font-extrabold text-blue-700 tracking-tight font-mono block my-1">
                {ticket.ticketNumber}
              </span>
              {ticket.priority && ticket.priority !== 'NORMAL' && (
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                  {ticket.priorityReason || 'Ưu tiên đặc biệt'}
                </span>
              )}
            </div>

            {/* Queue Wait Details */}
            <div className="space-y-1.5 py-2 border-y border-dashed border-slate-200 text-left text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Giờ lấy số:</span>
                <span className="font-semibold">{new Date(ticket.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày lấy:</span>
                <span className="font-semibold">{new Date(ticket.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Người trước bạn:</span>
                <span className="font-bold text-amber-600">{waitInfo ? `${waitInfo.peopleAhead} người` : 'Đang tính toán'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khung giờ dự kiến:</span>
                <span className="font-semibold text-blue-700">{waitInfo?.timeRangeText || '10 - 20 phút'}</span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="mt-4 flex flex-col items-center justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Tra cứu số" className="w-28 h-28 border border-slate-200 p-1 rounded-lg" />
              ) : (
                <div className="w-28 h-28 bg-slate-100 animate-pulse rounded-lg" />
              )}
              <p className="text-[10px] text-slate-500 mt-2">
                Quét mã QR bằng điện thoại để xem hàng đợi trực tiếp
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                Mã theo dõi: {ticket.token}
              </p>
            </div>

            <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
              Quý khách vui lòng lắng nghe loa và quan sát màn hình TV tại sảnh chờ.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={handleDownloadImg}
            disabled={downloadingImg}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs shadow-xs transition-all cursor-pointer"
          >
            {downloadingImg ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Đang tạo ảnh...</span>
              </>
            ) : downloadedImg ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Đã lưu ảnh vé!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Tải ảnh vé (PNG)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép link!' : 'Chia sẻ link'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In phiếu ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
