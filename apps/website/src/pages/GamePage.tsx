import { ExternalPacmanGame } from 'game';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import '../App.css';
import '../styles/retro-ui.css';
import { Toast } from '../components/Toast';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { EmojiAnimation } from '../components/EmojiAnimation';
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

  const speedLevelToMs = (level: number) => 500 - (level - 1) * 50;
  const MAX_PLAYERS = 10;

  useEffect(() => {
    const cleanup = onMessage((data) => {
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
    }) as () => void;

    return cleanup;
  }, [onMessage]);

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

  const callbacks: GameCallbacks = {
    onPlayerEliminated: (playerId, rank) => {
      console.log(`플레이어 ${playerId} 탈락 - 순위: ${rank}`);
    },
    onGameEnd: (rankings) => {
      const winners = rankings
        .map((r) => {
          return {
            ...players.find((pl) => pl.id === r.playerId),
            rank: r.rank,
          };
        })
        .filter((p) => p);
      console.log('게임 종료:', winners);
      sendMessage({
        type: 'gameStateUpdate',
        state: 'finished',
        roomId,
        winners,
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
  };

  return (
    <div className="retro-game-page" style={{ padding: '20px' }}>
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
          onCommandProcessed={(index: number) => {
            setCommands((prev) => prev.filter((_, i) => i !== index));
          }}
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
    </div>
  );
};
