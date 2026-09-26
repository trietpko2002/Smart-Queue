import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  branchId?: string;
}

class SSEManager {
  private clients: SSEClient[] = [];

  addClient(id: string, res: Response, branchId?: string) {
    this.clients.push({ id, res, branchId });

    // Send initial connected event
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    // Remove client on close
    res.on('close', () => {
      this.removeClient(id);
    });
  }

  removeClient(id: string) {
    this.clients = this.clients.filter(c => c.id !== id);
  }

  broadcast(eventType: string, data: any, branchId?: string) {
    const payload = JSON.stringify({
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    });

    for (const client of this.clients) {
      if (!branchId || !client.branchId || client.branchId === branchId) {
        try {
          client.res.write(`data: ${payload}\n\n`);
        } catch {
          // Client might be broken
        }
      }
    }
  }

  // Heartbeat to prevent timeouts
  startHeartbeat() {
    setInterval(() => {
      for (const client of this.clients) {
        try {
          client.res.write(`: heartbeat ${Date.now()}\n\n`);
        } catch {
          // ignore
        }
      }
    }, 15000);
  }
}

export const sseManager = new SSEManager();
sseManager.startHeartbeat();
