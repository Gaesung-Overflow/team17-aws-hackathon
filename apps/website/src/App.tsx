import { ExternalPacmanGame } from 'game';
import type { ExternalPlayer, GameCallbacks, PlayerCommand } from './types';
import { useState } from 'react';
import './App.css';
import { ChatContainer } from './chat/Container';
import { Toast } from './components/Toast';

const App = () => {
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

  // const boostPlayer = (playerId: string) => {
  //   setCommands((prev) => [
  //     ...prev,
  //     {
  //       playerId,
  //       type: 'boost',
  //       data: { duration: 5000, speedMultiplier: 2 },
  //     },
  //   ]);
  // };

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
      <h1>돔황챠 - 팩맨 서바이벌</h1>

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

export default App;
