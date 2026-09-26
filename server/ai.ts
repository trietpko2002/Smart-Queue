import { GoogleGenAI } from '@google/genai';
import { AIPrediction, QueueStatistics, Service, Counter } from '../src/types/queue.js';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function generateQueueAIForecast(
  stats: QueueStatistics,
  services: Service[],
  counters: Counter[]
): Promise<AIPrediction> {
  const client = getAIClient();

  // If Gemini API is available, ask Gemini 3.8 Flash for intelligent queue forecasting and counter dispatch recommendations
  if (client) {
    try {
      const prompt = `
Bạn là AI chuyên gia tối ưu hóa hàng đợi công cộng cho hệ thống SMART QUEUE (UBND/Cơ quan hành chính).
Dựa trên dữ liệu thực tế sau đây:
- Tổng lượt hôm nay: ${stats.totalToday}
- Đang chờ: ${stats.waitingCount}
- Đang phục vụ: ${stats.servingCount}
- Đã hoàn tất: ${stats.completedCount}
- Vắng: ${stats.noShowCount}
- Thời gian chờ trung bình: ${stats.avgWaitMinutes} phút
- Thời gian phục vụ trung bình: ${stats.avgServiceMinutes} phút
- Danh sách dịch vụ: ${services.map(s => `${s.name} (${s.prefix}, TB: ${s.avgServiceTimeMinutes}p)`).join(', ')}
- Các quầy đang cấu hình: ${counters.map(c => `${c.code}: ${c.status} (${c.name})`).join(', ')}
- Phân bổ theo giờ: ${JSON.stringify(stats.hourlyDistribution)}

Hãy phân tích và trả về JSON thuần túy (không markdown, không backticks) theo cấu trúc:
{
  "predictedTodayTraffic": number,
  "peakHoursForecast": [
    { "hour": "08:00 - 09:30", "estimatedCrowd": "Khoảng 25 - 35 lượt", "trafficLevel": "NORMAL" },
    { "hour": "09:30 - 11:30", "estimatedCrowd": "Khoảng 40 - 55 lượt", "trafficLevel": "PEAK" },
    { "hour": "13:30 - 15:00", "estimatedCrowd": "Khoảng 30 - 40 lượt", "trafficLevel": "NORMAL" },
    { "hour": "15:00 - 16:30", "estimatedCrowd": "Khoảng 15 - 20 lượt", "trafficLevel": "LOW" }
  ],
  "counterRecommendations": [
    { "counterCode": "Quầy 01", "recommendation": "Khuyến nghị điều phối cụ thể tiếng Việt", "expectedWaitImpact": "giảm thời gian chờ X phút" }
  ],
  "anomalies": [
    { "severity": "WARN" | "CRITICAL" | "INFO", "message": "Nội dung bất thường phát hiện", "suggestion": "Giải pháp khuyến nghị" }
  ]
}
`;

      // 3.5-second timeout to prevent hanging the client UI
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));

      const apiPromise = client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const response: any = await Promise.race([apiPromise, timeoutPromise]);

      if (response && response.text) {
        let rawText = response.text.trim();
        if (rawText.startsWith('```json')) {
          rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(rawText);
        if (parsed.peakHoursForecast && parsed.counterRecommendations) {
          return {
            ...parsed,
            generatedAt: new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn('Gemini queue forecast failed, using rule-based fallback:', err);
    }
  }

  // Fallback heuristic model based on queue metrics
  const waiting = stats.waitingCount;
  const activeCounters = counters.filter(c => c.status !== 'CLOSED').length || 1;
  const closedCounters = counters.filter(c => c.status === 'CLOSED');

  const recommendations: AIPrediction['counterRecommendations'] = [];
  if (waiting > 10 && closedCounters.length > 0) {
    recommendations.push({
      counterCode: closedCounters[0].code,
      recommendation: `Hàng đợi đang có ${waiting} người chờ. Đề xuất mở thêm ${closedCounters[0].code} để giải tỏa áp lực.`,
      expectedWaitImpact: `Giảm thời gian chờ từ ~${Math.round(waiting * 10 / activeCounters)} phút xuống ~${Math.round(waiting * 10 / (activeCounters + 1))} phút.`,
    });
  } else {
    recommendations.push({
      counterCode: 'Hệ thống Quầy',
      recommendation: 'Tải phục vụ hiện tại đang ở mức ổn định. Duy trì các quầy hiện có.',
      expectedWaitImpact: 'Thời gian chờ trung bình ổn định dưới 15 phút.',
    });
  }

  const anomalies: AIPrediction['anomalies'] = [];
  if (stats.noShowCount > 5) {
    anomalies.push({
      severity: 'WARN',
      message: `Tỉ lệ người dân vắng mặt (${stats.noShowCount} lượt) đang cao hơn mức thông thường.`,
      suggestion: 'Đề xuất tăng cường âm lượng loa phát thanh và gửi thông báo đẩy sắp tới lượt.',
    });
  }
  if (stats.avgWaitMinutes > 25) {
    anomalies.push({
      severity: 'CRITICAL',
      message: `Thời gian chờ trung bình đạt ${stats.avgWaitMinutes} phút, vượt ngưỡng mục tiêu 20 phút.`,
      suggestion: 'Kích hoạt phương án điều phối viên hỗ trợ giải quyết hồ sơ nhanh.',
    });
  } else {
    anomalies.push({
      severity: 'INFO',
      message: 'Các chỉ số vận hành đang trong giới hạn an toàn của đơn vị.',
      suggestion: 'Tiếp tục theo dõi diễn biến các khung giờ cao điểm đầu giờ chiều.',
    });
  }

  return {
    predictedTodayTraffic: Math.max(stats.totalToday + 25, 65),
    peakHoursForecast: [
      { hour: '08:00 - 09:30', estimatedCrowd: 'Khoảng 25 - 35 người', trafficLevel: 'NORMAL' },
      { hour: '09:30 - 11:30', estimatedCrowd: 'Khoảng 45 - 60 người', trafficLevel: 'PEAK' },
      { hour: '13:30 - 15:00', estimatedCrowd: 'Khoảng 30 - 40 người', trafficLevel: 'HIGH' },
      { hour: '15:00 - 16:30', estimatedCrowd: 'Khoảng 15 - 20 người', trafficLevel: 'LOW' },
    ],
    counterRecommendations: recommendations,
    anomalies,
    generatedAt: new Date().toISOString(),
  };
}
