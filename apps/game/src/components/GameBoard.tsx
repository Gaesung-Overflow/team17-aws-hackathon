import React from 'react';
import { GameState } from '../game/types';

interface GameBoardProps {
  gameState: GameState;
  cellSize?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, cellSize = 20 }) => {
  const { mapSize, walls, players, ghost } = gameState;

  const isWall = (x: number, y: number): boolean => {
    return walls.some(wall => wall.x === x && wall.y === y);
  };

  const isPlayer = (x: number, y: number): number => {
    return players.findIndex(player => player.x === x && player.y === y);
  };

  const isGhost = (x: number, y: number): boolean => {
    return ghost.x === x && ghost.y === y;
  };

  const getCellContent = (x: number, y: number) => {
    if (isWall(x, y)) return '🧱';
    if (isGhost(x, y)) return '👻';
    
    const playerIndex = isPlayer(x, y);
    if (playerIndex !== -1) {
      const playerEmojis = ['🔵', '🟢', '🟡', '🟣', '🟠'];
      return playerEmojis[playerIndex % playerEmojis.length];
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
      border: '1px solid #ddd'
    };

    if (isWall(x, y)) {
      return { ...baseStyle, backgroundColor: '#333' };
    }
    
    return { ...baseStyle, backgroundColor: '#f9f9f9' };
  };

  return (
    <div style={{ 
      display: 'inline-block', 
      border: '2px solid #000',
      backgroundColor: '#000'
    }}>
      {Array.from({ length: mapSize.height }, (_, y) => (
        <div key={y} style={{ display: 'flex' }}>
          {Array.from({ length: mapSize.width }, (_, x) => (
            <div key={`${x}-${y}`} style={getCellStyle(x, y)}>
              {getCellContent(x, y)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};