import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const JoinPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');

  const joinGame = () => {
    if (!playerName.trim()) return;

    // TODO: WebSocket으로 게임 참가 요청
    const newPlayerId = `player_${Date.now()}`;

    // 참가 완료 후 플레이어 페이지로 이동
    navigate(
      `/player?roomId=${roomId}&playerId=${newPlayerId}&playerName=${encodeURIComponent(playerName)}`,
    );
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
          onClick={joinGame}
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
