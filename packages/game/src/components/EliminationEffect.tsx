import React, { useEffect, useState } from 'react';
import '../styles/elimination-effects.css';

interface EliminationEffectProps {
  playerId: string;
  playerEmoji: string;
  position: { x: number; y: number };
  cellSize: number;
  onComplete: () => void;
}

export const EliminationEffect: React.FC<EliminationEffectProps> = ({
  playerId,
  playerEmoji,
  position,
  cellSize,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="elimination-effect"
      style={{
        position: 'absolute',
        left: position.x * (cellSize + 2),
        top: position.y * (cellSize + 2),
        width: cellSize,
        height: cellSize,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {/* 흔들리는 이모지 */}
      <div className="elimination-emoji shake-effect">
        {playerEmoji}
      </div>
      
      {/* 날아가는 이모지 */}
      <div className="elimination-emoji fly-away-effect">
        {playerEmoji}
      </div>
      
      {/* 폭발 효과 */}
      <div className="explosion-effect">
        <div className="explosion-particle"></div>
        <div className="explosion-particle"></div>
        <div className="explosion-particle"></div>
        <div className="explosion-particle"></div>
      </div>
      
      {/* 화면 흔들림 효과 */}
      <div className="screen-shake-trigger"></div>
    </div>
  );
};