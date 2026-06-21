import { useEffect, useRef, useState } from 'react';

export function useWebSocket() {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Conecta ao servidor WebSocket
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/stream';
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (e) {
        console.error('Error parsing WebSocket message', e);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected. Reconnecting...');
      // Poderia ter uma lógica de reconexão automática aqui
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { lastMessage, sendMessage };
}
