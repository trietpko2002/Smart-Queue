import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Touchpad,
  Search,
  UserCheck,
  Tv,
  Settings,
  X,
  Sparkles,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Mic,
  Keyboard,
  Printer,
  QrCode,
  Volume2,
  Clock,
  ShieldCheck,
  Bot,
  Zap,
  Users,
  Lightbulb,
  FileCheck,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

export type PortalType = 'CITIZEN' | 'KIOSK' | 'TRACKER' | 'STAFF' | 'TV' | 'ADMIN';

interface PortalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPortal?: PortalType;
  onNavigateToPortal?: (portal: PortalType) => void;
}

interface GuideContent {
  id: PortalType;
  title: string;
  shortLabel: string;
  badge: string;
  targetUser: string;
  icon: React.ElementType;
  color: string;
  summary: string;
  steps: {
    step: string;
    title: string;
    desc: string;
    icon: React.ElementType;
  }[];
  highlights: {
    title: string;
    desc: string;
    tag?: string;
  }[];
  proTip: string;
}

const PORTAL_GUIDES: GuideContent[] = [
  {
    id: 'CITIZEN',
    title: 'Cổng Lấy Số Trực Tuyến',
    shortLabel: 'Dân Lấy Số',
    badge: 'Dành cho Người Dân',
    targetUser: 'Công dân thao tác trên điện thoại hoặc máy tính cá nhân từ xa',
    icon: Smartphone,
    color: 'indigo',
    summary: 'Cho phép người dân đăng ký và lấy phiếu số thứ tự điện tử từ xa mà không cần đến sớm xếp hàng tại trung tâm.',
    steps: [
      {
        step: '1',
        title: 'Chọn dịch vụ cần giải quyết',
        desc: 'Xem danh sách các lĩnh vực hành chính (CCCD, Hộ tịch, Đất đai, ĐKKD...) kèm ước tính thời gian xử lý trung bình mỗi lượt.',
        icon: Layers,
      },
      {
        step: '2',
        title: 'Khai báo thông tin & Diện ưu tiên',
        desc: 'Điền họ tên, số CCCD và chọn diện ưu tiên nếu là Người cao tuổi, Phụ nữ mang thai, Người khuyết tật hoặc Người có công.',
        icon: FileCheck,
      },
      {
        step: '3',
        title: 'Nhận phiếu số điện tử & Mã QR',
        desc: 'Hệ thống cấp ngay số thứ tự kèm mã Token theo dõi và số lượng người đang xếp hàng trước bạn trong thời gian thực.',
        icon: QrCode,
      },
      {
        step: '4',
        title: 'Tải ảnh phiếu số hoặc theo dõi',
        desc: 'Bấm "Tải Ảnh Phiếu Số" để lưu vào máy ảnh điện thoại hoặc sao chép mã Token để tra cứu từ xa khi di chuyển.',
        icon: CheckCircle2,
      },
    ],
    highlights: [
      {
        title: 'Chống bốc trùng lặp thông minh',
        desc: 'Ngăn chặn một người bốc nhiều số liên tiếp cùng lúc trong cùng một dịch vụ.',
        tag: 'Bảo vệ hàng đợi',
      },
      {
        title: 'Ưu tiên tự động',
        desc: 'Hồ sơ ưu tiên được đánh dấu thẻ vàng và tự động đẩy lên lượt gọi sớm hơn theo quy định.',
        tag: 'Nhân văn',
      },
      {
        title: 'Lưu ảnh vé sắc nét',
        desc: 'Tự tạo ảnh thẻ phiếu số chuẩn định dạng đồ họa với mã QR rõ ràng để trình tại quầy.',
        tag: 'Tiện lợi',
      },
    ],
    proTip: 'Quý khách chỉ cần lưu mã Token (ví dụ: TK78A29B) để theo dõi tiến độ trên điện thoại mà không cần có mặt sớm tại phòng chờ.',
  },
  {
    id: 'KIOSK',
    title: 'Máy Kiosk Cảm Ứng Sảnh Chờ',
    shortLabel: 'Kiosk Cảm Ứng',
    badge: 'Thiết bị tại sảnh',
    targetUser: 'Người dân trực tiếp đến sảnh giao dịch Trung tâm hành chính công',
    icon: Touchpad,
    color: 'blue',
    summary: 'Màn hình cảm ứng chuyên dụng tại sảnh, hỗ trợ tự động bốc số nhanh, in nhiệt phiếu giấy và quét mã tiện lợi.',
    steps: [
      {
        step: '1',
        title: 'Chạm vào màn hình để bắt đầu',
        desc: 'Giao diện cảm ứng kích thước lớn, tương phản cao, thao tác một chạm dễ dàng cho cả người lớn tuổi.',
        icon: Touchpad,
      },
      {
        step: '2',
        title: 'Chạm chọn lĩnh vực hồ sơ',
        desc: 'Các dịch vụ được phân ô lớn kèm mã ký hiệu (CA, HT, DD, KD...) và thời gian dự kiến rõ ràng.',
        icon: Layers,
      },
      {
        step: '3',
        title: 'Nhập thông tin qua Bàn phím ảo',
        desc: 'Bàn phím ảo tiếng Việt tích hợp sẵn trên màn hình Kiosk, hỗ trợ nhập họ tên và 12 số định danh CCCD.',
        icon: Keyboard,
      },
      {
        step: '4',
        title: 'Nhận phiếu in nhiệt tự động',
        desc: 'Máy in nhiệt tự động in phiếu số giấy trong vòng 2 giây, trên phiếu có mã QR để quét tra cứu trên điện thoại.',
        icon: Printer,
      },
    ],
    highlights: [
      {
        title: 'Khóa tỉ lệ chuẩn 16:9',
        desc: 'Tối ưu hóa hoàn hảo cho các màn hình cảm ứng Kiosk công nghiệp và chân đứng.',
        tag: 'Phần cứng chuyên dụng',
      },
      {
        title: 'Tự động làm mới (Auto-reset)',
        desc: 'Tự động quay về trang chủ sau 15 giây không có thao tác để xóa thông tin cá nhân của người trước.',
        tag: 'Bảo mật thông tin',
      },
      {
        title: 'Tích hợp tuyên truyền chính sách',
        desc: 'Trình chiếu các banner hướng dẫn thực hiện dịch vụ công trực tuyến và Đề án 06.',
        tag: 'Truyền thông',
      },
    ],
    proTip: 'Đường dẫn trực tiếp cho máy Kiosk sảnh là "/kiosk". Có thể nhấn F11 để đưa Kiosk vào chế độ toàn màn hình không có thanh địa chỉ.',
  },
  {
    id: 'TRACKER',
    title: 'Cổng Tra Cứu Vé & Hàng Đợi',
    shortLabel: 'Tra Cứu Vé',
    badge: 'Dành cho Người Dân',
    targetUser: 'Người dân đang chờ đến lượt muốn kiểm tra tình trạng số thứ tự',
    icon: Search,
    color: 'cyan',
    summary: 'Theo dõi tiến trình phục vụ theo thời gian thực (SSE), nhận cảnh báo khi sắp đến lượt và đánh giá hài lòng.',
    steps: [
      {
        step: '1',
        title: 'Nhập mã Token hoặc Quét QR',
        desc: 'Điền mã theo dõi (in trên phiếu hoặc gửi qua điện thoại) vào ô tra cứu rồi nhấn "Tra cứu".',
        icon: Search,
      },
      {
        step: '2',
        title: 'Theo dõi vị trí trong hàng đợi',
        desc: 'Xem chính xác có bao nhiêu người đang đứng trước bạn và thời gian ước tính còn bao nhiêu phút.',
        icon: Clock,
      },
      {
        step: '3',
        title: 'Chuông báo khi được gọi quầy',
        desc: 'Hệ thống tự động phát âm thanh chuông báo và chuyển màu thẻ khi cán bộ tại quầy bấm gọi số của bạn.',
        icon: Volume2,
      },
      {
        step: '4',
        title: 'Đánh giá mức độ hài lòng',
        desc: 'Sau khi hoàn tất hồ sơ, công dân có thể chấm điểm từ 1 đến 5 sao và gửi phản hồi ý kiến cho trung tâm.',
        icon: CheckCircle2,
      },
    ],
    highlights: [
      {
        title: 'Đồng bộ tức thì SSE (Real-time)',
        desc: 'Dữ liệu tự động cập nhật ngay lập tức khi cán bộ chuyển trạng thái mà không cần tải lại trang.',
        tag: 'Công nghệ cao',
      },
      {
        title: 'Ước tính thời gian thông minh',
        desc: 'Tính toán dựa trên tốc độ xử lý thực tế của các quầy đang hoạt động để đưa ra khoảng thời gian chính xác.',
        tag: 'Thời gian thực',
      },
      {
        title: 'Lịch sử sự kiện vé (Event Log)',
        desc: 'Xem lại toàn bộ nhật ký: Giờ bốc số -> Giờ gọi loa -> Giờ bắt đầu phục vụ -> Giờ hoàn tất.',
        tag: 'Minh bạch',
      },
    ],
    proTip: 'Quý khách có thể rời khỏi phòng chờ đi uống cà phê hoặc làm việc khác, chỉ cần mở trang tra cứu trên điện thoại để biết khi nào đến lượt.',
  },
  {
    id: 'STAFF',
    title: 'Bàn Làm Việc Cán Bộ Tại Quầy',
    shortLabel: 'Cán Bộ Quầy',
    badge: 'Dành cho Cán Bộ',
    targetUser: 'Cán bộ tiếp nhận và trả kết quả làm việc tại các quầy giao dịch',
    icon: UserCheck,
    color: 'emerald',
    summary: 'Hệ thống điều khiển quầy siêu tốc: Hỗ trợ nhận diện giọng nói tiếng Việt và bàn phím phím tắt không cần chuột.',
    steps: [
      {
        step: '1',
        title: 'Chọn cán bộ & Bàn quầy phân công',
        desc: 'Đăng nhập và chọn bàn quầy của mình (Quầy 01, 02...). Mỗi tab trình duyệt có thể điều khiển một quầy độc lập.',
        icon: UserCheck,
      },
      {
        step: '2',
        title: 'Gọi lượt tiếp theo (Space / F2)',
        desc: 'Bấm nút "Gọi số tiếp theo", hoặc nhấn phím Space, hoặc nói "Gọi số" vào micro. Loa sảnh sẽ tự động xướng tên số phiếu.',
        icon: Volume2,
      },
      {
        step: '3',
        title: 'Bắt đầu phục vụ (Phím S / F4)',
        desc: 'Khi công dân tiến vào bàn, bấm "Bắt đầu" (hoặc nói "Bắt đầu") để đồng hồ bấm giờ xử lý bắt đầu đếm.',
        icon: Clock,
      },
      {
        step: '4',
        title: 'Hoàn tất / Vắng mặt / Chuyển quầy',
        desc: 'Bấm "Hoàn tất" (Enter), "Vắng mặt" (Delete) nếu không thấy đến, hoặc "Chuyển tiếp" (T) sang bộ phận chuyên môn khác.',
        icon: ArrowRightLeft,
      },
    ],
    highlights: [
      {
        title: 'Nhận diện giọng nói Web Speech API',
        desc: 'Bật nút "Giọng nói" (hoặc phím V) rồi ra lệnh tiếng Việt: "Gọi số", "Nhắc lại", "Xong", "Vắng mặt". Có chế độ Rảnh tay.',
        tag: 'AI Giọng nói',
      },
      {
        title: 'Sổ tay phím tắt nghiệp vụ (Phím ? / F1)',
        desc: 'Toàn bộ thao tác nghiệp vụ quầy đều có phím tắt: Space (Gọi tiếp), R (Gọi lại), S (Bắt đầu), Enter (Xong), Del (Vắng mặt).',
        tag: 'Siêu tốc',
      },
      {
        title: 'Chuyển quầy liên thông',
        desc: 'Chuyển vé công dân sang quầy khác mà không bắt công dân phải bốc lại số mới từ đầu.',
        tag: 'Liên thông',
      },
    ],
    proTip: 'Bấm phím "?" hoặc F1 bất cứ lúc nào để mở bảng tra cứu phím tắt nhanh. Cán bộ có thể mở nhiều tab để quản lý đồng thời nhiều quầy nếu cần.',
  },
  {
    id: 'TV',
    title: 'Màn Hình TV Trung Tâm Sảnh Chờ',
    shortLabel: 'Màn Hình TV',
    badge: 'Màn hình công cộng',
    targetUser: 'Màn hình TV lớn treo tại sảnh chờ phục vụ toàn bộ người dân theo dõi',
    icon: Tv,
    color: 'rose',
    summary: 'Bảng điện tử tập trung hiển thị số đang phục vụ, danh sách hàng đợi, phát loa xướng âm thanh và trình chiếu truyền thông.',
    steps: [
      {
        step: '1',
        title: 'Cột số đang phục vụ nổi bật',
        desc: 'Hiển thị cỡ chữ cực lớn số thứ tự vừa được gọi kèm mã quầy mời vào, có hiệu ứng chớp sáng thu hút ánh nhìn.',
        icon: Tv,
      },
      {
        step: '2',
        title: 'Phát thanh giọng nữ tiếng Việt chuẩn',
        desc: 'Tự động phát chuông đa âm và đọc loa: "Xin mời số phiếu... đến quầy số... để làm thủ tục" mỗi khi cán bộ bấm gọi.',
        icon: Volume2,
      },
      {
        step: '3',
        title: 'Lưới trạng thái tất cả các quầy',
        desc: 'Liệt kê đồng thời tất cả các bàn quầy đang tiếp nhận, đang gọi hoặc đang chờ người dân.',
        icon: Layers,
      },
      {
        step: '4',
        title: 'Chạy chữ & Video Đề án 06',
        desc: 'Tích hợp thanh chạy chữ tin tức, khẩu hiệu tuyên truyền cải cách hành chính và chuyển đổi số quốc gia.',
        icon: Sparkles,
      },
    ],
    highlights: [
      {
        title: 'Chuẩn tỉ lệ 16:9 & Tràn màn hình',
        desc: 'Tối ưu độ phân giải Full HD / 4K cho TV màn hình lớn tại sảnh tiếp dân.',
        tag: 'Hiển thị sảnh',
      },
      {
        title: 'Giọng đọc Web Speech Synthesis',
        desc: 'Xướng giọng nữ tiếng Việt chuẩn miền Bắc/Nam rõ ràng, âm lượng lớn, tự động hàng đợi âm thanh không đè lên nhau.',
        tag: 'Loa thông minh',
      },
      {
        title: 'Chạy độc lập liên tục 24/7',
        desc: 'Tự động kết nối lại khi mạng chập chờn, không bị đọng bộ nhớ trong suốt ngày làm việc.',
        tag: 'Bền bỉ',
      },
    ],
    proTip: 'Đường dẫn chuyên dụng cho màn hình TV sảnh là "/tv". Bấm F11 trên máy tính kết nối TV để vào chế độ toàn màn hình sắc nét.',
  },
  {
    id: 'ADMIN',
    title: 'Trung Tâm Quản Trị & Điều Hành AI',
    shortLabel: 'Quản Trị & AI',
    badge: 'Dành cho Quản Trị / Lãnh Đạo',
    targetUser: 'Lãnh đạo trung tâm hành chính công và quản trị viên hệ thống',
    icon: Settings,
    color: 'amber',
    summary: 'Bảng điều khiển toàn diện: Dự báo lưu lượng bằng Gemini AI, cấu hình dịch vụ, form động, quầy, thiết bị và nhật ký bảo mật.',
    steps: [
      {
        step: '1',
        title: 'Giám sát chỉ số KPI thời gian thực',
        desc: 'Theo dõi tổng lượt cấp trong ngày, số người đang chờ, thời gian phục vụ trung bình và tỷ lệ đúng hẹn 94%.',
        icon: Users,
      },
      {
        step: '2',
        title: 'Trí tuệ nhân tạo Gemini AI phân tích',
        desc: 'Mô hình AI dự báo khung giờ cao điểm, phát hiện nguy cơ ùn ứ và tự động đề xuất phân bổ mở thêm bàn quầy.',
        icon: Bot,
      },
      {
        step: '3',
        title: 'Quản lý Dịch vụ & Form động',
        desc: 'Tùy biến thêm/sửa thủ tục hành chính, cấu hình các trường nhập liệu động (Họ tên, CCCD, Ngày sinh...) theo từng dịch vụ.',
        icon: Layers,
      },
      {
        step: '4',
        title: 'Bảo mật & Nhật ký kiểm toán (Audit Log)',
        desc: 'Lưu vết toàn bộ thao tác đăng nhập, tạo dịch vụ, gọi số, hủy vé. Hỗ trợ xuất dữ liệu báo cáo ra file Excel/CSV.',
        icon: ShieldCheck,
      },
    ],
    highlights: [
      {
        title: 'Smart Queue AI Dự Báo',
        desc: 'Tích hợp mô hình Gemini AI phân tích dữ liệu lịch sử để dự báo tình trạng quá tải và tư vấn giải pháp điều hành.',
        tag: 'Trí tuệ nhân tạo',
      },
      {
        title: 'Quản lý thiết bị Kiosk & TV',
        desc: 'Giám sát trạng thái hoạt động trực tuyến (Online/Offline) của từng máy Kiosk và màn hình TV sảnh theo thời gian thực.',
        tag: 'Giám sát IOT',
      },
      {
        title: 'Quản lý tài khoản & Phân quyền RBAC',
        desc: 'Cấp tài khoản cho Cán bộ tiếp nhận, Quản trị viên, Điều phối viên với quyền hạn chặt chẽ.',
        tag: 'An toàn dữ liệu',
      },
    ],
    proTip: 'Nhấn tổ hợp phím "Ctrl + Shift + A" bất kỳ lúc nào để mở hộp thoại đăng nhập Quản trị viên nhanh chóng.',
  },
];

