import React from 'react';

interface GameControlsProps {
  isRunning: boolean;
  ghostLevel: number;
  playerSpeed: number;
  ghostSpeed: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onGhostLevelChange: (level: number) => void;
  onPlayerSpeedChange: (speed: number) => void;
  onGhostSpeedChange: (speed: number) => void;
  onAddPlayer: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  isRunning,
  ghostLevel,
  playerSpeed,
  ghostSpeed,
  onStart,
  onStop,
  onReset,
  onGhostLevelChange,
  onPlayerSpeedChange,
  onGhostSpeedChange,
  onAddPlayer,
}) => {
  return (
    <div
      style={{
        margin: '20px 0',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
      }}
    >
      <button onClick={isRunning ? onStop : onStart}>
        {isRunning ? '⏸️ 정지' : '▶️ 시작'}
      </button>

      <button onClick={onReset}>🔄 리셋</button>

      <button onClick={onAddPlayer}>➕ 플레이어 추가</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <label>술래 레벨:</label>
        <select
          value={ghostLevel}
          onChange={(e) => onGhostLevelChange(Number(e.target.value))}
        >
          <option value={1}>1 - 기본</option>
          <option value={2}>2 - 예측</option>
          <option value={3}>3 - 전략</option>
          <option value={4}>4 - 고급</option>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <label>플레이어 속도:</label>
        <input
          type="range"
          min="1"
          max="9"
          step="1"
          value={Math.round((500 - playerSpeed) / 50) + 1}
          onChange={(e) =>
            onPlayerSpeedChange(500 - (Number(e.target.value) - 1) * 50)
          }
        />
        <span>{Math.round((500 - playerSpeed) / 50) + 1}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <label>고스트 속도:</label>
        <input
          type="range"
          min="1"
          max="9"
          step="1"
          value={Math.round((500 - ghostSpeed) / 50) + 1}
          onChange={(e) =>
            onGhostSpeedChange(500 - (Number(e.target.value) - 1) * 50)
          }
        />
        <span>{Math.round((500 - ghostSpeed) / 50) + 1}</span>
      </div>
    </div>
  );
};
