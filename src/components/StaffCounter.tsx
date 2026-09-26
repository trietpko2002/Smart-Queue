import React, { useState, useEffect, useRef } from 'react';
import { Counter, Ticket, Service, UserAccount, PriorityLevel } from '../types/queue.js';
import {
  UserCheck,
  Volume2,
  Play,
  CheckCircle,
  UserX,
  ArrowRightLeft,
  Clock,
  AlertCircle,
  Phone,
  FileText,
  Users,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  ExternalLink,
  Layers,
  Check,
  Mic,
  MicOff,
  Keyboard,
  HelpCircle,
  X,
  Radio,
  VolumeX,
  Flame,
  CheckCheck
} from 'lucide-react';
import { announceTicket, playChime } from '../utils/audio.js';

interface StaffCounterProps {
  counters: Counter[];
  services: Service[];
  users: UserAccount[];
  tickets: Ticket[];
  onRefresh: () => void;
  currentUser?: UserAccount | null;
  onUserChange?: (user: UserAccount) => void;
  onOpenGuide?: () => void;
}

export const StaffCounter: React.FC<StaffCounterProps> = ({
  counters,
  services,
  users,
  tickets,
  onRefresh,
  currentUser,
  onUserChange,
  onOpenGuide,
}) => {
  // Initialize staff & counter with tab-session isolation
  const [selectedStaff, setSelectedStaff] = useState<UserAccount>(() => {
    // 1. Check URL query param ?staff=...
    const urlParams = new URLSearchParams(window.location.search);
    const staffParam = urlParams.get('staff');
    if (staffParam) {
      const foundByParam = users.find(u => u.id === staffParam || u.username === staffParam);
      if (foundByParam) return foundByParam;
    }
    // 2. Check current logged in user
    if (currentUser) return currentUser;
    // 3. Check sessionStorage for this tab
    const sessionStaffId = sessionStorage.getItem('sq_active_staff_id');
    if (sessionStaffId) {
      const found = users.find(u => u.id === sessionStaffId);
      if (found) return found;
    }
    return users.find(u => u.role === 'STAFF') || users[0];
  });

  const [selectedCounterId, setSelectedCounterId] = useState<string>(() => {
    // 1. Check URL query param ?counter=...
    const urlParams = new URLSearchParams(window.location.search);
    const counterParam = urlParams.get('counter');
    if (counterParam) {
      const foundCounter = counters.find(c => c.id === counterParam || c.code.toLowerCase() === counterParam.toLowerCase());
      if (foundCounter) return foundCounter.id;
    }
    // 2. Check sessionStorage for this tab
    const sessionCounter = sessionStorage.getItem('sq_active_counter');
    if (sessionCounter && counters.some(c => c.id === sessionCounter)) {
      return sessionCounter;
    }
    // 3. Fallback to staff's assigned counter or first counter
    return selectedStaff?.counterId || counters[0]?.id || '';
  });

  // Unique Tab Session ID for this browser tab
  const [tabSessionId] = useState(() => {
    let id = sessionStorage.getItem('sq_tab_session_id');
    if (!id) {
      id = 'tab_' + Math.random().toString(36).substring(2, 7);
      sessionStorage.setItem('sq_tab_session_id', id);
    }
    return id;
  });

  // Persist tab-specific counter & staff selection in sessionStorage
  const handleSelectStaff = (u: UserAccount) => {
    setSelectedStaff(u);
    sessionStorage.setItem('sq_active_staff_id', u.id);
    if (u.counterId && counters.some(c => c.id === u.counterId)) {
      setSelectedCounterId(u.counterId);
      sessionStorage.setItem('sq_active_counter', u.counterId);
    }
    if (onUserChange) onUserChange(u);
  };

  const handleSelectCounter = (counterId: string) => {
    setSelectedCounterId(counterId);
    sessionStorage.setItem('sq_active_counter', counterId);
  };

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [targetCounterId, setTargetCounterId] = useState('');
  const [targetServiceId, setTargetServiceId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentCounter = counters.find(c => c.id === selectedCounterId);

  // Current active ticket assigned to this counter
  const activeTicket = tickets.find(
    t => t.id === currentCounter?.currentTicketId || (t.currentCounterId === currentCounter?.id && ['CALLED', 'SERVING'].includes(t.status))
  );

  // Waiting tickets eligible for this counter
  const waitingTickets = tickets
    .filter(t => t.status === 'WAITING' && currentCounter?.serviceIds.includes(t.serviceId))
    .sort((a, b) => {
      const prioOrder: Record<PriorityLevel, number> = { VIP: 0, DISABILITY: 1, PREGNANT: 2, ELDERLY: 3, NORMAL: 4 };
      if (prioOrder[a.priority] !== prioOrder[b.priority]) {
        return prioOrder[a.priority] - prioOrder[b.priority];
      }
      return a.sequenceNumber - b.sequenceNumber;
    });

  // Web Speech API Voice Recognition & Keyboard Shortcuts State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [handsFreeMode, setHandsFreeMode] = useState(true);
  const [lastTranscript, setLastTranscript] = useState('');
  const [voiceActionFeedback, setVoiceActionFeedback] = useState<string | null>(null);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const handsFreeModeRef = useRef(true);
  const activeTicketRef = useRef(activeTicket);
  const waitingTicketsRef = useRef(waitingTickets);
  const currentCounterRef = useRef(currentCounter);
  const selectedStaffRef = useRef(selectedStaff);
  const actionLoadingRef = useRef(actionLoading);

  // Keep refs in sync with state for callbacks
  useEffect(() => {
    isListeningRef.current = isListening;
    handsFreeModeRef.current = handsFreeMode;
    activeTicketRef.current = activeTicket;
    waitingTicketsRef.current = waitingTickets;
    currentCounterRef.current = currentCounter;
    selectedStaffRef.current = selectedStaff;
    actionLoadingRef.current = actionLoading;
  });

  // Auto clear voice & shortcut feedback badge
  useEffect(() => {
    if (!voiceActionFeedback) return;
    const t = setTimeout(() => setVoiceActionFeedback(null), 3800);
    return () => clearTimeout(t);
  }, [voiceActionFeedback]);

  // Call Next Ticket (supports optional specific ticket ID)
  const handleCallNext = async (specificTicketId?: string) => {
    const counter = currentCounterRef.current;
    const staff = selectedStaffRef.current;
    if (!counter) return;

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/staff/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counterId: counter.id,
          staffId: staff.id,
          staffName: staff.name,
          ticketId: specificTicketId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Không có số phù hợp');

      // Play audio announcement
      announceTicket(data.ticket.ticketNumber, counter.code);
      setVoiceActionFeedback(`Đã gọi số ${data.ticket.ticketNumber} vào quầy ${counter.code}`);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
      setVoiceActionFeedback(`⚠️ ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Recall current ticket
  const handleRecall = async () => {
    const ticket = activeTicketRef.current;
    const counter = currentCounterRef.current;
    const staff = selectedStaffRef.current;
    if (!ticket || !counter) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/staff/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          staffId: staff.id,
          staffName: staff.name,
        }),
      });
      if (res.ok) {
        announceTicket(ticket.ticketNumber, counter.code);
        setVoiceActionFeedback(`Đã nhắc lại số ${ticket.ticketNumber}`);
        onRefresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setVoiceActionFeedback(`⚠️ ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Start Serving
  const handleStartServing = async () => {
    const ticket = activeTicketRef.current;
    const staff = selectedStaffRef.current;
    if (!ticket) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/staff/start-serving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          staffId: staff.id,
          staffName: staff.name,
        }),
      });
      if (res.ok) {
        setVoiceActionFeedback(`Đang phục vụ số ${ticket.ticketNumber}`);
        onRefresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setVoiceActionFeedback(`⚠️ ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Complete
  const handleComplete = async () => {
    const ticket = activeTicketRef.current;
    const staff = selectedStaffRef.current;
    if (!ticket) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/staff/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          staffId: staff.id,
          staffName: staff.name,
        }),
      });
      if (res.ok) {
        playChime();
        setVoiceActionFeedback(`Đã hoàn tất vé ${ticket.ticketNumber}`);
        onRefresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setVoiceActionFeedback(`⚠️ ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // No Show
  const handleNoShow = async () => {
    const ticket = activeTicketRef.current;
    const staff = selectedStaffRef.current;
    if (!ticket) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/staff/no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          staffId: staff.id,
          staffName: staff.name,
        }),
      });
      if (res.ok) {
        setVoiceActionFeedback(`Đã ghi nhận vắng mặt số ${ticket.ticketNumber}`);
        onRefresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setVoiceActionFeedback(`⚠️ ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Transfer
  const handleTransfer = async () => {
    const ticket = activeTicketRef.current;
    const staff = selectedStaffRef.current;
    if (!ticket) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/staff/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          targetCounterId: targetCounterId || undefined,
          targetServiceId: targetServiceId || undefined,
          staffId: staff.id,
          staffName: staff.name,
          reason: transferReason || 'Chuyển xử lý theo thẩm quyền',
        }),
      });
      if (res.ok) {
        setTransferModalOpen(false);
        setTransferReason('');
        setVoiceActionFeedback(`Đã chuyển số ${ticket.ticketNumber}`);
        onRefresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setVoiceActionFeedback(`⚠️ ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Voice Command Processor
  const processVoiceCommand = (rawText: string) => {
    const text = rawText.toLowerCase().trim().replace(/[,.?!]/g, '');
    setLastTranscript(rawText);

    // 1. Specific ticket calling: "gọi số [mã số]" hoặc "mời số [mã số]"
    if (text.startsWith('gọi số ') || text.startsWith('mời số ') || text.startsWith('gọi vé ') || text.startsWith('số ')) {
      const targetNumberStr = text.replace(/^(gọi số|mời số|gọi vé|số)\s+/, '').trim();
      const waiting = waitingTicketsRef.current;

      const foundTicket = waiting.find(t => {
        const ticketLower = t.ticketNumber.toLowerCase();
        const cleanTarget = targetNumberStr.replace(/\s+/g, '');
        const cleanTicket = ticketLower.replace(/\s+/g, '');
        return (
          cleanTicket === cleanTarget ||
          cleanTicket.endsWith(cleanTarget) ||
          cleanTicket.replace(/[^0-9]/g, '') === cleanTarget.replace(/[^0-9]/g, '')
        );
      });

      if (foundTicket) {
        playChime();
        setVoiceActionFeedback(`🎤 [Khẩu lệnh]: GỌI SỐ ${foundTicket.ticketNumber}`);
        handleCallNext(foundTicket.id);
        return;
      }
    }

    // 2. Call Next Ticket: "gọi số", "gọi tiếp", "tiếp theo", "mời số tiếp", "mời người tiếp theo", "next"
    if (
      text.includes('gọi tiếp') ||
      text.includes('tiếp theo') ||
      text.includes('người tiếp') ||
      text.includes('số tiếp') ||
      text === 'gọi số' ||
      text === 'gọi' ||
      text === 'tiếp' ||
      text === 'tiếp tục' ||
      text === 'mời tiếp' ||
      text === 'bốc số tiếp' ||
      text === 'next'
    ) {
      playChime();
      setVoiceActionFeedback('🎤 [Khẩu lệnh]: GỌI SỐ TIẾP THEO');
      handleCallNext();
      return;
    }

    // 3. Recall: "gọi lại", "nhắc lại", "mời lại", "đọc lại", "recall"
    if (
      text.includes('gọi lại') ||
      text.includes('nhắc lại') ||
      text.includes('đọc lại') ||
      text.includes('mời lại') ||
      text.includes('lặp lại') ||
      text === 'recall'
    ) {
      if (activeTicketRef.current) {
        playChime();
        setVoiceActionFeedback(`🎤 [Khẩu lệnh]: GỌI LẠI SỐ ${activeTicketRef.current.ticketNumber}`);
        handleRecall();
      } else {
        setVoiceActionFeedback('⚠️ Quầy hiện chưa có vé nào để gọi lại');
      }
      return;
    }

    // 4. Start Serving: "bắt đầu", "tiếp nhận", "bắt đầu phục vụ", "phục vụ", "vào quầy"
    if (
      text.includes('bắt đầu') ||
      text.includes('tiếp nhận') ||
      text.includes('phục vụ') ||
      text.includes('vào quầy') ||
      text === 'start'
    ) {
      if (activeTicketRef.current && activeTicketRef.current.status === 'CALLED') {
        playChime();
        setVoiceActionFeedback(`🎤 [Khẩu lệnh]: BẮT ĐẦU PHỤC VỤ SỐ ${activeTicketRef.current.ticketNumber}`);
        handleStartServing();
      } else {
        setVoiceActionFeedback('⚠️ Vé đang trong quá trình phục vụ');
      }
      return;
    }

    // 5. Complete: "hoàn tất", "hoàn thành", "xong", "xong rồi", "xong việc", "kết thúc"
    if (
      text.includes('hoàn tất') ||
      text.includes('hoàn thành') ||
      text.includes('xong') ||
      text.includes('kết thúc') ||
      text.includes('xong rồi') ||
      text === 'done' ||
      text === 'complete'
    ) {
      if (activeTicketRef.current) {
        setVoiceActionFeedback(`🎤 [Khẩu lệnh]: HOÀN TẤT VÉ ${activeTicketRef.current.ticketNumber}`);
        handleComplete();
      } else {
        setVoiceActionFeedback('⚠️ Chưa có vé đang phục vụ để hoàn tất');
      }
      return;
    }

    // 6. No-show: "vắng mặt", "không đến", "không có mặt", "bỏ qua", "bỏ lượt"
    if (
      text.includes('vắng mặt') ||
      text.includes('không đến') ||
      text.includes('không có mặt') ||
      text.includes('bỏ qua') ||
      text.includes('bỏ lượt') ||
      text === 'vắng' ||
      text === 'no show'
    ) {
      if (activeTicketRef.current) {
        setVoiceActionFeedback(`🎤 [Khẩu lệnh]: BÁO VẮNG MẶT SỐ ${activeTicketRef.current.ticketNumber}`);
        handleNoShow();
      } else {
        setVoiceActionFeedback('⚠️ Không có vé đang gọi để báo vắng mặt');
      }
      return;
    }

    // 7. Transfer: "chuyển quầy", "chuyển tiếp", "chuyển tuyến"
    if (
      text.includes('chuyển quầy') ||
      text.includes('chuyển tiếp') ||
      text.includes('chuyển tuyến') ||
      text.includes('chuyển dịch vụ') ||
      text === 'transfer'
    ) {
      if (activeTicketRef.current) {
        setVoiceActionFeedback('🎤 [Khẩu lệnh]: MỞ CHUYỂN QUẦY');
        setTransferModalOpen(true);
      } else {
        setVoiceActionFeedback('⚠️ Cần có vé đang gọi/phục vụ để chuyển tiếp');
      }
      return;
    }

    // 8. Shortcuts: "phím tắt", "sổ tay", "hướng dẫn", "trợ giúp"
    if (text.includes('phím tắt') || text.includes('sổ tay') || text.includes('trợ giúp') || text.includes('hướng dẫn')) {
      setShortcutsModalOpen(true);
      setVoiceActionFeedback('🎤 [Khẩu lệnh]: MỞ SỔ TAY PHÍM TẮT');
      return;
    }

    setVoiceActionFeedback(`🎙️ Đã nghe: "${rawText}" (chưa rõ khẩu lệnh)`);
  };

  // Toggle Voice Recognition
  const toggleVoiceListening = () => {
    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechClass) {
      alert('Trình duyệt của bạn hiện chưa hỗ trợ Web Speech API. Bạn có thể sử dụng trọn bộ Phím tắt sổ [Space, R, S, Enter, Del, T] để thao tác nhanh không cần chuột!');
      return;
    }

    if (isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setVoiceActionFeedback('🔇 Đã tắt nhận diện giọng nói');
    } else {
      if (!recognitionRef.current) {
        initSpeechRecognition();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          isListeningRef.current = true;
          setVoiceActionFeedback('🎤 Micro đang lắng nghe... Bạn có thể nói: "Gọi số", "Nhắc lại", "Xong", "Vắng mặt"');
        } catch (err: any) {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              recognitionRef.current.start();
              setIsListening(true);
              isListeningRef.current = true;
            }, 150);
          } catch {
            setVoiceActionFeedback('⚠️ Không thể kích hoạt micro');
          }
        }
      }
    }
  };

  // Initialize Speech Recognition
  const initSpeechRecognition = () => {
    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechClass) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechClass();
      recognition.lang = 'vi-VN';
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0]?.transcript;
        if (transcript) {
          processVoiceCommand(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Web Speech API Error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
          isListeningRef.current = false;
          setVoiceActionFeedback('⚠️ Chưa được cấp quyền truy cập Micro.');
        }
      };

      recognition.onend = () => {
        if (handsFreeModeRef.current && isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Lỗi cấu hình Web Speech API:', err);
      setSpeechSupported(false);
    }
  };

  useEffect(() => {
    initSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Global Keyboard Shortcuts (Phím tắt sổ)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Esc: Close open modals
      if (e.key === 'Escape') {
        if (transferModalOpen || shortcutsModalOpen) {
          e.preventDefault();
          setTransferModalOpen(false);
          setShortcutsModalOpen(false);
        }
        return;
      }

      // 2. Ignore if focus is inside an input, textarea, or select
      const activeEl = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeEl === 'input' || activeEl === 'textarea' || activeEl === 'select';
      if (isInput) return;

      // 3. '?' or 'F1': Open Shortcuts Cheat Sheet
      if (e.key === '?' || e.key === 'F1') {
        e.preventDefault();
        setShortcutsModalOpen(prev => !prev);
        return;
      }

      // 4. 'V' or 'M': Toggle Voice recognition
      if (e.key === 'v' || e.key === 'V' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleVoiceListening();
        return;
      }

      // 5. 'Space' or 'F2' or 'N': Call Next Ticket
      if (e.code === 'Space' || e.key === 'F2' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (!actionLoadingRef.current && waitingTicketsRef.current.length > 0) {
          setVoiceActionFeedback('⌨️ Phím tắt: GỌI SỐ TIẾP THEO [Space / F2]');
          handleCallNext();
        } else if (waitingTicketsRef.current.length === 0) {
          setVoiceActionFeedback('⚠️ Không còn số thứ tự nào đang chờ');
        }
        return;
      }

      // 6. 'R' or 'F3': Recall current ticket
      if (e.key === 'r' || e.key === 'R' || e.key === 'F3') {
        e.preventDefault();
        if (activeTicketRef.current && !actionLoadingRef.current) {
          setVoiceActionFeedback(`⌨️ Phím tắt: GỌI LẠI SỐ ${activeTicketRef.current.ticketNumber} [R / F3]`);
          handleRecall();
        }
        return;
      }

      // 7. 'S' or 'F4': Start Serving
      if (e.key === 's' || e.key === 'S' || e.key === 'F4') {
        e.preventDefault();
        if (activeTicketRef.current && activeTicketRef.current.status === 'CALLED' && !actionLoadingRef.current) {
          setVoiceActionFeedback(`⌨️ Phím tắt: BẮT ĐẦU PHỤC VỤ [S / F4]`);
          handleStartServing();
        }
        return;
      }

      // 8. 'Enter' or 'F8' or 'C': Complete Ticket (or start serving if CALLED)
      if (e.key === 'Enter' || e.key === 'F8' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (activeTicketRef.current && !actionLoadingRef.current) {
          if (activeTicketRef.current.status === 'CALLED') {
            setVoiceActionFeedback(`⌨️ Phím tắt: BẮT ĐẦU PHỤC VỤ [Enter / F8]`);
            handleStartServing();
          } else {
            setVoiceActionFeedback(`⌨️ Phím tắt: HOÀN TẤT VÉ [Enter / F8]`);
            handleComplete();
          }
        }
        return;
      }

      // 9. 'Delete' or 'F9' or 'X': Mark No-Show
      if (e.key === 'Delete' || e.key === 'F9' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        if (activeTicketRef.current && !actionLoadingRef.current) {
          setVoiceActionFeedback(`⌨️ Phím tắt: BÁO VẮNG MẶT [Delete / F9]`);
          handleNoShow();
        }
        return;
      }

      // 10. 'T' or 'F6': Transfer modal
      if (e.key === 't' || e.key === 'T' || e.key === 'F6') {
        e.preventDefault();
        if (activeTicketRef.current && !actionLoadingRef.current) {
          setVoiceActionFeedback('⌨️ Phím tắt: MỞ CHUYỂN QUẦY [T / F6]');
          setTransferModalOpen(true);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transferModalOpen, shortcutsModalOpen, isListening]);

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6 font-sans">
      {/* Multi-Session Indicator & Independent Tab Controls */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Phiên làm việc Tab độc lập #{tabSessionId}
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                Online Đa Session
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Tab này đang vận hành riêng cho: <strong className="text-white font-mono">{currentCounter?.code || 'Chưa gán'}</strong> – Cán bộ: <strong className="text-white">{selectedStaff.name}</strong>
            </p>
          </div>
        </div>

        {/* Action to open another counter session in separate tab */}
        <button
          onClick={() => {
            const nextCounter = counters.find(c => c.id !== selectedCounterId);
            const targetUrl = nextCounter
              ? `${window.location.origin}/staff?counter=${nextCounter.id}`
              : `${window.location.origin}/staff`;
            window.open(targetUrl, '_blank');
          }}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          title="Mở thêm một tab mới để vận hành quầy khác đồng thời"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Mở Thêm Tab Quầy Khác</span>
        </button>
      </div>

      {/* Top Staff & Counter Selector Bar with Voice & Shortcut Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Cán bộ trực tiếp nhận (Tab này)
            </label>
            <select
              value={selectedStaff.id}
              onChange={e => {
                const found = users.find(u => u.id === e.target.value);
                if (found) handleSelectStaff(found);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role}) - @{u.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Bàn quầy phân công (Tab này)
            </label>
            <select
              value={selectedCounterId}
              onChange={e => handleSelectCounter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
            >
              {counters.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} – {c.name} ({c.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side: Counter status + Voice Recognition + Shortcuts button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {currentCounter && (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                currentCounter.status === 'SERVING'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : currentCounter.status === 'CALLING'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse'
                  : currentCounter.status === 'IDLE'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {currentCounter.status === 'SERVING'
                ? 'Đang tiếp nhận'
                : currentCounter.status === 'CALLING'
                ? 'Đang gọi số'
                : currentCounter.status === 'IDLE'
                ? 'Đang chờ người'
                : 'Đang đóng'}
            </span>
          )}

          {/* Voice Command Button (Web Speech API) */}
          <button
            onClick={toggleVoiceListening}
            title={isListening ? 'Bấm để tắt nhận diện giọng nói (Phím tắt: V)' : 'Bấm để bật nhận diện giọng nói tiếng Việt (Phím tắt: V)'}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-200 animate-pulse'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            }`}
          >
            {isListening ? (
              <>
                <Mic className="w-3.5 h-3.5 animate-bounce" />
                <span>Đang nghe lệnh...</span>
                <span className="px-1.5 py-0.2 rounded bg-white/20 text-[10px] font-mono">V</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Giọng nói</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-200/60 text-indigo-800 text-[10px] font-mono">V</span>
              </>
            )}
          </button>

          {/* Hands-Free Toggle */}
          {speechSupported && (
            <label
              className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 cursor-pointer select-none"
              title="Tự động duy trì micro liên tục không cần bấm lại"
            >
              <input
                type="checkbox"
                checked={handsFreeMode}
                onChange={e => setHandsFreeMode(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>Rảnh tay</span>
            </label>
          )}

          {/* Keyboard Shortcuts Cheat Sheet Button */}
          <button
            onClick={() => setShortcutsModalOpen(true)}
            title="Mở sổ tay phím tắt nghiệp vụ quầy (Phím tắt: ? hoặc F1)"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            <span>Phím Tắt Sổ</span>
            <kbd className="px-1.5 py-0.2 rounded bg-slate-700 text-amber-300 text-[10px] font-mono font-bold">?</kbd>
          </button>

          {/* Hướng Dẫn Nghiệp Vụ Button */}
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              title="Xem cẩm nang hướng dẫn sử dụng bàn quầy cán bộ"
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hướng dẫn</span>
            </button>
          )}
        </div>
      </div>

      {/* Voice & Keyboard Real-time Feedback HUD */}
      {(voiceActionFeedback || isListening) && (
        <div
          className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-all shadow-xs ${
            voiceActionFeedback?.startsWith('⚠️')
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : isListening
              ? 'bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white border-indigo-700 shadow-sm'
              : 'bg-indigo-50 border-indigo-200 text-indigo-950'
          }`}
        >
          <div className="flex items-center gap-3">
            {isListening ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Micro trực tuyến</span>
              </div>
            ) : (
              <Radio className="w-4 h-4 text-indigo-600" />
            )}

            <span className="font-semibold">
              {voiceActionFeedback || (lastTranscript ? `Đã nghe: "${lastTranscript}"` : 'Đang lắng nghe: nói "Gọi số", "Nhắc lại", "Xong", "Vắng mặt"...')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400 font-mono hidden sm:inline">Khẩu lệnh chuẩn:</span>
            <div className="flex gap-1">
              <span className="px-1.5 py-0.5 bg-white/10 rounded font-medium text-[10px]">"Gọi số"</span>
              <span className="px-1.5 py-0.5 bg-white/10 rounded font-medium text-[10px]">"Nhắc lại"</span>
              <span className="px-1.5 py-0.5 bg-white/10 rounded font-medium text-[10px]">"Xong"</span>
              <span className="px-1.5 py-0.5 bg-white/10 rounded font-medium text-[10px]">"Vắng mặt"</span>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Serving Ticket & Control Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Bảng Điều Khiển Cán Bộ
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] bg-emerald-100 text-emerald-700 font-bold font-mono">
                {currentCounter?.code} - ONLINE
              </span>
            </div>

            {activeTicket ? (
              <div className="space-y-4">
                {/* Bento Active Ticket Card */}
                <div className="p-5 bg-indigo-50/80 border border-indigo-100 rounded-2xl">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider">
                      Đang phục vụ • {activeTicket.serviceName}
                    </span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        activeTicket.status === 'CALLED'
                          ? 'bg-amber-400 text-slate-950 animate-pulse'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {activeTicket.status === 'CALLED' ? 'ĐANG GỌI SỐ' : 'ĐANG PHỤC VỤ'}
                    </span>
                  </div>

                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <h2 className="text-4xl sm:text-5xl font-black font-mono text-indigo-900 tracking-tight">
                        {activeTicket.ticketNumber}
                      </h2>
                      <p className="text-xs text-indigo-600 mt-1">
                        Kênh: {activeTicket.sourceChannel} • Lúc: {new Date(activeTicket.createdAt).toLocaleTimeString('vi-VN')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                        Trạng thái
                      </p>
                      {activeTicket.priority !== 'NORMAL' && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                          {activeTicket.priorityReason || 'Ưu tiên'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Citizen Form Details */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Thông tin kê khai của công dân
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                    {Object.entries(activeTicket.customerData || {}).map(([key, val]) => (
                      <div key={key} className="bg-white p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          {key}
                        </span>
                        <span className="font-medium text-slate-800 break-words">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons Bento Grid with Keyboard Shortcut KBD Badges */}
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleRecall}
                    disabled={actionLoading}
                    title="Gọi lại số hiện tại (Phím tắt: R hoặc F3 | Giọng nói: 'Gọi lại')"
                    className="py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                  >
                    <Volume2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>GỌI LẠI</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-bold">
                      R / F3
                    </kbd>
                  </button>

                  {activeTicket.status === 'CALLED' ? (
                    <button
                      onClick={handleStartServing}
                      disabled={actionLoading}
                      title="Bắt đầu phục vụ (Phím tắt: S hoặc F4 | Giọng nói: 'Bắt đầu')"
                      className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                    >
                      <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>BẮT ĐẦU</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-800/80 border border-indigo-400/40 text-indigo-100 text-[10px] font-mono font-bold">
                        S / F4
                      </kbd>
                    </button>
                  ) : (
                    <button
                      onClick={handleComplete}
                      disabled={actionLoading}
                      title="Hoàn tất hồ sơ/giao dịch (Phím tắt: Enter hoặc F8 | Giọng nói: 'Hoàn tất' / 'Xong')"
                      className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                    >
                      <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>HOÀN TẤT</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-emerald-800/80 border border-emerald-400/40 text-emerald-100 text-[10px] font-mono font-bold">
                        Enter / F8
                      </kbd>
                    </button>
                  )}

                  <button
                    onClick={handleNoShow}
                    disabled={actionLoading}
                    title="Báo công dân vắng mặt (Phím tắt: Delete hoặc F9 | Giọng nói: 'Vắng mặt')"
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserX className="w-4 h-4 text-slate-500" />
                    <span>VẮNG MẶT</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-mono font-bold">
                      Del / F9
                    </kbd>
                  </button>

                  <button
                    onClick={() => setTransferModalOpen(true)}
                    disabled={actionLoading}
                    title="Chuyển sang quầy khác hoặc chuyển dịch vụ (Phím tắt: T hoặc F6 | Giọng nói: 'Chuyển quầy')"
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-slate-500" />
                    <span>CHUYỂN TIẾP</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-mono font-bold">
                      T / F6
                    </kbd>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Quầy hiện đang trống</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bấm phím <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono font-bold text-slate-700">Space</kbd> hoặc nói <span className="font-semibold text-indigo-600">"Gọi số"</span> để gọi người tiếp theo
                </p>
              </div>
            )}

            {/* Big "CALL NEXT" Button with Voice & Shortcut Badges */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => handleCallNext()}
                disabled={actionLoading || waitingTickets.length === 0}
                title="Gọi lượt người dân tiếp theo (Phím tắt: Space hoặc F2 hoặc N | Giọng nói: 'Gọi số' hoặc 'Tiếp theo')"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>GỌI SỐ TIẾP THEO ({waitingTickets.length} người đang chờ)</span>
                <kbd className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-300/40 text-indigo-100 text-xs font-mono font-bold ml-1">
                  Space / F2
                </kbd>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span className="flex items-center gap-1">
                  <Mic className="w-3 h-3 text-indigo-500" />
                  <span>Khẩu lệnh: Nói <strong>"Gọi số"</strong> hoặc <strong>"Tiếp theo"</strong></span>
                </span>
                <span className="flex items-center gap-1 text-slate-400 font-mono">
                  <span>Phím tắt sổ:</span>
                  <kbd className="px-1 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold">Space</kbd>
                  <kbd className="px-1 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold">F2</kbd>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Waiting Queue for this Counter */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Danh Sách Hàng Chờ (Tiếp theo)
                </h3>
                <p className="text-xs text-slate-500">Các số phù hợp với danh mục nghiệp vụ quầy này</p>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold font-mono text-xs rounded-lg border border-amber-200">
                {waitingTickets.length} chờ
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[440px] pr-1">
              {waitingTickets.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Không còn ai đang chờ xử lý cho dịch vụ của quầy này.
                </div>
              ) : (
                waitingTickets.map((t, idx) => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-mono font-bold flex items-center justify-center text-[11px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold font-mono text-indigo-900 text-sm">
                            {t.ticketNumber}
                          </span>
                          {t.priority !== 'NORMAL' && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-200 text-amber-900 rounded-sm">
                              {t.priority}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[170px]">
                          {t.serviceName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        {new Date(t.createdAt).toLocaleTimeString('vi-VN')}
                      </span>
                      <button
                        onClick={() => handleCallNext(t.id)}
                        disabled={actionLoading}
                        title={`Gọi trực tiếp số ${t.ticketNumber} (Hoặc nói "Gọi số ${t.ticketNumber}")`}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 rounded-lg text-xs font-bold transition-all shadow-2xs opacity-90 group-hover:opacity-100 cursor-pointer flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Gọi</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Counters Status Monitoring Bento Card (from Design HTML) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Giám sát trạng thái Các Quầy
          </h2>
          <div className="flex gap-3">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Đang rảnh
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Đang xử lý
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300" /> Offline
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {counters.map(c => {
            const isServing = c.status === 'SERVING' || c.status === 'CALLING';
            const isIdle = c.status === 'IDLE';
            const isCurrent = c.id === currentCounter?.id;

            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border relative transition-all ${
                  isCurrent
                    ? 'border-2 border-indigo-200 bg-indigo-50/40'
                    : isServing
                    ? 'border-slate-200 bg-slate-50'
                    : isIdle
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <div
                  className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                    isServing
                      ? 'bg-amber-500'
                      : isIdle
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                />
                <p className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {c.code} {isCurrent && '(Bạn)'}
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {c.currentTicketNumber || (isIdle ? 'TRỐNG' : '-')}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 italic truncate">
                  {isServing ? 'Đang phục vụ' : isIdle ? 'Chờ gọi số...' : 'Tạm đóng'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Chuyển Số {activeTicket?.ticketNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Số thứ tự sẽ được điều phối sang quầy khác hoặc chuyển phân loại dịch vụ mà không mất lịch sử.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chuyển sang quầy chỉ định:
              </label>
              <select
                value={targetCounterId}
                onChange={e => setTargetCounterId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">-- Không chỉ định quầy (vào hàng đợi chung) --</option>
                {counters
                  .filter(c => c.id !== currentCounter?.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} – {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hoặc đổi sang dịch vụ:
              </label>
              <select
                value={targetServiceId}
                onChange={e => setTargetServiceId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">-- Giữ nguyên dịch vụ hiện tại --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.prefix})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do chuyển:
              </label>
              <input
                type="text"
                value={transferReason}
                onChange={e => setTransferReason(e.target.value)}
                placeholder="Ví dụ: Chuyển bổ sung hồ sơ địa chính"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setTransferModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleTransfer}
                disabled={actionLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Xác nhận chuyển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sổ Tay Phím Tắt & Khẩu Lệnh Giọng Nói (Shortcuts Cheatsheet Modal) */}
      {shortcutsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Sổ Tay Phím Tắt & Khẩu Lệnh Quầy
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thao tác nhanh chóng, hoàn toàn không cần click chuột
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShortcutsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid 2 Columns: Phím tắt & Giọng nói */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Cột 1: Phím tắt bàn phím */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
                  <Keyboard className="w-4 h-4 text-indigo-600" />
                  <span>Phím tắt bàn phím</span>
                </div>

                <div className="space-y-2 text-slate-700">
                  <div className="flex items-center justify-between py-1">
                    <span className="font-medium">Gọi số tiếp theo:</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">Space</kbd>
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">F2</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="font-medium">Gọi lại số đang phục vụ:</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">R</kbd>
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">F3</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="font-medium">Bắt đầu phục vụ:</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">S</kbd>
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">F4</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="font-medium">Hoàn tất lượt khám/tiếp:</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">Enter</kbd>
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">F8</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="font-medium">Báo vắng mặt:</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">Delete</kbd>
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">F9</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="font-medium">Chuyển quầy / liên thông:</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">T</kbd>
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">F6</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="font-medium">Bật / Tắt nhận diện giọng nói:</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">V</kbd>
                      <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">M</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="font-medium">Đóng bảng phím tắt / Thoát:</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold shadow-2xs">Esc</kbd>
                  </div>
                </div>
              </div>

              {/* Cột 2: Khẩu lệnh giọng nói tiếng Việt */}
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-indigo-200/60">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                    <Mic className="w-4 h-4 text-indigo-600" />
                    <span>Lệnh giọng nói (vi-VN)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-200/80 text-indigo-800'
                  }`}>
                    {isListening ? 'Đang lắng nghe' : 'Micro sẵn sàng'}
                  </span>
                </div>

                <div className="space-y-2 text-slate-700">
                  <div className="bg-white p-2 rounded-xl border border-indigo-100">
                    <p className="font-bold text-indigo-900 text-[11px]">Gọi số tiếp theo:</p>
                    <p className="text-slate-600 italic">"Gọi số", "Tiếp theo", "Mời số tiếp", "Bốc số"</p>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-indigo-100">
                    <p className="font-bold text-indigo-900 text-[11px]">Gọi đích danh số chỉ định:</p>
                    <p className="text-slate-600 italic">"Gọi số A 102", "Số B 005", "Mời số một trăm linh hai"</p>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-indigo-100">
                    <p className="font-bold text-indigo-900 text-[11px]">Gọi lại / Nhắc lại loa:</p>
                    <p className="text-slate-600 italic">"Gọi lại", "Nhắc lại", "Đọc lại", "Alo"</p>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-indigo-100">
                    <p className="font-bold text-indigo-900 text-[11px]">Bắt đầu tiếp nhận:</p>
                    <p className="text-slate-600 italic">"Bắt đầu", "Phục vụ", "Tiếp nhận hồ sơ"</p>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-indigo-100">
                    <p className="font-bold text-indigo-900 text-[11px]">Hoàn tất hồ sơ:</p>
                    <p className="text-slate-600 italic">"Hoàn tất", "Xong rồi", "Xử lý xong", "Đã xong"</p>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-indigo-100">
                    <p className="font-bold text-indigo-900 text-[11px]">Báo vắng mặt:</p>
                    <p className="text-slate-600 italic">"Vắng mặt", "Không có mặt", "Bỏ qua"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer note & Fast switch */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100">
              <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Mẹo: Phím tắt hoạt động toàn cục trừ khi bạn đang gõ trong ô nhập văn bản.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleVoiceListening}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                    isListening ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? 'Dừng Micro' : 'Bật Micro ngay'}</span>
                </button>
                <button
                  onClick={() => setShortcutsModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Đóng (Esc)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
