import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';

export const JoinPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const { joinGame, onMessage, isConnected } = useWebSocket();

  useEffect(() => {
    onMessage((data) => {
      if (data.type === 'joinRoom') {
        navigate(
          `/player?roomId=${roomId}&playerId=${data.playerId}&playerName=${encodeURIComponent(playerName)}`,
        );
      }
    });
  }, [navigate, onMessage, roomId, playerName]);

  const handleJoinGame = () => {
    if (!playerName.trim() || !isConnected || !roomId) return;
    joinGame(roomId, playerName.trim());
    // 서버 응답을 기다림 (useEffect에서 처리)
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>게임 참가</h1>
      <p>방 ID: {roomId}</p>

      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          플레이어 이름:
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="이름을 입력하세요"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            marginBottom: '20px',
          }}
        />

        <button
          onClick={handleJoinGame}
          disabled={!playerName.trim()}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            backgroundColor: playerName.trim() ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          게임 참가
        </button>
      </div>
    </div>
  );
};
