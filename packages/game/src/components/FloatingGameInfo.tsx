import React, { useState, useRef, useEffect } from 'react';
import { GameState } from '../game/types';
import type { ExternalPlayer } from '../game/external-types';

interface FloatingGameInfoProps {
  gameState: GameState;
  gameOver: { isOver: boolean; winner?: number; totalPlayers: number; remainingPlayers: number };
  step: number;
  externalPlayers?: ExternalPlayer[];
  playerIdMap?: Map<string, number>;
}

export const FloatingGameInfo: React.FC<FloatingGameInfoProps> = ({ 
  gameState, 
  gameOver, 
  step,
  externalPlayers = [],
  playerIdMap = new Map()
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        buttonRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#4CAF50',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#45a049';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#4CAF50';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        📊
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            top: '60px',
            right: '0',
            width: '320px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            padding: '16px',
            fontSize: '14px',
            zIndex: 1001
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: '1px solid #eee',
            paddingBottom: '8px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>게임 상태</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#999'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px' }}>
              <strong>스텝:</strong> {step}
            </div>
            <div style={{ fontSize: '12px' }}>
              <strong>생존자:</strong> {gameOver.remainingPlayers}/{gameOver.totalPlayers}
            </div>
            <div style={{ fontSize: '12px' }}>
              <strong>술래:</strong> ({Math.round(gameState.ghost.x)}, {Math.round(gameState.ghost.y)})
            </div>
            <div style={{ fontSize: '12px' }}>
              <strong>맵:</strong> {gameState.mapSize.width}×{gameState.mapSize.height}
            </div>
          </div>
          
          {gameOver.isOver && (
            <div style={{ 
              marginBottom: '12px',
              padding: '8px', 
              backgroundColor: gameOver.winner !== undefined ? '#e8f5e8' : '#ffebee', 
              borderRadius: '4px',
              color: gameOver.winner !== undefined ? '#2e7d32' : '#c62828',
              fontSize: '12px',
              textAlign: 'center'
            }}>
              {gameOver.winner !== undefined ? (
                <strong>🎉 플레이어 {gameOver.winner + 1} 우승!</strong>
              ) : (
                <strong>게임 종료!</strong>
              )}
            </div>
          )}
          
          <div>
            <strong style={{ fontSize: '12px' }}>플레이어:</strong>
            <div style={{ 
              maxHeight: '120px', 
              overflowY: 'auto',
              marginTop: '4px',
              fontSize: '11px'
            }}>
              {gameState.players.map((player, index) => {
                const isEliminated = gameState.eliminatedPlayers?.includes(index);
                const externalPlayer = externalPlayers.find(p => playerIdMap.get(p.id) === index);
                
                return (
                  <div key={index} style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '2px 0',
                    color: isEliminated ? '#999' : 'inherit',
                    textDecoration: isEliminated ? 'line-through' : 'none'
                  }}>
                    <span>
                      {externalPlayer?.name || `플레이어 ${index + 1}`}
                    </span>
                    <span>
                      ({Math.round(player.x)}, {Math.round(player.y)}) {isEliminated ? '💀' : '✅'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};