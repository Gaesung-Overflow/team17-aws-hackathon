/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = 'wss://mbizopkcbc.execute-api.us-east-1.amazonaws.com/prod';

export const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageHandlerRef = useRef<((data: any) => void) | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('WebSocket 연속 시도 중...');
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket 연결 성공!');
      setIsConnected(true);

      // 재연결 타이머 취소
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket 연결 종료:', event.code, event.reason);
      setIsConnected(false);

      // 3초 후 재연결 시도
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('재연결 시도 중...');
          connect();
        }, 3000);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket 오류:', error);
    };

    ws.current.onmessage = (event) => {
      if (messageHandlerRef.current) {
        const data = JSON.parse(event.data);
        console.log('WebSocket 메시지 수신:', data);
        messageHandlerRef.current(data);
      }
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket 메시지 전송:', message);
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket 연결되지 않음. 메시지 전송 실패:', message);
    }
  }, []);

  const onMessage = useCallback((callback: (data: any) => void) => {
    messageHandlerRef.current = callback;
  }, []);

  return { sendMessage, onMessage, isConnected };
};
