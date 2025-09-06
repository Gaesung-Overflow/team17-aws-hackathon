import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';

export const HostPage = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [clicked, setClicked] = useState(false);

  const { createRoom, onMessage, isConnected } = useWebSocket();

  useEffect(() => {
    const cleanup = onMessage((data) => {
      if (data.type === 'roomCreated') {
        navigate(
          `/game?roomId=${data.roomId}&isHost=true&roomName=${encodeURIComponent(data.roomName)}`,
        );
      }
    });
    return () => {
      cleanup();
    };
  }, [navigate, onMessage]);

  const handleCreateRoom = () => {
    if (!roomName.trim() || !isConnected) return;
    setClicked(true);
    createRoom(roomName.trim());
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
        <h1 className="retro-title neon-pulse">CREATE ROOM</h1>
        <p
          className="retro-text"
          style={{ marginTop: '15px', fontSize: '1rem' }}
        >
          새로운 게임방을 만들어보세요
        </p>
      </div>

      <div>
        <h3
          className="neon-glow-green retro-font"
          style={{ fontSize: '1.1rem', marginBottom: '20px' }}
        >
          ROOM SETTINGS
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <label
            className="retro-text"
            style={{ display: 'block', marginBottom: '10px', fontSize: '16px' }}
          >
            ROOM NAME:
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
              background: 'var(--dark-bg)',
              color: 'var(--text-bright)',
              border: '2px solid var(--neon-green)',
              borderRadius: '5px',
              fontFamily: 'Courier New, monospace',
            }}
          />
        </div>

        <button
          onClick={handleCreateRoom}
          disabled={!roomName.trim() || !isConnected || clicked}
          className="retro-button"
          style={{
            fontSize: '18px',
            padding: '15px 30px',
            opacity: !roomName.trim() || !isConnected || clicked ? 0.5 : 1,
            cursor:
              !roomName.trim() || !isConnected || clicked
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          START GAME
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
