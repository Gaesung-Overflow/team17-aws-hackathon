import { ExternalPacmanGame } from 'game';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import '../App.css';
import { Toast } from '../components/Toast';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
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

  const addPlayer = () => {
    if (players.length >= MAX_PLAYERS) {
      setToast({
        message: `최대 ${MAX_PLAYERS}명까지만 참가할 수 있습니다.`,
        type: 'error',
      });
      return;
    }

    const newPlayer = {
      id: `player_${Date.now()}`,
      name: `플레이어 ${players.length + 1}`,
      emoji: ['🚀', '🎉', '🎆', '⭐'][players.length % 4],
      joinedAt: Date.now(),
    };
    setPlayers((prev) =>
      [...prev, newPlayer].sort(
        (a, b) => (b.joinedAt || 0) - (a.joinedAt || 0),
      ),
    );
    setCommands((prev) => [...prev, { playerId: newPlayer.id, type: 'add' }]);
  };

  const callbacks: GameCallbacks = {
    onPlayerEliminated: (playerId, rank) => {
      console.log(`플레이어 ${playerId} 탈락 - 순위: ${rank}`);
    },
    onGameEnd: (rankings) => {
      console.log('게임 종료:', rankings);
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
  };

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          {roomName && <h1 style={{ color: '#007bff' }}>{roomName}</h1>}
        </div>
        {roomId && (
          <div style={{ textAlign: 'right' }}>
            <div>
              방 ID: <strong>{roomId}</strong>
            </div>
            <div
              style={{
                fontSize: '12px',
                color: isConnected ? '#28a745' : '#dc3545',
                marginTop: '5px',
              }}
            >
              ● {isConnected ? '연결됨' : '연결 끊어짐'}
            </div>
            {isConnected && (
              <button
                onClick={() =>
                  sendMessage({ type: 'test', message: 'Hello from GamePage' })
                }
                style={{
                  marginTop: '5px',
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                }}
              >
                테스트 메시지
              </button>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        {isHost && roomId && (
          <div
            style={{
              border: '1px solid #ccc',
              padding: '15px',
              borderRadius: '8px',
              minWidth: '300px',
              flexGrow: 1,
            }}
          >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
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
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  지금 참가하세요!
                </h2>
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
        <div
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '8px',
            minWidth: '300px',
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>게임 설정</h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>맵 선택:</span>
              <select
                value={gameSettings.selectedMapId}
                onChange={(e) =>
                  setGameSettings((prev) => ({
                    ...prev,
                    selectedMapId: e.target.value,
                  }))
                }
                disabled={gameStarted}
                style={{
                  opacity: gameStarted ? 0.5 : 1,
                  cursor: gameStarted ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="classic">클래식 (보통)</option>
                <option value="open">오픈 필드 (쉬움)</option>
                <option value="cross">십자가 (보통)</option>
                <option value="maze">미로 (어려움)</option>
                <option value="spiral">스파이럴 (어려움)</option>
              </select>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>플레이어 속도: {gameSettings.playerSpeedLevel}</span>
              <input
                type="range"
                min="1"
                max="9"
                step="1"
                value={gameSettings.playerSpeedLevel}
                onChange={(e) =>
                  setGameSettings((prev) => ({
                    ...prev,
                    playerSpeedLevel: parseInt(e.target.value),
                  }))
                }
                disabled={gameStarted}
                style={{ opacity: gameStarted ? 0.5 : 1 }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>술래 속도: {gameSettings.ghostSpeedLevel}</span>
              <input
                type="range"
                min="1"
                max="9"
                step="1"
                value={gameSettings.ghostSpeedLevel}
                onChange={(e) =>
                  setGameSettings((prev) => ({
                    ...prev,
                    ghostSpeedLevel: parseInt(e.target.value),
                  }))
                }
                disabled={gameStarted}
                style={{ opacity: gameStarted ? 0.5 : 1 }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>술래 난이도:</span>
              <select
                value={gameSettings.ghostLevel}
                onChange={(e) =>
                  setGameSettings((prev) => ({
                    ...prev,
                    ghostLevel: parseInt(e.target.value),
                  }))
                }
                disabled={gameStarted}
                style={{
                  opacity: gameStarted ? 0.5 : 1,
                  cursor: gameStarted ? 'not-allowed' : 'pointer',
                }}
              >
                <option value={2}>쉬움</option>
                <option value={3}>보통</option>
                <option value={4}>어려움</option>
              </select>
            </div>
            {gameStarted && (
              <div
                style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}
              >
                게임 시작 후에는 설정을 변경할 수 없습니다.
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '8px',
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>
            참가자 목록 ({players.length}/{MAX_PLAYERS}명)
          </h3>

          {isHost && (
            <button
              onClick={addPlayer}
              style={{ marginBottom: '15px', padding: '8px 16px' }}
            >
              테스트 플레이어 추가
            </button>
          )}

          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {players.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                참가자를 기다리는 중...
              </p>
            ) : (
              players.map((player, index) => (
                <div
                  key={player.id}
                  style={{
                    padding: '8px 12px',
                    marginBottom: '5px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#333',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{player.emoji}</span>
                  <span style={{ fontWeight: 'bold' }}>{player.name}</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    #{index + 1}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
