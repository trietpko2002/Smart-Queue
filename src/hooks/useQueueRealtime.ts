import { useEffect, useState, useRef } from 'react';

export interface QueueEvent {
  type: string;
  data: any;
  timestamp: string;
}

export function useQueueRealtime(onEvent?: (event: QueueEvent) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<QueueEvent | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: any = null;

    function connect() {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            setLastEvent(parsed);
            if (onEventRef.current) {
              onEventRef.current(parsed);
            }
          } catch {
            // Heartbeat or malformed
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          retryTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        setIsConnected(false);
        retryTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  return { isConnected, lastEvent };
}
