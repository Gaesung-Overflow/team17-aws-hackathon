import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { EmojiAnimation } from '../components/EmojiAnimation';
import { VictoryAnimation } from '../components/VictoryAnimation';

export const PlayerPage = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const playerId = searchParams.get('playerId');
  const playerName = searchParams.get('playerName');
  const initialEmoji = searchParams.get('emoji') || '😀';

  const { sendPlayerAction, onMessage, isConnected } = useWebSocket();
  const [gameState, setGameState] = useState<
    'waiting' | 'running' | 'eliminated' | 'finished'
  >('waiting');
  const [cheerEmojis, setCheerEmojis] = useState<string[]>([]);
  const [myRank, setMyRank] = useState<number>();

  useEffect(() => {
    const cleanup = onMessage((data) => {
      if (data.type === 'gameStateUpdate') {
        console.log('게임 상태 업데이트:', data);
        if (data.state === 'finished' && data.winners) {
          data.winners.forEach((winner: { id: string; rank: number }) => {
            if (winner.id === playerId) {
              setMyRank(winner.rank);
            }
          });
        }
        setGameState(data.state ?? 'waiting');
      }
      if (data.type === 'playerAction') {
        if (data.action === 'cheer') {
          setCheerEmojis([data.emoji]);
          setTimeout(() => setCheerEmojis([]), 100);
        }
      }
    });
    return () => {
      cleanup();
    };
  }, [onMessage]);

  const sendAction = (action: string) => {
    if (!isConnected || !roomId) return;
    sendPlayerAction(roomId, action, initialEmoji);
  };

  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        maxWidth: '400px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ marginBottom: '30px' }}>
        <div
          className="neon-glow-green"
          style={{ fontSize: '2rem', marginBottom: '10px' }}
        >
          🎮
        </div>
        <h2
          className="neon-glow-green retro-font"
          style={{ fontSize: '1.2rem', marginBottom: '15px' }}
        >
          CONTROLLER
        </h2>
        <div
          className="retro-text"
          style={{ fontSize: '14px', marginTop: '10px' }}
        >
          <div>ROOM: {roomId}</div>
          <div>PLAYER: {playerName}</div>
          <div>EMOJI: {initialEmoji}</div>
          <div style={{ marginTop: '10px' }}>
            {isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}
          </div>
        </div>
      </div>

      {gameState === 'waiting' && (
        <div>
          <h3
            className="neon-glow-cyan retro-font"
            style={{ fontSize: '1.1rem', marginBottom: '20px' }}
          >
            WAITING FOR GAME...
          </h3>
          <p className="retro-text" style={{ marginBottom: '10px' }}>
            방장이 게임을 시작할 때까지
          </p>
          <p className="retro-text" style={{ marginBottom: '30px' }}>
            기다려주세요
          </p>

          <button
            onClick={() => sendAction('cheer')}
            className="retro-button"
            style={{
              fontSize: '16px',
              padding: '15px 30px',
              width: '100%',
            }}
          >
            CHEER {initialEmoji}
          </button>
        </div>
      )}

      {gameState === 'running' && (
        <div>
          <h3
            className="neon-glow-green retro-font"
            style={{ fontSize: '1.1rem', marginBottom: '30px' }}
          >
            GAME RUNNING
          </h3>

          <button
            onClick={() => sendAction('cheer')}
            className="retro-button"
            style={{
              fontSize: '16px',
              padding: '15px 30px',
              width: '100%',
            }}
          >
            CHEER {initialEmoji}
          </button>
        </div>
      )}

      {gameState === 'eliminated' && (
        <div>
          <h3
            className="neon-glow-red retro-font"
            style={{ fontSize: '1.1rem', marginBottom: '20px' }}
          >
            😵 ELIMINATED!
          </h3>
          <p className="retro-text">다음 게임을 기다려주세요</p>
        </div>
      )}

      {gameState === 'finished' && (
        <div>
          <h3
            className="neon-glow-yellow retro-font"
            style={{ fontSize: '1.1rem', marginBottom: '20px' }}
          >
            🎉 GAME FINISHED!
          </h3>
          <p className="retro-text" style={{ marginBottom: '20px' }}>
            새로운 게임을 기다려주세요
          </p>
          <VictoryAnimation myRank={myRank} />
        </div>
      )}

      <EmojiAnimation emojis={cheerEmojis} />
    </div>
  );
};
