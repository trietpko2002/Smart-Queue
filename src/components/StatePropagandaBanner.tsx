import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  STATE_PROPAGANDA_BANNERS,
  OFFICIAL_STATE_SLOGANS,
  StateBannerItem,
} from '../data/stateAnnouncements.js';
import {
  Flag,
  ShieldCheck,
  Award,
  Landmark,
  QrCode,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Volume2,
} from 'lucide-react';

interface StatePropagandaBannerProps {
  variant?: 'hero-16-9' | 'sidebar' | 'marquee-only' | 'compact';
  className?: string;
  autoPlayInterval?: number; // default 8000ms
}

export const StatePropagandaBanner: React.FC<StatePropagandaBannerProps> = ({
  variant = 'hero-16-9',
  className = '',
  autoPlayInterval = 8000,
}) => {
  const [banners, setBanners] = useState<StateBannerItem[]>(STATE_PROPAGANDA_BANNERS);
  const [slogans, setSlogans] = useState<string[]>(OFFICIAL_STATE_SLOGANS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [isPaused, setIsPaused] = useState(false);

  // Fetch dynamic propaganda config from backend
  useEffect(() => {
    fetch('/api/propaganda')
      .then(res => res.json())
      .then(data => {
        if (data.banners && Array.isArray(data.banners) && data.banners.length > 0) {
          const activeList = data.banners.filter((b: StateBannerItem) => b.active !== false);
          if (activeList.length > 0) setBanners(activeList);
        }
        if (data.slogans && Array.isArray(data.slogans) && data.slogans.length > 0) {
          setSlogans(data.slogans);
        }
      })
      .catch(() => {
        // Fallback to static defaults
      });
  }, []);

  const activeBanner = banners[currentIndex] || banners[0] || STATE_PROPAGANDA_BANNERS[0];

  // Pre-generate QR codes for each banner
  useEffect(() => {
    banners.forEach(banner => {
      if (!banner?.qrUrl) return;
      QRCode.toDataURL(banner.qrUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(url => {
          setQrCodeDataUrls(prev => ({ ...prev, [banner.id]: url }));
        })
        .catch(console.error);
    });
  }, [banners]);

  // Auto carousel effect
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlayInterval, isPaused, banners.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'flag':
        return <Flag className="w-5 h-5 text-amber-400" />;
      case 'shield':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'award':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'landmark':
      default:
        return <Landmark className="w-5 h-5 text-blue-400" />;
    }
  };

  // Marquee-only display
  if (variant === 'marquee-only') {
    return (
      <div className={`w-full overflow-hidden bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-amber-300 py-1.5 px-3 border-y border-amber-500/40 select-none ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500 text-red-950 text-[10px] font-black uppercase rounded-md shrink-0 shadow-xs">
            <Flag className="w-3 h-3 text-red-900 fill-red-900" />
            <span>TUYÊN TRUYỀN CHÍNH SÁCH</span>
          </div>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <div className="inline-block animate-marquee font-bold text-xs tracking-wide">
              {slogans.join('   •   ')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hero 16:9 or Compact Banner Layout
  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${activeBanner.themeGradient} border-2 shadow-2xl transition-all duration-500 flex flex-col justify-between select-none ${className}`}
    >
      {/* State Emblems & Background Accent */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-amber-500/10 via-red-500/5 to-transparent rounded-bl-full pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Top Bar with Badge, Organization & Carousel Navigation */}
      <div className="p-4 sm:p-5 flex items-center justify-between z-10 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-inner">
            {renderIcon(activeBanner.iconType)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black tracking-wider uppercase shadow-xs ${activeBanner.badgeColor}`}>
                {activeBanner.badge}
              </span>
              <span className="hidden sm:inline text-[10px] font-semibold text-amber-200/80 uppercase tracking-widest">
                TUYÊN TRUYỀN PHỔ BIẾN PHÁP LUẬT
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5 tracking-wide">
              {activeBanner.source}
            </p>
          </div>
        </div>

        {/* Carousel controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/30 px-2 py-0.5 rounded-full border border-white/10">
            {currentIndex + 1}/{STATE_PROPAGANDA_BANNERS.length}
          </span>
          <button
            onClick={handlePrev}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
            title="Thông điệp trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
            title="Thông điệp kế tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 z-10 flex flex-col md:flex-row items-center justify-between gap-6 my-auto">
        <div className="flex-1 space-y-3 text-left">
          <h3 className="text-lg sm:text-xl md:text-2xl font-black text-amber-300 tracking-tight leading-snug">
            {activeBanner.title}
          </h3>

          <div className="inline-block px-3 py-1 bg-amber-400/20 border border-amber-300/40 rounded-xl text-amber-200 font-bold text-xs sm:text-sm tracking-wide shadow-xs">
            {activeBanner.highlightText}
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl">
            {activeBanner.description}
          </p>

          {/* Key tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeBanner.tags.map(tag => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-medium border border-white/15"
              >
                ✓ {tag}
              </span>
            ))}
          </div>
        </div>

        {/* QR Code Container for Public Interaction */}
        <div className="shrink-0 bg-white/95 rounded-2xl p-3 shadow-xl border-2 border-amber-400/60 text-center flex flex-col items-center justify-center space-y-1.5 max-w-[150px]">
          {qrCodeDataUrls[activeBanner.id] ? (
            <img
              src={qrCodeDataUrls[activeBanner.id]}
              alt={activeBanner.qrLabel}
              className="w-24 h-24 object-contain rounded-lg"
            />
          ) : (
            <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
              <QrCode className="w-8 h-8 animate-pulse" />
            </div>
          )}
          <span className="text-[10px] font-black text-slate-900 leading-tight block">
            {activeBanner.qrLabel}
          </span>
          <span className="text-[9px] text-slate-500 font-medium block">
            Quét mã trên điện thoại
          </span>
        </div>
      </div>

      {/* Footer Navigation Dots & Slogan */}
      <div className="p-3 bg-black/40 backdrop-blur-xs border-t border-white/10 flex items-center justify-between text-xs z-10">
        <div className="flex items-center gap-1.5">
          {STATE_PROPAGANDA_BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === currentIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              title={`Chuyển đến banner ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-medium text-amber-200/90">
          <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
          <span>Tổng đài Dịch vụ công & Phản ánh kiến nghị: <strong>1022</strong> (24/7)</span>
        </div>
      </div>
    </div>
  );
};
