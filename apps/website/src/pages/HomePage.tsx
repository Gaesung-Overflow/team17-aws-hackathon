import { Link } from 'react-router-dom';

export const HomePage = () => {
  return (
    <div
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ marginBottom: '40px' }}>
        <h1 className="retro-title neon-pulse">LASTBYTE</h1>
        <h2
          className="neon-glow-green retro-font"
          style={{ fontSize: '1.2rem', marginTop: '20px' }}
        >
          PACMAN SURVIVAL
        </h2>
        <p
          className="retro-text"
          style={{ marginTop: '15px', fontSize: '1rem' }}
        >
          실시간 멀티플레이어 팩맨 게임
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '30px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '40px',
        }}
      >
        <Link
          to="/host"
          className="retro-button"
          style={{
            fontSize: '18px',
            padding: '20px 40px',
          }}
        >
          CREATE ROOM
        </Link>

        <Link
          to="/game"
          className="retro-button"
          style={{
            fontSize: '18px',
            padding: '20px 40px',
          }}
        >
          LOCAL GAME
        </Link>
      </div>

      <div className="retro-panel">
        <h3
          className="neon-glow-green retro-font"
          style={{ fontSize: '1.1rem', marginBottom: '20px' }}
        >
          HOW TO PLAY
        </h3>
        <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
          <p className="retro-text" style={{ marginBottom: '10px' }}>
            1. 방장이 "CREATE ROOM"으로 게임방을 생성합니다
          </p>
          <p className="retro-text" style={{ marginBottom: '10px' }}>
            2. QR 코드를 스캔하거나 방 ID로 접속합니다
          </p>
          <p className="retro-text">3. 이름을 입력하고 게임에 참가합니다</p>
        </div>
      </div>
    </div>
  );
};