export const PortalGuideModal: React.FC<PortalGuideModalProps> = ({
  isOpen,
  onClose,
  defaultPortal = 'CITIZEN',
  onNavigateToPortal,
}) => {
  const [selectedPortal, setSelectedPortal] = useState<PortalType>(defaultPortal);

  // Synchronize defaultPortal whenever modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
      setSelectedPortal(defaultPortal);
    }
  }, [isOpen, defaultPortal]);

  // Handle Esc key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentGuide =
    PORTAL_GUIDES.find(g => g.id === selectedPortal) || PORTAL_GUIDES[0];
  const CurrentIcon = currentGuide.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Hướng dẫn tính năng hệ thống Smart Queue"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header Bar */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-5 sm:p-6 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md">
                <HelpCircle className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                    HƯỚNG DẪN SỬ DỤNG SMART QUEUE
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold font-mono uppercase hidden sm:inline">
                    Cẩm Nang Trực Quan
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Khám phá và hiểu nhanh các tính năng chính dành cho Người Dân và Cán Bộ
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
              title="Đóng cửa sổ hướng dẫn (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Portal Switcher Tabs */}
          <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {PORTAL_GUIDES.map(portal => {
              const Icon = portal.icon;
              const isSelected = selectedPortal === portal.id;
              return (
                <button
                  key={portal.id}
                  onClick={() => setSelectedPortal(portal.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-900/40'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{portal.shortLabel}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-800">
          {/* Active Portal Banner */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-xs">
                <CurrentIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {currentGuide.title}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                    {currentGuide.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {currentGuide.targetUser}
                </p>
                <p className="text-xs text-slate-700 mt-2 font-medium leading-relaxed max-w-2xl">
                  {currentGuide.summary}
                </p>
              </div>
            </div>

            {onNavigateToPortal && defaultPortal !== currentGuide.id && (
              <button
                onClick={() => {
                  onNavigateToPortal(currentGuide.id);
                  onClose();
                }}
                className="self-start sm:self-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-300 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Mở Cổng Này</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Core Steps Section */}
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Quy trình sử dụng từng bước (Workflow)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentGuide.steps.map((s, idx) => {
                const StepIcon = s.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-mono font-black text-xs shrink-0 transition-colors">
                      {s.step}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <StepIcon className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <h5 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {s.title}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Highlights & Smart Features */}
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Tính năng thông minh nổi bật
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentGuide.highlights.map((h, i) => (
                <div
                  key={i}
                  className="p-3.5 bg-indigo-50/40 rounded-2xl border border-indigo-100/80 flex flex-col justify-between space-y-2"
                >
                  <div>
                    {h.tag && (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold font-mono uppercase mb-1.5">
                        {h.tag}
                      </span>
                    )}
                    <h5 className="text-xs font-bold text-indigo-950">
                      {h.title}
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {h.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro-Tip Box */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-950 shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-0.5">
              <span className="font-bold uppercase tracking-wide text-[10px] text-amber-800 block">
                Mẹo sử dụng hữu ích
              </span>
              <p className="text-amber-900 leading-relaxed font-medium">
                {currentGuide.proTip}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Bạn có thể chuyển đổi giữa các thẻ ở trên để xem hướng dẫn của các Portal khác.</span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToPortal && defaultPortal !== currentGuide.id && (
              <button
                onClick={() => {
                  onNavigateToPortal(currentGuide.id);
                  onClose();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Chuyển đến Portal này
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all cursor-pointer"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
