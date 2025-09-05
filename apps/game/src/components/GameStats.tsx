import React from 'react';
import { GameState } from '../game/types';

interface GameStatsProps {
  gameState: GameState;
  gameOver: { isOver: boolean; winner?: number; totalPlayers: number; remainingPlayers: number };
  step: number;
}

export const GameStats: React.FC<GameStatsProps> = ({ gameState, gameOver, step }) => {
  return (
    <div style={{ 
      margin: '20px 0', 
      padding: '15px', 
      border: '1px solid #ddd', 
      borderRadius: '5px',
      backgroundColor: '#f9f9f9',
      width: '100%'
    }}>
      <h3>게임 상태</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div>
          <strong>스텝:</strong> {step}
        </div>
        <div>
          <strong>생존자:</strong> {gameOver.remainingPlayers}/{gameOver.totalPlayers}
        </div>
        <div>
          <strong>술래 위치:</strong> ({Math.round(gameState.ghost.x)}, {Math.round(gameState.ghost.y)})
        </div>
        <div>
          <strong>맵 크기:</strong> {gameState.mapSize.width} × {gameState.mapSize.height}
        </div>
      </div>
      
      {gameOver.isOver && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: gameOver.winner !== undefined ? '#e8f5e8' : '#ffebee', 
          borderRadius: '3px',
          color: gameOver.winner !== undefined ? '#2e7d32' : '#c62828'
        }}>
          {gameOver.winner !== undefined ? (
            <strong>🎉 플레이어 {gameOver.winner + 1} 우승!</strong>
          ) : (
            <strong>게임 종료!</strong>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '10px' }}>
        <strong>플레이어 위치:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          {gameState.players.map((player, index) => {
            const isEliminated = gameState.eliminatedPlayers?.includes(index);
            return (
              <li key={index} style={{ 
                color: isEliminated ? '#999' : 'inherit',
                textDecoration: isEliminated ? 'line-through' : 'none'
              }}>
                플레이어 {index + 1}: ({Math.round(player.x)}, {Math.round(player.y)}) {isEliminated ? '💀' : '✅'}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};