import React, { useState } from 'react';
import { ExternalPacmanGame } from './ExternalPacmanGame';
import type { ExternalPlayer, GameCallbacks } from '../game/external-types';

export const GameConfigExample: React.FC = () => {
  const [ghostLevel, setGhostLevel] = useState(1);
  const [playerSpeed, setPlayerSpeed] = useState(300);
  const [ghostSpeed, setGhostSpeed] = useState(300);
  const [maxPlayers, setMaxPlayers] = useState(4);
  
  const [players, setPlayers] = useState<ExternalPlayer[]>([
    { id: 'player1', name: '플레이어 1', emoji: '🔵' },
    { id: 'player2', name: '플레이어 2', emoji: '🟢' },
  ]);

  const callbacks: GameCallbacks = {
    onPlayerJoinFailed: (playerId, error) => {
      alert(`플레이어 ${playerId} 추가 실패: ${error.message}`);
    },
    onGameEnd: (rankings) => {
      console.log('게임 종료! 순위:', rankings);
    },
  };

  const addPlayer = () => {
    const newId = `player${players.length + 1}`;
    const newPlayer: ExternalPlayer = {
      id: newId,
      name: `플레이어 ${players.length + 1}`,
      emoji: ['🔵', '🟢', '🟡', '🟣', '🟠'][players.length] || '⚪',
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = () => {
    if (players.length > 0) {
      setPlayers(players.slice(0, -1));
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>게임 설정 예시</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <label>
            술래 레벨 (1-5): 
            <input
              type="range"
              min="1"
              max="5"
              value={ghostLevel}
              onChange={(e) => setGhostLevel(Number(e.target.value))}
            />
            <span>{ghostLevel}</span>
          </label>
        </div>
        
        <div>
          <label>
            플레이어 속도 (100-500ms): 
            <input
              type="range"
              min="100"
              max="500"
              step="50"
              value={playerSpeed}
              onChange={(e) => setPlayerSpeed(Number(e.target.value))}
            />
            <span>{playerSpeed}ms</span>
          </label>
        </div>
        
        <div>
          <label>
            술래 속도 (100-500ms): 
            <input
              type="range"
              min="100"
              max="500"
              step="50"
              value={ghostSpeed}
              onChange={(e) => setGhostSpeed(Number(e.target.value))}
            />
            <span>{ghostSpeed}ms</span>
          </label>
        </div>
        
        <div>
          <label>
            최대 플레이어 수 (2-8): 
            <input
              type="range"
              min="2"
              max="8"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            />
            <span>{maxPlayers}명</span>
          </label>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={addPlayer} disabled={players.length >= maxPlayers}>
          플레이어 추가 ({players.length}/{maxPlayers})
        </button>
        <button onClick={removePlayer} disabled={players.length === 0}>
          플레이어 제거
        </button>
      </div>

      <ExternalPacmanGame
        externalPlayers={players}
        callbacks={callbacks}
        gameConfig={{
          ghostLevel,
          playerSpeed,
          ghostSpeed,
          maxPlayers,
          cellSize: 25,
        }}
        autoStart={false}
      />
    </div>
  );
};