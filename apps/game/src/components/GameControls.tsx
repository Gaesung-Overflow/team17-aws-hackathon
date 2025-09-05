import React from 'react';

interface GameControlsProps {
  isRunning: boolean;
  ghostLevel: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onGhostLevelChange: (level: number) => void;
  onAddPlayer: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  isRunning,
  ghostLevel,
  onStart,
  onStop,
  onReset,
  onGhostLevelChange,
  onAddPlayer
}) => {
  return (
    <div style={{ margin: '20px 0', display: 'flex', gap: '10px', alignItems: 'center' }}>
      <button onClick={isRunning ? onStop : onStart}>
        {isRunning ? '⏸️ 정지' : '▶️ 시작'}
      </button>
      
      <button onClick={onReset}>
        🔄 리셋
      </button>
      
      <button onClick={onAddPlayer}>
        ➕ 플레이어 추가
      </button>
      
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
    </div>
  );
};