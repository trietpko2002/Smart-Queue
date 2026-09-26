import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  Organization,
  Branch,
  Service,
  Counter,
  Ticket,
  TicketEvent,
  KioskDevice,
  DisplayScreen,
  AuditLog,
  UserAccount,
  QueueStatistics,
  PriorityLevel,
  SourceChannel,
  PropagandaConfig,
  StateBannerItem
} from '../src/types/queue.js';

interface DatabaseSchema {
  organization: Organization;
  branches: Branch[];
  services: Service[];
  counters: Counter[];
  tickets: Ticket[];
  ticketEvents: TicketEvent[];
  kiosks: KioskDevice[];
  displays: DisplayScreen[];
  auditLogs: AuditLog[];
  users: UserAccount[];
  propaganda?: PropagandaConfig;
}

const DATA_DIR = process.env.DATA_PATH || path.join(process.cwd(), 'data');
const SQLITE_DB_PATH = path.join(DATA_DIR, 'smart_queue.db');
const LEGACY_JSON_FILE = path.join(DATA_DIR, 'smart_queue.json');

// SQLite native database instance & memory cache
let sqliteDb: DatabaseSync;
let db: DatabaseSchema;

// Simple mutex queue to prevent race conditions during ticket issuance
let atomicTicketLock = Promise.resolve();

