import React, { useState, useEffect } from 'react';
import { Organization } from '../types/queue.js';
import { isLocalAddress, cleanUrl, isValidHttpUrl } from '../utils/url.js';
import {
  Globe,
  Radio,
  Monitor,
  Smartphone,
  Check,
  AlertTriangle,
  ExternalLink,
  Copy,
  Save,
  Terminal,
  ShieldCheck,
  Zap,
  Building2,
  Phone,
  Sparkles,
  Download,
} from 'lucide-react';

interface AdminSettingsTabProps {
  branchId: string;
  onRefresh: () => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ branchId, onRefresh }) => {
  const [org, setOrg] = useState<Organization | null>(null);
  const [publicUrlInput, setPublicUrlInput] = useState('');
  const [orgNameInput, setOrgNameInput] = useState('');
  const [sloganInput, setSloganInput] = useState('');
  const [hotlineInput, setHotlineInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  // Fetch current organization config
  const fetchOrgConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/org');
      if (res.ok) {
        const data: Organization = await res.json();
        setOrg(data);
        setPublicUrlInput(data.publicBaseUrl || '');
        setOrgNameInput(data.name || '');
        setSloganInput(data.slogan || '');
        setHotlineInput(data.hotline || '');
      }
    } catch (err) {
      console.error('Lỗi khi tải cấu hình cơ quan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgConfig();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const cleanedUrl = publicUrlInput ? cleanUrl(publicUrlInput) : '';
      const payload: Partial<Organization> = {
        name: orgNameInput.trim(),
        slogan: sloganInput.trim(),
        hotline: hotlineInput.trim(),
        publicBaseUrl: cleanedUrl,
      };

      const res = await fetch('/api/org', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrg(updated);
        // Cache in localStorage for client-side instant retrieval
        if (cleanedUrl) {
          localStorage.setItem('smart_queue_public_url', cleanedUrl);
        } else {
          localStorage.removeItem('smart_queue_public_url');
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        onRefresh();
      }
    } catch (err) {
      console.error('Lỗi khi lưu cài đặt:', err);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  const isPublicConfigured = Boolean(publicUrlInput && isValidHttpUrl(publicUrlInput) && !isLocalAddress(publicUrlInput));

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold">Đang tải cấu hình hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. PUBLIC BASE URL CONFIGURATION BANNER & FORM */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Cấu Hình Tên Miền Công Khai (Public Base URL)
                </h2>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded-md border border-indigo-200">
                  CỐ ĐỊNH LINK QUÉT QR
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Đường link công khai để công dân dùng điện thoại (4G/5G/WiFi) quét mã QR phiếu số hoặc bốc số từ xa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPublicConfigured ? (
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Link Public Hợp Lệ</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Chưa có Public Link</span>
              </span>
            )}
          </div>
        </div>

        {/* Warning Callout if using localhost */}
        {!isPublicConfigured && (
          <div className="mt-5 p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                ⚠️ Cảnh báo: Hệ thống hiện đang chạy trên địa chỉ mạng nội bộ / localhost!
              </p>
              <p className="text-amber-800 leading-relaxed">
                Khi công dân dùng điện thoại quét mã QR in trên giấy hoặc hiển thị trên Kiosk, điện thoại của họ sẽ{' '}
                <strong>không thể mở được link</strong> vì không vào được mạng localhost của máy bạn. Hãy khởi động{' '}
                <strong>Cloudflare Tunnel</strong> bên dưới hoặc nhập tên miền công khai của cơ quan để mọi mã QR đều quét được online!
              </p>
            </div>
          </div>
        )}

        {/* Public URL Form */}
        <form onSubmit={handleSaveSettings} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Đường dẫn / Tên miền Public của hệ thống:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="Ví dụ: https://xephang.coquan.gov.vn hoặc https://random-subdomain.trycloudflare.com"
                  value={publicUrlInput}
                  onChange={e => setPublicUrlInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                />
              </div>

              {publicUrlInput && isValidHttpUrl(publicUrlInput) && (
                <a
                  href={publicUrlInput}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
                  title="Kiểm tra mở thử link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mở Thử</span>
                </a>
              )}

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {saving ? (
                  <span>Đang lưu...</span>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Đã Lưu Thành Công!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu Cấu Hình</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              💡 Mẹo: Có thể nhập link Cloudflare Tunnel miễn phí (xem hướng dẫn kích hoạt nhanh bên dưới).
            </p>
          </div>

          <div className="h-[1px] bg-slate-100 my-4" />

          {/* Org Name & Slogan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên Cơ quan / Trung tâm:
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orgNameInput}
                  onChange={e => setOrgNameInput(e.target.value)}
                  placeholder="TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Khẩu hiệu (Slogan):
              </label>
              <input
                type="text"
                value={sloganInput}
                onChange={e => setSloganInput(e.target.value)}
                placeholder="Công khai – Minh bạch – Tận tình – Đúng hẹn"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hotline hỗ trợ:
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={hotlineInput}
                  onChange={e => setHotlineInput(e.target.value)}
                  placeholder="1900 1234"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* 2. CLOUDFLARE TUNNEL - 1-CLICK FREE PERMANENT PUBLIC LINK */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Tạo Link Public Miễn Phí Bằng Cloudflare Tunnel</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded border border-emerald-500/30">
                  KHÔNG CẦN NAT PORT
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chỉ cần 1-click để có đường truyền HTTPS bảo mật ra Internet, máy đổi mạng hay dùng 4G đều vào được
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Option A: Quick Run File */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/70 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-400">Cách 1: Chạy Script Tự Động (Windows)</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-mono">1 Click</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Trong thư mục dự án, nhấp đúp vào file:
              </p>
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl font-mono text-emerald-400 border border-slate-800">
                <span>scripts\setup-cloudflare-tunnel.bat</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('scripts\\setup-cloudflare-tunnel.bat', 'bat')}
                  className="text-slate-400 hover:text-white p-1"
                  title="Sao chép đường dẫn"
                >
                  {copiedScript === 'bat' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Script sẽ tự động tải công cụ về và hiển thị đường link <code>https://xxx.trycloudflare.com</code>.
              </p>
            </div>
          </div>

          {/* Option B: Custom Permanent Domain */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/70 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400">Cách 2: Gắn Tên Miền Riêng Cố Định</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Chính quy</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Nếu cơ quan bạn có tên miền riêng (ví dụ: <code>xephang.ubnd.gov.vn</code>):
              </p>
              <p className="text-[11px] text-slate-400">
                Đăng nhập Cloudflare Zero Trust ➔ Tạo <strong>Named Tunnel</strong> trỏ về <code>http://localhost:3000</code>. Link sẽ cố định vĩnh viễn không bao giờ thay đổi.
              </p>
            </div>

            <a
              href="/docs/HUONG_DAN_DONG_GOI_VA_PUBLIC_LINK.md"
              target="_blank"
              className="text-indigo-400 hover:text-indigo-300 font-semibold text-[11px] flex items-center gap-1"
            >
              <span>Xem tài liệu cẩm nang chi tiết</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. THREE STANDALONE APP PACKAGING OPTIONS */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>Giải Pháp Đóng Gói App Độc Lập Đa Nền Tảng</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* 1. PWA Card */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">PWA Đa Nền Tảng</h4>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Cài đặt trực tiếp thành app độc lập trên Windows, Mac, iPad Kiosk và Android TV qua nút bấm ở thanh tiêu đề trên cùng.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] text-sky-600 font-semibold">Tích hợp sẵn & Tự động cập nhật</span>
            </div>
          </div>

          {/* 2. Desktop 1-Click Runner */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Monitor className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">1-Click Desktop App (.bat)</h4>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Nhấp đúp chuột vào file <code>SmartQueue-Desktop.bat</code> để khởi chạy máy chủ và mở ứng dụng ở chế độ Standalone Native Window.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] text-emerald-600 font-semibold">Không cần cài đặt thêm phần mềm</span>
            </div>
          </div>

          {/* 3. Electron Executable */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Terminal className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Đóng Gói Electron (.exe)</h4>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Gói toàn bộ Backend SQLite + Frontend vào 1 file cài đặt độc lập Windows <code>.exe</code> để phân phối cho các đơn vị.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <code className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                npm run electron:build
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
