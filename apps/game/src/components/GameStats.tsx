import React from 'react';
import { GameState } from '../game/types';

interface GameStatsProps {
  gameState: GameState;
  gameOver: { isOver: boolean; caughtPlayers: number[] };
  step: number;
}

export const GameStats: React.FC<GameStatsProps> = ({ gameState, gameOver, step }) => {
  return (
    <div style={{ 
      margin: '20px 0', 
      padding: '15px', 
      border: '1px solid #ddd', 
      borderRadius: '5px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>게임 상태</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div>
          <strong>스텝:</strong> {step}
        </div>
        <div>
          <strong>플레이어 수:</strong> {gameState.players.length}
        </div>
        <div>
          <strong>술래 위치:</strong> ({gameState.ghost.x}, {gameState.ghost.y})
        </div>
        <div>
          <strong>맵 크기:</strong> {gameState.mapSize.width} × {gameState.mapSize.height}
        </div>
      </div>
      
      {gameOver.isOver && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          borderRadius: '3px',
          color: '#c62828'
        }}>
          <strong>게임 오버!</strong> 플레이어 {gameOver.caughtPlayers.join(', ')}번이 잡혔습니다!
        </div>
      )}
      
      <div style={{ marginTop: '10px' }}>
        <strong>플레이어 위치:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          {gameState.players.map((player, index) => (
            <li key={index}>
              플레이어 {index + 1}: ({player.x}, {player.y})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};