function getInitialSeedData(): DatabaseSchema {
  const org: Organization = {
    id: 'org_01',
    name: 'TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG',
    slogan: 'Công khai – Minh bạch – Tận tình – Đúng hẹn',
    hotline: '1900 1234',
    logoUrl: '/logo.svg',
  };

  const branches: Branch[] = [
    {
      id: 'branch_01',
      orgId: 'org_01',
      name: 'Trụ sở chính - Cơ sở 01 (Trung tâm)',
      code: 'CS01',
      address: 'Số 123 Đại lộ Trần Hưng Đạo, Phường 1, Thành phố',
      phone: '028.3829.1111',
      active: true,
    },
    {
      id: 'branch_02',
      orgId: 'org_01',
      name: 'Chi nhánh phía Đông - Cơ sở 02',
      code: 'CS02',
      address: 'Số 45 Đại lộ Võ Nguyên Giáp, Phường Đông Hòa, Thành phố',
      phone: '028.3829.2222',
      active: true,
    },
  ];

  const services: Service[] = [
    {
      id: 'srv_ca',
      branchId: 'branch_01',
      name: 'Cấp đổi Căn cước công dân & Định danh điện tử (VNeID)',
      code: 'CONG_AN',
      prefix: 'CA',
      description: 'Làm mới, cấp đổi thẻ CCCD gắn chip và kích hoạt tài khoản định danh VNeID mức độ 2',
      dailyMax: 150,
      startNumber: 1,
      digitCount: 3,
      avgServiceTimeMinutes: 12,
      isOnlineEnabled: true,
      isKioskEnabled: true,
      isPriorityEnabled: true,
      isPreBookingEnabled: true,
      active: true,
      fields: [
        {
          id: 'fullname',
          label: 'Họ và tên người yêu cầu',
          type: 'text',
          required: true,
          placeholder: 'Ví dụ: Nguyễn Văn An',
          order: 1,
          visibility: true,
        },
        {
          id: 'citizen_id',
          label: 'Số định danh cá nhân (CCCD/CMND)',
          type: 'text',
          required: true,
          validation: '^[0-9]{9,12}$',
          placeholder: 'Nhập 12 số định danh công dân',
          order: 2,
          visibility: true,
          antiDuplicateKey: true, // Anti duplicate on CCCD!
        },
        {
          id: 'phone',
          label: 'Số điện thoại liên hệ',
          type: 'text',
          required: true,
          placeholder: '090xxxxxxx',
          order: 3,
          visibility: true,
        },
        {
          id: 'service_detail',
          label: 'Thủ tục chi tiết',
          type: 'select',
          required: true,
          options: [
            'Cấp đổi thẻ CCCD gắn chip (hết hạn / đổi thông tin)',
            'Cấp lại thẻ CCCD bị mất',
            'Kích hoạt định danh điện tử VNeID mức 2',
            'Thu nhận vân tay / chụp ảnh khuôn mặt',
          ],
          order: 4,
          visibility: true,
        },
      ],
    },
    {
      id: 'srv_dd',
      branchId: 'branch_01',
      name: 'Đất đai & Tài nguyên Môi trường',
      code: 'DAT_DAI',
      prefix: 'DD',
      description: 'Đăng ký biến động quyền sử dụng đất, cấp Giấy chứng nhận quyền sử dụng đất (Sổ đỏ/hồng)',
      dailyMax: 80,
      startNumber: 1,
      digitCount: 3,
      avgServiceTimeMinutes: 15,
      isOnlineEnabled: true,
      isKioskEnabled: true,
      isPriorityEnabled: true,
      isPreBookingEnabled: true,
      active: true,
      fields: [
        {
          id: 'fullname',
          label: 'Họ và tên chủ hồ sơ',
          type: 'text',
          required: true,
          placeholder: 'Nguyễn Thị Hoa',
          order: 1,
          visibility: true,
        },
        {
          id: 'citizen_id',
          label: 'Số CCCD chủ sở hữu',
          type: 'text',
          required: true,
          order: 2,
          visibility: true,
        },
        {
          id: 'dossier_code',
          label: 'Mã hồ sơ tiếp nhận (nếu có)',
          type: 'text',
          required: true,
          placeholder: 'VD: HS-DD-2026-9812',
          order: 3,
          visibility: true,
          antiDuplicateKey: true, // Anti duplicate based on dossier code
        },
        {
          id: 'transaction_type',
          label: 'Loại thủ tục',
          type: 'select',
          required: true,
          options: [
            'Đăng ký biến động (chuyển nhượng, tặng cho, thừa kế)',
            'Cấp mới Giấy chứng nhận lần đầu',
            'Xóa thế chấp, đăng ký giao dịch bảo đảm',
            'Đo đạc, tách thửa, hợp thửa',
          ],
          order: 4,
          visibility: true,
        },
      ],
    },
    {
      id: 'srv_ht',
      branchId: 'branch_01',
      name: 'Đăng ký Hộ tịch & Chứng thực tư pháp',
      code: 'HO_TICH',
      prefix: 'HT',
      description: 'Khai sinh, kết hôn, xác nhận tình trạng hôn nhân, sao y bản chính & chứng thực chữ ký',
      dailyMax: 120,
      startNumber: 1,
      digitCount: 3,
      avgServiceTimeMinutes: 8,
      isOnlineEnabled: true,
      isKioskEnabled: true,
      isPriorityEnabled: true,
      isPreBookingEnabled: false,
      active: true,
      fields: [
        {
          id: 'fullname',
          label: 'Họ và tên công dân',
          type: 'text',
          required: true,
          placeholder: 'Trần Văn Bình',
          order: 1,
          visibility: true,
        },
        {
          id: 'phone',
          label: 'Số điện thoại',
          type: 'text',
          required: true,
          order: 2,
          visibility: true,
          antiDuplicateKey: true,
        },
        {
          id: 'procedure',
          label: 'Nội dung thực hiện',
          type: 'select',
          required: true,
          options: [
            'Sao y bản chính giấy tờ, văn bản (chứng thực)',
            'Chứng thực chữ ký công dân',
            'Cấp giấy xác nhận tình trạng hôn nhân',
            'Đăng ký khai sinh / kết hôn / khai tử',
          ],
          order: 3,
          visibility: true,
        },
      ],
    },
    {
      id: 'srv_kd',
      branchId: 'branch_01',
      name: 'Đăng ký Doanh nghiệp & Hộ kinh doanh cá thể',
      code: 'KINH_DOANH',
      prefix: 'KD',
      description: 'Cấp mới, điều chỉnh giấy phép đăng ký kinh doanh và thuế môn bài',
      dailyMax: 60,
      startNumber: 1,
      digitCount: 3,
      avgServiceTimeMinutes: 14,
      isOnlineEnabled: true,
      isKioskEnabled: true,
      isPriorityEnabled: false,
      isPreBookingEnabled: true,
      active: true,
      fields: [
        {
          id: 'business_name',
          label: 'Tên Doanh nghiệp / Hộ kinh doanh',
          type: 'text',
          required: true,
          placeholder: 'Công ty TNHH Phát Triển Công Nghệ Á Châu',
          order: 1,
          visibility: true,
        },
        {
          id: 'representative_name',
          label: 'Người đại diện theo pháp luật',
          type: 'text',
          required: true,
          order: 2,
          visibility: true,
        },
        {
          id: 'tax_code',
          label: 'Mã số thuế / Mã số doanh nghiệp',
          type: 'text',
          required: true,
          placeholder: '0312345678',
          order: 3,
          visibility: true,
          antiDuplicateKey: true,
        },
      ],
    },
  ];

  const counters: Counter[] = [
    {
      id: 'cnt_01',
      branchId: 'branch_01',
      code: 'Quầy 01',
      name: 'Tiếp nhận hồ sơ Công an & CCCD',
      serviceIds: ['srv_ca'],
      currentStaffId: 'usr_staff_01',
      currentStaffName: 'Nguyễn Văn An',
      status: 'SERVING',
      currentTicketId: 'tkt_demo_01',
      currentTicketNumber: 'CA-021',
    },
    {
      id: 'cnt_02',
      branchId: 'branch_01',
      code: 'Quầy 02',
      name: 'Cấp đổi CCCD & Hộ tịch',
      serviceIds: ['srv_ca', 'srv_ht'],
      currentStaffId: 'usr_staff_02',
      currentStaffName: 'Trần Thị Mai',
      status: 'CALLING',
      currentTicketId: 'tkt_demo_02',
      currentTicketNumber: 'HT-015',
    },
    {
      id: 'cnt_03',
      branchId: 'branch_01',
      code: 'Quầy 03',
      name: 'Địa chính & Đất đai (Bàn 1)',
      serviceIds: ['srv_dd'],
      currentStaffId: 'usr_staff_03',
      currentStaffName: 'Lê Hoàng Nam',
      status: 'SERVING',
      currentTicketId: 'tkt_demo_03',
      currentTicketNumber: 'DD-008',
    },
    {
      id: 'cnt_04',
      branchId: 'branch_01',
      code: 'Quầy 04',
      name: 'Địa chính & Đất đai (Bàn 2)',
      serviceIds: ['srv_dd'],
      status: 'IDLE',
    },
    {
      id: 'cnt_05',
      branchId: 'branch_01',
      code: 'Quầy 05',
      name: 'Hộ tịch & Chứng thực',
      serviceIds: ['srv_ht'],
      status: 'IDLE',
    },
    {
      id: 'cnt_06',
      branchId: 'branch_01',
      code: 'Quầy 06',
      name: 'Đăng ký kinh doanh',
      serviceIds: ['srv_kd'],
      status: 'CLOSED',
    },
  ];

  const kiosks: KioskDevice[] = [
    {
      id: 'kiosk_01',
      branchId: 'branch_01',
      name: 'Máy Kiosk Sảnh Chính A',
      location: 'Khu vực đón tiếp tầng 1 (Cửa chính)',
      allowedServiceIds: ['srv_ca', 'srv_dd', 'srv_ht', 'srv_kd'],
      autoResetSeconds: 15,
      printerStatus: 'OK',
      status: 'ONLINE',
      lastPing: new Date().toISOString(),
    },
    {
      id: 'kiosk_02',
      branchId: 'branch_01',
      name: 'Máy Kiosk Khu Vực Hộ Tịch',
      location: 'Khu tiếp nhận hồ sơ hộ tịch tầng 1',
      allowedServiceIds: ['srv_ht'],
      autoResetSeconds: 15,
      printerStatus: 'OK',
      status: 'ONLINE',
      lastPing: new Date().toISOString(),
    },
  ];

  const displays: DisplayScreen[] = [
    {
      id: 'disp_01',
      branchId: 'branch_01',
      name: 'Màn hình TV Trung tâm Sảnh Chờ (65 inch)',
      location: 'Chính diện hàng ghế chờ sảnh chính',
      voiceConfig: {
        enabled: true,
        voiceName: 'vi-VN',
        speed: 0.95,
        repeatCount: 1,
        customTemplate: 'Kính mời số {ticket} đến {counter}',
      },
      status: 'ONLINE',
      lastPing: new Date().toISOString(),
    },
  ];

  const users: UserAccount[] = [
    {
      id: 'usr_admin',
      username: 'admin',
      password: 'admin123',
      name: 'Quản trị viên Hệ thống',
      role: 'ADMIN',
      phone: '0903112233',
      status: 'ACTIVE',
      branchId: 'branch_01',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_coord',
      username: 'coordinator',
      password: 'coord123',
      name: 'Phạm Quốc Huy (Điều phối viên)',
      role: 'COORDINATOR',
      phone: '0908556677',
      status: 'ACTIVE',
      branchId: 'branch_01',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_staff_01',
      username: 'staff01',
      password: 'staff123',
      name: 'Nguyễn Văn An (Cán bộ)',
      role: 'STAFF',
      counterId: 'cnt_01',
      phone: '0912345678',
      status: 'ACTIVE',
      branchId: 'branch_01',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_staff_02',
      username: 'staff02',
      password: 'staff123',
      name: 'Trần Thị Mai (Cán bộ)',
      role: 'STAFF',
      counterId: 'cnt_02',
      phone: '0918765432',
      status: 'ACTIVE',
      branchId: 'branch_01',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_staff_03',
      username: 'staff03',
      password: 'staff123',
      name: 'Lê Hoàng Nam (Cán bộ)',
      role: 'STAFF',
      counterId: 'cnt_03',
      phone: '0933445566',
      status: 'ACTIVE',
      branchId: 'branch_01',
      createdAt: new Date().toISOString(),
    },
  ];

  const now = new Date();
  const formatTime = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60000).toISOString();

  // Initial tickets to demonstrate real workflow
  const tickets: Ticket[] = [
    {
      id: 'tkt_demo_01',
      token: 'TK78A29B',
      branchId: 'branch_01',
      serviceId: 'srv_ca',
      serviceName: 'Cấp đổi Căn cước công dân & Định danh điện tử (VNeID)',
      servicePrefix: 'CA',
      ticketNumber: 'CA-021',
      sequenceNumber: 21,
      sourceChannel: 'KIOSK',
      priority: 'NORMAL',
      status: 'SERVING',
      customerData: {
        fullname: 'Lê Minh Tuấn',
        citizen_id: '079090012345',
        phone: '0903123456',
        service_detail: 'Cấp đổi thẻ CCCD gắn chip (hết hạn / đổi thông tin)',
      },
      antiDuplicateHash: '079090012345',
      currentCounterId: 'cnt_01',
      currentCounterCode: 'Quầy 01',
      currentStaffId: 'usr_staff_01',
      currentStaffName: 'Nguyễn Văn An',
      createdAt: formatTime(25),
      calledAt: formatTime(6),
      servingStartedAt: formatTime(4),
    },
    {
      id: 'tkt_demo_02',
      token: 'TK99B81C',
      branchId: 'branch_01',
      serviceId: 'srv_ht',
      serviceName: 'Đăng ký Hộ tịch & Chứng thực tư pháp',
      servicePrefix: 'HT',
      ticketNumber: 'HT-015',
      sequenceNumber: 15,
      sourceChannel: 'ONLINE_PHONE',
      priority: 'ELDERLY',
      priorityReason: 'Người cao tuổi (trên 70 tuổi)',
      status: 'CALLED',
      customerData: {
        fullname: 'Bà Đặng Thị Loan',
        phone: '0912888999',
        procedure: 'Sao y bản chính giấy tờ, văn bản (chứng thực)',
      },
      antiDuplicateHash: '0912888999',
      currentCounterId: 'cnt_02',
      currentCounterCode: 'Quầy 02',
      currentStaffId: 'usr_staff_02',
      currentStaffName: 'Trần Thị Mai',
      createdAt: formatTime(18),
      calledAt: formatTime(1),
    },
    {
      id: 'tkt_demo_03',
      token: 'TK43C55D',
      branchId: 'branch_01',
      serviceId: 'srv_dd',
      serviceName: 'Đất đai & Tài nguyên Môi trường',
      servicePrefix: 'DD',
      ticketNumber: 'DD-008',
      sequenceNumber: 8,
      sourceChannel: 'KIOSK',
      priority: 'NORMAL',
      status: 'SERVING',
      customerData: {
        fullname: 'Hoàng Văn Thái',
        citizen_id: '079185002233',
        dossier_code: 'HS-DD-2026-9812',
        transaction_type: 'Đăng ký biến động (chuyển nhượng, tặng cho, thừa kế)',
      },
      antiDuplicateHash: 'HS-DD-2026-9812',
      currentCounterId: 'cnt_03',
      currentCounterCode: 'Quầy 03',
      currentStaffId: 'usr_staff_03',
      currentStaffName: 'Lê Hoàng Nam',
      createdAt: formatTime(32),
      calledAt: formatTime(12),
      servingStartedAt: formatTime(10),
    },
    {
      id: 'tkt_demo_04',
      token: 'TK12D44E',
      branchId: 'branch_01',
      serviceId: 'srv_ca',
      serviceName: 'Cấp đổi Căn cước công dân & Định danh điện tử (VNeID)',
      servicePrefix: 'CA',
      ticketNumber: 'CA-022',
      sequenceNumber: 22,
      sourceChannel: 'ONLINE_PHONE',
      priority: 'NORMAL',
      status: 'WAITING',
      customerData: {
        fullname: 'Phan Quốc Bảo',
        citizen_id: '079095009988',
        phone: '0933221100',
        service_detail: 'Kích hoạt định danh điện tử VNeID mức 2',
      },
      antiDuplicateHash: '079095009988',
      createdAt: formatTime(14),
    },
    {
      id: 'tkt_demo_05',
      token: 'TK33E66F',
      branchId: 'branch_01',
      serviceId: 'srv_ca',
      serviceName: 'Cấp đổi Căn cước công dân & Định danh điện tử (VNeID)',
      servicePrefix: 'CA',
      ticketNumber: 'CA-023',
      sequenceNumber: 23,
      sourceChannel: 'KIOSK',
      priority: 'PREGNANT',
      priorityReason: 'Phụ nữ mang thai',
      status: 'WAITING',
      customerData: {
        fullname: 'Ngô Thanh Hằng',
        citizen_id: '079198007766',
        phone: '0977665544',
        service_detail: 'Cấp đổi thẻ CCCD gắn chip (hết hạn / đổi thông tin)',
      },
      antiDuplicateHash: '079198007766',
      createdAt: formatTime(10),
    },
    {
      id: 'tkt_demo_06',
      token: 'TK55F77G',
      branchId: 'branch_01',
      serviceId: 'srv_ht',
      serviceName: 'Đăng ký Hộ tịch & Chứng thực tư pháp',
      servicePrefix: 'HT',
      ticketNumber: 'HT-016',
      sequenceNumber: 16,
      sourceChannel: 'KIOSK',
      priority: 'NORMAL',
      status: 'WAITING',
      customerData: {
        fullname: 'Vũ Đức Thịnh',
        phone: '0908112233',
        procedure: 'Cấp giấy xác nhận tình trạng hôn nhân',
      },
      antiDuplicateHash: '0908112233',
      createdAt: formatTime(8),
    },
    {
      id: 'tkt_demo_07',
      token: 'TK88G99H',
      branchId: 'branch_01',
      serviceId: 'srv_dd',
      serviceName: 'Đất đai & Tài nguyên Môi trường',
      servicePrefix: 'DD',
      ticketNumber: 'DD-009',
      sequenceNumber: 9,
      sourceChannel: 'ONLINE_PHONE',
      priority: 'NORMAL',
      status: 'WAITING',
      customerData: {
        fullname: 'Phạm Thị Thảo',
        citizen_id: '079199003322',
        dossier_code: 'HS-DD-2026-9920',
        transaction_type: 'Xóa thế chấp, đăng ký giao dịch bảo đảm',
      },
      antiDuplicateHash: 'HS-DD-2026-9920',
      createdAt: formatTime(5),
    },
  ];

  const ticketEvents: TicketEvent[] = [
    {
      id: 'evt_01',
      ticketId: 'tkt_demo_01',
      ticketNumber: 'CA-021',
      eventType: 'CREATED',
      timestamp: formatTime(25),
      actorName: 'Hệ thống Kiosk Sảnh A',
      note: 'Lấy số thành công tại Kiosk',
    },
    {
      id: 'evt_02',
      ticketId: 'tkt_demo_01',
      ticketNumber: 'CA-021',
      eventType: 'CALLED',
      timestamp: formatTime(6),
      actorId: 'usr_staff_01',
      actorName: 'Nguyễn Văn An',
      counterId: 'cnt_01',
      counterCode: 'Quầy 01',
      note: 'Cán bộ bấm gọi số',
    },
    {
      id: 'evt_03',
      ticketId: 'tkt_demo_01',
      ticketNumber: 'CA-021',
      eventType: 'SERVING',
      timestamp: formatTime(4),
      actorId: 'usr_staff_01',
      actorName: 'Nguyễn Văn An',
      counterId: 'cnt_01',
      counterCode: 'Quầy 01',
      note: 'Bắt đầu tiếp nhận và xử lý hồ sơ',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log_01',
      branchId: 'branch_01',
      actorRole: 'STAFF',
      actorName: 'Nguyễn Văn An',
      action: 'CALL_TICKET',
      targetType: 'TICKET',
      targetId: 'CA-021',
      timestamp: formatTime(6),
      details: 'Gọi số CA-021 vào Quầy 01',
    },
    {
      id: 'log_02',
      branchId: 'branch_01',
      actorRole: 'STAFF',
      actorName: 'Trần Thị Mai',
      action: 'CALL_TICKET',
      targetType: 'TICKET',
      targetId: 'HT-015',
      timestamp: formatTime(1),
      details: 'Gọi số HT-015 (Ưu tiên người cao tuổi) vào Quầy 02',
    },
  ];

  const propaganda: PropagandaConfig = {
    orgName: 'ỦY BAN NHÂN DÂN THÀNH PHỐ • TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG',
    subTitle: 'HỆ THỐNG MỘT CỬA ĐIỆN TỬ & DỊCH VỤ CÔNG QUỐC GIA',
    appTitle: 'Hệ Thống Xếp Hàng & Phục Vụ Hành Chính Công Điện Tử',
    hotline: '1022 - 1900 9068',
    address: 'Số 123 Đại lộ Trần Hưng Đạo, Phường 1, Trung tâm Hành chính Thành phố',
    workingHours: 'Sáng: 07:30 – 11:30 | Chiều: 13:00 – 17:00 (Thứ Hai đến Thứ Sáu)',
    nationalPortalUrl: 'https://dichvucong.gov.vn',
    slogans: [
      '★ NHIỆT LIỆT HƯỞNG ỨNG PHONG TRÀO CHUYỂN ĐỔI SỐ QUỐC GIA - ĐỀ ÁN 06/CP CỦA CHÍNH PHỦ ★',
      '★ TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG: LẤY SỰ HÀI LÒNG CỦA CÔNG DÂN VÀ DOANH NGHIỆP LÀM MỤC TIÊU PHỤC VỤ ★',
      '★ KHUYẾN KHÍCH NỘP HỒ SƠ TRỰC TUYẾN TẠI CỔNG DỊCH VỤ CÔNG QUỐC GIA (DICHVUCONG.GOV.VN) ĐỂ TIẾT KIỆM THỜI GIAN ★',
      '★ TÍCH HỢP GIẤY TỜ TRÊN ỨNG DỤNG ĐỊNH DANH ĐIỆN TỬ VNeID MỨC 2 THAY THẾ GIẤY TỜ BẢN CỨNG TRUYỀN THỐNG ★',
      '★ CÁN BỘ CÔNG CHỨC THỰC HIỆN 4 XIN - 4 LUÔN: XIN CHÀO, XIN LỖI, XIN CẢM ƠN, XIN PHÉP - LUÔN LẮNG NGHE, GIÚP ĐỠ ★',
      '★ TUYÊN TRUYỀN PHÁP LUẬT: NÓI KHÔNG VỚI TIÊU CỰC, NHŨNG NHIỄU, "CÒ MỒI" LÀM HỒ SƠ - ĐƯỜNG DÂY NÓNG PHẢN ÁNH: 1022 ★',
    ],
    banners: [
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
        active: true,
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
        active: true,
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
        active: true,
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
        active: true,
      },
    ],
  };

  return {
    organization: org,
    branches,
    services,
    counters,
    tickets,
    ticketEvents,
    kiosks,
    displays,
    auditLogs,
    users,
    propaganda,
  };
}

