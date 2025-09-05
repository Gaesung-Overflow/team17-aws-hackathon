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
      console.log('WebSocket 연결 종료:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      setIsConnected(false);

      // 정상 종료가 아닌 경우만 재연결
      if (!event.wasClean && !reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('재연결 시도 중...');
          connect();
        }, 3000);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket 오류:', {
        error,
        readyState: ws.current?.readyState,
        url: WS_URL,
      });
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

  const sendMessage = useCallback(
    (message: any) => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log('WebSocket 메시지 전송:', message);
        try {
          ws.current.send(JSON.stringify(message));
        } catch (error) {
          console.error('WebSocket 메시지 전송 오류:', error);
        }
      } else {
        console.warn(
          'WebSocket 연결되지 않음. readyState:',
          ws.current?.readyState,
          '메시지:',
          message,
        );
        // 연결이 끊어졌으면 재연결 시도
        if (ws.current?.readyState === WebSocket.CLOSED) {
          connect();
        }
      }
    },
    [connect],
  );

  const onMessage = useCallback((callback: (data: any) => void) => {
    messageHandlerRef.current = callback;
  }, []);

  // 방 입장 후 메시지 브로드캐스트
  const sendRoomMessage = useCallback(
    (roomId: string, message: any) => {
      // 1. 먼저 방에 입장
      sendMessage({ type: 'joinRoom', roomId });
      // 2. 바로 메시지 브로드캐스트
      sendMessage(message);
    },
    [sendMessage],
  );

  const createRoom = useCallback(
    (roomName: string) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      // 먼저 방에 입장
      sendMessage({ type: 'joinRoom', roomId });
      // 그 다음 createRoom 메시지 브로드캐스트
      sendMessage({ type: 'createRoom', roomId, roomName });
      return roomId;
    },
    [sendMessage],
  );

  const joinGame = useCallback(
    (roomId: string, playerName: string) => {
      const playerId = Math.random().toString(36).substring(2, 8);
      sendRoomMessage(roomId, {
        type: 'joinGame',
        roomId,
        playerId,
        playerName,
      });
      return playerId;
    },
    [sendRoomMessage],
  );

  const sendPlayerAction = useCallback(
    (roomId: string, action: string) => {
      sendMessage({ type: 'playerAction', action });
    },
    [sendMessage],
  );

  return {
    sendMessage,
    onMessage,
    isConnected,
    createRoom,
    joinGame,
    sendPlayerAction,
  };
};
