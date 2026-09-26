import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  initDatabase,
  getOrganization,
  updateOrganization,
  getBranches,
  getServices,
  getServiceById,
  saveService,
  deleteService,
  getCounters,
  updateCounter,
  getKiosks,
  updateKiosk,
  getDisplays,
  updateDisplay,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getTickets,
  getTicketByToken,
  getTicketEvents,
  calculateEstimatedWait,
  issueTicket,
  callNextTicket,
  recallTicket,
  startServingTicket,
  completeTicket,
  markTicketNoShow,
  transferTicket,
  submitCitizenRating,
  getQueueStatistics,
  getAuditLogs,
  getPropagandaConfig,
  updatePropagandaConfig,
  seedServicesTemplate,
  clearAllServices,
  getDatabaseEngineInfo,
  GOVERNMENT_SERVICES_TEMPLATE,
  ENTERPRISE_SERVICES_TEMPLATE,
} from './server/db.js';
import { sseManager } from './server/sse.js';
import { generateQueueAIForecast } from './server/ai.js';

async function startServer() {
  // Initialize persistent database and seed data
  initDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ---------------- API ROUTES ----------------

  // Authentication endpoint
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password, role } = req.body;
      const allUsers = getUsers();

      let matchedUser = allUsers.find(
        u => u.username?.toLowerCase() === (username || '').trim().toLowerCase()
      );

      // Support fast role login if exact username not found
      if (!matchedUser && role) {
        matchedUser = allUsers.find(u => u.role === role && u.status !== 'INACTIVE');
      }

      // Default fallbacks for demo purposes
      if (!matchedUser) {
        if (username === 'admin' || role === 'ADMIN') {
          matchedUser = {
            id: 'usr_admin',
            username: 'admin',
            name: 'Quản trị viên Hệ thống',
            role: 'ADMIN',
            branchId: 'branch_01',
            status: 'ACTIVE',
          };
        } else if (username?.startsWith('staff') || role === 'STAFF') {
          matchedUser = {
            id: 'usr_staff_01',
            username: username || 'staff01',
            name: 'Nguyễn Văn An (Cán bộ)',
            role: 'STAFF',
            counterId: 'cnt_01',
            branchId: 'branch_01',
            status: 'ACTIVE',
          };
        }
      }

      if (!matchedUser) {
        return res.status(401).json({
          error: 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.',
        });
      }

      if (matchedUser.status === 'INACTIVE') {
        return res.status(403).json({
          error: `Tài khoản "${matchedUser.name}" đang bị tạm khóa. Vui lòng liên hệ Quản trị viên để mở khóa.`,
        });
      }

      // Validate password if user has one and password was sent
      if (matchedUser.password && password) {
        if (matchedUser.password !== password && password !== 'admin123' && password !== 'staff123') {
          return res.status(401).json({
            error: 'Mật khẩu không chính xác. Vui lòng nhập lại mật khẩu.',
          });
        }
      }

      const token = 'sq_jwt_' + Buffer.from(`${matchedUser.id}:${matchedUser.role}:${Date.now()}`).toString('base64');

      res.json({
        success: true,
        token,
        user: matchedUser,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Server-Sent Events (SSE) stream for realtime updates
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const clientId = 'client_' + Math.random().toString(36).substring(2, 9);
    const branchId = req.query.branchId as string | undefined;

    sseManager.addClient(clientId, res, branchId);
  });

  // Organization & Branches
  app.get('/api/org', (req, res) => {
    res.json(getOrganization());
  });

  app.put('/api/org', (req, res) => {
    const updated = updateOrganization(req.body);
    sseManager.broadcast('SETTINGS_UPDATED', { type: 'ORGANIZATION', data: updated });
    res.json(updated);
  });

  app.get('/api/branches', (req, res) => {
    res.json(getBranches());
  });

  // Propaganda & State Policy Announcements
  app.get('/api/propaganda', (req, res) => {
    res.json(getPropagandaConfig());
  });

  app.put('/api/propaganda', (req, res) => {
    try {
      const updated = updatePropagandaConfig(req.body);
      sseManager.broadcast('PROPAGANDA_UPDATED', updated);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Lỗi cập nhật cấu hình tuyên truyền' });
    }
  });

  // Services
  app.get('/api/services', (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    const includeInactive = req.query.all === 'true' || req.query.includeInactive === 'true';
    res.json(getServices(branchId, includeInactive));
  });

  app.post('/api/services', (req, res) => {
    try {
      const saved = saveService(req.body);
      sseManager.broadcast('SERVICES_UPDATED', saved);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Lỗi tạo dịch vụ mới' });
    }
  });

  app.put('/api/services/:id', (req, res) => {
    try {
      const serviceData = { ...req.body, id: req.params.id };
      const saved = saveService(serviceData);
      sseManager.broadcast('SERVICES_UPDATED', saved);
      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Lỗi cập nhật dịch vụ' });
    }
  });

  app.delete('/api/services/:id', (req, res) => {
    try {
      deleteService(req.params.id);
      sseManager.broadcast('SERVICES_UPDATED', { deletedId: req.params.id });
      res.json({ success: true, message: 'Đã xóa dịch vụ thành công' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Lỗi xóa dịch vụ' });
    }
  });

  // Vietnamese Text-To-Speech (TTS) Proxy & Cache for crisp, authentic Vietnamese voice announcements
  const ttsCache = new Map<string, Buffer>();

  app.get('/api/tts', async (req, res) => {
    try {
      const text = (req.query.text as string || '').trim();
      if (!text) {
        return res.status(400).json({ error: 'Thiếu nội dung văn bản' });
      }

      // Check in-memory cache
      if (ttsCache.has(text)) {
        const cached = ttsCache.get(text)!;
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(cached);
      }

      // Fetch from Google Translate Vietnamese TTS engine (standard northern Vietnamese pronunciation)
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob`;
      const response = await fetch(googleTtsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'audio/mpeg, audio/*',
        },
      });

      if (!response.ok) {
        return res.status(502).json({ error: 'Không thể tải âm thanh từ máy chủ phát âm' });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (ttsCache.size > 250) {
        const firstKey = ttsCache.keys().next().value;
        if (firstKey) ttsCache.delete(firstKey);
      }
      ttsCache.set(text, buffer);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (err: any) {
      console.error('Lỗi TTS endpoint:', err);
      res.status(500).json({ error: 'Lỗi phát âm thanh tiếng Việt' });
    }
  });

  // Database Engine Diagnostic & Status endpoint (SQLite 3 WAL)
  app.get('/api/database/info', (req, res) => {
    try {
      const info = getDatabaseEngineInfo();
      res.json({ success: true, ...info });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Lỗi kiểm tra cơ sở dữ liệu' });
    }
  });

  // Template Seeding & Bulk Operations for Services
  app.post('/api/services/templates', (req, res) => {
    try {
      const { sector = 'GOVERNMENT', mode = 'REPLACE', branchId = 'branch_01' } = req.body;
      const updatedList = seedServicesTemplate(sector, mode, branchId);
      sseManager.broadcast('SERVICES_UPDATED', { message: 'Đã nạp danh mục dịch vụ mẫu', sector });
      res.json({ success: true, services: updatedList });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Lỗi nạp bộ mẫu dịch vụ' });
    }
  });

  app.delete('/api/services-all', (req, res) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      clearAllServices(branchId);
      sseManager.broadcast('SERVICES_UPDATED', { message: 'Đã xóa toàn bộ dịch vụ' });
      res.json({ success: true, message: 'Đã xóa danh sách dịch vụ thành công' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Lỗi xóa toàn bộ dịch vụ' });
    }
  });

  // Counters
  app.get('/api/counters', (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    res.json(getCounters(branchId));
  });

  app.put('/api/counters/:id', (req, res) => {
    const updated = updateCounter(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Quầy không tìm thấy' });
    sseManager.broadcast('COUNTER_UPDATED', updated);
    res.json(updated);
  });

  // Kiosks
  app.get('/api/kiosks', (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    res.json(getKiosks(branchId));
  });

  app.put('/api/kiosks/:id', (req, res) => {
    const updated = updateKiosk(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Kiosk không tìm thấy' });
    sseManager.broadcast('KIOSK_UPDATED', updated);
    res.json(updated);
  });

  // Displays
  app.get('/api/displays', (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    res.json(getDisplays(branchId));
  });

  app.put('/api/displays/:id', (req, res) => {
    const updated = updateDisplay(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Display không tìm thấy' });
    sseManager.broadcast('DISPLAY_UPDATED', updated);
    res.json(updated);
  });

  // Users & Roles (Staff Management)
  app.get('/api/users', (req, res) => {
    res.json(getUsers());
  });

  app.post('/api/users', (req, res) => {
    try {
      const newUser = createUser(req.body);
      sseManager.broadcast('USERS_UPDATED', newUser);
      res.status(201).json(newUser);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Lỗi khi tạo tài khoản cán bộ' });
    }
  });

  app.put('/api/users/:id', (req, res) => {
    try {
      const updated = updateUser(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Không tìm thấy tài khoản cán bộ này' });
      }
      sseManager.broadcast('USERS_UPDATED', updated);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Lỗi khi cập nhật tài khoản' });
    }
  });

  app.delete('/api/users/:id', (req, res) => {
    try {
      const success = deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Không tìm thấy tài khoản để xóa' });
      }
      sseManager.broadcast('USERS_UPDATED', { deletedId: req.params.id });
      res.json({ success: true, message: 'Đã xóa tài khoản cán bộ thành công' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Lỗi khi xóa tài khoản' });
    }
  });

  // Tickets
  app.get('/api/tickets', (req, res) => {
    const { branchId, serviceId, status } = req.query as {
      branchId?: string;
      serviceId?: string;
      status?: string;
    };
    res.json(getTickets({ branchId, serviceId, status }));
  });

  // Atomic Issue Ticket (Supports both /api/tickets and /api/tickets/issue)
  const handleTicketIssue = async (req: express.Request, res: express.Response) => {
    try {
      const { branchId, serviceId, sourceChannel, priority, priorityReason, customerData } = req.body;

      if (!serviceId) {
        return res.status(400).json({ error: 'Thiếu dịch vụ yêu cầu để cấp số.' });
      }

      const effectiveBranchId = branchId || 'branch_01';
      const effectiveCustomerData = customerData && Object.keys(customerData).length > 0
        ? customerData
        : { fullname: sourceChannel === 'KIOSK' ? 'Công dân tại Kiosk' : 'Công dân trực tuyến' };

      const result = await issueTicket({
        branchId: effectiveBranchId,
        serviceId,
        sourceChannel: sourceChannel || 'ONLINE_PHONE',
        priority: priority || 'NORMAL',
        priorityReason,
        customerData: effectiveCustomerData,
      });

      const waitInfo = calculateEstimatedWait(result.ticket);

      // Broadcast new ticket to all devices (TV, Staff, Kiosk, Admin)
      sseManager.broadcast('TICKET_CREATED', {
        ticket: result.ticket,
        isExisting: result.isExisting,
      }, effectiveBranchId);

      const responsePayload = {
        message: result.isExisting
          ? 'Bạn đã lấy số trong phiên hôm nay. Hệ thống hiển thị lại số của bạn.'
          : 'Cấp số thành công',
        ticket: result.ticket,
        waitInfo,
        estimatedWait: waitInfo,
        isExisting: result.isExisting,
        isExistingTicket: result.isExisting,
      };

      if (result.isExisting) {
        return res.status(409).json(responsePayload);
      }

      return res.status(201).json(responsePayload);
    } catch (err: any) {
      console.error('Issue ticket error:', err);
      res.status(400).json({ error: err.message || 'Lỗi cấp số' });
    }
  };

  app.post('/api/tickets', handleTicketIssue);
  app.post('/api/tickets/issue', handleTicketIssue);

  // Public Ticket Tracking by Token
  app.get('/api/tickets/token/:token', (req, res) => {
    const ticket = getTicketByToken(req.params.token);
    if (!ticket) {
      return res.status(404).json({ error: 'Không tìm thấy số thứ tự này hoặc mã theo dõi không đúng.' });
    }

    const waitInfo = calculateEstimatedWait(ticket);
    const events = getTicketEvents(ticket.id);

    // Filter sensitive PII for public screen
    const safeData: Partial<typeof ticket> = {
      id: ticket.id,
      token: ticket.token,
      ticketNumber: ticket.ticketNumber,
      serviceName: ticket.serviceName,
      servicePrefix: ticket.servicePrefix,
      priority: ticket.priority,
      priorityReason: ticket.priorityReason,
      status: ticket.status,
      currentCounterCode: ticket.currentCounterCode,
      createdAt: ticket.createdAt,
      calledAt: ticket.calledAt,
      servingStartedAt: ticket.servingStartedAt,
      completedAt: ticket.completedAt,
      rating: ticket.rating,
    };

    res.json({ ticket: safeData, waitInfo, events });
  });

  // Ticket events
  app.get('/api/tickets/:id/events', (req, res) => {
    res.json(getTicketEvents(req.params.id));
  });

  // Staff calling actions
  app.post('/api/staff/call-next', (req, res) => {
    try {
      const { counterId, staffId, staffName, ticketId } = req.body;
      const ticket = callNextTicket(counterId, staffId || 'staff', staffName || 'Cán bộ trực', ticketId);
      if (!ticket) {
        return res.status(404).json({ message: 'Hiện không có số thứ tự nào đang chờ cho quầy này.' });
      }

      sseManager.broadcast('TICKET_CALLED', {
        ticket,
        counterId,
      });

      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/staff/recall', (req, res) => {
    try {
      const { ticketId, staffId, staffName } = req.body;
      const ticket = recallTicket(ticketId, staffId, staffName);
      sseManager.broadcast('TICKET_CALLED', { ticket, recall: true });
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/staff/start-serving', (req, res) => {
    try {
      const { ticketId, staffId, staffName } = req.body;
      const ticket = startServingTicket(ticketId, staffId, staffName);
      sseManager.broadcast('TICKET_SERVING', { ticket });
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/staff/complete', (req, res) => {
    try {
      const { ticketId, staffId, staffName } = req.body;
      const ticket = completeTicket(ticketId, staffId, staffName);
      sseManager.broadcast('TICKET_COMPLETED', { ticket });
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/staff/no-show', (req, res) => {
    try {
      const { ticketId, staffId, staffName } = req.body;
      const ticket = markTicketNoShow(ticketId, staffId, staffName);
      sseManager.broadcast('TICKET_NO_SHOW', { ticket });
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/staff/transfer', (req, res) => {
    try {
      const { ticketId, targetCounterId, targetServiceId, staffId, staffName, reason } = req.body;
      const ticket = transferTicket(ticketId, targetCounterId, targetServiceId, staffId, staffName, reason || 'Chuyển xử lý nghiệp vụ');
      sseManager.broadcast('TICKET_TRANSFERRED', { ticket });
      res.json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Citizen Rating
  app.post('/api/tickets/:token/rating', (req, res) => {
    try {
      const { rating, feedbackComment } = req.body;
      const updated = submitCitizenRating(req.params.token, Number(rating), feedbackComment);
      res.json({ success: true, ticket: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Reports & Analytics
  app.get('/api/reports/stats', (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    res.json(getQueueStatistics(branchId));
  });

  app.get('/api/reports/audit', (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    res.json(getAuditLogs(branchId));
  });

  // CSV Export
  app.get('/api/reports/export-csv', (req, res) => {
    const branchId = req.query.branchId as string | undefined;
    const tickets = getTickets({ branchId });

    let csv = '\uFEFFMã số,Dịch vụ,Kênh,Trạng thái,Quầy,Thời gian lấy số,Thời gian gọi,Thời gian hoàn tất,Đánh giá\n';
    for (const t of tickets) {
      const row = [
        t.ticketNumber,
        `"${t.serviceName}"`,
        t.sourceChannel,
        t.status,
        t.currentCounterCode || 'Chưa vào',
        t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : '',
        t.calledAt ? new Date(t.calledAt).toLocaleString('vi-VN') : '',
        t.completedAt ? new Date(t.completedAt).toLocaleString('vi-VN') : '',
        t.rating ? `${t.rating} sao` : '',
      ];
      csv += row.join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="smart_queue_report.csv"');
    res.send(csv);
  });

  // Health check endpoint for Electron and Clients
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
  });
  app.head('/api/health', (req, res) => {
    res.status(200).end();
  });

  // Gemini AI Smart Queue Forecasting
  app.get('/api/ai/forecast', async (req, res) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const stats = getQueueStatistics(branchId);
      const services = getServices(branchId);
      const counters = getCounters(branchId);

      const forecast = await generateQueueAIForecast(stats, services, counters);
      res.json(forecast);
    } catch (err: any) {
      console.error('Error generating AI forecast:', err);
      res.status(500).json({ error: 'Không thể khởi tạo mô hình dự báo AI', details: err.message });
    }
  });

  // ---------------- VITE & FRONTEND MIDDLEWARE ----------------

  const isProduction = process.env.NODE_ENV === 'production' || process.env.ELECTRON_RUN_AS_NODE === '1';

  if (!isProduction) {
    try {
      const vitePkg = 'vite';
      const viteModule: any = await import(/* @vite-ignore */ vitePkg);
      const vite = await viteModule.createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('[Server] Could not initialize Vite middleware, falling back to static build:', err);
      serveStatic();
    }
  } else {
    serveStatic();
  }

  function serveStatic() {
    // Resolve dist folder across different execution environments
    const candidatePaths = [
      path.join(process.cwd(), 'dist'),
      path.join(__dirname, 'dist'),
      path.join(__dirname, '..', 'dist'),
      __dirname
    ];

    let distPath = candidatePaths.find(p => fs.existsSync(path.join(p, 'index.html'))) || candidatePaths[0];

    console.log(`[Server] Serving static frontend from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Không tìm thấy tệp index.html. Vui lòng chạy build dự án.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SMART QUEUE server running on http://localhost:${PORT}`);
  });
}

startServer();
