import React from 'react';
import { GameState, Position } from '../game/types';

interface GameBoardProps {
  gameState: GameState;
  cellSize?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  cellSize = 50,
}) => {
  const { mapSize, walls, players, ghost, playerNames } = gameState;

  const isWall = (x: number, y: number): boolean => {
    return walls.some((wall) => wall.x === x && wall.y === y);
  };

  const isPlayer = (
    x: number,
    y: number,
  ): { index: number; isEliminated: boolean } => {
    const index = players.findIndex(
      (player) => player.x === x && player.y === y,
    );
    const isEliminated =
      index !== -1 && gameState.eliminatedPlayers?.includes(index);
    return { index, isEliminated };
  };

  const getCellContent = (x: number, y: number) => {
    if (isWall(x, y)) return '⬛';

    // 제거된 플레이어만 그리드에 표시 (생존 플레이어와 고스트는 따로 렌더링)
    const playerInfo = isPlayer(x, y);
    if (playerInfo.index !== -1 && playerInfo.isEliminated) {
      return '💀';
    }

    return '';
  };

  const getCellStyle = (x: number, y: number) => {
    const baseStyle = {
      width: cellSize,
      height: cellSize,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: cellSize * 0.7,
      border: '1px solid #ddd',
      position: 'relative' as const,
      boxSizing: 'content-box' as const,
    };

    if (isWall(x, y)) {
      return { ...baseStyle, backgroundColor: '#333' };
    }

    const playerInfo = isPlayer(x, y);
    if (playerInfo.index !== -1 && playerInfo.isEliminated) {
      return { ...baseStyle, backgroundColor: '#ffebee', zIndex: 1 };
    }

    return { ...baseStyle, backgroundColor: '#f9f9f9', zIndex: 2 };
  };

  const getSmoothEntityStyle = (pos: Position, zIndex: number = 10) => {
    return {
      position: 'absolute' as const,
      left: pos.x * (cellSize + 2),
      top: pos.y * (cellSize + 2),
      width: cellSize,
      height: cellSize,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: cellSize * 0.7,
      zIndex,
      transition: 'none',
      pointerEvents: 'none' as const,
    };
  };

  const playerEmojis = ['🔵', '🟢', '🟡', '🟣', '🟠', '🔴', '⚫', '⚪'];

  return (
    <div
      style={{
        display: 'inline-block',
        border: '2px solid #000',
        backgroundColor: '#000',
        position: 'relative',
      }}
    >
      {/* 그리드 배경 */}
      {Array.from({ length: mapSize.height }, (_, y) => (
        <div key={y} style={{ display: 'flex' }}>
          {Array.from({ length: mapSize.width }, (_, x) => (
            <div key={`${x}-${y}`} style={getCellStyle(x, y)}>
              {getCellContent(x, y)}
            </div>
          ))}
        </div>
      ))}

      {/* 생존 플레이어들 부드럽게 렌더링 */}
      {players.map((player, index) => {
        if (gameState.eliminatedPlayers?.includes(index)) return null;
        const playerName = playerNames?.[index] || `Player ${index + 1}`;
        return (
          <div key={`player-${index}`} style={getSmoothEntityStyle(player, 10)}>
            {playerEmojis[index % playerEmojis.length]}
            <div
              style={{
                position: 'absolute',
                top: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 10,
                fontWeight: 'bold',
                color: '#333',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '2px 4px',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
                border: '1px solid #ccc',
                zIndex: 1000,
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {playerName}
            </div>
          </div>
        );
      })}

      {/* 고스트 부드럽게 렌더링 */}
      <div style={getSmoothEntityStyle(ghost, 11)}>
        👻
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 10,
            fontWeight: 'bold',
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '2px 4px',
            borderRadius: '3px',
            whiteSpace: 'nowrap',
            border: '1px solid #666',
            zIndex: 1000,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          Ghost
        </div>
      </div>
    </div>
  );
};
