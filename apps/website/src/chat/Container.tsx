import { useEffect, useRef } from 'react';

export const ChatContainer = () => {
  const ws = useRef<WebSocket | null>(null);

  const sendMessage = () => {
    const input = document.getElementById('messageInput') as HTMLInputElement;
    const message = input.value;
    if (message && ws.current) {
      ws.current.send(JSON.stringify({ message }));
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
    // WebSocket URL을 여기에 입력하세요 (terraform apply 후 출력됨)
    ws.current = new WebSocket(
      'wss://lczr545025.execute-api.us-east-1.amazonaws.com/prod',
    );

    ws.current.onopen = () => {
      console.log('연결됨');
      addMessage('서버에 연결되었습니다');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addMessage(`받은 메시지: ${data.message}`);
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
      <div id="messages"></div>
      <input type="text" id="messageInput" placeholder="메시지 입력" />
      <button onClick={sendMessage}>전송</button>
    </>
  );
};
