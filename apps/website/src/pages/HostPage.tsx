import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const HostPage = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');

  const createRoom = () => {
    if (!roomName.trim()) return;

    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    // TODO: WebSocket으로 방 생성 요청
    navigate(
      `/game?roomId=${newRoomId}&isHost=true&roomName=${encodeURIComponent(roomName)}`,
    );
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
          onClick={createRoom}
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
