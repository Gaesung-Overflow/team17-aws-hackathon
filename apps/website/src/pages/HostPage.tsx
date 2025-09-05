import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';

export const HostPage = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');

  const { createRoom, onMessage, isConnected } = useWebSocket();

  useEffect(() => {
    onMessage((data) => {
      if (data.type === 'roomCreated') {
        navigate(
          `/game?roomId=${data.roomId}&isHost=true&roomName=${encodeURIComponent(data.roomName)}`,
        );
      }
    });
  }, [navigate, onMessage]);

  const handleCreateRoom = () => {
    if (!roomName.trim() || !isConnected) return;
    createRoom(roomName.trim());
    // 서버 응답을 기다림 (useEffect에서 처리)
  };

  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      <h1>게임 방장 페이지</h1>

      <div style={{ marginTop: '40px' }}>
        <label
          style={{ display: 'block', marginBottom: '10px', fontSize: '16px' }}
        >
          방 이름:
        </label>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="방 이름을 입력하세요"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            marginBottom: '20px',
            border: '1px solid #ccc',
            borderRadius: '5px',
          }}
        />

        <button
          onClick={handleCreateRoom}
          disabled={!roomName.trim()}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            backgroundColor: roomName.trim() ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: roomName.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          방 만들기
        </button>
      </div>
    </div>
  );
};
