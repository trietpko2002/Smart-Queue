export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'COORDINATOR' 
  | 'STAFF' 
  | 'DISPLAY' 
  | 'KIOSK' 
  | 'CITIZEN';

export type TicketStatus = 
  | 'WAITING' 
  | 'CALLED' 
  | 'SERVING' 
  | 'COMPLETED' 
  | 'NO_SHOW' 
  | 'TRANSFERRED' 
  | 'CANCELLED';

export type PriorityLevel = 
  | 'NORMAL' 
  | 'ELDERLY' 
  | 'PREGNANT' 
  | 'DISABILITY' 
  | 'VIP';

export type SourceChannel = 'ONLINE_PHONE' | 'KIOSK';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox';

export type ServiceSector = 'GOVERNMENT' | 'ENTERPRISE' | 'OTHER';

export interface ServiceField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  validation?: string; // regex or rule note
  placeholder?: string;
  options?: string[]; // For select type
  order: number;
  visibility: boolean;
  antiDuplicateKey?: boolean; // If true, used to compute anti-duplicate hash
}

export interface Service {
  id: string;
  branchId: string;
  name: string;
  code: string;
  prefix: string;
  description: string;
  sector?: ServiceSector; // 'GOVERNMENT' (Nhà nước) | 'ENTERPRISE' (Doanh nghiệp) | 'OTHER'
  category?: string; // Nhóm / Lĩnh vực chi tiết
  dailyMax: number;
  startNumber: number;
  digitCount: number; // e.g. 3 => 001
  avgServiceTimeMinutes: number;
  isOnlineEnabled: boolean;
  isKioskEnabled: boolean;
  isPriorityEnabled: boolean;
  isPreBookingEnabled: boolean;
  fields: ServiceField[];
  active: boolean;
}

export interface Branch {
  id: string;
  orgId: string;
  name: string;
  address: string;
  phone: string;
  code: string;
  active: boolean;
}

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  slogan?: string;
  hotline?: string;
  publicBaseUrl?: string; // Tên miền hoặc URL public cố định để dân quét QR (vd: https://xephang.domain.vn)
}

export interface Counter {
  id: string;
  branchId: string;
  code: string; // e.g. "Quầy 01"
  name: string;
  serviceIds: string[]; // List of services this counter can handle
  currentStaffId?: string;
  currentStaffName?: string;
  status: 'IDLE' | 'CALLING' | 'SERVING' | 'CLOSED';
  currentTicketId?: string;
  currentTicketNumber?: string;
}

export interface Ticket {
  id: string;
  token: string; // Random secret token for public URL: /ticket/[token]
  branchId: string;
  serviceId: string;
  serviceName: string;
  servicePrefix: string;
  ticketNumber: string; // e.g. CA-025
  sequenceNumber: number;
  sourceChannel: SourceChannel;
  priority: PriorityLevel;
  priorityReason?: string;
  status: TicketStatus;
  customerData: Record<string, any>;
  antiDuplicateHash: string;
  currentCounterId?: string;
  currentCounterCode?: string;
  currentStaffId?: string;
  currentStaffName?: string;
  estimatedWaitMinutes?: number;
  createdAt: string;
  calledAt?: string;
  servingStartedAt?: string;
  completedAt?: string;
  rating?: number; // 1-5
  feedbackComment?: string;
}

export interface TicketEvent {
  id: string;
  ticketId: string;
  ticketNumber: string;
  eventType: 'CREATED' | 'CALLED' | 'RECALLED' | 'SERVING' | 'COMPLETED' | 'NO_SHOW' | 'TRANSFERRED' | 'CANCELLED';
  timestamp: string;
  actorId?: string;
  actorName?: string;
  counterId?: string;
  counterCode?: string;
  note?: string;
}

export interface KioskDevice {
  id: string;
  branchId: string;
  name: string;
  location: string;
  allowedServiceIds: string[];
  autoResetSeconds: number;
  printerStatus: 'OK' | 'LOW_PAPER' | 'OUT_OF_PAPER' | 'ERROR';
  status: 'ONLINE' | 'OFFLINE';
  lastPing: string;
}

export interface DisplayScreen {
  id: string;
  branchId: string;
  name: string;
  location: string;
  voiceConfig: {
    enabled: boolean;
    voiceName: string;
    speed: number;
    repeatCount: number;
    customTemplate: string;
  };
  status: 'ONLINE' | 'OFFLINE';
  lastPing: string;
}

export interface AuditLog {
  id: string;
  branchId: string;
  actorRole: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  details: string;
}

export interface QueueStatistics {
  totalToday: number;
  waitingCount: number;
  servingCount: number;
  completedCount: number;
  noShowCount: number;
  transferredCount: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
  hourlyDistribution: { hour: string; count: number }[];
  serviceDistribution: { serviceName: string; count: number }[];
  counterPerformance: { counterCode: string; servedCount: number; avgServiceMinutes: number }[];
  channelSplit: { onlineCount: number; kioskCount: number };
}

export interface AIPrediction {
  predictedTodayTraffic: number;
  peakHoursForecast: { hour: string; estimatedCrowd: string; trafficLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'PEAK' }[];
  counterRecommendations: { counterCode: string; recommendation: string; expectedWaitImpact: string }[];
  anomalies: { severity: 'WARN' | 'CRITICAL' | 'INFO'; message: string; suggestion: string }[];
  generatedAt: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  counterId?: string;
  branchId: string;
  phone?: string;
  email?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  lastLogin?: string;
}

export interface StateBannerItem {
  id: string;
  badge: string;
  badgeColor?: string;
  title: string;
  highlightText?: string;
  description: string;
  source?: string;
  qrType?: 'DICHVUCONG' | 'VNEID' | 'HOTLINE';
  qrLabel: string;
  qrUrl: string;
  themeGradient?: string;
  iconType?: 'flag' | 'shield' | 'award' | 'qr' | 'landmark';
  tags?: string[];
  active?: boolean;
  order?: number;
  subtitle?: string;
  categoryBadge?: string;
  highlightTag?: string;
}

export interface PropagandaConfig {
  orgName?: string;
  organizationName?: string;
  subTitle?: string;
  bannerSubtitle?: string;
  appTitle?: string;
  hotline?: string;
  address?: string;
  workingHours?: string;
  nationalPortalUrl?: string;
  slogans: string[];
  banners: StateBannerItem[];
}

