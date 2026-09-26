import React, { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, Check, X, Info } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running inside standalone PWA window
    const isInStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // If already running inside standalone desktop or mobile app mode, don't show prompt
  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="px-2.5 py-1.5 bg-gradient-to-r from-sky-500/20 to-blue-600/30 hover:from-sky-500/30 hover:to-blue-600/40 text-sky-200 hover:text-white border border-sky-400/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer group"
        title="Cài đặt SmartQueue thành App độc lập trên máy tính hoặc điện thoại"
      >
        <Download className="w-3.5 h-3.5 text-sky-400 group-hover:animate-bounce" />
        <span className="hidden sm:inline">Cài App Độc Lập</span>
        <span className="sm:hidden">Cài App</span>
        <span className="px-1.5 py-0.2 bg-sky-400/20 text-[10px] font-mono rounded text-sky-300">PWA</span>
      </button>

      {/* Guide Modal when direct beforeinstallprompt is not automatically triggered */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-sky-400">
                <Monitor className="w-5 h-5" />
                <span>Cài Đặt App Độc Lập (PWA)</span>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có thể cài đặt SmartQueue như một phần mềm độc lập trên màn hình Desktop hoặc điện thoại, không cần mở trình duyệt:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
                <div className="font-bold text-sky-300 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-sky-400" />
                  <span>Trên Máy tính (Windows / macOS / Chrome / Edge):</span>
                </div>
                <p className="text-slate-300 pl-6">
                  Nhìn vào góc phải thanh địa chỉ URL trình duyệt, bấm vào biểu tượng <strong>"Cài đặt ứng dụng"</strong> (hình máy tính kèm mũi tên tải xuống ⊕) rồi chọn <strong>Cài đặt</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
                <div className="font-bold text-emerald-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Trên iPhone / iPad (Safari):</span>
                </div>
                <p className="text-slate-300 pl-6">
                  Bấm vào nút <strong>Chia sẻ (Share ⎋)</strong> ở thanh dưới cùng Safari ➔ Chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
                <div className="font-bold text-indigo-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>Trên Android (Chrome):</span>
                </div>
                <p className="text-slate-300 pl-6">
                  Bấm dấu <strong>3 chấm (⋮)</strong> ở góc trên bên phải ➔ Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 font-bold text-xs rounded-xl transition-colors cursor-pointer text-white"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
