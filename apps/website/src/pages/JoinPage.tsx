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
      console.log('JoinPage received message:', data);
      if (data.type === 'joinGameSuccess') {
        console.log('Join game success, navigating to player page');
        navigate(
          `/player?roomId=${roomId}&playerId=${data.playerId}&playerName=${encodeURIComponent(playerName)}`,
        );
      } else if (data.type === 'joinGameError') {
        console.error('Join game error:', data.error);
        alert(`게임 참가 실패: ${data.error}`);
      }
    });
  }, [navigate, onMessage, roomId, playerName]);

  const handleJoinGame = () => {
    if (!playerName.trim() || !isConnected || !roomId) {
      alert(
        '유효한 이름과 방 ID가 필요합니다. 또는 서버에 연결되어 있지 않습니다.',
      );
      return;
    }
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
