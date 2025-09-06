import React, { useState, useEffect } from 'react';
import { GameState, Position } from '../game/types';
import { ExternalPlayer } from '../game/external-types';

interface GameBoardProps {
  gameState: GameState;
  cellSize?: number;
  externalPlayers?: ExternalPlayer[];
  playerIdMap?: Map<string, number>;
  elapsedTime?: number;
  isRunning?: boolean;
}

const GHOST_MESSAGES = [
  '이리 와!',
  '다 잡아버리겠다!',
  '도망갈 수 없어!',
  '너희들 어디 있나?',
  '곧 잡힐 거야!',
  '숨어봤자 소용없어!',
  '한 명씩 잡아주지!',
  '게임 끝!',
];

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  cellSize = 50,
  externalPlayers = [],
  playerIdMap = new Map(),
  elapsedTime = 0,
  isRunning = false,
}) => {
  const { mapSize, walls, players, ghost, playerNames } = gameState;
  const [ghostMessage, setGhostMessage] = useState<string>('');
  const [isWarningFlash, setIsWarningFlash] = useState(false);

  const elapsedSeconds = elapsedTime / 1000;
  const gameOverInfo = gameState.eliminatedPlayers
    ? {
        isOver:
          gameState.players.length - gameState.eliminatedPlayers.length <= 1 &&
          gameState.gameStep > 0,
      }
    : { isOver: false };
  const shouldFlash = elapsedSeconds >= 30 && !gameOverInfo.isOver;

  useEffect(() => {
    if (!shouldFlash) {
      setIsWarningFlash(false);
      return;
    }

    const interval = setInterval(() => {
      setIsWarningFlash((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [shouldFlash]);

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

    // 제거된 플레이어의 마지막 위치 표시
    // externalPlayers에서 제거된 플레이어 찾기
    const eliminatedPlayer = externalPlayers.find((player) => {
      const gameIndex = playerIdMap.get(player.id);
      return (
        gameIndex !== undefined &&
        gameState.eliminatedPlayers?.includes(gameIndex) &&
        players[gameIndex] &&
        players[gameIndex].x === x &&
        players[gameIndex].y === y
      );
    });

    if (eliminatedPlayer) {
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

    // 제거된 플레이어의 마지막 위치 표시
    const eliminatedPlayer = externalPlayers.find((player) => {
      const gameIndex = playerIdMap.get(player.id);
      return (
        gameIndex !== undefined &&
        gameState.eliminatedPlayers?.includes(gameIndex) &&
        players[gameIndex] &&
        players[gameIndex].x === x &&
        players[gameIndex].y === y
      );
    });

    if (eliminatedPlayer) {
      return { ...baseStyle, backgroundColor: '#ffebee', zIndex: 3 };
    }

    const bgColor = shouldFlash && isWarningFlash ? '#ffcccc' : '#f9f9f9';
    return { ...baseStyle, backgroundColor: bgColor, zIndex: 2 };
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

  const getPlayerEmoji = (index: number): string => {
    // playerIdMap을 역으로 찾아서 external player 정보 가져오기
    const externalPlayerId = Array.from(playerIdMap.entries()).find(
      ([_, gameIndex]) => gameIndex === index,
    )?.[0];

    if (externalPlayerId) {
      const externalPlayer = externalPlayers.find(
        (p) => p.id === externalPlayerId,
      );
      if (externalPlayer?.emoji) {
        return externalPlayer.emoji;
      }
    }

    // fallback: 인덱스로 직접 찾기
    const fallbackPlayer = externalPlayers[index];
    if (fallbackPlayer?.emoji) {
      return fallbackPlayer.emoji;
    }

    // 기본 이모지 사용
    return playerEmojis[index % playerEmojis.length];
  };

  // 고스트 메시지 타이머
  useEffect(() => {
    if (gameOverInfo.isOver || !isRunning) {
      setGhostMessage('');
      return;
    }

    const showMessage = () => {
      const randomMessage =
        GHOST_MESSAGES[Math.floor(Math.random() * GHOST_MESSAGES.length)];
      setGhostMessage(randomMessage);

      // 2초 후 메시지 숨기기
      setTimeout(() => {
        setGhostMessage('');
      }, 2000);
    };

    const scheduleNextMessage = () => {
      // 10초 ± 3초 랜덤
      const delay = 10000 + (Math.random() - 0.5) * 6000;
      return setTimeout(showMessage, delay);
    };

    // 첫 메시지는 5초 후에 시작
    const initialTimeout = setTimeout(showMessage, 5000);
    let nextTimeout: NodeJS.Timeout;

    const startMessageLoop = () => {
      nextTimeout = scheduleNextMessage();
      const interval = setInterval(
        () => {
          clearTimeout(nextTimeout);
          nextTimeout = scheduleNextMessage();
        },
        10000 + (Math.random() - 0.5) * 6000,
      );

      return interval;
    };

    const interval = startMessageLoop();

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(nextTimeout);
      clearInterval(interval);
    };
  }, [gameOverInfo.isOver, isRunning]);

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

        // playerIdMap을 역으로 찾아서 external player 정보 가져오기
        const externalPlayerId = Array.from(playerIdMap.entries()).find(
          ([_, gameIndex]) => gameIndex === index,
        )?.[0];

        const externalPlayer = externalPlayerId
          ? externalPlayers.find((p) => p.id === externalPlayerId)
          : externalPlayers[index]; // fallback

        const playerName =
          externalPlayer?.name || playerNames?.[index] || `Player ${index + 1}`;
        const emoji = getPlayerEmoji(index);

        return (
          <div key={`player-${index}`} style={getSmoothEntityStyle(player, 10)}>
            <span style={{ fontSize: cellSize * 0.7 }}>{emoji}</span>
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
        {/* 고스트 말풍선 */}
        {ghostMessage && (
          <div
            style={{
              position: 'absolute',
              top: -50,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 12,
              fontWeight: 'bold',
              color: '#333',
              backgroundColor: '#fff',
              padding: '6px 10px',
              borderRadius: '15px',
              whiteSpace: 'nowrap',
              border: '2px solid #ff4444',
              zIndex: 1001,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              animation: 'bounce 0.3s ease-out',
            }}
          >
            {ghostMessage}
            {/* 말풍선 꼬리 */}
            <div
              style={{
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid #ff4444',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #fff',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// CSS 애니메이션을 위한 스타일 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce {
    0% { transform: translateX(-50%) scale(0.8); opacity: 0; }
    50% { transform: translateX(-50%) scale(1.1); }
    100% { transform: translateX(-50%) scale(1); opacity: 1; }
  }
`;
if (!document.head.querySelector('style[data-ghost-speech]')) {
  style.setAttribute('data-ghost-speech', 'true');
  document.head.appendChild(style);
}