function createSqliteTables(): void {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS organization (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS propaganda (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      org_id TEXT,
      code TEXT,
      name TEXT,
      active INTEGER,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      branch_id TEXT,
      code TEXT,
      name TEXT,
      prefix TEXT,
      active INTEGER,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS counters (
      id TEXT PRIMARY KEY,
      branch_id TEXT,
      code TEXT,
      name TEXT,
      status TEXT,
      current_ticket_number TEXT,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      branch_id TEXT,
      service_id TEXT,
      ticket_number TEXT,
      status TEXT,
      priority TEXT,
      source_channel TEXT,
      created_at TEXT,
      called_at TEXT,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_events (
      id TEXT PRIMARY KEY,
      ticket_id TEXT,
      event_type TEXT,
      timestamp TEXT,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kiosks (
      id TEXT PRIMARY KEY,
      branch_id TEXT,
      name TEXT,
      location TEXT,
      status TEXT,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS displays (
      id TEXT PRIMARY KEY,
      branch_id TEXT,
      name TEXT,
      location TEXT,
      status TEXT,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      actor_name TEXT,
      action TEXT,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      name TEXT,
      role TEXT,
      status TEXT,
      data TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_services_branch ON services(branch_id);
    CREATE INDEX IF NOT EXISTS idx_counters_branch ON counters(branch_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_branch ON tickets(branch_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
    CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket ON ticket_events(ticket_id);
  `);
}

function loadFromSqlite(): void {
  const orgRow = sqliteDb.prepare('SELECT data FROM organization LIMIT 1').get() as { data: string } | undefined;
  const propRow = sqliteDb.prepare('SELECT data FROM propaganda LIMIT 1').get() as { data: string } | undefined;

  const branchRows = sqliteDb.prepare('SELECT data FROM branches').all() as { data: string }[];
  const serviceRows = sqliteDb.prepare('SELECT data FROM services').all() as { data: string }[];
  const counterRows = sqliteDb.prepare('SELECT data FROM counters').all() as { data: string }[];
  const ticketRows = sqliteDb.prepare('SELECT data FROM tickets').all() as { data: string }[];
  const eventRows = sqliteDb.prepare('SELECT data FROM ticket_events').all() as { data: string }[];
  const kioskRows = sqliteDb.prepare('SELECT data FROM kiosks').all() as { data: string }[];
  const displayRows = sqliteDb.prepare('SELECT data FROM displays').all() as { data: string }[];
  const auditRows = sqliteDb.prepare('SELECT data FROM audit_logs').all() as { data: string }[];
  const userRows = sqliteDb.prepare('SELECT data FROM users').all() as { data: string }[];

  const seed = getInitialSeedData();

  db = {
    organization: orgRow ? JSON.parse(orgRow.data) : seed.organization,
    propaganda: propRow ? JSON.parse(propRow.data) : seed.propaganda,
    branches: branchRows.length > 0 ? branchRows.map(r => JSON.parse(r.data)) : seed.branches,
    services: serviceRows.length > 0 ? serviceRows.map(r => JSON.parse(r.data)) : seed.services,
    counters: counterRows.length > 0 ? counterRows.map(r => JSON.parse(r.data)) : seed.counters,
    tickets: ticketRows.map(r => JSON.parse(r.data)),
    ticketEvents: eventRows.map(r => JSON.parse(r.data)),
    kiosks: kioskRows.length > 0 ? kioskRows.map(r => JSON.parse(r.data)) : seed.kiosks,
    displays: displayRows.length > 0 ? displayRows.map(r => JSON.parse(r.data)) : seed.displays,
    auditLogs: auditRows.map(r => JSON.parse(r.data)),
    users: userRows.length > 0 ? userRows.map(r => JSON.parse(r.data)) : seed.users,
  };
}

export function initDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Connect to SQLite Database
    sqliteDb = new DatabaseSync(SQLITE_DB_PATH);
    sqliteDb.exec('PRAGMA journal_mode = WAL;');
    sqliteDb.exec('PRAGMA synchronous = NORMAL;');

    // Create SQLite tables and indexes
    createSqliteTables();

    // Check if SQLite database already has records
    const srvCountRow = sqliteDb.prepare('SELECT count(*) as count FROM services').get() as { count: number } | undefined;
    const hasData = (srvCountRow?.count || 0) > 0;

    if (hasData) {
      loadFromSqlite();
      console.log(`[SQLite Database] Successfully loaded database from SQLite: ${SQLITE_DB_PATH}`);
    } else {
      // Check for legacy JSON migration
      if (fs.existsSync(LEGACY_JSON_FILE)) {
        try {
          const jsonContent = fs.readFileSync(LEGACY_JSON_FILE, 'utf-8');
          db = JSON.parse(jsonContent);
          console.log('[SQLite Database] Migrating existing data from smart_queue.json into SQLite...');
          saveDatabase();
          try {
            fs.renameSync(LEGACY_JSON_FILE, `${LEGACY_JSON_FILE}.migrated_backup`);
          } catch {}
          console.log('[SQLite Database] Migration to SQLite completed successfully.');
          return;
        } catch (mErr) {
          console.error('[SQLite Database] Error reading legacy JSON, using seed:', mErr);
        }
      }

      // Initialize fresh SQLite database with seed data
      db = getInitialSeedData();
      saveDatabase();
      console.log(`[SQLite Database] Initialized fresh SQLite database at ${SQLITE_DB_PATH}`);
    }
  } catch (err) {
    console.error('[SQLite Database] Error initializing SQLite database, falling back to in-memory seed:', err);
    db = getInitialSeedData();
  }
}

export function saveDatabase(): void {
  if (!sqliteDb || !db) return;

  try {
    sqliteDb.exec('BEGIN TRANSACTION;');

    // Organization
    if (db.organization) {
      const stmt = sqliteDb.prepare('INSERT OR REPLACE INTO organization (id, data) VALUES (?, ?)');
      stmt.run(db.organization.id || 'org_01', JSON.stringify(db.organization));
    }

    // Propaganda
    if (db.propaganda) {
      const stmt = sqliteDb.prepare('INSERT OR REPLACE INTO propaganda (id, data) VALUES (?, ?)');
      stmt.run('propaganda_default', JSON.stringify(db.propaganda));
    }

    // Branches
    sqliteDb.exec('DELETE FROM branches;');
    const branchStmt = sqliteDb.prepare('INSERT INTO branches (id, org_id, code, name, active, data) VALUES (?, ?, ?, ?, ?, ?)');
    for (const b of db.branches) {
      branchStmt.run(b.id, b.orgId, b.code, b.name, b.active ? 1 : 0, JSON.stringify(b));
    }

    // Services
    sqliteDb.exec('DELETE FROM services;');
    const srvStmt = sqliteDb.prepare('INSERT INTO services (id, branch_id, code, name, prefix, active, data) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const s of db.services) {
      srvStmt.run(s.id, s.branchId, s.code, s.name, s.prefix, s.active ? 1 : 0, JSON.stringify(s));
    }

    // Counters
    sqliteDb.exec('DELETE FROM counters;');
    const cntStmt = sqliteDb.prepare('INSERT INTO counters (id, branch_id, code, name, status, current_ticket_number, data) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const c of db.counters) {
      cntStmt.run(c.id, c.branchId, c.code, c.name, c.status, c.currentTicketNumber || '', JSON.stringify(c));
    }

    // Tickets
    sqliteDb.exec('DELETE FROM tickets;');
    const tktStmt = sqliteDb.prepare('INSERT INTO tickets (id, branch_id, service_id, ticket_number, status, priority, source_channel, created_at, called_at, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const t of db.tickets) {
      tktStmt.run(t.id, t.branchId, t.serviceId, t.ticketNumber, t.status, t.priority, t.sourceChannel, t.createdAt, t.calledAt || '', JSON.stringify(t));
    }

    // Ticket Events
    sqliteDb.exec('DELETE FROM ticket_events;');
    const evtStmt = sqliteDb.prepare('INSERT INTO ticket_events (id, ticket_id, event_type, timestamp, data) VALUES (?, ?, ?, ?, ?)');
    for (const e of db.ticketEvents) {
      evtStmt.run(e.id, e.ticketId, e.eventType, e.timestamp, JSON.stringify(e));
    }

    // Kiosks
    sqliteDb.exec('DELETE FROM kiosks;');
    const kskStmt = sqliteDb.prepare('INSERT INTO kiosks (id, branch_id, name, location, status, data) VALUES (?, ?, ?, ?, ?, ?)');
    for (const k of db.kiosks) {
      kskStmt.run(k.id, k.branchId, k.name, k.location || '', k.status, JSON.stringify(k));
    }

    // Displays
    sqliteDb.exec('DELETE FROM displays;');
    const dspStmt = sqliteDb.prepare('INSERT INTO displays (id, branch_id, name, location, status, data) VALUES (?, ?, ?, ?, ?, ?)');
    for (const d of db.displays) {
      dspStmt.run(d.id, d.branchId, d.name, d.location || '', d.status, JSON.stringify(d));
    }

    // Audit Logs
    sqliteDb.exec('DELETE FROM audit_logs;');
    const logStmt = sqliteDb.prepare('INSERT INTO audit_logs (id, timestamp, actor_name, action, data) VALUES (?, ?, ?, ?, ?)');
    for (const a of db.auditLogs) {
      logStmt.run(a.id, a.timestamp, a.actorName || '', a.action, JSON.stringify(a));
    }

    // Users
    sqliteDb.exec('DELETE FROM users;');
    const usrStmt = sqliteDb.prepare('INSERT INTO users (id, username, name, role, status, data) VALUES (?, ?, ?, ?, ?, ?)');
    for (const u of db.users) {
      usrStmt.run(u.id, u.username, u.name, u.role, u.status || 'ACTIVE', JSON.stringify(u));
    }

    sqliteDb.exec('COMMIT;');
  } catch (err) {
    try {
      sqliteDb.exec('ROLLBACK;');
    } catch {}
    console.error('[SQLite Database] Failed to write transaction into SQLite:', err);
  }
}

export function getSqliteDatabase(): DatabaseSync {
  return sqliteDb;
}

export function getDatabaseEngineInfo() {
  return {
    engine: 'SQLite 3 (WAL mode)',
    driver: 'node:sqlite (native embedded C engine)',
    databaseFile: SQLITE_DB_PATH,
    tables: [
      'organization',
      'propaganda',
      'branches',
      'services',
      'counters',
      'tickets',
      'ticket_events',
      'kiosks',
      'displays',
      'audit_logs',
      'users'
    ],
    counts: {
      services: db?.services?.length || 0,
      counters: db?.counters?.length || 0,
      tickets: db?.tickets?.length || 0,
      ticketEvents: db?.ticketEvents?.length || 0,
      users: db?.users?.length || 0,
      branches: db?.branches?.length || 0,
    }
  };
}

// ----------------- REPOSITORY METHODS -----------------

export function getOrganization(): Organization {
  const envUrl = process.env.PUBLIC_BASE_URL?.trim();
  return {
    ...db.organization,
    publicBaseUrl: envUrl || db.organization.publicBaseUrl || '',
  };
}

export function updateOrganization(data: Partial<Organization>): Organization {
  db.organization = { ...db.organization, ...data };
  saveDatabase();
  return getOrganization();
}

export function getPropagandaConfig(): PropagandaConfig {
  if (!db.propaganda) {
    const seed = getInitialSeedData();
    db.propaganda = seed.propaganda!;
    saveDatabase();
  }
  return db.propaganda;
}

export function updatePropagandaConfig(data: Partial<PropagandaConfig>): PropagandaConfig {
  const current = getPropagandaConfig();
  db.propaganda = { ...current, ...data };
  saveDatabase();
  return db.propaganda;
}

export function getBranches(): Branch[] {
  return db.branches;
}

export function getServices(branchId?: string, includeInactive = false): Service[] {
  if (branchId && branchId !== 'all') {
    return db.services.filter(
      s => (!s.branchId || s.branchId === branchId) && (includeInactive || s.active)
    );
  }
  return includeInactive ? db.services : db.services.filter(s => s.active);
}

export function getServiceById(id: string): Service | undefined {
  return db.services.find(s => s.id === id);
}

export function saveService(service: Service): Service {
  if (!service.id) {
    const pfx = (service.prefix || 'DV').trim().toUpperCase();
    service.id = 'srv_' + pfx.toLowerCase() + '_' + Math.random().toString(36).substring(2, 7);
  }
  if (!service.branchId) {
    service.branchId = 'branch_01';
  }
  if (service.prefix) {
    service.prefix = service.prefix.trim().toUpperCase();
  } else {
    service.prefix = 'DV';
  }
  if (service.active === undefined) {
    service.active = true;
  }
  if (!service.fields) {
    service.fields = [];
  }

  const index = db.services.findIndex(s => s.id === service.id);
  if (index >= 0) {
    db.services[index] = { ...db.services[index], ...service };
  } else {
    db.services.push(service);
  }
  saveDatabase();
  return db.services.find(s => s.id === service.id)!;
}

export function deleteService(id: string): boolean {
  db.services = db.services.filter(s => s.id !== id);
  // Also clean up assigned service references in counters
  if (db.counters && Array.isArray(db.counters)) {
    db.counters.forEach(c => {
      if (c.serviceIds && Array.isArray(c.serviceIds)) {
        c.serviceIds = c.serviceIds.filter(sid => sid !== id);
      }
    });
  }
  saveDatabase();
  return true;
}

export const GOVERNMENT_SERVICES_TEMPLATE: Service[] = [
  {
    id: 'srv_gov_ca',
    branchId: 'branch_01',
    name: 'Căn cước công dân & Định danh điện tử VNeID',
    code: 'CAN_CUOC_VNEID',
    prefix: 'CA',
    sector: 'GOVERNMENT',
    category: 'Căn cước - Định danh',
    description: 'Cấp mới, cấp đổi thẻ CCCD gắn chip, đăng ký và kích hoạt tài khoản định danh điện tử VNeID mức 2',
    dailyMax: 150,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 10,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: true,
    isPreBookingEnabled: true,
    active: true,
    fields: [
      {
        id: 'citizen_id',
        label: 'Số CCCD/Định danh cá nhân (12 số)',
        type: 'text',
        required: true,
        placeholder: 'Nhập 12 số định danh cá nhân',
        order: 1,
        visibility: true,
        antiDuplicateKey: true,
      },
      {
        id: 'fullname',
        label: 'Họ và tên công dân',
        type: 'text',
        required: true,
        placeholder: 'Ví dụ: Nguyễn Văn An',
        order: 2,
        visibility: true,
      },
      {
        id: 'phone',
        label: 'Số điện thoại liên hệ',
        type: 'text',
        required: true,
        placeholder: '090xxxxxxx',
        order: 3,
        visibility: true,
      },
      {
        id: 'service_detail',
        label: 'Thủ tục chi tiết',
        type: 'select',
        required: true,
        options: [
          'Cấp đổi thẻ CCCD gắn chip (hết hạn / sai lệch thông tin)',
          'Cấp lại thẻ CCCD bị mất',
          'Kích hoạt định danh điện tử VNeID mức 2',
          'Thu nhận sinh trắc học vân tay / ảnh khuôn mặt',
        ],
        order: 4,
        visibility: true,
      },
    ],
  },
  {
    id: 'srv_gov_dd',
    branchId: 'branch_01',
    name: 'Đất đai, Sổ đỏ & Tài nguyên Môi trường',
    code: 'DAT_DAI_SO_DO',
    prefix: 'DD',
    sector: 'GOVERNMENT',
    category: 'Đất đai - Địa chính',
    description: 'Đăng ký biến động quyền sử dụng đất, cấp Giấy chứng nhận quyền sử dụng đất (Sổ đỏ), xóa thế chấp',
    dailyMax: 90,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 15,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: true,
    isPreBookingEnabled: true,
    active: true,
    fields: [
      {
        id: 'fullname',
        label: 'Họ và tên chủ hồ sơ / Người sử dụng đất',
        type: 'text',
        required: true,
        placeholder: 'Ví dụ: Lê Thị Mai',
        order: 1,
        visibility: true,
      },
      {
        id: 'citizen_id',
        label: 'Số CCCD chủ sở hữu',
        type: 'text',
        required: true,
        placeholder: '12 số CCCD',
        order: 2,
        visibility: true,
      },
      {
        id: 'dossier_code',
        label: 'Mã hồ sơ tiếp nhận / Giấy biên nhận',
        type: 'text',
        required: true,
        placeholder: 'VD: HS-DD-2026-0812',
        order: 3,
        visibility: true,
        antiDuplicateKey: true,
      },
      {
        id: 'transaction_type',
        label: 'Loại thủ tục đất đai',
        type: 'select',
        required: true,
        options: [
          'Đăng ký biến động (chuyển nhượng, tặng cho, thừa kế)',
          'Cấp mới Giấy chứng nhận lần đầu',
          'Xóa thế chấp, đăng ký giao dịch bảo đảm',
          'Đo đạc, tách thửa, hợp thửa',
        ],
        order: 4,
        visibility: true,
      },
    ],
  },
  {
    id: 'srv_gov_ht',
    branchId: 'branch_01',
    name: 'Hộ tịch, Tư pháp & Chứng thực bản sao',
    code: 'HO_TICH_TU_PHAP',
    prefix: 'HT',
    sector: 'GOVERNMENT',
    category: 'Tư pháp - Hộ tịch',
    description: 'Đăng ký khai sinh, kết hôn, khai tử, cấp giấy xác nhận tình trạng hôn nhân, chứng thực bản sao',
    dailyMax: 130,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 8,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: true,
    isPreBookingEnabled: false,
    active: true,
    fields: [
      {
        id: 'fullname',
        label: 'Họ và tên người yêu cầu',
        type: 'text',
        required: true,
        placeholder: 'Trần Văn Bình',
        order: 1,
        visibility: true,
      },
      {
        id: 'citizen_id',
        label: 'Số CCCD / Hộ chiếu',
        type: 'text',
        required: true,
        placeholder: '12 số CCCD',
        order: 2,
        visibility: true,
        antiDuplicateKey: true,
      },
      {
        id: 'phone',
        label: 'Số điện thoại',
        type: 'text',
        required: true,
        order: 3,
        visibility: true,
      },
      {
        id: 'procedure',
        label: 'Nội dung thực hiện',
        type: 'select',
        required: true,
        options: [
          'Sao y bản chính giấy tờ, văn bản (chứng thực)',
          'Chứng thực chữ ký công dân',
          'Cấp giấy xác nhận tình trạng hôn nhân',
          'Đăng ký khai sinh / kết hôn / khai tử',
        ],
        order: 4,
        visibility: true,
      },
    ],
  },
  {
    id: 'srv_gov_xd',
    branchId: 'branch_01',
    name: 'Cấp phép Xây dựng & Quản lý Đô thị',
    code: 'XAY_DUNG_DO_THI',
    prefix: 'XD',
    sector: 'GOVERNMENT',
    category: 'Xây dựng - Quy hoạch',
    description: 'Thẩm định hồ sơ, cấp phép xây dựng nhà ở riêng lẻ, cải tạo công trình, cấp phép biển hiệu quảng cáo',
    dailyMax: 60,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 20,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: false,
    isPreBookingEnabled: true,
    active: true,
    fields: [
      {
        id: 'fullname',
        label: 'Tên chủ công trình / Chủ đầu tư',
        type: 'text',
        required: true,
        placeholder: 'Ví dụ: Đỗ Mạnh Hùng',
        order: 1,
        visibility: true,
      },
      {
        id: 'citizen_id',
        label: 'Số CCCD người đại diện nộp',
        type: 'text',
        required: true,
        placeholder: '12 số CCCD',
        order: 2,
        visibility: true,
      },
      {
        id: 'project_address',
        label: 'Địa chỉ thửa đất / Vị trí xây dựng',
        type: 'text',
        required: true,
        placeholder: 'Số nhà, ngõ, tổ dân phố, phường/xã',
        order: 3,
        visibility: true,
        antiDuplicateKey: true,
      },
      {
        id: 'permit_type',
        label: 'Loại giấy phép đề nghị',
        type: 'select',
        required: true,
        options: [
          'Cấp phép xây mới nhà ở riêng lẻ đô thị',
          'Sửa chữa, cải tạo, nâng tầng công trình',
          'Hoàn công, nghiệm thu công trình xây dựng',
          'Cấp phép tạm thời công trình phụ trợ',
        ],
        order: 4,
        visibility: true,
      },
    ],
  },
];

export const ENTERPRISE_SERVICES_TEMPLATE: Service[] = [
  {
    id: 'srv_ent_dn',
    branchId: 'branch_01',
    name: 'Đăng ký Doanh nghiệp & Giấy phép Kinh doanh',
    code: 'DANG_KY_DOANH_NGHIEP',
    prefix: 'DN',
    sector: 'ENTERPRISE',
    category: 'Pháp lý & ĐKKD',
    description: 'Thành lập công ty mới, thay đổi nội dung đăng ký kinh doanh, người đại diện, bổ sung ngành nghề',
    dailyMax: 100,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 15,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: true,
    isPreBookingEnabled: true,
    active: true,
    fields: [
      {
        id: 'tax_id',
        label: 'Mã số thuế / Mã số Doanh nghiệp (MST)',
        type: 'text',
        required: true,
        placeholder: 'Ví dụ: 0101234567 hoặc để trống nếu thành lập mới',
        order: 1,
        visibility: true,
        antiDuplicateKey: true,
      },
      {
        id: 'company_name',
        label: 'Tên Công ty / Doanh nghiệp / Tổ chức',
        type: 'text',
        required: true,
        placeholder: 'CÔNG TY TNHH / CP ABC...',
        order: 2,
        visibility: true,
      },
      {
        id: 'representative_name',
        label: 'Họ tên Người đại diện pháp luật / Người nộp',
        type: 'text',
        required: true,
        placeholder: 'Họ và tên người đại diện',
        order: 3,
        visibility: true,
      },
      {
        id: 'phone',
        label: 'Số điện thoại liên hệ',
        type: 'text',
        required: true,
        placeholder: '09xxxxxxxxx',
        order: 4,
        visibility: true,
      },
      {
        id: 'procedure_type',
        label: 'Loại thủ tục thực hiện',
        type: 'select',
        required: true,
        options: [
          'Đăng ký thành lập mới doanh nghiệp',
          'Thay đổi nội dung ĐKKD (Địa chỉ, Vốn điều lệ, Ngành nghề)',
          'Thay đổi Người đại diện theo pháp luật / Thành viên góp vốn',
          'Tạm ngừng hoạt động / Giải thể doanh nghiệp',
        ],
        order: 5,
        visibility: true,
      },
    ],
  },
  {
    id: 'srv_ent_td',
    branchId: 'branch_01',
    name: 'Giao dịch Tài chính, Ngân hàng & Tín dụng Doanh nghiệp',
    code: 'TAI_CHINH_TIN_DUNG_DN',
    prefix: 'TD',
    sector: 'ENTERPRISE',
    category: 'Ngân hàng & Tín dụng',
    description: 'Mở tài khoản thanh toán DN, giải ngân vốn lưu động, phát hành bảo lãnh dự thầu, chuyển khoản quốc tế L/C',
    dailyMax: 80,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 12,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: true,
    isPreBookingEnabled: true,
    active: true,
    fields: [
      {
        id: 'tax_id',
        label: 'Mã số thuế Doanh nghiệp (MST)',
        type: 'text',
        required: true,
        placeholder: '10 hoặc 13 số MST',
        order: 1,
        visibility: true,
        antiDuplicateKey: true,
      },
      {
        id: 'company_name',
        label: 'Tên Doanh nghiệp giao dịch',
        type: 'text',
        required: true,
        placeholder: 'Tên công ty giao dịch',
        order: 2,
        visibility: true,
      },
      {
        id: 'account_number',
        label: 'Số tài khoản thanh toán (nếu đã có)',
        type: 'text',
        required: false,
        placeholder: 'Số tài khoản ngân hàng',
        order: 3,
        visibility: true,
      },
      {
        id: 'transaction_type',
        label: 'Nội dung giao dịch',
        type: 'select',
        required: true,
        options: [
          'Mở mới tài khoản thanh toán / Gói tài khoản số đẹp DN',
          'Hồ sơ vay vốn, giải ngân hạn mức tín dụng',
          'Phát hành bảo lãnh dự thầu, bảo lãnh thực hiện hợp đồng',
          'Thanh toán quốc tế L/C, chuyển tiền ngoại tệ',
          'Nộp / rút tiền mặt hạn mức lớn theo séc',
        ],
        order: 4,
        visibility: true,
      },
      {
        id: 'contact_phone',
        label: 'Số điện thoại Kế toán / Giao dịch viên',
        type: 'text',
        required: true,
        placeholder: '09xxxxxxxx',
        order: 5,
        visibility: true,
      },
    ],
  },
  {
    id: 'srv_ent_th',
    branchId: 'branch_01',
    name: 'Kê khai Thuế & Hóa đơn Điện tử Doanh nghiệp',
    code: 'THUE_HOA_DON_DN',
    prefix: 'TH',
    sector: 'ENTERPRISE',
    category: 'Kế toán & Thuế',
    description: 'Đăng ký và phát hành hóa đơn điện tử, kê khai nộp thuế TNDN, GTGT, giải quyết hoàn thuế doanh nghiệp',
    dailyMax: 110,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 10,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: false,
    isPreBookingEnabled: true,
    active: true,
    fields: [
      {
        id: 'tax_id',
        label: 'Mã số thuế Doanh nghiệp',
        type: 'text',
        required: true,
        placeholder: 'Mã số thuế công ty',
        order: 1,
        visibility: true,
        antiDuplicateKey: true,
      },
      {
        id: 'company_name',
        label: 'Tên Doanh nghiệp / Chi nhánh',
        type: 'text',
        required: true,
        placeholder: 'Tên công ty người nộp thuế',
        order: 2,
        visibility: true,
      },
      {
        id: 'tax_period',
        label: 'Kỳ thuế / Số quyết định kiểm tra',
        type: 'text',
        required: false,
        placeholder: 'VD: Q3/2026 hoặc QĐ-KT-908',
        order: 3,
        visibility: true,
      },
      {
        id: 'tax_procedure',
        label: 'Yêu cầu xử lý',
        type: 'select',
        required: true,
        options: [
          'Đăng ký mới / Thay đổi mẫu hóa đơn điện tử',
          'Quyết toán thuế TNDN, TNCN năm',
          'Thủ tục hồ sơ hoàn thuế GTGT',
          'Tra cứu tình trạng nợ đọng thuế và đối soát sổ bộ',
        ],
        order: 4,
        visibility: true,
      },
      {
        id: 'contact_phone',
        label: 'Số điện thoại phụ trách kế toán',
        type: 'text',
        required: true,
        order: 5,
        visibility: true,
      },
    ],
  },
  {
    id: 'srv_ent_b2b',
    branchId: 'branch_01',
    name: 'Khách hàng Doanh nghiệp & Hợp đồng B2B',
    code: 'KHACH_HANG_B2B',
    prefix: 'B2B',
    sector: 'ENTERPRISE',
    category: 'Đối tác & B2B',
    description: 'Đàm phán ký kết hợp đồng thương mại, hỗ trợ đối tác cung ứng, tiếp nhận nghiệm thu thanh toán đợt',
    dailyMax: 70,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 15,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: true,
    isPreBookingEnabled: true,
    active: true,
    fields: [
      {
        id: 'tax_id',
        label: 'Mã số thuế / Mã khách hàng B2B',
        type: 'text',
        required: true,
        placeholder: 'Mã số thuế hoặc Mã KH đối tác',
        order: 1,
        visibility: true,
        antiDuplicateKey: true,
      },
      {
        id: 'company_name',
        label: 'Tên đối tác / Doanh nghiệp',
        type: 'text',
        required: true,
        placeholder: 'Tên doanh nghiệp',
        order: 2,
        visibility: true,
      },
      {
        id: 'contract_number',
        label: 'Số Hợp đồng / Đơn hàng',
        type: 'text',
        required: false,
        placeholder: 'VD: HD-B2B-2026-044',
        order: 3,
        visibility: true,
      },
      {
        id: 'contact_person',
        label: 'Họ tên người liên hệ & Chức vụ',
        type: 'text',
        required: true,
        placeholder: 'Họ tên - Trưởng phòng/Đại diện',
        order: 4,
        visibility: true,
      },
      {
        id: 'support_topic',
        label: 'Nội dung làm việc',
        type: 'select',
        required: true,
        options: [
          'Ký kết & Gia hạn hợp đồng khung B2B',
          'Nghiệm thu dịch vụ & Xuất hóa đơn VAT',
          'Tư vấn giải pháp công nghệ & Đào tạo triển khai',
          'Xử lý phản ánh dịch vụ theo cam kết SLA',
        ],
        order: 5,
        visibility: true,
      },
    ],
  },
  {
    id: 'srv_ent_kt',
    branchId: 'branch_01',
    name: 'Tiếp nhận Bảo hành & Kỹ thuật Thiết bị Doanh nghiệp',
    code: 'BAO_HANH_KY_THUAT_DN',
    prefix: 'KT',
    sector: 'ENTERPRISE',
    category: 'Bảo hành & Kỹ thuật',
    description: 'Tiếp nhận máy móc, thiết bị viễn thông, phần cứng chuyên dụng bảo hành, hiệu chuẩn và kiểm thử',
    dailyMax: 90,
    startNumber: 1,
    digitCount: 3,
    avgServiceTimeMinutes: 15,
    isOnlineEnabled: true,
    isKioskEnabled: true,
    isPriorityEnabled: false,
    isPreBookingEnabled: true,
    active: true,
    fields: [
      {
        id: 'company_name',
        label: 'Tên cơ quan / Doanh nghiệp gửi thiết bị',
        type: 'text',
        required: true,
        placeholder: 'Tên công ty sở hữu thiết bị',
        order: 1,
        visibility: true,
      },
      {
        id: 'serial_number',
        label: 'Số Serial / Model thiết bị',
        type: 'text',
        required: true,
        placeholder: 'VD: SN-2026-X9082',
        order: 2,
        visibility: true,
        antiDuplicateKey: true,
      },
      {
        id: 'handover_person',
        label: 'Họ tên người bàn giao',
        type: 'text',
        required: true,
        placeholder: 'Người mang thiết bị đến',
        order: 3,
        visibility: true,
      },
      {
        id: 'phone',
        label: 'Số điện thoại liên hệ',
        type: 'text',
        required: true,
        placeholder: '09xxxxxxxx',
        order: 4,
        visibility: true,
      },
      {
        id: 'fault_description',
        label: 'Mô tả hiện tượng lỗi cần khắc phục',
        type: 'textarea',
        required: false,
        placeholder: 'Chi tiết lỗi gặp phải...',
        order: 5,
        visibility: true,
      },
    ],
  },
];

export function clearAllServices(branchId?: string): boolean {
  if (branchId && branchId !== 'all') {
    db.services = db.services.filter(s => s.branchId !== branchId && Boolean(s.branchId));
  } else {
    db.services = [];
  }
  // Clear assigned services on counters
  if (db.counters && Array.isArray(db.counters)) {
    db.counters.forEach(c => {
      if (!branchId || branchId === 'all' || c.branchId === branchId) {
        c.serviceIds = [];
      }
    });
  }
  saveDatabase();
  return true;
}

export function seedServicesTemplate(
  sector: 'GOVERNMENT' | 'ENTERPRISE' | 'HYBRID',
  mode: 'REPLACE' | 'APPEND' = 'REPLACE',
  branchId: string = 'branch_01'
): Service[] {
  let targetServices: Service[] = [];
  if (sector === 'GOVERNMENT') {
    targetServices = JSON.parse(JSON.stringify(GOVERNMENT_SERVICES_TEMPLATE));
  } else if (sector === 'ENTERPRISE') {
    targetServices = JSON.parse(JSON.stringify(ENTERPRISE_SERVICES_TEMPLATE));
  } else {
    targetServices = [
      ...JSON.parse(JSON.stringify(GOVERNMENT_SERVICES_TEMPLATE)),
      ...JSON.parse(JSON.stringify(ENTERPRISE_SERVICES_TEMPLATE)),
    ];
  }

  targetServices.forEach(s => {
    s.branchId = branchId;
  });

  if (mode === 'REPLACE') {
    if (branchId) {
      db.services = db.services.filter(s => s.branchId !== branchId).concat(targetServices);
    } else {
      db.services = targetServices;
    }
  } else {
    for (const item of targetServices) {
      const exists = db.services.some(s => s.id === item.id || s.prefix === item.prefix);
      if (!exists) {
        db.services.push(item);
      }
    }
  }

  // Update counters to ensure they have services assigned
  if (db.counters && db.counters.length > 0) {
    const allServiceIds = db.services.map(s => s.id);
    db.counters.forEach((c, idx) => {
      // Assign appropriate subset or all
      if (!c.serviceIds || c.serviceIds.length === 0) {
        c.serviceIds = allServiceIds;
      }
    });
  }

  saveDatabase();
  return db.services;
}

export function getCounters(branchId?: string): Counter[] {
  if (branchId) {
    const list = db.counters.filter(c => c.branchId === branchId);
    if (list.length > 0) return list;
  }
  return db.counters;
}

export function getCounterById(id: string): Counter | undefined {
  return db.counters.find(c => c.id === id);
}

export function updateCounter(id: string, update: Partial<Counter>): Counter | undefined {
  const counter = db.counters.find(c => c.id === id);
  if (!counter) return undefined;
  Object.assign(counter, update);
  saveDatabase();
  return counter;
}

export function getKiosks(branchId?: string): KioskDevice[] {
  if (branchId) {
    const list = db.kiosks.filter(k => k.branchId === branchId);
    if (list.length > 0) return list;
  }
  return db.kiosks;
}

export function getDisplays(branchId?: string): DisplayScreen[] {
  if (branchId) {
    const list = db.displays.filter(d => d.branchId === branchId);
    if (list.length > 0) return list;
  }
  return db.displays;
}

export function updateDisplay(id: string, update: Partial<DisplayScreen>): DisplayScreen | undefined {
  const disp = db.displays.find(d => d.id === id);
  if (!disp) return undefined;
  Object.assign(disp, update);
  saveDatabase();
  return disp;
}

export function updateKiosk(id: string, update: Partial<KioskDevice>): KioskDevice | undefined {
  const kiosk = db.kiosks.find(k => k.id === id);
  if (!kiosk) return undefined;
  Object.assign(kiosk, update);
  saveDatabase();
  return kiosk;
}

export function getUsers(): UserAccount[] {
  return db.users;
}

export function getUserById(id: string): UserAccount | undefined {
  return db.users.find(u => u.id === id);
}

export function createUser(userData: Partial<UserAccount>): UserAccount {
  const username = (userData.username || '').trim().toLowerCase();
  if (!username) {
    throw new Error('Tên đăng nhập không được để trống');
  }

  const existing = db.users.find(u => u.username.toLowerCase() === username);
  if (existing) {
    throw new Error(`Tên đăng nhập "${username}" đã tồn tại. Vui lòng chọn tên khác.`);
  }

  const newUser: UserAccount = {
    id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    username,
    password: userData.password || '123456',
    name: userData.name?.trim() || 'Cán bộ mới',
    role: userData.role || 'STAFF',
    counterId: userData.counterId || undefined,
    phone: userData.phone?.trim() || '',
    email: userData.email?.trim() || '',
    status: userData.status || 'ACTIVE',
    branchId: userData.branchId || 'branch_01',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase();
  return newUser;
}

export function updateUser(id: string, updateData: Partial<UserAccount>): UserAccount | undefined {
  const user = db.users.find(u => u.id === id);
  if (!user) return undefined;

  if (updateData.username) {
    const newUsername = updateData.username.trim().toLowerCase();
    const existing = db.users.find(u => u.username.toLowerCase() === newUsername && u.id !== id);
    if (existing) {
      throw new Error(`Tên đăng nhập "${newUsername}" đã được sử dụng.`);
    }
    user.username = newUsername;
  }

  if (updateData.name !== undefined) user.name = updateData.name.trim();
  if (updateData.password !== undefined && updateData.password.trim()) user.password = updateData.password.trim();
  if (updateData.role !== undefined) user.role = updateData.role;
  if (updateData.counterId !== undefined) user.counterId = updateData.counterId;
  if (updateData.phone !== undefined) user.phone = updateData.phone.trim();
  if (updateData.email !== undefined) user.email = updateData.email.trim();
  if (updateData.status !== undefined) user.status = updateData.status;

  saveDatabase();
  return user;
}

export function deleteUser(id: string): boolean {
  const user = db.users.find(u => u.id === id);
  if (!user) return false;

  // Prevent deleting the main system admin if it's the only admin
  if (user.role === 'ADMIN') {
    const adminCount = db.users.filter(u => u.role === 'ADMIN').length;
    if (adminCount <= 1) {
      throw new Error('Không thể xóa quản trị viên duy nhất của hệ thống.');
    }
  }

  db.users = db.users.filter(u => u.id !== id);
  saveDatabase();
  return true;
}

// ----------------- QUEUE & TICKETS ENGINE -----------------

export function getTickets(filter?: { branchId?: string; serviceId?: string; status?: string }): Ticket[] {
  let list = db.tickets;
  if (filter?.branchId) {
    const branchFiltered = list.filter(t => t.branchId === filter.branchId);
    if (branchFiltered.length > 0) {
      list = branchFiltered;
    }
  }
  if (filter?.serviceId) {
    list = list.filter(t => t.serviceId === filter.serviceId);
  }
  if (filter?.status) {
    list = list.filter(t => t.status === filter.status);
  }
  return list;
}

export function getTicketByToken(token: string): Ticket | undefined {
  return db.tickets.find(t => t.token === token);
}

export function getTicketById(id: string): Ticket | undefined {
  return db.tickets.find(t => t.id === id);
}

export function getTicketEvents(ticketId: string): TicketEvent[] {
  return db.ticketEvents.filter(e => e.ticketId === ticketId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function calculateEstimatedWait(ticket: Ticket): { peopleAhead: number; estimatedMinutes: number; timeRangeText: string } {
  // Count people ahead in the same service or queue who are WAITING
  const waitingTickets = db.tickets
    .filter(t => t.serviceId === ticket.serviceId && t.status === 'WAITING')
    .sort((a, b) => {
      // Priorities first, then sequence
      const prioOrder: Record<PriorityLevel, number> = { VIP: 0, DISABILITY: 1, PREGNANT: 2, ELDERLY: 3, NORMAL: 4 };
      if (prioOrder[a.priority] !== prioOrder[b.priority]) {
        return prioOrder[a.priority] - prioOrder[b.priority];
      }
      return a.sequenceNumber - b.sequenceNumber;
    });

  const index = waitingTickets.findIndex(t => t.id === ticket.id);
  const peopleAhead = index >= 0 ? index : 0;

  const service = db.services.find(s => s.id === ticket.serviceId);
  const avgTime = service?.avgServiceTimeMinutes || 10;

  // Active counters handling this service
  const activeCounters = db.counters.filter(
    c => c.status !== 'CLOSED' && c.serviceIds.includes(ticket.serviceId)
  ).length || 1;

  const estimatedMinutes = Math.max(1, Math.round((peopleAhead * avgTime) / activeCounters));

  const now = new Date();
  const startTime = new Date(now.getTime() + estimatedMinutes * 60000);
  const endTime = new Date(startTime.getTime() + avgTime * 60000);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeRangeText = `Dự kiến: ${pad(startTime.getHours())}:${pad(startTime.getMinutes())} – ${pad(endTime.getHours())}:${pad(endTime.getMinutes())}`;

  return { peopleAhead, estimatedMinutes, timeRangeText };
}

// Check for duplicate ticket request
export function checkDuplicateTicket(serviceId: string, antiDuplicateHash: string): Ticket | null {
  if (!antiDuplicateHash || antiDuplicateHash.trim() === '') return null;

  // Check today's active tickets (WAITING, CALLED, SERVING)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const existing = db.tickets.find(t => {
    if (t.serviceId !== serviceId) return false;
    if (t.antiDuplicateHash !== antiDuplicateHash) return false;
    const isToday = new Date(t.createdAt) >= todayStart;
    const isActive = ['WAITING', 'CALLED', 'SERVING'].includes(t.status);
    return isToday && isActive;
  });

  return existing || null;
}

// Compute anti-duplicate hash based on configured fields in service
export function buildAntiDuplicateHash(service: Service, customerData: Record<string, any>): string {
  const keyFields = service.fields.filter(f => f.antiDuplicateKey).map(f => f.id);
  if (keyFields.length === 0) {
    // fallback: citizen_id or phone if present
    const fallback = customerData.citizen_id || customerData.phone || customerData.dossier_code || '';
    return String(fallback).trim().toLowerCase();
  }

  const parts = keyFields.map(fieldId => String(customerData[fieldId] || '').trim().toLowerCase());
  return parts.filter(Boolean).join('_');
}

// Atomic ticket creation
export async function issueTicket(params: {
  branchId: string;
  serviceId: string;
  sourceChannel: SourceChannel;
  priority?: PriorityLevel;
  priorityReason?: string;
  customerData: Record<string, any>;
}): Promise<{ ticket: Ticket; isExisting: boolean }> {
  // Use atomic queue mutex to guarantee absolute consistency and prevent duplicate numbers under concurrency
  return new Promise((resolve, reject) => {
    atomicTicketLock = atomicTicketLock.then(async () => {
      try {
        const service = db.services.find(s => s.id === params.serviceId);
        if (!service) {
          throw new Error('Dịch vụ không tồn tại');
        }
        if (!service.active) {
          throw new Error('Dịch vụ hiện đang tạm dừng tiếp nhận');
        }

        // 1. Anti-duplicate verification
        const hash = buildAntiDuplicateHash(service, params.customerData);
        const existing = checkDuplicateTicket(params.serviceId, hash);
        if (existing) {
          return resolve({ ticket: existing, isExisting: true });
        }

        // 2. Determine sequence number for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayTicketsForService = db.tickets.filter(
          t => t.serviceId === params.serviceId && new Date(t.createdAt) >= todayStart
        );

        if (todayTicketsForService.length >= service.dailyMax) {
          throw new Error(`Dịch vụ đã đạt giới hạn tối đa ${service.dailyMax} số trong ngày.`);
        }

        const nextSeq = todayTicketsForService.length + service.startNumber;
        const padDigits = service.digitCount || 3;
        const ticketNumber = `${service.prefix}-${nextSeq.toString().padStart(padDigits, '0')}`;

        // 3. Generate random secure token for public tracking (no PII)
        const token = 'TK' + crypto.randomBytes(4).toString('hex').toUpperCase();

        const newTicket: Ticket = {
          id: 'tkt_' + crypto.randomBytes(6).toString('hex'),
          token,
          branchId: params.branchId,
          serviceId: service.id,
          serviceName: service.name,
          servicePrefix: service.prefix,
          ticketNumber,
          sequenceNumber: nextSeq,
          sourceChannel: params.sourceChannel,
          priority: params.priority || 'NORMAL',
          priorityReason: params.priorityReason,
          status: 'WAITING',
          customerData: params.customerData,
          antiDuplicateHash: hash,
          createdAt: new Date().toISOString(),
        };

        db.tickets.push(newTicket);

        // Add creation event
        db.ticketEvents.push({
          id: 'evt_' + Date.now(),
          ticketId: newTicket.id,
          ticketNumber: newTicket.ticketNumber,
          eventType: 'CREATED',
          timestamp: newTicket.createdAt,
          actorName: params.sourceChannel === 'KIOSK' ? 'Máy Kiosk tự phục vụ' : 'Đăng ký trực tuyến Mobile',
          note: `Lấy số thành công (${params.priority !== 'NORMAL' ? 'Ưu tiên: ' + params.priority : 'Thường'})`,
        });

        // Audit log
        db.auditLogs.push({
          id: 'log_' + Date.now(),
          branchId: params.branchId,
          actorRole: params.sourceChannel === 'KIOSK' ? 'KIOSK' : 'CITIZEN',
          actorName: 'Hệ thống Cấp Số',
          action: 'ISSUE_TICKET',
          targetType: 'TICKET',
          targetId: newTicket.ticketNumber,
          timestamp: newTicket.createdAt,
          details: `Cấp số ${newTicket.ticketNumber} qua ${params.sourceChannel}`,
        });

        saveDatabase();
        resolve({ ticket: newTicket, isExisting: false });
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Call next ticket for a counter
export function callNextTicket(
  counterId: string,
  staffId: string,
  staffName: string,
  specificTicketId?: string
): Ticket | null {
  const counter = db.counters.find(c => c.id === counterId);
  if (!counter) throw new Error('Quầy không tồn tại');

  // If counter is currently SERVING or CALLING a ticket, mark it completed or idle first or prompt
  let nextTicket: Ticket | undefined;

  if (specificTicketId) {
    nextTicket = db.tickets.find(t => t.id === specificTicketId && t.status === 'WAITING');
    if (!nextTicket) {
      // Try finding by ticketNumber
      nextTicket = db.tickets.find(
        t => t.ticketNumber.toLowerCase() === specificTicketId.toLowerCase() && t.status === 'WAITING'
      );
    }
    if (!nextTicket) throw new Error('Số thứ tự không tồn tại trong hàng đợi hoặc đã được gọi');
  } else {
    // Get waiting tickets eligible for this counter
    const eligibleTickets = db.tickets.filter(
      t => t.status === 'WAITING' && counter.serviceIds.includes(t.serviceId)
    );

    if (eligibleTickets.length === 0) {
      return null;
    }

    // Sort by priority (VIP -> DISABILITY -> PREGNANT -> ELDERLY -> NORMAL) then FIFO (sequenceNumber)
    const prioOrder: Record<PriorityLevel, number> = { VIP: 0, DISABILITY: 1, PREGNANT: 2, ELDERLY: 3, NORMAL: 4 };
    eligibleTickets.sort((a, b) => {
      if (prioOrder[a.priority] !== prioOrder[b.priority]) {
        return prioOrder[a.priority] - prioOrder[b.priority];
      }
      return a.sequenceNumber - b.sequenceNumber;
    });

    nextTicket = eligibleTickets[0];
  }

  const now = new Date().toISOString();

  nextTicket.status = 'CALLED';
  nextTicket.calledAt = now;
  nextTicket.currentCounterId = counter.id;
  nextTicket.currentCounterCode = counter.code;
  nextTicket.currentStaffId = staffId;
  nextTicket.currentStaffName = staffName;

  counter.status = 'CALLING';
  counter.currentTicketId = nextTicket.id;
  counter.currentTicketNumber = nextTicket.ticketNumber;
  counter.currentStaffId = staffId;
  counter.currentStaffName = staffName;

  // Events & Audit
  db.ticketEvents.push({
    id: 'evt_' + Date.now(),
    ticketId: nextTicket.id,
    ticketNumber: nextTicket.ticketNumber,
    eventType: 'CALLED',
    timestamp: now,
    actorId: staffId,
    actorName: staffName,
    counterId: counter.id,
    counterCode: counter.code,
    note: `Mời số ${nextTicket.ticketNumber} đến ${counter.code}`,
  });

  db.auditLogs.push({
    id: 'log_' + Date.now(),
    branchId: counter.branchId,
    actorRole: 'STAFF',
    actorName: staffName,
    action: 'CALL_NEXT',
    targetType: 'TICKET',
    targetId: nextTicket.ticketNumber,
    timestamp: now,
    details: `Gọi số ${nextTicket.ticketNumber} vào ${counter.code}`,
  });

  saveDatabase();
  return nextTicket;
}

// Recall current ticket
export function recallTicket(
  ticketId: string,
  staffId: string,
  staffName: string
): Ticket {
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) throw new Error('Vé không tồn tại');

  const now = new Date().toISOString();
  ticket.calledAt = now;

  db.ticketEvents.push({
    id: 'evt_' + Date.now(),
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    eventType: 'RECALLED',
    timestamp: now,
    actorId: staffId,
    actorName: staffName,
    counterId: ticket.currentCounterId,
    counterCode: ticket.currentCounterCode,
    note: `Nhắc lại số ${ticket.ticketNumber} lần tiếp theo`,
  });

  saveDatabase();
  return ticket;
}

// Start serving
export function startServingTicket(
  ticketId: string,
  staffId: string,
  staffName: string
): Ticket {
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) throw new Error('Vé không tồn tại');

  const now = new Date().toISOString();
  ticket.status = 'SERVING';
  ticket.servingStartedAt = now;

  if (ticket.currentCounterId) {
    const counter = db.counters.find(c => c.id === ticket.currentCounterId);
    if (counter) {
      counter.status = 'SERVING';
    }
  }

  db.ticketEvents.push({
    id: 'evt_' + Date.now(),
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    eventType: 'SERVING',
    timestamp: now,
    actorId: staffId,
    actorName: staffName,
    counterId: ticket.currentCounterId,
    counterCode: ticket.currentCounterCode,
    note: 'Bắt đầu tiếp nhận và xử lý hồ sơ',
  });

  saveDatabase();
  return ticket;
}

// Complete ticket
export function completeTicket(
  ticketId: string,
  staffId: string,
  staffName: string
): Ticket {
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) throw new Error('Vé không tồn tại');

  const now = new Date().toISOString();
  ticket.status = 'COMPLETED';
  ticket.completedAt = now;

  if (ticket.currentCounterId) {
    const counter = db.counters.find(c => c.id === ticket.currentCounterId);
    if (counter && counter.currentTicketId === ticket.id) {
      counter.status = 'IDLE';
      counter.currentTicketId = undefined;
      counter.currentTicketNumber = undefined;
    }
  }

  db.ticketEvents.push({
    id: 'evt_' + Date.now(),
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    eventType: 'COMPLETED',
    timestamp: now,
    actorId: staffId,
    actorName: staffName,
    counterId: ticket.currentCounterId,
    counterCode: ticket.currentCounterCode,
    note: 'Xử lý hồ sơ thành công - Hoàn tất phục vụ',
  });

  saveDatabase();
  return ticket;
}

// Mark No-Show / Absent
export function markTicketNoShow(
  ticketId: string,
  staffId: string,
  staffName: string
): Ticket {
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) throw new Error('Vé không tồn tại');

  const now = new Date().toISOString();
  ticket.status = 'NO_SHOW';

  if (ticket.currentCounterId) {
    const counter = db.counters.find(c => c.id === ticket.currentCounterId);
    if (counter && counter.currentTicketId === ticket.id) {
      counter.status = 'IDLE';
      counter.currentTicketId = undefined;
      counter.currentTicketNumber = undefined;
    }
  }

  db.ticketEvents.push({
    id: 'evt_' + Date.now(),
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    eventType: 'NO_SHOW',
    timestamp: now,
    actorId: staffId,
    actorName: staffName,
    counterId: ticket.currentCounterId,
    counterCode: ticket.currentCounterCode,
    note: 'Người dân không có mặt sau nhiều lần gọi',
  });

  saveDatabase();
  return ticket;
}

// Transfer ticket (to another counter or service)
export function transferTicket(
  ticketId: string,
  targetCounterId: string | undefined,
  targetServiceId: string | undefined,
  staffId: string,
  staffName: string,
  reason: string
): Ticket {
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) throw new Error('Vé không tồn tại');

  const oldCounterId = ticket.currentCounterId;
  const oldCounterCode = ticket.currentCounterCode;

  // Clear old counter
  if (oldCounterId) {
    const oldCounter = db.counters.find(c => c.id === oldCounterId);
    if (oldCounter && oldCounter.currentTicketId === ticket.id) {
      oldCounter.status = 'IDLE';
      oldCounter.currentTicketId = undefined;
      oldCounter.currentTicketNumber = undefined;
    }
  }

  // Update target
  if (targetServiceId) {
    const srv = db.services.find(s => s.id === targetServiceId);
    if (srv) {
      ticket.serviceId = srv.id;
      ticket.serviceName = srv.name;
    }
  }

  let targetCounterCode: string | undefined;
  if (targetCounterId) {
    const cnt = db.counters.find(c => c.id === targetCounterId);
    if (cnt) {
      ticket.currentCounterId = cnt.id;
      ticket.currentCounterCode = cnt.code;
      targetCounterCode = cnt.code;
    }
  } else {
    ticket.currentCounterId = undefined;
    ticket.currentCounterCode = undefined;
  }

  ticket.status = 'WAITING'; // Placed back in waiting queue for that destination

  const now = new Date().toISOString();
  db.ticketEvents.push({
    id: 'evt_' + Date.now(),
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    eventType: 'TRANSFERRED',
    timestamp: now,
    actorId: staffId,
    actorName: staffName,
    counterId: targetCounterId,
    counterCode: targetCounterCode,
    note: `Chuyển từ ${oldCounterCode || 'Hàng đợi'} sang ${targetCounterCode || 'Hàng đợi dịch vụ mới'}: ${reason}`,
  });

  saveDatabase();
  return ticket;
}

// Submit Citizen Rating
export function submitCitizenRating(token: string, rating: number, feedbackComment?: string): Ticket {
  const ticket = db.tickets.find(t => t.token === token);
  if (!ticket) throw new Error('Vé không tồn tại');

  ticket.rating = rating;
  ticket.feedbackComment = feedbackComment;
  saveDatabase();
  return ticket;
}

// ----------------- AUDIT & REPORTS -----------------

export function getAuditLogs(branchId?: string, limit = 50): AuditLog[] {
  let logs = db.auditLogs;
  if (branchId) {
    logs = logs.filter(l => l.branchId === branchId);
  }
  return [...logs].reverse().slice(0, limit);
}

export function getQueueStatistics(branchId?: string): QueueStatistics {
  let tickets = db.tickets;
  if (branchId) {
    tickets = tickets.filter(t => t.branchId === branchId);
  }

  const waiting = tickets.filter(t => t.status === 'WAITING').length;
  const serving = tickets.filter(t => t.status === 'SERVING').length;
  const completed = tickets.filter(t => t.status === 'COMPLETED');
  const noShow = tickets.filter(t => t.status === 'NO_SHOW').length;
  const transferred = tickets.filter(t => t.status === 'TRANSFERRED').length;

  // Calc wait times
  let totalWaitMinutes = 0;
  let waitCount = 0;
  let totalServiceMinutes = 0;
  let serviceCount = 0;

  for (const t of completed) {
    if (t.calledAt && t.createdAt) {
      const wait = (new Date(t.calledAt).getTime() - new Date(t.createdAt).getTime()) / 60000;
      if (wait > 0 && wait < 300) {
        totalWaitMinutes += wait;
        waitCount++;
      }
    }
    if (t.completedAt && t.servingStartedAt) {
      const serv = (new Date(t.completedAt).getTime() - new Date(t.servingStartedAt).getTime()) / 60000;
      if (serv > 0 && serv < 180) {
        totalServiceMinutes += serv;
        serviceCount++;
      }
    }
  }

  const avgWaitMinutes = waitCount > 0 ? Math.round(totalWaitMinutes / waitCount) : 12;
  const avgServiceMinutes = serviceCount > 0 ? Math.round(totalServiceMinutes / serviceCount) : 10;

  // Hourly distribution
  const hourlyMap: Record<string, number> = {
    '08:00': 12,
    '09:00': 28,
    '10:00': 35,
    '11:00': 18,
    '13:30': 22,
    '14:30': 30,
    '15:30': 16,
    '16:30': 8,
  };

  for (const t of tickets) {
    const h = new Date(t.createdAt).getHours();
    const key = `${h.toString().padStart(2, '0')}:00`;
    hourlyMap[key] = (hourlyMap[key] || 0) + 1;
  }

  const hourlyDistribution = Object.entries(hourlyMap).map(([hour, count]) => ({ hour, count }));

  // Service distribution
  const serviceCountMap: Record<string, number> = {};
  for (const t of tickets) {
    serviceCountMap[t.serviceName] = (serviceCountMap[t.serviceName] || 0) + 1;
  }
  const serviceDistribution = Object.entries(serviceCountMap).map(([serviceName, count]) => ({ serviceName, count }));

  // Counter performance
  const counterMap: Record<string, { served: number; totalMinutes: number }> = {};
  for (const c of db.counters) {
    counterMap[c.code] = { served: 0, totalMinutes: 0 };
  }
  for (const t of completed) {
    if (t.currentCounterCode && counterMap[t.currentCounterCode]) {
      counterMap[t.currentCounterCode].served++;
      if (t.completedAt && t.servingStartedAt) {
        counterMap[t.currentCounterCode].totalMinutes += (new Date(t.completedAt).getTime() - new Date(t.servingStartedAt).getTime()) / 60000;
      }
    }
  }
  const counterPerformance = Object.entries(counterMap).map(([counterCode, data]) => ({
    counterCode,
    servedCount: data.served,
    avgServiceMinutes: data.served > 0 ? Math.round(data.totalMinutes / data.served) : 10,
  }));

  const onlineCount = tickets.filter(t => t.sourceChannel === 'ONLINE_PHONE').length;
  const kioskCount = tickets.filter(t => t.sourceChannel === 'KIOSK').length;

  return {
    totalToday: tickets.length,
    waitingCount: waiting,
    servingCount: serving,
    completedCount: completed.length,
    noShowCount: noShow,
    transferredCount: transferred,
    avgWaitMinutes,
    avgServiceMinutes,
    hourlyDistribution,
    serviceDistribution,
    counterPerformance,
    channelSplit: { onlineCount, kioskCount },
  };
}
