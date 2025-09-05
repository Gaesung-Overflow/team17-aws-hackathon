import { useEffect, useRef, useState } from 'react';

export const ChatContainer = () => {
  const ws = useRef<WebSocket | null>(null);

  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [roomInput, setRoomInput] = useState<string>('');

  const joinRoom = () => {
    if (roomInput && ws.current) {
      ws.current.send(JSON.stringify({ type: 'joinRoom', roomId: roomInput }));
      setCurrentRoom(roomInput);
    }
  };

  const sendMessage = () => {
    const input = document.getElementById('messageInput') as HTMLInputElement;
    const message = input.value;
    if (message && ws.current && currentRoom) {
      ws.current.send(JSON.stringify({ message, type: 'chat' }));
      addMessage(`보낸 메시지: ${message}`);
      input.value = '';
    }
  };

  const addMessage = (message: string) => {
    const div = document.createElement('div');
    div.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    document.getElementById('messages')?.appendChild(div);
  };

  useEffect(() => {
    ws.current = new WebSocket(
      'wss://lczr545025.execute-api.us-east-1.amazonaws.com/prod',
    );

    ws.current.onopen = () => {
      console.log('연결됨');
      addMessage('서버에 연결되었습니다');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'system') {
        addMessage(`시스템: ${data.message}`);
      } else if (data.type === 'chat') {
        addMessage(`받은 메시지: ${data.message}`);
      }
    };

    ws.current.onclose = () => {
      addMessage('연결이 종료되었습니다');
    };

    const messageInput = document.getElementById('messageInput');
    messageInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    return () => {
      if (ws.current && ws.current.readyState === 1) {
        ws.current.close();
      }
    };
  }, []);

  return (
    <>
      <h1>실시간 채팅 테스트</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          placeholder="방 ID 입력"
        />
        <button onClick={joinRoom}>방 입장</button>
        {currentRoom && (
          <span style={{ marginLeft: '10px' }}>현재 방: {currentRoom}</span>
        )}
      </div>

      <div
        id="messages"
        style={{
          height: '300px',
          overflow: 'auto',
          border: '1px solid #ccc',
          padding: '10px',
          marginBottom: '10px',
        }}
      ></div>

      <div>
        <input
          type="text"
          id="messageInput"
          placeholder="메시지 입력"
          disabled={!currentRoom}
        />
        <button onClick={sendMessage} disabled={!currentRoom}>
          전송
        </button>
      </div>
    </>
  );
};
