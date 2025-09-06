import { ExternalPacmanGame } from 'game';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfettiExplosion from 'react-confetti-explosion';
import { useSearchParams } from 'react-router-dom';
import '../App.css';
import { EmojiAnimation } from '../components/EmojiAnimation';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { Toast } from '../components/Toast';
import { useWebSocket } from '../hooks/useWebSocket';
import '../styles/retro-ui.css';

// 로딩 애니메이션 스타일 추가
const loadingStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  @keyframes vortex {
    0% { transform: rotate(0deg) scale(1); }
    100% { transform: rotate(360deg) scale(0.1); }
  }
  @keyframes suckIn {
    0% { transform: scale(1) rotate(0deg); opacity: 1; }
    100% { transform: scale(0) rotate(720deg); opacity: 0; }
  }
`;

// 스타일 태그 추가
if (!document.querySelector('#loading-styles')) {
  const style = document.createElement('style');
  style.id = 'loading-styles';
  style.textContent = loadingStyles;
  document.head.appendChild(style);
}
import type { ExternalPlayer, GameCallbacks, PlayerCommand } from '../types';

export const GamePage = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const roomName = searchParams.get('roomName');
  const isHost = searchParams.get('isHost') === 'true';
  const webSocket = useWebSocket();
  const { sendMessage, onMessage, isConnected } = webSocket;

  const [players, setPlayers] = useState<ExternalPlayer[]>([]);
  const [commands, setCommands] = useState<PlayerCommand[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
  } | null>(null);
  const [gameSettings, setGameSettings] = useState({
    playerSpeedLevel: 5,
    ghostSpeedLevel: 6,
    ghostLevel: 4,
    selectedMapId: 'classic',
  });
  const [gameStarted] = useState(false);
  const [cheerEmojis, setCheerEmojis] = useState<string[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [winners, setWinners] = useState<
    Array<{ id: string; name?: string; emoji?: string; rank: number }>
  >([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const speedLevelToMs = (level: number) => 500 - (level - 1) * 50;
  const MAX_PLAYERS = 10;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMessage = useCallback((data: any) => {
    console.log('GamePage received message:', data);

    if (data.type === 'playerJoined') {
      setPlayers((prev) => {
        const newPlayer: ExternalPlayer = {
          id: data.playerId,
          name: data.playerName,
          emoji: data.emoji,
          joinedAt: Date.now(),
        };
        return [...prev, newPlayer].sort(
          (a, b) => (b.joinedAt || 0) - (a.joinedAt || 0),
        );
      });

      setCommands((prev) => [
        ...prev,
        { playerId: data.playerId, type: 'add' },
      ]);

      setToast({
        message: `${data.playerName}님이 참가했습니다!`,
        type: 'success',
      });
    }

    if (data.type === 'playerAction') {
      if (data.action === 'cheer') {
        setCheerEmojis([data.emoji]);
        setTimeout(() => setCheerEmojis([]), 100);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actionMap: Record<string, any> = {
        up: { type: 'move', direction: 'up' },
        down: { type: 'move', direction: 'down' },
        left: { type: 'move', direction: 'left' },
        right: { type: 'move', direction: 'right' },
        boost: { type: 'boost', duration: 3000, speedMultiplier: 2 },
      };

      const gameAction = actionMap[data.action];
      if (gameAction) {
        setCommands((prev) => [
          ...prev,
          {
            playerId: data.playerId,
            ...gameAction,
          },
        ]);
      }
    }

    if (data.type === 'testResponse') {
      setToast({
        message: data.message,
        type: 'success',
      });
    }
  }, []);

  useEffect(() => {
    const cleanup = onMessage(handleMessage);
    return cleanup as () => void;
  }, [onMessage, handleMessage]);

  // 방 입장 처리
  useEffect(() => {
    if (roomId && isConnected) {
      sendMessage({ type: 'joinRoom', roomId });
    }
  }, [roomId, isConnected, sendMessage]);

  // const addPlayer = () => {
  //   if (players.length >= MAX_PLAYERS) {
  //     setToast({
  //       message: `최대 ${MAX_PLAYERS}명까지만 참가할 수 있습니다.`,
  //       type: 'error',
  //     });
  //     return;
  //   }

  //   const newPlayer = {
  //     id: `player_${Date.now()}`,
  //     name: `플레이어 ${players.length + 1}`,
  //     emoji: ['🚀', '🎉', '🎆', '⭐'][players.length % 4],
  //     joinedAt: Date.now(),
  //   };
  //   setPlayers((prev) =>
  //     [...prev, newPlayer].sort(
  //       (a, b) => (b.joinedAt || 0) - (a.joinedAt || 0),
  //     ),
  //   );
  //   setCommands((prev) => [...prev, { playerId: newPlayer.id, type: 'add' }]);
  // };

  const callbacks: GameCallbacks = useMemo(
    () => ({
      onPlayerEliminated: (playerId, rank) => {
        console.log(`플레이어 ${playerId} 탈락 - 순위: ${rank}`);
      },
      onGameEnd: (rankings) => {
        const gameWinners = rankings
          .map((r) => {
            const player = players.find((pl) => pl.id === r.playerId);
            return {
              id: r.playerId,
              name: player?.name,
              emoji: player?.emoji,
              rank: r.rank,
            };
          })
          .filter((p) => p);
        console.log('게임 종료:', gameWinners);
        setWinners(gameWinners);
        setGameFinished(true);
        setShowConfetti(true);
        sendMessage({
          type: 'gameStateUpdate',
          state: 'finished',
          roomId,
          winners: gameWinners,
        });
      },
      onGameStateChange: (state) => {
        console.log('게임 상태 변경:', state);
        sendMessage({ type: 'gameStateUpdate', state, roomId });

        if (state === 'running') {
          setToast({
            message: '게임이 시작되었습니다!',
            type: 'info',
          });
        }
      },
      onPlayerJoinFailed: (_, error) => {
        setToast({
          message: error.message,
          type: 'error',
        });
      },
      onGameReset: () => {
        setPlayers([]);
        setCommands([]);
        setToast({
          message: '게임이 리셋되었습니다.',
          type: 'info',
        });
      },
      onConfigChange: (config) => {
        setGameSettings({
          playerSpeedLevel: config.playerSpeedLevel,
          ghostSpeedLevel: config.ghostSpeedLevel,
          ghostLevel: config.ghostLevel,
          selectedMapId: config.selectedMapId,
        });
      },
    }),
    [players, sendMessage, roomId],
  );

  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOverlay(false);
    }, 580); // 애니메이션 완료 후 제거
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="retro-game-page" style={{ padding: '20px' }}>
      {showOverlay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {/* 빨려들어가는 배경 원들 */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${200 + i * 100}px`,
                height: `${200 + i * 100}px`,
                border: '2px solid var(--neon-cyan)',
                borderRadius: '50%',
                animation: `vortex ${2 + i * 0.3}s linear infinite`,
                opacity: 0.3 - i * 0.03,
              }}
            />
          ))}

          <div
            className="retro-font neon-glow-cyan neon-pulse"
            style={{
              fontSize: '48px',
              textAlign: 'center',
              marginBottom: '20px',
              textTransform: 'uppercase',
              letterSpacing: '4px',
              zIndex: 10,
              animation: 'suckIn 0.3s ease-in-out forwards',
              animationDelay: '0.25s',
            }}
          >
            LOADING
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'var(--neon-cyan)',
                  borderRadius: '50%',
                  animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite, suckIn 0.3s ease-in-out forwards`,
                  animationDelay: `0s, ${0.25 + i * 0.05}s`,
                  boxShadow: '0 0 10px var(--neon-cyan)',
                }}
              />
            ))}
          </div>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>{roomName && <h1 className="retro-title">{roomName}</h1>}</div>
        {roomId && (
          <div style={{ textAlign: 'right' }}>
            <div className="retro-room-id">ROOM: {roomId}</div>
            <div
              className={`retro-connection-status ${isConnected ? 'connected' : 'disconnected'}`}
              style={{ marginTop: '10px' }}
            >
              ● {isConnected ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        )}
      </div>

      {/* <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div
          className="retro-panel"
          style={{
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <h3 className="retro-qr-title">
            PLAYERS ({players.length}/{MAX_PLAYERS})
          </h3>

          {isHost && (
            <button
              className="retro-button"
              onClick={addPlayer}
              style={{ marginBottom: '15px' }}
            >
              ADD TEST PLAYER
            </button>
          )}

          <div className="retro-player-list">
            {players.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                참가자를 기다리는 중...
              </p>
            ) : (
              players.map((player, index) => (
                <div key={player.id} className="retro-player-item">
                  <span style={{ fontSize: '20px' }}>{player.emoji}</span>
                  <span style={{ fontWeight: 'bold' }}>{player.name}</span>
                  <span
                    style={{ fontSize: '8px', color: 'var(--neon-yellow)' }}
                  >
                    #{index + 1}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div> */}

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {isHost && roomId && (
          <div className="retro-panel retro-qr-panel" style={{ flexGrow: 1 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                alignItems: 'center',
              }}
            >
              <QRCodeDisplay
                value={`${window.location.origin}/join/${roomId}`}
                size={150}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                }}
              >
                <h2 className="retro-qr-title">JOIN NOW!</h2>
                <p>1. QR 코드 스캔</p>
                <p>
                  2. 또는 직접 접속:
                  <br />
                  {window.location.origin}/join/{roomId}
                </p>
              </div>
            </div>
          </div>
        )}
        <ExternalPacmanGame
          externalPlayers={players}
          playerCommands={commands}
          callbacks={callbacks}
          onCommandProcessed={useCallback((index: number) => {
            setCommands((prev) => prev.filter((_, i) => i !== index));
          }, [])}
          autoStart={false}
          gameConfig={{
            maxPlayers: MAX_PLAYERS,
            playerSpeed: speedLevelToMs(gameSettings.playerSpeedLevel),
            ghostSpeed: speedLevelToMs(gameSettings.ghostSpeedLevel),
            ghostLevel: gameSettings.ghostLevel,
            selectedMapId: gameSettings.selectedMapId,
            gameStarted: gameStarted,
          }}
        />
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <EmojiAnimation emojis={cheerEmojis} />

      {gameFinished && winners.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0.95) 70%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
          }}
        >
          {showConfetti && (
            <ConfettiExplosion
              particleCount={200}
              duration={3000}
              colors={['#00ff41', '#00ffff', '#ff0080', '#ffff00']}
              onComplete={() => setShowConfetti(false)}
              zIndex={1001}
            />
          )}

          <button
            onClick={() => setGameFinished(false)}
            className="retro-button"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              fontSize: '20px',
              padding: 0,
            }}
          >
            ✕
          </button>

          <div
            className="retro-font neon-glow-cyan neon-pulse"
            style={{
              textAlign: 'center',
              fontSize: '48px',
              marginBottom: '40px',
              textTransform: 'uppercase',
            }}
          >
            🎉 GAME OVER 🎉
          </div>

          <div
            className="retro-panel"
            style={{ padding: '30px', minWidth: '500px' }}
          >
            <h3
              className="retro-font neon-glow-yellow"
              style={{
                textAlign: 'center',
                marginBottom: '30px',
                fontSize: '24px',
              }}
            >
              FINAL RANKINGS
            </h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              {winners.slice(0, 3).map((winner) => (
                <div
                  key={winner.id}
                  className="arcade-info-panel"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    padding: '20px',
                    border: `2px solid ${winner.rank === 1 ? 'var(--neon-yellow)' : winner.rank === 2 ? 'var(--neon-cyan)' : 'var(--neon-pink)'}`,
                    boxShadow: `0 0 20px ${winner.rank === 1 ? 'rgba(255, 255, 0, 0.5)' : winner.rank === 2 ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 0, 128, 0.5)'}`,
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '40px' }}>
                    {winner.rank === 1 ? '🥇' : winner.rank === 2 ? '🥈' : '🥉'}
                  </span>
                  <span
                    className={`retro-font ${winner.rank === 1 ? 'neon-glow-yellow' : winner.rank === 2 ? 'neon-glow-cyan' : 'neon-glow-pink'}`}
                  >
                    {winner.rank} PLACE
                  </span>
                  <span style={{ fontSize: '40px' }}>{winner.emoji}</span>
                  <span className="retro-font neon-glow-green">
                    {winner.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
