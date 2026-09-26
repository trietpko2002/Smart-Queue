import React, { useState, useEffect, useCallback } from 'react';
import {
  Service,
  Counter,
  Ticket,
  KioskDevice,
  DisplayScreen,
  UserAccount,
  Organization,
} from './types/queue.js';
import { useQueueRealtime, QueueEvent } from './hooks/useQueueRealtime.js';
import { CitizenPortal } from './components/CitizenPortal.js';
import { KioskMode } from './components/KioskMode.js';
import { PwaInstallPrompt } from './components/PwaInstallPrompt.js';
import { TicketTracker } from './components/TicketTracker.js';
import { StaffCounter } from './components/StaffCounter.js';
import { TvDisplay } from './components/TvDisplay.js';
import { AdminPortal } from './components/AdminPortal.js';
import { AdminLoginModal } from './components/AdminLoginModal.js';
import { PortalGuideModal } from './components/PortalGuideModal.js';
import { VirtualKeyboard } from './components/VirtualKeyboard.js';
import {
  Smartphone,
  Touchpad,
  Search,
  UserCheck,
  Tv,
  Settings,
  Radio,
  Building2,
  Sparkles,
  RefreshCw,
  Lock,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Maximize2,
  HelpCircle,
  Keyboard,
} from 'lucide-react';

