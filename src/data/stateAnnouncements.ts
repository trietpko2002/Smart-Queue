export interface StateBannerItem {
  id: string;
  badge: string;
  badgeColor: string; // e.g. bg-rose-600, bg-amber-600, bg-blue-600
  title: string;
  highlightText: string;
  description: string;
  source: string;
  qrType: 'DICHVUCONG' | 'VNEID' | 'HOTLINE';
  qrLabel: string;
  qrUrl: string;
  themeGradient: string;
  iconType: 'flag' | 'shield' | 'award' | 'qr' | 'landmark';
  tags: string[];
  active?: boolean;
}

export const OFFICIAL_STATE_SLOGANS = [
  '★ NHIỆT LIỆT HƯỞNG ỨNG PHONG TRÀO CHUYỂN ĐỔI SỐ QUỐC GIA - ĐỀ ÁN 06/CP CỦA CHÍNH PHỦ ★',
  '★ TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG: LẤY SỰ HÀI LÒNG CỦA CÔNG DÂN VÀ DOANH NGHIỆP LÀM MỤC TIÊU PHỤC VỤ ★',
  '★ KHUYẾN KHÍCH NỘP HỒ SƠ TRỰC TUYẾN TẠI CỔNG DỊCH VỤ CÔNG QUỐC GIA (DICHVUCONG.GOV.VN) ĐỂ TIẾT KIỆM THỜI GIAN ★',
  '★ TÍCH HỢP GIẤY TỜ TRÊN ỨNG DỤNG ĐỊNH DANH ĐIỆN TỬ VNeID MỨC 2 THAY THẾ GIẤY TỜ BẢN CỨNG TRUYỀN THỐNG ★',
  '★ CÁN BỘ CÔNG CHỨC THỰC HIỆN 4 XIN - 4 LUÔN: XIN CHÀO, XIN LỖI, XIN CẢM ƠN, XIN PHÉP - LUÔN LẮNG NGHE, GIÚP ĐỠ ★',
  '★ TUYÊN TRUYỀN PHÁP LUẬT: NÓI KHÔNG VỚI TIÊU CỰC, NHŨNG NHIỄU, "CÒ MỒI" LÀM HỒ SƠ - ĐƯỜNG DÂY NÓNG PHẢN ÁNH: 1022 ★',
];

export const STATE_PROPAGANDA_BANNERS: StateBannerItem[] = [
  {
    id: 'banner_dean06',
    badge: 'ĐỀ ÁN 06/CHÍNH PHỦ',
    badgeColor: 'bg-red-600 text-white',
    title: 'PHÁT TRIỂN ỨNG DỤNG DỮ LIỆU DÂN CƯ, ĐỊNH DANH VÀ XÁC THỰC ĐIỆN TỬ',
    highlightText: 'SỬ DỤNG VNeID MỨC 2 & CCCD GẮN CHIP THAY THẾ GIẤY TỜ TRUYỀN THỐNG',
    description: 'Thực hiện chỉ đạo của Thủ tướng Chính phủ, người dân khi đến làm thủ tục có thể xuất trình thông tin định danh điện tử trên ứng dụng VNeID thay thế Sổ hộ khẩu, Giấy khai sinh, Giấy phép lái xe và Thẻ BHYT.',
    source: 'ỦY BAN NHÂN DÂN THÀNH PHỐ • CÔNG AN THÀNH PHỐ',
    qrType: 'VNEID',
    qrLabel: 'Quét tải ứng dụng VNeID',
    qrUrl: 'https://vneid.gov.vn',
    themeGradient: 'from-red-950 via-red-900 to-amber-950 border-amber-500/50',
    iconType: 'flag',
    tags: ['Đề án 06', 'VNeID Mức 2', 'Chính phủ số'],
  },
  {
    id: 'banner_dvcqg',
    badge: 'CỔNG DỊCH VỤ CÔNG QUỐC GIA',
    badgeColor: 'bg-amber-500 text-slate-950',
    title: 'TIẾP NHẬN VÀ GIẢI QUYẾT THỦ TỤC HÀNH CHÍNH TRỰC TUYẾN 24/7',
    highlightText: 'NỘP HỒ SƠ TOÀN TRÌNH - THANH TOÁN TRỰC TUYẾN - NHẬN KẾT QUẢ TẠI NHÀ',
    description: 'Quý công dân có thể nộp hồ sơ tại dichvucong.gov.vn mọi lúc, mọi nơi mà không cần xếp hàng trực tiếp. Hỗ trợ tra cứu tiến độ thời gian thực và thanh toán thuế, phí điện tử an toàn.',
    source: 'VĂN PHÒNG CHÍNH PHỦ • TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG',
    qrType: 'DICHVUCONG',
    qrLabel: 'Cổng Dịch vụ công Quốc gia',
    qrUrl: 'https://dichvucong.gov.vn',
    themeGradient: 'from-blue-950 via-slate-900 to-indigo-950 border-blue-500/50',
    iconType: 'landmark',
    tags: ['DVC Toàn trình', 'Thanh toán trực tuyến', 'Tiết kiệm 80% thời gian'],
  },
  {
    id: 'banner_vanhoa',
    badge: 'VĂN HÓA CÔNG VỤ & LẤY DÂN LÀM GỐC',
    badgeColor: 'bg-emerald-600 text-white',
    title: 'TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG: KỶ CƯƠNG - TRÁCH NHIỆM - TẬN TỤY',
    highlightText: 'LẤY SỰ HÀI LÒNG CỦA CÔNG DÂN VÀ DOANH NGHIỆP LÀM THƯỚC ĐO HIỆU QUẢ',
    description: 'Cam kết tiếp nhận, hướng dẫn tận tình, giải quyết hồ sơ đúng hẹn và trước hẹn. Đánh giá chất lượng phục vụ của cán bộ trực tiếp tại quầy bằng hệ thống chấm điểm điện tử.',
    source: 'ỦY BAN NHÂN DÂN THÀNH PHỐ',
    qrType: 'HOTLINE',
    qrLabel: 'Đường dây nóng phản ánh: 1022',
    qrUrl: 'tel:1022',
    themeGradient: 'from-emerald-950 via-slate-900 to-teal-950 border-emerald-500/50',
    iconType: 'award',
    tags: ['Văn hóa công vụ', 'Đúng hẹn 100%', 'Đánh giá cán bộ'],
  },
  {
    id: 'banner_phapluat',
    badge: 'TUYÊN TRUYỀN PHÁP LUẬT',
    badgeColor: 'bg-purple-600 text-white',
    title: 'PHÒNG NGỪA TIÊU CỰC, NHŨNG NHIỄU - NÓI KHÔNG VỚI "CÒ MỒI"',
    highlightText: 'QUY TRÌNH MINH BẠCH - SỐ THỨ TỰ ĐIỆN TỬ - KHÔNG MÔI GIỚI BẤT HỢP PHÁP',
    description: 'Mọi thủ tục hành chính đều được niêm yết công khai lệ phí và thời hạn giải quyết. Nghiêm cấm hành vi tiếp tay cho các đối tượng môi giới làm nhanh thu tiền trái quy định pháp luật.',
    source: 'THANH TRA THÀNH PHỐ • TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG',
    qrType: 'HOTLINE',
    qrLabel: 'Hộp thư & Hotline tiếp nhận',
    qrUrl: 'tel:1022',
    themeGradient: 'from-purple-950 via-slate-900 to-indigo-950 border-purple-500/50',
    iconType: 'shield',
    tags: ['Minh bạch', 'Phòng chống tiêu cực', 'Bảo vệ quyền lợi công dân'],
  },
];
