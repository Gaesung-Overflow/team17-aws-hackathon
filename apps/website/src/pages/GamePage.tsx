import { ExternalPacmanGame } from 'game';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../App.css';
import { ChatContainer } from '../chat/Container';
import { Toast } from '../components/Toast';
import type { ExternalPlayer, GameCallbacks, PlayerCommand } from '../types';

export const GamePage = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const roomName = searchParams.get('roomName');
  const isHost = searchParams.get('isHost') === 'true';

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
            <div
              style={{
                width: '150px',
                height: '150px',
                border: '2px solid #007bff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
              }}
            >
              QR 코드
              <br />
              {roomId}
            </div>
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
          }}
        >
          <h3>플레이어 관리</h3>
          <button onClick={addPlayer} style={{ marginBottom: '10px' }}>
            플레이어 추가
          </button>
          <div>
            참가자: {players.length}/{MAX_PLAYERS}명
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
        }}
      />
      <ChatContainer />
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