type ActiveView = 'CITIZEN' | 'KIOSK' | 'TRACKER' | 'STAFF' | 'TV' | 'ADMIN';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('CITIZEN');
  const [trackedToken, setTrackedToken] = useState<string>('');
  const [branchId] = useState<string>('branch_01');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Authentication & Role-based Access State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const sessionUser = sessionStorage.getItem('smart_queue_user');
      if (sessionUser) return JSON.parse(sessionUser);
      const stored = localStorage.getItem('smart_queue_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [guideModalOpen, setGuideModalOpen] = useState<boolean>(false);
  const [virtualKeyboardOpen, setVirtualKeyboardOpen] = useState<boolean>(false);

  // Core domain states
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [kiosks, setKiosks] = useState<KioskDevice[]>([]);
  const [displays, setDisplays] = useState<DisplayScreen[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Keep live digital clock updating every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Programmatic URL Navigation with Browser History pushState
  const navigateToView = (view: ActiveView, customToken?: string) => {
    setActiveView(view);
    let targetPath = '/';
    if (view === 'KIOSK') targetPath = '/kiosk';
    else if (view === 'TV') targetPath = '/tv';
    else if (view === 'TRACKER') targetPath = customToken ? `/ticket/${customToken}` : '/ticket';
    else if (view === 'STAFF') targetPath = '/staff';
    else if (view === 'ADMIN') targetPath = '/admin';
    else targetPath = '/';

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Check URL pathname for direct dedicated URLs (/kiosk, /tv, /ticket/TOKEN, /admin, /staff)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/kiosk' || path.startsWith('/kiosk')) {
        setActiveView('KIOSK');
      } else if (
        path === '/tv' ||
        path.startsWith('/tv') ||
        path === '/display' ||
        path.startsWith('/display')
      ) {
        setActiveView('TV');
      } else if (path.startsWith('/ticket')) {
        const token = path.replace('/ticket/', '').replace('/ticket', '').trim();
        if (token) setTrackedToken(token);
        setActiveView('TRACKER');
      } else if (path === '/staff' || path.startsWith('/staff')) {
        setActiveView('STAFF');
      } else if (path === '/admin' || path.startsWith('/admin')) {
        setActiveView('ADMIN');
      } else {
        setActiveView('CITIZEN');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Toggle browser fullscreen for standalone Kiosk and TV
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Fetch all initial data from backend APIs
  const fetchAllData = useCallback(async () => {
    try {
      const [srvRes, cntRes, tktRes, kskRes, dspRes, usrRes, orgRes] = await Promise.all([
        fetch(`/api/services?branchId=${branchId}`),
        fetch(`/api/counters?branchId=${branchId}`),
        fetch(`/api/tickets?branchId=${branchId}`),
        fetch(`/api/kiosks?branchId=${branchId}`),
        fetch(`/api/displays?branchId=${branchId}`),
        fetch(`/api/users?branchId=${branchId}`),
        fetch('/api/org'),
      ]);

      if (srvRes.ok) setServices(await srvRes.json());
      if (cntRes.ok) setCounters(await cntRes.json());
      if (tktRes.ok) setTickets(await tktRes.json());
      if (kskRes.ok) setKiosks(await kskRes.json());
      if (dspRes.ok) setDisplays(await dspRes.json());
      if (usrRes.ok) setUsers(await usrRes.json());
      if (orgRes?.ok) setOrganization(await orgRes.json());
    } catch (err) {
      console.error('Error fetching queue system data:', err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Real-time Event Receiver via SSE
  const handleRealtimeEvent = useCallback((event: QueueEvent) => {
    fetchAllData();
  }, [fetchAllData]);

  const { isConnected } = useQueueRealtime(handleRealtimeEvent);

  const handleTrackTicket = (token: string) => {
    setTrackedToken(token);
    navigateToView('TRACKER', token);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'ADMIN' || user.role === 'COORDINATOR') {
      navigateToView('ADMIN');
    } else if (user.role === 'STAFF') {
      navigateToView('STAFF');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('smart_queue_token');
    sessionStorage.removeItem('smart_queue_user');
    sessionStorage.removeItem('sq_active_counter');
    sessionStorage.removeItem('sq_active_staff_id');
    localStorage.removeItem('smart_queue_token');
    localStorage.removeItem('smart_queue_user');
    setCurrentUser(null);
    if (activeView === 'STAFF' || activeView === 'ADMIN') {
      navigateToView('CITIZEN');
    }
  };

  // Keyboard shortcut listener (Ctrl+Shift+A or Ctrl+Shift+L for discreet Admin access)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'A' || e.key === 'a' || e.key === 'L' || e.key === 'l')
      ) {
        e.preventDefault();
        setLoginModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Public user portals (always visible to citizens on web/mobile)
  const publicTabs = [
    { id: 'CITIZEN' as ActiveView, label: 'Dân Lấy Số', icon: Smartphone, path: '/' },
    { id: 'TRACKER' as ActiveView, label: 'Tra Cứu Vé', icon: Search, path: '/ticket' },
  ];

  // 2. Dedicated device links (Kiosk touch & TV display are standalone links)
  const dedicatedDeviceLinks = [
    {
      id: 'KIOSK' as ActiveView,
      label: 'Kiosk Cảm Ứng',
      icon: Touchpad,
      path: '/kiosk',
      badge: 'Link riêng: /kiosk',
    },
    {
      id: 'TV' as ActiveView,
      label: 'Màn Hình TV',
      icon: Tv,
      path: '/tv',
      badge: 'Link riêng: /tv',
    },
  ];

  // 3. Internal management portals (only unlocked after staff/admin login)
  const internalTabs = [];
  if (currentUser) {
    if (
      currentUser.role === 'STAFF' ||
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'COORDINATOR'
    ) {
      internalTabs.push({
        id: 'STAFF' as ActiveView,
        label: 'Cán Bộ Quầy',
        icon: UserCheck,
        path: '/staff',
      });
    }
    if (currentUser.role === 'ADMIN' || currentUser.role === 'COORDINATOR') {
      internalTabs.push({
        id: 'ADMIN' as ActiveView,
        label: 'Quản Trị & AI',
        icon: Settings,
        path: '/admin',
      });
    }
  }

  // Detect standalone mode (Full-screen dedicated physical device experience)
  const isStandaloneKiosk = activeView === 'KIOSK';
  const isStandaloneTv = activeView === 'TV';
  const isStandalone = isStandaloneKiosk || isStandaloneTv;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-indigo-200">
          ĐANG KHỞI TẠO HỆ THỐNG SMART QUEUE...
        </p>
      </div>
    );
  }

  // Standalone Full-Screen Mode for Dedicated Hardware (Kiosk terminal & TV Lounge Display)
  if (isStandalone) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col relative text-white selection:bg-indigo-500 selection:text-white">
        {/* Floating Standalone Glass Control Bar */}
        <aside
          aria-label="Standalone controls"
          className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl px-3.5 py-1.5 rounded-2xl border border-white/10 shadow-2xl text-xs font-semibold"
        >
          <div className="flex items-center gap-2 text-indigo-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-200">
              {isStandaloneKiosk ? '🖥️ Kiosk Sảnh (/kiosk)' : '📺 Màn hình TV (/tv)'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700/80 mx-1" />

          {/* Copy Link Button */}
          <button
            onClick={() => {
              const url = window.location.origin + (isStandaloneKiosk ? '/kiosk' : '/tv');
              navigator.clipboard.writeText(url);
              setCopiedUrl(true);
              setTimeout(() => setCopiedUrl(false), 2000);
            }}
            className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 text-[11px] cursor-pointer border border-slate-700/50 active:scale-95"
            title="Sao chép link riêng chuyên dụng"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Đã chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Sao chép Link</span>
              </>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullScreen}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-700/50 active:scale-95"
            title="Bật/Tắt toàn màn hình (F11)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Bàn Phím Ảo Button */}
          <button
            onClick={() => setVirtualKeyboardOpen(prev => !prev)}
            className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 text-[11px] font-bold border cursor-pointer active:scale-95 ${
              virtualKeyboardOpen
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-slate-700/60'
            }`}
            title="Bật/Tắt bàn phím ảo cảm ứng (Hỗ trợ Dấu sẵn, Telex, VNI)"
          >
            <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            <span>Phím ảo</span>
          </button>

          {/* Hướng Dẫn Button */}
          <button
            onClick={() => setGuideModalOpen(true)}
            className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 rounded-xl transition-all flex items-center gap-1.5 text-[11px] font-bold border border-amber-500/30 cursor-pointer active:scale-95"
            title="Xem cẩm nang hướng dẫn sử dụng"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Hướng dẫn</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-700/80 mx-1" />

          {/* Return to Citizen portal */}
          <button
            onClick={() => navigateToView('CITIZEN')}
            className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 text-[11px] cursor-pointer shadow-md shadow-indigo-600/30 active:scale-95"
            title="Quay lại Cổng lấy số trực tuyến của Người Dân"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Cổng Dân (/)</span>
          </button>
        </aside>

        {/* Fullscreen Standalone View Content */}
        <div className="flex-1 w-full min-h-screen">
          {isStandaloneKiosk && (
            <KioskMode
              services={services}
              kiosk={
                kiosks[0] || {
                  id: 'kiosk-01',
                  branchId,
                  name: 'Kiosk Cảm Ứng Sảnh 1',
                  location: 'Cửa ra vào sảnh chính',
                  printerStatus: 'OK',
                  autoResetSeconds: 15,
                  status: 'ONLINE',
                  lastHeartbeat: new Date().toISOString(),
                }
              }
              branchId={branchId}
              publicBaseUrl={organization?.publicBaseUrl}
              onOpenGuide={() => setGuideModalOpen(true)}
            />
          )}

          {isStandaloneTv && (
            <TvDisplay
              counters={counters}
              tickets={tickets}
              displays={displays}
              onOpenGuide={() => setGuideModalOpen(true)}
            />
          )}
        </div>

        {/* Guide Modal for Standalone Mode */}
        <PortalGuideModal
          isOpen={guideModalOpen}
          onClose={() => setGuideModalOpen(false)}
          defaultPortal={isStandaloneKiosk ? 'KIOSK' : 'TV'}
          onNavigateToPortal={navigateToView}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Bento Header Bar */}
      <header className="bg-slate-950/95 backdrop-blur-xl text-white sticky top-0 z-40 border-b border-slate-800/80 shadow-xl shadow-slate-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full bg-slate-950/40 backdrop-blur-xs rounded-[15px] flex items-center justify-center font-black text-base text-white tracking-wider">
                SQ
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black leading-tight tracking-tight text-white font-heading">
                  SMART <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">QUEUE</span>
                </h1>
                <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 text-[10px] font-bold rounded-md uppercase font-mono border border-indigo-400/20 tracking-wider">
                  BENTO GRID
                </span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                Hệ thống Hàng Đợi Thông Minh Đa Kênh
              </p>
            </div>
          </div>

          {/* Center / Right Metadata & Clock */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">CƠ SỞ: TRUNG TÂM HÀNH CHÍNH CÔNG</span>
              <span className="text-xs font-semibold text-slate-200">Phòng Tiếp nhận & Trả kết quả một cửa</span>
            </div>

            <div className="hidden md:block h-7 w-[1px] bg-slate-800" />

            {/* Realtime Status Indicator */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                isConnected
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30 shadow-xs shadow-emerald-500/10'
                  : 'bg-rose-950/60 text-rose-400 border-rose-500/30'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                ></span>
              </span>
              <span className="hidden sm:inline font-mono text-[11px] font-bold">
                {isConnected ? 'Realtime SSE' : 'Mất kết nối'}
              </span>
            </div>

            {/* Live Digital Clock */}
            <div className="hidden sm:block text-right pl-1">
              <p className="text-xs font-bold text-slate-100 font-mono tracking-tight">
                {currentTime.toLocaleDateString('vi-VN')}
              </p>
              <p className="text-[11px] text-indigo-300 font-mono font-semibold">
                {currentTime.toLocaleTimeString('vi-VN')}
              </p>
            </div>

            <button
              onClick={() => fetchAllData()}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-700/60"
              title="Đồng bộ lại dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Quick Virtual Keyboard Toggle Button */}
            <button
              onClick={() => setVirtualKeyboardOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer active:scale-95 ${
                virtualKeyboardOpen
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/20'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-slate-700/60'
              }`}
              title="Bật/Tắt bàn phím ảo cảm ứng (Hỗ trợ Dấu sẵn, Telex, VNI)"
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Phím ảo</span>
            </button>

            {/* PWA Install Button */}
            <PwaInstallPrompt />

            {/* Quick Portal Guide Button */}
            <button
              onClick={() => setGuideModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all border border-amber-500/30 shadow-xs cursor-pointer active:scale-95"
              title="Xem cẩm nang hướng dẫn sử dụng tính năng của các Portal"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Hướng dẫn</span>
            </button>

            {/* Discreet Admin / Staff Login Trigger or Authenticated Badge */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-indigo-300">
                    {currentUser.role === 'ADMIN' ? 'Admin' : 'Cán bộ'}:
                  </span>
                  <span className="text-white max-w-[120px] truncate font-semibold">
                    {currentUser.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Đăng xuất khỏi phiên làm việc"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thoát</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700/80 shadow-xs ml-1 cursor-pointer"
                title="Cổng đăng nhập Cán bộ & Quản trị viên (Phím tắt: Ctrl+Shift+A)"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Cán bộ / Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Bento Sub-nav Tabs Bar: Separates Public vs Dedicated Device Links vs Internal Portals */}
        <div className="bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <nav className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
              {/* 1. Public Portals */}
              {publicTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigateToView(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-900/50 border border-blue-400/30 ring-1 ring-white/15'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

              {/* 2. Dedicated Standalone Device Links (Kiosk & TV Display) */}
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 hidden lg:inline">
                Thiết bị sảnh:
              </span>
              {dedicatedDeviceLinks.map(link => {
                const Icon = link.icon;
                return (
                  <div
                    key={link.id}
                    className="flex items-center bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/60 rounded-xl overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      onClick={() => navigateToView(link.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white whitespace-nowrap cursor-pointer"
                      title={`Truy cập ${link.label} (${link.path})`}
                    >
                      <Icon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{link.label}</span>
                      <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                        {link.path}
                      </span>
                    </button>
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 border-l border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                      title={`Mở ${link.label} trong tab mới riêng biệt`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })}

              {/* 3. Privileged Internal Portals (Unlocked upon login) */}
              {internalTabs.length > 0 && (
                <>
                  <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden sm:block" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 px-1 hidden md:inline">
                    Nội bộ:
                  </span>
                  {internalTabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeView === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => navigateToView(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-400 shadow-md shadow-indigo-900/50'
                            : 'bg-indigo-950/40 text-indigo-200 border-indigo-500/30 hover:bg-indigo-900/60 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Bento Layout Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* System Notice Banner (Bento Grid signature element with left gradient accent) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 px-5 flex items-center gap-4 mb-6 hover:shadow-sm transition-shadow relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-gradient-to-b before:from-blue-600 before:to-indigo-600">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px] uppercase tracking-wider shrink-0 border border-blue-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Thông báo hệ thống</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs text-slate-700 truncate font-medium">
              [Trực tuyến] Hệ thống đang vận hành ổn định trên các quầy giao dịch. Quý khách có thể theo dõi tiến độ lượt gọi qua mã QR trên phiếu điện tử.
            </p>
          </div>
          <div className="text-[11px] text-slate-500 font-mono shrink-0 hidden md:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{counters.filter(c => c.status === 'SERVING' || c.status === 'IDLE').length} quầy đang mở</span>
          </div>
        </div>

        {activeView === 'CITIZEN' && (
          <CitizenPortal
            services={services}
            onTrackTicket={handleTrackTicket}
            branchId={branchId}
            publicBaseUrl={organization?.publicBaseUrl}
            onOpenGuide={() => setGuideModalOpen(true)}
          />
        )}

        {activeView === 'KIOSK' && (
          <div className="w-full max-w-7xl mx-auto">
            <KioskMode
              services={services}
              kiosk={kiosks[0] || {
                id: 'kiosk-01',
                branchId,
                name: 'Kiosk Cảm Ứng Sảnh 1',
                location: 'Cửa ra vào sảnh chính',
                printerStatus: 'OK',
                autoResetSeconds: 15,
                status: 'ONLINE',
                lastHeartbeat: new Date().toISOString(),
              }}
              branchId={branchId}
              publicBaseUrl={organization?.publicBaseUrl}
              onOpenGuide={() => setGuideModalOpen(true)}
            />
          </div>
        )}

        {activeView === 'TRACKER' && (
          <TicketTracker
            initialToken={trackedToken}
            onSelectToken={tok => setTrackedToken(tok)}
            onOpenGuide={() => setGuideModalOpen(true)}
          />
        )}

        {activeView === 'STAFF' && (
          currentUser ? (
            <StaffCounter
              counters={counters}
              services={services}
              users={users}
              tickets={tickets}
              onRefresh={fetchAllData}
              currentUser={currentUser}
              onUserChange={u => setCurrentUser(u)}
              onOpenGuide={() => setGuideModalOpen(true)}
            />
          ) : (
            <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Yêu cầu xác thực Cán bộ</h3>
              <p className="text-xs text-slate-500">
                Khu vực nghiệp vụ gọi số chỉ dành cho cán bộ tiếp nhận hồ sơ tại quầy.
              </p>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-200 inline-flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Đăng nhập Cán bộ</span>
              </button>
            </div>
          )
        )}

        {activeView === 'TV' && (
          <div className="w-full max-w-7xl mx-auto">
            <TvDisplay
              counters={counters}
              tickets={tickets}
              displays={displays}
              onOpenGuide={() => setGuideModalOpen(true)}
            />
          </div>
        )}

        {activeView === 'ADMIN' && (
          currentUser?.role === 'ADMIN' || currentUser?.role === 'COORDINATOR' ? (
            <AdminPortal
              services={services}
              counters={counters}
              kiosks={kiosks}
              displays={displays}
              users={users}
              onRefresh={fetchAllData}
              branchId={branchId}
              onOpenGuide={() => setGuideModalOpen(true)}
            />
          ) : (
            <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Khu vực Quản trị viên</h3>
              <p className="text-xs text-slate-500">
                Chức năng cấu hình quy trình, form động và phân tích AI yêu cầu quyền Quản trị viên.
              </p>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-200 inline-flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Đăng nhập Quản trị</span>
              </button>
            </div>
          )
        )}
      </main>

      {/* Global Compact Footer with Discreet Admin Access Link */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200/80 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
            <span className="font-bold text-slate-800 tracking-tight">SMART QUEUE PLATFORM</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Hệ Thống Quản Lý Tiếp Nhận & Hàng Đợi Điện Tử</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setGuideModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-bold transition-colors cursor-pointer"
              title="Xem hướng dẫn toàn bộ hệ thống"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Cẩm nang Hướng dẫn</span>
            </button>
            <span className="text-slate-300">•</span>
            {!currentUser ? (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
                title="Đăng nhập dành cho cán bộ & quản trị viên"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Cổng đăng nhập Cán bộ / Quản trị</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2">
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Đang đăng nhập: {currentUser.role} ({currentUser.name})
                </span>
                <span className="text-slate-300">•</span>
                <button
                  onClick={handleLogout}
                  className="text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Admin / Staff Login Modal */}
      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        users={users}
      />

      {/* Portal Guide Modal */}
      <PortalGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        defaultPortal={activeView}
        onNavigateToPortal={navigateToView}
      />

      {/* Universal Virtual Touch Keyboard (Telex, VNI, Bỏ dấu sẵn) */}
      <VirtualKeyboard
        isOpen={virtualKeyboardOpen}
        onClose={() => setVirtualKeyboardOpen(false)}
      />
    </div>
  );
}
