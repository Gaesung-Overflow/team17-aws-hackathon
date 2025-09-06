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
  const { sendMessage, onMessage, isConnected } = useWebSocket();

  const [players, setPlayers] = useState<ExternalPlayer[]>([]);
  const [commands, setCommands] = useState<PlayerCommand[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
  } | null>(null);
  const [gameSettings, setGameSettings] = useState({
    playerSpeedLevel: 5,
    ghostSpeedLevel: 5,
    ghostLevel: 3,
  });

  const speedLevelToMs = (level: number) => 500 - (level - 1) * 50;
  const MAX_PLAYERS = 10;

  // 웹소켓 메시지 처리
  useEffect(() => {
    onMessage((data) => {
      console.log('🎮 GamePage received message:', data);

      // 모든 메시지 타입 로깅
      if (data.type) {
        console.log(`📨 Message type: ${data.type}`);
      }

      if (data.type === 'playerJoined') {
        // 새 플레이어를 게임에 추가
        setPlayers((prev) => {
          const newPlayer: ExternalPlayer = {
            id: data.playerId,
            name: data.playerName,
            avatar: ['🚀', '🎉', '🎆', '⭐'][prev.length % 4],
          };
          return [...prev, newPlayer];
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
        // 플레이어 액션을 게임 명령으로 변환
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
    });
  }, [onMessage, isHost]);

  // GamePage에서는 이미 방이 생성된 상태로 오므로 createRoom 호출 제거

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
      avatar: ['🚀', '🎉', '🎆', '⭐'][players.length % 4],
    };
    setPlayers((prev) => [...prev, newPlayer]);
    setCommands((prev) => [...prev, { playerId: newPlayer.id, type: 'add' }]);
  };

  const callbacks: GameCallbacks = {
    onPlayerEliminated: (playerId, rank) => {
      console.log(`플레이어 ${playerId} 탈락 - 순위: ${rank}`);
    },
    onGameEnd: (rankings) => {
      console.log('게임 종료:', rankings);
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
          <h1>돔황챠 - 팩맨 서바이벌</h1>
          {roomName && (
            <h2 style={{ margin: '5px 0', color: '#007bff' }}>{roomName}</h2>
          )}
        </div>
        {roomId && (
          <div style={{ textAlign: 'right' }}>
            <div>
              방 ID: <strong>{roomId}</strong>
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {isHost ? '방장' : '참가자'}
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

      {isHost && roomId && (
        <div
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h3>참가자 초대</h3>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <QRCodeDisplay
              value={`${window.location.origin}/join/${roomId}`}
              size={150}
            />
            <div>
              <p>
                <strong>참가 방법:</strong>
              </p>
              <p>1. QR 코드 스캔</p>
              <p>2. 또는 직접 접속:</p>
              <code style={{ backgroundColor: '#eee', padding: '5px' }}>
                {window.location.origin}/join/{roomId}
              </code>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '8px',
            minWidth: '300px',
          }}
        >
          <h3>게임 설정</h3>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
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
              >
                <option value={2}>쉬움</option>
                <option value={3}>보통</option>
                <option value={4}>어려움</option>
              </select>
            </div>
          </div>
        </div>

        <div
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '8px',
            minWidth: '300px',
          }}
        >
          <h3>
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
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{player.avatar}</span>
                  <span style={{ fontWeight: 'bold' }}>{player.name}</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    #{index + 1}
                  </span>
                </div>
              ))
            )}
          </div>

          {isHost && players.length > 0 && (
            <button
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                width: '100%',
              }}
            >
              게임 시작
            </button>
          )}
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
