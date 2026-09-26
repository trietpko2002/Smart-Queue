import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types/queue.js';
import { Shield, Lock, User, Key, X, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount, token: string) => void;
  users?: UserAccount[];
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  users = [],
}) => {
  // Thay đổi 1: Khởi tạo username và password rỗng
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent, customUser?: UserAccount) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const loginPayload = {
      username: customUser ? customUser.username : username,
      password: customUser ? (customUser.password || '') : password,
      role: customUser ? customUser.role : selectedRole,
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công');
      }

      // Save token & user in BOTH sessionStorage (for isolated multi-tab sessions) and localStorage
      sessionStorage.setItem('smart_queue_token', data.token);
      sessionStorage.setItem('smart_queue_user', JSON.stringify(data.user));
      if (data.user.counterId) {
        sessionStorage.setItem('sq_active_counter', data.user.counterId);
      }
      localStorage.setItem('smart_queue_token', data.token);
      localStorage.setItem('smart_queue_user', JSON.stringify(data.user));

      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStaff = (u: UserAccount) => {
    setUsername(u.username);
    setPassword(u.password || '');
    setSelectedRole(u.role);
    handleLogin(undefined, u);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden relative">
        {/* Header Bar with Deep GovTech Gradient */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative border-b border-slate-800/80">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white font-heading">
                Cán Bộ & Quản Trị Hệ Thống
              </h2>
              <p className="text-xs text-indigo-300 font-mono">
                Xác thực phân quyền nội bộ Smart Queue
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Role selector tab */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2 font-mono">
              Phân quyền truy cập
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('ADMIN');
                  // Thay đổi 2: Không tự động điền username/password khi chuyển tab
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedRole === 'ADMIN'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Quản Trị Viên (Admin)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('STAFF');
                  // Thay đổi 2: Không tự động điền username/password khi chuyển tab
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedRole === 'STAFF'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Cán Bộ Quầy (Staff)
              </button>
            </div>
          </div>

          <form onSubmit={e => handleLogin(e)} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="Nhập tên đăng nhập..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 mt-4 cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>ĐĂNG NHẬP HỆ THỐNG</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins & Registered Staff Bento Card */}
        </div>

        {/* Footer Note */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 leading-normal">
            Khu vực hạn chế. Mọi thao tác truy cập đều được ghi nhận vào nhật ký Audit của hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
};