import React, { useState, useEffect } from 'react';
import { PropagandaConfig, StateBannerItem } from '../types/queue.js';
import {
  Flag,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Eye,
  Megaphone,
  Sparkles,
} from 'lucide-react';
import { StatePropagandaBanner } from './StatePropagandaBanner.js';

interface AdminPropagandaSettingsProps {
  onSaved?: () => void;
}

export const AdminPropagandaSettings: React.FC<AdminPropagandaSettingsProps> = ({ onSaved }) => {
  const [config, setConfig] = useState<PropagandaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newSlogan, setNewSlogan] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'SLOGANS' | 'BANNERS' | 'PREVIEW'>('SLOGANS');

  // Load config
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/propaganda');
      if (!res.ok) throw new Error('Không thể tải cấu hình tuyên truyền');
      const data = await res.json();
      setConfig(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/propaganda', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi lưu cấu hình');
      }

      const updated = await res.json();
      setConfig(updated);
      setSuccessMsg('Đã lưu và áp dụng cấu hình tuyên truyền chính sách thành công!');
      setTimeout(() => setSuccessMsg(null), 4000);
      if (onSaved) onSaved();
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSlogan = () => {
    if (!newSlogan.trim() || !config) return;
    setConfig({
      ...config,
      slogans: [...(config.slogans || []), newSlogan.trim()],
    });
    setNewSlogan('');
  };

  const handleRemoveSlogan = (index: number) => {
    if (!config) return;
    const updated = [...(config.slogans || [])];
    updated.splice(index, 1);
    setConfig({ ...config, slogans: updated });
  };

  const handleUpdateSlogan = (index: number, val: string) => {
    if (!config) return;
    const updated = [...(config.slogans || [])];
    updated[index] = val;
    setConfig({ ...config, slogans: updated });
  };

  const handleAddBanner = () => {
    if (!config) return;
    const newBanner: StateBannerItem = {
      id: 'banner_' + Date.now(),
      badge: 'TUYÊN TRUYỀN',
      title: 'Tiêu đề thông điệp tuyên truyền mới',
      subtitle: 'Phổ biến chính sách & hướng dẫn thủ tục công dân',
      description: 'Mô tả tóm tắt nội dung chính sách hoặc tiện ích chuyển đổi số mới được ban hành.',
      categoryBadge: 'TUYÊN TRUYỀN',
      qrUrl: 'https://dichvucong.gov.vn',
      qrLabel: 'Quét mã tra cứu',
      highlightTag: 'Chính sách mới',
      iconType: 'flag',
      themeGradient: 'from-red-900 via-red-950 to-slate-950 border-red-500/40 text-red-100',
      active: true,
      order: (config.banners?.length || 0) + 1,
    };
    setConfig({
      ...config,
      banners: [...(config.banners || []), newBanner],
    });
  };

  const handleUpdateBanner = (index: number, fields: Partial<StateBannerItem>) => {
    if (!config) return;
    const updated = [...(config.banners || [])];
    updated[index] = { ...updated[index], ...fields };
    setConfig({ ...config, banners: updated });
  };

  const handleRemoveBanner = (index: number) => {
    if (!config) return;
    const updated = [...(config.banners || [])];
    updated.splice(index, 1);
    setConfig({ ...config, banners: updated });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
        <RotateCcw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">Đang tải cấu hình thông tin tuyên truyền chính sách...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm text-slate-700 font-bold mb-4">Không tìm thấy dữ liệu tuyên truyền</p>
        <button
          onClick={fetchConfig}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-red-100 text-red-700 rounded-xl">
              <Flag className="w-5 h-5 fill-red-700" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Thiết Lập Thông Tin App & Tuyên Truyền Chính Sách
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý khẩu hiệu chạy chữ, banner phổ biến pháp luật, đường dây nóng và liên kết tra cứu dịch vụ công
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchConfig}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Tải lại
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 text-xs font-black text-white bg-red-600 hover:bg-red-700 active:scale-98 rounded-xl shadow-md shadow-red-200 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu & Áp Dụng Toàn Hệ Thống</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Basic Settings: Organization & Hotline */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-600" />
          <span>Thông Tin Cơ Quan & Cổng Tiếp Nhận</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Tiêu đề cơ quan / Trung tâm HCC:</label>
            <input
              type="text"
              value={config.organizationName || ''}
              onChange={e => setConfig({ ...config, organizationName: e.target.value })}
              placeholder="Ví dụ: UBND THÀNH PHỐ - TT PHỤC VỤ HÀNH CHÍNH CÔNG"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:border-red-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Phụ đề định hướng / Tôn chỉ:</label>
            <input
              type="text"
              value={config.bannerSubtitle || ''}
              onChange={e => setConfig({ ...config, bannerSubtitle: e.target.value })}
              placeholder="Chính quyền số - Công khai minh bạch - Phục vụ nhân dân"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:border-red-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Số điện thoại Đường dây nóng (Hotline):</label>
            <input
              type="text"
              value={config.hotline || ''}
              onChange={e => setConfig({ ...config, hotline: e.target.value })}
              placeholder="1022 hoặc 024.1022"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-red-600 focus:outline-hidden focus:border-red-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Slogans vs Banners vs Live Preview */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('SLOGANS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'SLOGANS'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Khẩu Hiệu Chạy Chữ Marquee ({config.slogans?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('BANNERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'BANNERS'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Banner Chính Sách & QR Tra Cứu ({config.banners?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('PREVIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'PREVIEW'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Xem Trước Trực Quan (Live Preview)</span>
        </button>
      </div>

      {/* TAB 1: SLOGANS */}
      {activeSubTab === 'SLOGANS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Danh Sách Khẩu Hiệu Chạy Chữ (Marquee)</h3>
              <p className="text-xs text-slate-500">
                Các câu tuyên truyền hiển thị xoay vòng liên tục ở chân máy Kiosk, màn hình TV sảnh và giao diện công dân.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSlogan}
                onChange={e => setNewSlogan(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSlogan()}
                placeholder="Nhập câu khẩu hiệu mới..."
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs min-w-[280px] focus:outline-hidden focus:border-red-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddSlogan}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {config.slogans?.map((slogan, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl transition-colors"
              >
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-800 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={slogan}
                  onChange={e => handleUpdateSlogan(idx, e.target.value)}
                  className="flex-1 bg-white px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSlogan(idx)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Xóa câu này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BANNERS */}
      {activeSubTab === 'BANNERS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900">Danh Sách Banner Tuyên Truyền & QR Dịch Vụ Công</h3>
              <p className="text-xs text-slate-500">
                Các thẻ truyền thông chuyên đề hiển thị tự động trên máy Kiosk lấy số và màn hình TV phòng chờ.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddBanner}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Banner Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.banners?.map((banner, idx) => (
              <div
                key={banner.id || idx}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-red-100 text-red-800 text-[11px] font-black rounded-lg uppercase">
                      Banner #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={banner.active !== false}
                          onChange={e => handleUpdateBanner(idx, { active: e.target.checked })}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                        <span>Hiển thị</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveBanner(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Xóa banner này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tiêu đề chính:</label>
                    <input
                      type="text"
                      value={banner.title}
                      onChange={e => handleUpdateBanner(idx, { title: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Phụ đề ngắn:</label>
                    <input
                      type="text"
                      value={banner.subtitle}
                      onChange={e => handleUpdateBanner(idx, { subtitle: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Mô tả nội dung chi tiết:</label>
                    <textarea
                      rows={2}
                      value={banner.description}
                      onChange={e => handleUpdateBanner(idx, { description: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Huy hiệu thể loại:</label>
                      <input
                        type="text"
                        value={banner.categoryBadge}
                        onChange={e => handleUpdateBanner(idx, { categoryBadge: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Thẻ nổi bật:</label>
                      <input
                        type="text"
                        value={banner.highlightTag}
                        onChange={e => handleUpdateBanner(idx, { highlightTag: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Đường dẫn QR Code (URL tra cứu):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={banner.qrUrl}
                        onChange={e => handleUpdateBanner(idx, { qrUrl: e.target.value })}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-blue-700"
                      />
                      <a
                        href={banner.qrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600"
                        title="Mở liên kết"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PREVIEW */}
      {activeSubTab === 'PREVIEW' && (
        <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-black text-white uppercase tracking-wider">
                Mô Phỏng Trực Quan Trên Máy Kiosk & Màn Hình Sảnh
              </span>
            </div>
            <span className="text-xs text-amber-300 font-mono">Tự động chuyển mỗi 6 giây</span>
          </div>

          <div className="max-w-2xl mx-auto">
            <StatePropagandaBanner variant="hero-16-9" autoPlayInterval={6000} />
          </div>

          <div className="pt-2">
            <span className="text-xs text-slate-400 block mb-1">Dải chạy chữ Marquee ở chân máy:</span>
            <StatePropagandaBanner variant="marquee-only" />
          </div>
        </div>
      )}
    </div>
  );
};
