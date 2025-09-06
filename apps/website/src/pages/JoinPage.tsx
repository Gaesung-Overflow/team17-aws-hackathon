import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmojiPicker } from '../components/EmojiPicker';
import { useWebSocket } from '../hooks/useWebSocket';

export const JoinPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😀');
  const [clicked, setClicked] = useState(false);
  const { joinGame, onMessage, isConnected } = useWebSocket();

  useEffect(() => {
    const cleanup = onMessage((data) => {
      // if (!isJoining) return;
      console.log('JoinPage received message:', data);
      if (data.type === 'joinGameSuccess') {
        console.log('Join game success, navigating to player page');
        navigate(
          `/player?roomId=${roomId}&playerId=${data.playerId}&playerName=${encodeURIComponent(playerName)}&emoji=${encodeURIComponent(selectedEmoji)}`,
        );
      } else if (data.type === 'joinGameError') {
        console.error('Join game error:', data.error);
        alert(`게임 참가 실패: ${data.error}`);
      }
    });
    return () => {
      cleanup();
    };
  }, [navigate, onMessage, roomId, playerName, selectedEmoji]);

  const handleJoinGame = () => {
    if (!playerName.trim() || !isConnected || !roomId) {
      alert(
        '유효한 이름과 방 ID가 필요합니다. 또는 서버에 연결되어 있지 않습니다.',
      );
      return;
    }
    setClicked(true);
    joinGame(roomId, playerName.trim(), selectedEmoji);
  };

  return (
    <div
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ marginBottom: '40px' }}>
        <h1 className="retro-title neon-pulse">JOIN GAME</h1>
        <h2
          className="neon-glow-green retro-font"
          style={{ fontSize: '1.2rem', marginTop: '20px' }}
        >
          ROOM: {roomId}
        </h2>
        <p
          className="retro-text"
          style={{ marginTop: '15px', fontSize: '1rem' }}
        >
          게임에 참가하세요
        </p>
      </div>

      <div>
        <div style={{ marginBottom: '20px' }}>
          <label
            className="retro-text"
            style={{ display: 'block', marginBottom: '10px', fontSize: '16px' }}
          >
            PLAYER NAME:
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="이름을 입력하세요"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              marginBottom: '20px',
              background: 'var(--dark-bg)',
              color: 'var(--text-bright)',
              border: '2px solid var(--neon-green)',
              borderRadius: '5px',
              fontFamily: 'Courier New, monospace',
            }}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label
            className="retro-text"
            style={{ display: 'block', marginBottom: '10px', fontSize: '16px' }}
          >
            SELECT EMOJI:
          </label>
          <EmojiPicker
            selectedEmoji={selectedEmoji}
            onEmojiSelect={setSelectedEmoji}
          />
        </div>

        <button
          onClick={handleJoinGame}
          disabled={!playerName.trim() || !isConnected || clicked}
          className="retro-button"
          style={{
            fontSize: '18px',
            padding: '15px 30px',
            width: '100%',
            maxWidth: '300px',
            opacity: !playerName.trim() || !isConnected || clicked ? 0.5 : 1,
            cursor:
              !playerName.trim() || !isConnected || clicked
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          JOIN GAME
        </button>

        <div
          className="retro-text"
          style={{ marginTop: '15px', fontSize: '0.9rem' }}
        >
          연결 상태: {isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}
        </div>
      </div>
    </div>
  );
};
