import React from 'react';
import { GameState } from '../game/types';
import '../styles/retro-arcade.css';

interface GameStatsProps {
  gameState: GameState;
  gameOver: {
    isOver: boolean;
    winner?: number;
    totalPlayers: number;
    remainingPlayers: number;
  };
  step: number;
}

export const GameStats: React.FC<GameStatsProps> = ({
  gameState,
  gameOver,
  step,
}) => {
  return (
    <div
      className="arcade-info-panel"
      style={{ margin: '20px 0', width: '100%' }}
    >
      <h3
        className="retro-font neon-glow-green"
        style={{ marginBottom: '15px', textTransform: 'uppercase' }}
      >
        GAME STATUS
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
        }}
      >
        <div className="retro-font">
          <strong>STEP:</strong> {step}
        </div>
        <div className="retro-font">
          <strong>ALIVE:</strong> {gameOver.remainingPlayers}/
          {gameOver.totalPlayers}
        </div>
        <div className="retro-font">
          <strong>GHOST:</strong> ({Math.round(gameState.ghost.x)},{' '}
          {Math.round(gameState.ghost.y)})
        </div>
        <div className="retro-font">
          <strong>MAP:</strong> {gameState.mapSize.width} ×{' '}
          {gameState.mapSize.height}
        </div>
      </div>

      {gameOver.isOver && (
        <div
          className={`retro-font ${gameOver.winner !== undefined ? 'neon-glow-green' : 'arcade-game-over'}`}
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor:
              gameOver.winner !== undefined
                ? 'rgba(0, 255, 0, 0.1)'
                : 'rgba(255, 0, 64, 0.1)',
            border:
              gameOver.winner !== undefined
                ? '1px solid var(--neon-green)'
                : '1px solid var(--neon-red)',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          {gameOver.winner !== undefined ? (
            <strong>PLAYER {gameOver.winner + 1} WINS!</strong>
          ) : (
            <strong>GAME OVER!</strong>
          )}
        </div>
      )}

      <div style={{ marginTop: '10px' }}>
        <strong className="retro-font neon-glow-green">PLAYERS:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          {gameState.players.map((player, index) => {
            const isEliminated = gameState.eliminatedPlayers?.includes(index);
            return (
              <li
                key={index}
                className="retro-font"
                style={{
                  color: isEliminated ? 'var(--neon-red)' : 'var(--neon-cyan)',
                  textDecoration: isEliminated ? 'line-through' : 'none',
                  textShadow: isEliminated
                    ? '0 0 5px var(--neon-red)'
                    : '0 0 5px var(--neon-cyan)',
                }}
              >
                P{index + 1}: ({Math.round(player.x)}, {Math.round(player.y)}){' '}
                {isEliminated ? '💀' : '✅'}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
