import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { ArcadeBackground } from '../components/ArcadeBackground';
import { GlitchText } from '../components/GlitchText';
import { PulsingButton } from '../components/PulsingButton';

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
      className="fade-in"
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <ArcadeBackground />
      <div className="slide-in-left" style={{ marginBottom: '40px' }}>
        <GlitchText
          className="retro-title neon-pulse"
          style={{ fontSize: '2.5rem', marginBottom: '20px' }}
        >
          CREATE ROOM
        </GlitchText>
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

        <PulsingButton
          onClick={handleCreateRoom}
          disabled={!roomName.trim() || !isConnected || clicked}
          style={{
            fontSize: '18px',
            width: '100%',
            maxWidth: '300px',
          }}
        >
          {clicked ? 'CREATING...' : 'START GAME'}
        </PulsingButton>

        <div
          className="retro-text slide-in-right"
          style={{ marginTop: '15px', fontSize: '0.9rem' }}
        >
          연결 상태: {isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}
        </div>
        {clicked && <div className="arcade-spinner" />}
      </div>
    </div>
  );
};
