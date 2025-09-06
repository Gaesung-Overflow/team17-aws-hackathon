/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';

const WS_URL = 'wss://mbizopkcbc.execute-api.us-east-1.amazonaws.com/prod';

// 싱글톤 WebSocket 관리
class WebSocketManager {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers = new Map<string, (data: any) => void>();
  private connectionListeners = new Set<(connected: boolean) => void>();

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.connectionListeners.forEach((listener) => listener(true));
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    };

    this.ws.onclose = (event) => {
      this.isConnected = false;
      this.connectionListeners.forEach((listener) => listener(false));
      if (event.code !== 1000 && !this.reconnectTimeout) {
        this.reconnectTimeout = setTimeout(() => this.connect(), 1000);
      }
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('메시지 수신:', data, 'handlers:', this.messageHandlers.size);
      this.messageHandlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error('Handler error:', error);
        }
      });
    };
  }

  sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
      if (this.ws?.readyState === WebSocket.CLOSED) {
        this.connect();
      }
    }
  }

  addMessageHandler(callback: (data: any) => void) {
    const id = Math.random().toString(36).substring(2, 9);
    this.messageHandlers.set(id, callback);
    return () => this.messageHandlers.delete(id);
  }

  addConnectionListener(listener: (connected: boolean) => void) {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  getConnectionState() {
    return this.isConnected;
  }
}

const wsManager = new WebSocketManager();

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(
    wsManager.getConnectionState(),
  );

  useEffect(() => {
    wsManager.connect();
    return wsManager.addConnectionListener(setIsConnected);
  }, []);

  const sendMessage = useCallback((message: any) => {
    wsManager.sendMessage(message);
  }, []);

  const onMessage = useCallback((callback: (data: any) => void) => {
    return wsManager.addMessageHandler(callback);
  }, []);

  const createRoom = useCallback(
    (roomName: string) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      sendMessage({ type: 'createRoom', roomId, roomName });
      return roomId;
    },
    [sendMessage],
  );

  const joinGame = useCallback(
    (roomId: string, playerName: string, emoji?: string) => {
      const playerId = Math.random().toString(36).substring(2, 8);
      sendMessage({ type: 'joinGame', roomId, playerId, playerName, emoji });
      return playerId;
    },
    [sendMessage],
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
