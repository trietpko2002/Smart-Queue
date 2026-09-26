import QRCode from 'qrcode';
import { Ticket } from '../types/queue.js';
import { getPublicUrl } from './url.js';

interface WaitInfoParam {
  peopleAhead?: number;
  estimatedMinutes?: number;
  timeRangeText?: string;
}

/**
 * Generates a clean, high-resolution ticket receipt image on a Canvas
 * and downloads it to the user's phone or computer as a PNG file.
 */
export async function downloadTicketImage(
  ticket: Ticket,
  waitInfo?: WaitInfoParam,
  customPublicBaseUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const width = 750;
    const height = 1100;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // 1. Background
    ctx.fillStyle = '#f8fafc'; // slate-50
    ctx.fillRect(0, 0, width, height);

    // Main Card container (with rounded corner effect)
    const cardPadding = 30;
    const cardW = width - cardPadding * 2;
    const cardH = height - cardPadding * 2;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;

    // Draw rounded rect
    roundRect(ctx, cardPadding, cardPadding, cardW, cardH, 28);
    ctx.fill();
    ctx.stroke();

    // 2. Top Header Banner
    const isEnterprise = ticket.servicePrefix?.startsWith('DN') || ticket.serviceName?.toLowerCase().includes('doanh nghiệp');
    const headerGrad = ctx.createLinearGradient(cardPadding, cardPadding, cardPadding + cardW, cardPadding);
    if (isEnterprise) {
      headerGrad.addColorStop(0, '#312e81'); // indigo-900
      headerGrad.addColorStop(1, '#4338ca'); // indigo-700
    } else {
      headerGrad.addColorStop(0, '#991b1b'); // red-800
      headerGrad.addColorStop(1, '#b91c1c'); // red-700
    }

    ctx.save();
    // Clip to top rounded corners
    ctx.beginPath();
    ctx.moveTo(cardPadding + 28, cardPadding);
    ctx.lineTo(cardPadding + cardW - 28, cardPadding);
    ctx.arcTo(cardPadding + cardW, cardPadding, cardPadding + cardW, cardPadding + 28, 28);
    ctx.lineTo(cardPadding + cardW, cardPadding + 110);
    ctx.lineTo(cardPadding, cardPadding + 110);
    ctx.lineTo(cardPadding, cardPadding + 28);
    ctx.arcTo(cardPadding, cardPadding, cardPadding + 28, cardPadding, 28);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = headerGrad;
    ctx.fillRect(cardPadding, cardPadding, cardW, 110);
    ctx.restore();

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('UBND THÀNH PHỐ - TT PHỤC VỤ HÀNH CHÍNH CÔNG', width / 2, cardPadding + 42);

    ctx.fillStyle = '#fef08a'; // amber-200
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('HỆ THỐNG TIẾP NHẬN & CẤP SỐ THỨ TỰ ĐIỆN TỬ', width / 2, cardPadding + 70);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Hotline hỗ trợ: 1900 1234 • Giờ tiếp nhận: 07:30 - 16:30', width / 2, cardPadding + 94);

    // 3. Service Name
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    const srvText = ticket.serviceName || 'Dịch vụ Hành chính';
    wrapText(ctx, srvText.toUpperCase(), width / 2, cardPadding + 155, cardW - 60, 30);

    // 4. Large Ticket Number Box
    const boxY = cardPadding + 200;
    const boxH = 155;
    const boxW = cardW - 80;
    const boxX = cardPadding + 40;

    ctx.fillStyle = '#f1f5f9'; // slate-100
    ctx.strokeStyle = '#cbd5e1'; // slate-300
    ctx.lineWidth = 2;
    roundRect(ctx, boxX, boxY, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('SỐ THỨ TỰ TIẾP NHẬN CỦA BẠN', width / 2, boxY + 34);

    // Huge bold number
    ctx.fillStyle = isEnterprise ? '#3730a3' : '#1d4ed8'; // indigo or blue
    ctx.font = '900 76px "SF Mono", Menlo, Consolas, monospace';
    ctx.fillText(ticket.ticketNumber, width / 2, boxY + 110);

    // Priority badge if applicable
    if (ticket.priority && ticket.priority !== 'NORMAL') {
      ctx.fillStyle = '#b45309'; // amber-700
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`★ Ưu tiên: ${ticket.priorityReason || ticket.priority}`, width / 2, boxY + 140);
    }

    // 5. Details Section (Dashed separator)
    const lineY = boxY + boxH + 25;
    ctx.beginPath();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.moveTo(cardPadding + 30, lineY);
    ctx.lineTo(cardPadding + cardW - 30, lineY);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Info grid
    const infoStartY = lineY + 30;
    const leftCol = cardPadding + 45;
    const rightCol = cardPadding + cardW - 45;

    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Row 1: Time & Date
    const ticketDate = new Date(ticket.createdAt);
    const timeStr = ticketDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = ticketDate.toLocaleDateString('vi-VN');

    drawInfoRow(ctx, 'Thời gian bốc số:', `${timeStr} - ${dateStr}`, leftCol, rightCol, infoStartY);
    drawInfoRow(ctx, 'Người đang chờ phía trước:', `${waitInfo?.peopleAhead ?? 0} người`, leftCol, rightCol, infoStartY + 30, '#b45309');
    drawInfoRow(ctx, 'Thời gian dự kiến phục vụ:', waitInfo?.timeRangeText || '~10 - 20 phút', leftCol, rightCol, infoStartY + 60, '#1e40af');

    // Customer custom details if present (e.g. CCCD or Tax ID or Name)
    let currentY = infoStartY + 90;
    if (ticket.customerData) {
      const ccd = ticket.customerData['citizen_id'] || ticket.customerData['cccd'];
      const tax = ticket.customerData['tax_id'] || ticket.customerData['mst'];
      const name = ticket.customerData['fullname'] || ticket.customerData['rep_name'] || ticket.customerData['name'];

      if (name) {
        drawInfoRow(ctx, 'Họ và tên:', String(name), leftCol, rightCol, currentY);
        currentY += 28;
      }
      if (ccd) {
        drawInfoRow(ctx, 'Số CCCD:', String(ccd), leftCol, rightCol, currentY);
        currentY += 28;
      } else if (tax) {
        drawInfoRow(ctx, 'Mã số thuế (MST):', String(tax), leftCol, rightCol, currentY);
        currentY += 28;
      }
    }

    // 6. QR Code Section for Online Tracking
    const qrSize = 190;
    const qrY = currentY + 15;
    const qrX = (width - qrSize) / 2;

    const publicUrl = getPublicUrl(`/ticket/${ticket.token}`, customPublicBaseUrl);
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, publicUrl, {
      width: qrSize,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });

    // Draw QR white border container
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    roundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16);
    ctx.fill();
    ctx.stroke();

    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // QR Caption
    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155'; // slate-700
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('QUÉT MÃ QR ĐỂ THEO DÕI SỐ TRÊN ĐIỆN THOẠI', width / 2, qrY + qrSize + 30);

    ctx.fillStyle = '#64748b';
    ctx.font = '13px "SF Mono", Menlo, Consolas, monospace';
    ctx.fillText(`Mã tra cứu: ${ticket.token} • Kênh: ${ticket.sourceChannel === 'KIOSK' ? 'Máy Kiosk Sảnh' : 'Bốc số Online'}`, width / 2, qrY + qrSize + 52);

    // 7. Footer Stamp / Note
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Quý khách vui lòng lưu ảnh này. Khi đến lượt, hệ thống sẽ phát loa và hiển thị tại TV sảnh.', width / 2, qrY + qrSize + 85);

    // Convert Canvas to Blob and Trigger Download
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve({ success: false, error: 'Không thể tạo tệp ảnh' });
          return;
        }

        const fileName = `phieu-so-${ticket.ticketNumber}-${ticket.token.slice(0, 4)}.png`;

        // Check if Web Share API with files is available (useful on iOS / Android)
        if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
          try {
            const file = new File([blob], fileName, { type: 'image/png' });
            await navigator.share({
              title: `Phiếu số thứ tự: ${ticket.ticketNumber}`,
              text: `Phiếu số ${ticket.ticketNumber} - ${ticket.serviceName}`,
              files: [file],
            });
            resolve({ success: true });
            return;
          } catch (e: any) {
            // User cancelled share or fallback to direct download
            if (e.name === 'AbortError') {
              resolve({ success: true });
              return;
            }
          }
        }

        // Standard link download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        resolve({ success: true });
      }, 'image/png');
    });
  } catch (err: any) {
    console.error('Error generating ticket image:', err);
    return { success: false, error: err?.message || 'Lỗi khi tạo ảnh phiếu số' };
  }
}

/** Helper to draw rounded rectangle */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** Helper to draw aligned row */
function drawInfoRow(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  leftX: number,
  rightX: number,
  y: number,
  valueColor: string = '#0f172a'
) {
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b'; // slate-500
  ctx.fillText(label, leftX, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = valueColor;
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(value, rightX, y);
}

/** Helper to wrap multi-line text */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}
