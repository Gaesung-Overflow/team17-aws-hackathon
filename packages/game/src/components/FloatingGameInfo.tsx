import React, { useState, useRef, useEffect } from 'react';
import { GameState } from '../game/types';
import type { ExternalPlayer } from '../game/external-types';
import '../styles/retro-arcade.css';

interface GameConfig {
  playerSpeedLevel: number;
  ghostSpeedLevel: number;
  ghostLevel: number;
  selectedMapId: string;
}

interface FloatingGameInfoProps {
  gameState: GameState;
  gameOver: {
    isOver: boolean;
    winner?: number;
    totalPlayers: number;
    remainingPlayers: number;
  };
  step: number;
  externalPlayers?: ExternalPlayer[];
  playerIdMap?: Map<string, number>;
  gameConfig?: GameConfig;
  onConfigChange?: (config: GameConfig) => void;
  gameStarted?: boolean;
}

export const FloatingGameInfo: React.FC<FloatingGameInfoProps> = ({
  gameState,
  gameOver,
  step,
  externalPlayers = [],
  playerIdMap = new Map(),
  gameConfig = {
    playerSpeedLevel: 5,
    ghostSpeedLevel: 6,
    ghostLevel: 4,
    selectedMapId: 'classic',
  },
  onConfigChange,
  gameStarted = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'config'>('status');
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
    <div
      style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}
    >
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="arcade-button"
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
        }}
      >
        📊
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className="arcade-info-panel"
          style={{
            position: 'absolute',
            top: '60px',
            right: '0',
            width: '320px',
            fontSize: '10px',
            zIndex: 1001,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              borderBottom: '1px solid #eee',
              paddingBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('status')}
                className={`retro-font ${activeTab === 'status' ? 'neon-glow-green' : ''}`}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '10px',
                  cursor: 'pointer',
                  color: activeTab === 'status' ? 'var(--neon-green)' : '#999',
                  textTransform: 'uppercase',
                }}
              >
                STATUS
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`retro-font ${activeTab === 'config' ? 'neon-glow-cyan' : ''}`}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '10px',
                  cursor: 'pointer',
                  color: activeTab === 'config' ? 'var(--neon-cyan)' : '#999',
                  textTransform: 'uppercase',
                }}
              >
                CONFIG
              </button>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="retro-font"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: 'var(--neon-red)',
              }}
            >
              ×
            </button>
          </div>

          {activeTab === 'status' ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <div className="retro-font" style={{ fontSize: '8px' }}>
                  <strong>STEP:</strong> {step}
                </div>
                <div className="retro-font" style={{ fontSize: '8px' }}>
                  <strong>ALIVE:</strong> {gameOver.remainingPlayers}/
                  {gameOver.totalPlayers}
                </div>
                <div className="retro-font" style={{ fontSize: '8px' }}>
                  <strong>GHOST:</strong> ({Math.round(gameState.ghost.x)},{' '}
                  {Math.round(gameState.ghost.y)})
                </div>
                <div className="retro-font" style={{ fontSize: '8px' }}>
                  <strong>MAP:</strong> {gameState.mapSize.width}×
                  {gameState.mapSize.height}
                </div>
              </div>

              {gameOver.isOver && (
                <div
                  style={{
                    marginBottom: '12px',
                    padding: '8px',
                    backgroundColor:
                      gameOver.winner !== undefined ? '#e8f5e8' : '#ffebee',
                    borderRadius: '4px',
                    color:
                      gameOver.winner !== undefined ? '#2e7d32' : '#c62828',
                    fontSize: '12px',
                    textAlign: 'center',
                  }}
                >
                  {gameOver.winner !== undefined ? (
                    <strong>🎉 플레이어 {gameOver.winner + 1} 우승!</strong>
                  ) : (
                    <strong>게임 종료!</strong>
                  )}
                </div>
              )}
            </>
          ) : (
            <div>
              <strong
                className="retro-font neon-glow-cyan"
                style={{
                  fontSize: '10px',
                  marginBottom: '8px',
                  display: 'block',
                }}
              >
                GAME CONFIG:
              </strong>

              {gameStarted && (
                <div
                  style={{
                    marginBottom: '12px',
                    padding: '6px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '4px',
                    color: '#856404',
                    fontSize: '9px',
                    textAlign: 'center',
                  }}
                >
                  ⚠️ 게임 진행 중에는 설정을 변경할 수 없습니다
                </div>
              )}

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div>
                  <label
                    className="retro-font"
                    style={{
                      fontSize: '8px',
                      display: 'block',
                      marginBottom: '2px',
                    }}
                  >
                    MAP:
                  </label>
                  <select
                    value={gameConfig.selectedMapId}
                    onChange={(e) =>
                      onConfigChange?.({
                        ...gameConfig,
                        selectedMapId: e.target.value,
                      })
                    }
                    disabled={gameStarted}
                    style={{
                      width: '100%',
                      fontSize: '8px',
                      padding: '2px',
                      backgroundColor: '#000',
                      color: 'var(--neon-green)',
                      border: '1px solid var(--neon-green)',
                      opacity: gameStarted ? 0.5 : 1,
                    }}
                  >
                    <option value="classic">CLASSIC</option>
                    <option value="open">OPEN FIELD</option>
                    <option value="cross">CROSS</option>
                    <option value="maze">MAZE</option>
                    <option value="spiral">SPIRAL</option>
                  </select>
                </div>

                <div>
                  <label
                    className="retro-font"
                    style={{
                      fontSize: '8px',
                      display: 'block',
                      marginBottom: '2px',
                    }}
                  >
                    PLAYER SPEED: {gameConfig.playerSpeedLevel}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="9"
                    value={gameConfig.playerSpeedLevel}
                    disabled={gameStarted}
                    onChange={(e) =>
                      onConfigChange?.({
                        ...gameConfig,
                        playerSpeedLevel: Number(e.target.value),
                      })
                    }
                    style={{ width: '100%', opacity: gameStarted ? 0.5 : 1 }}
                  />
                </div>

                <div>
                  <label
                    className="retro-font"
                    style={{
                      fontSize: '8px',
                      display: 'block',
                      marginBottom: '2px',
                    }}
                  >
                    GHOST SPEED: {gameConfig.ghostSpeedLevel}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="9"
                    value={gameConfig.ghostSpeedLevel}
                    disabled={gameStarted}
                    onChange={(e) =>
                      onConfigChange?.({
                        ...gameConfig,
                        ghostSpeedLevel: Number(e.target.value),
                      })
                    }
                    style={{ width: '100%', opacity: gameStarted ? 0.5 : 1 }}
                  />
                </div>

                <div>
                  <label
                    className="retro-font"
                    style={{
                      fontSize: '8px',
                      display: 'block',
                      marginBottom: '2px',
                    }}
                  >
                    GHOST LEVEL:
                  </label>
                  <select
                    value={gameConfig.ghostLevel}
                    onChange={(e) =>
                      onConfigChange?.({
                        ...gameConfig,
                        ghostLevel: Number(e.target.value),
                      })
                    }
                    disabled={gameStarted}
                    style={{
                      width: '100%',
                      fontSize: '8px',
                      padding: '2px',
                      backgroundColor: '#000',
                      color: 'var(--neon-green)',
                      border: '1px solid var(--neon-green)',
                      opacity: gameStarted ? 0.5 : 1,
                    }}
                  >
                    <option value={2}>EASY</option>
                    <option value={3}>NORMAL</option>
                    <option value={4}>HARD</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
