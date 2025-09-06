import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ExternalGameState,
  ExternalPlayer,
  GameCallbacks,
  PlayerCommand,
} from '../game/external-types';
import { ExternalGameEngine } from '../game/ExternalGameEngine';
import type { GameState } from '../game/types';
import { FloatingGameInfo } from './FloatingGameInfo';
import { GameBoard } from './GameBoard';
import { RankingBoard } from './RankingBoard';

interface ExternalPacmanGameProps {
  externalPlayers?: ExternalPlayer[];
  playerCommands?: PlayerCommand[];
  callbacks?: GameCallbacks;
  onCommandProcessed?: (commandIndex: number) => void;
  autoStart?: boolean;
  gameConfig?: {
    cellSize?: number;
    ghostLevel?: number;
    playerSpeed?: number;
    ghostSpeed?: number;
    maxPlayers?: number;
    selectedMapId?: string;
    gameStarted?: boolean;
  };
  showControls?: boolean;
  showStats?: boolean;
  showRankings?: boolean;
}

export const ExternalPacmanGame: React.FC<ExternalPacmanGameProps> = ({
  externalPlayers = [],
  playerCommands = [],
  callbacks = {},
  onCommandProcessed,
  autoStart = false,
  gameConfig = {},
  showControls = true,
  showRankings = true,
}) => {
  const gameEngineRef = useRef<ExternalGameEngine>();
  const [gameState, setGameState] = useState<GameState>();
  const [externalState, setExternalState] = useState<ExternalGameState>();
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [playerIdMap, setPlayerIdMap] = useState<Map<string, number>>(
    new Map(),
  );

  // 게임 엔진 초기화
  useEffect(() => {
    const engine = new ExternalGameEngine();

    // 설정 적용
    if (gameConfig.ghostLevel !== undefined)
      engine.setGhostLevel(gameConfig.ghostLevel);
    if (gameConfig.playerSpeed !== undefined)
      engine.setPlayerSpeed(gameConfig.playerSpeed);
    if (gameConfig.ghostSpeed !== undefined)
      engine.setGhostSpeed(gameConfig.ghostSpeed);
    if (gameConfig.maxPlayers !== undefined)
      engine.setMaxPlayers(gameConfig.maxPlayers);
    if (gameConfig.selectedMapId !== undefined)
      engine.selectMap(gameConfig.selectedMapId);

    // 이벤트 리스너 등록
    engine.on('playerJoined', (playerId: string, gameIndex: number) => {
      const player = externalPlayers.find((p) => p.id === playerId);
      if (player) {
        callbacks.onPlayerJoined?.(player, gameIndex);
      }
    });

    engine.on('playerEliminated', (_: number, rank: number) => {
      // gameIndex를 playerId로 변환 필요
      callbacks.onPlayerEliminated?.('', rank); // 실제로는 매핑 필요
    });

    gameEngineRef.current = engine;
    setGameState(engine.getGameState());
    setExternalState(engine.getExternalGameState());

    if (autoStart) {
      setIsRunning(true);
    }

    return () => {
      // 정리
    };
  }, []);

  // 맵 선택 처리
  useEffect(() => {
    if (!gameEngineRef.current || !gameConfig.selectedMapId) return;

    const success = gameEngineRef.current.selectMap(gameConfig.selectedMapId);
    if (success) {
      setGameState(gameEngineRef.current.getGameState());
      setExternalState(gameEngineRef.current.getExternalGameState());
    }
  }, [gameConfig.selectedMapId]);

  // 기타 게임 설정 변경 처리
  useEffect(() => {
    if (!gameEngineRef.current) return;

    if (gameConfig.ghostLevel !== undefined) {
      gameEngineRef.current.setGhostLevel(gameConfig.ghostLevel);
    }
    if (gameConfig.playerSpeed !== undefined) {
      gameEngineRef.current.setPlayerSpeed(gameConfig.playerSpeed);
    }
    if (gameConfig.ghostSpeed !== undefined) {
      gameEngineRef.current.setGhostSpeed(gameConfig.ghostSpeed);
    }
    if (gameConfig.maxPlayers !== undefined) {
      gameEngineRef.current.setMaxPlayers(gameConfig.maxPlayers);
    }
    if (gameConfig.gameStarted !== undefined) {
      gameEngineRef.current.setGameStarted(gameConfig.gameStarted);
    }
  }, [
    gameConfig.ghostLevel,
    gameConfig.playerSpeed,
    gameConfig.ghostSpeed,
    gameConfig.maxPlayers,
    gameConfig.gameStarted,
  ]);

  // 외부 플레이어 변경 처리
  useEffect(() => {
    if (!gameEngineRef.current) return;

    // 현재 등록된 플레이어와 비교하여 추가/제거
    const currentState = gameEngineRef.current.getExternalGameState();
    const currentPlayerIds = new Set(currentState.players.map((p) => p.id));
    const newPlayerIds = new Set(externalPlayers.map((p) => p.id));

    // 새로 추가된 플레이어들 (중복 방지)
    externalPlayers.forEach((player) => {
      if (!currentPlayerIds.has(player.id)) {
        try {
          console.log('=== ADDING PLAYER ===');
          console.log('Player ID:', player.id);
          console.log(
            'Current players count:',
            gameEngineRef.current!.getGameState().players.length,
          );
          console.log('Max players:', gameEngineRef.current!.getMaxPlayers());

          const gameIndex = gameEngineRef.current!.addExternalPlayer(
            player.id,
            player,
          );
          setPlayerIdMap((prev) => new Map(prev).set(player.id, gameIndex));

          console.log('Player added successfully, gameIndex:', gameIndex);
          console.log('====================');
        } catch (error) {
          console.warn(`플레이어 추가 실패: ${error}`);
          console.log('=== ADD PLAYER ERROR ===');
          console.log('Error:', error);
          console.log(
            'Current players:',
            gameEngineRef.current!.getGameState().players.length,
          );
          console.log('Max players:', gameEngineRef.current!.getMaxPlayers());
          console.log('========================');
          callbacks.onPlayerJoinFailed?.(player.id, error as Error);
        }
      } else {
        // 기존 플레이어 정보 업데이트
        gameEngineRef.current!.updatePlayerInfo(player.id, player);
      }
    });

    // 제거된 플레이어들
    currentState.players.forEach((player) => {
      if (!newPlayerIds.has(player.id)) {
        gameEngineRef.current!.removeExternalPlayer(player.id);
        setPlayerIdMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(player.id);
          return newMap;
        });
      }
    });

    setExternalState(gameEngineRef.current.getExternalGameState());
  }, [externalPlayers]);

  // 명령 처리
  useEffect(() => {
    if (!gameEngineRef.current || playerCommands.length === 0) return;

    playerCommands.forEach((command, index) => {
      const success = gameEngineRef.current!.processCommand(command);
      if (success) {
        onCommandProcessed?.(index);
      }
    });

    setExternalState(gameEngineRef.current.getExternalGameState());
  }, [playerCommands, onCommandProcessed]);

  // 게임 루프
  const updateGame = useCallback(() => {
    if (!gameEngineRef.current) return;

    const gameOverInfo = gameEngineRef.current.isGameOver();
    if (!gameOverInfo.isOver) {
      const newState = gameEngineRef.current.updateGame();
      setGameState(newState);
      setExternalState(gameEngineRef.current.getExternalGameState());
      setStep((prev) => prev + 1);
    } else {
      setIsRunning(false);
      callbacks.onGameEnd?.(externalState?.rankings || []);
    }
  }, [callbacks, externalState]);

  useEffect(() => {
    let animationFrame: number;
    let lastLogicUpdate = 0;
    const LOGIC_INTERVAL = 300;

    const gameLoop = (currentTime: number) => {
      if (isRunning && gameEngineRef.current) {
        const gameOverInfo = gameEngineRef.current.isGameOver();

        if (!gameOverInfo.isOver) {
          // 논리 업데이트
          if (currentTime - lastLogicUpdate >= LOGIC_INTERVAL) {
            updateGame();
            lastLogicUpdate = currentTime;
          }

          // 시각적 업데이트
          const smoothState = gameEngineRef.current.updateSmoothMovement();
          setGameState(smoothState);

          animationFrame = requestAnimationFrame(gameLoop);
        }
      }
    };

    if (isRunning) {
      animationFrame = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isRunning, updateGame]);

  const handleStart = () => {
    setIsRunning(true);
    callbacks.onGameStateChange?.('running');
  };

  const handleStop = () => {
    setIsRunning(false);
    callbacks.onGameStateChange?.('stopped');
  };

  const handleReset = () => {
    setIsRunning(false);

    // 기존 플레이어들을 모두 제거 (부모 컴포넌트에 알림)
    externalPlayers.forEach((player) => {
      callbacks.onPlayerLeft?.(player.id);
    });

    // 게임 엔진을 완전히 새로 생성
    const engine = new ExternalGameEngine();

    // 설정 재적용
    if (gameConfig.ghostLevel !== undefined)
      engine.setGhostLevel(gameConfig.ghostLevel);
    if (gameConfig.playerSpeed !== undefined)
      engine.setPlayerSpeed(gameConfig.playerSpeed);
    if (gameConfig.ghostSpeed !== undefined)
      engine.setGhostSpeed(gameConfig.ghostSpeed);
    if (gameConfig.maxPlayers !== undefined)
      engine.setMaxPlayers(gameConfig.maxPlayers);
    if (gameConfig.selectedMapId !== undefined)
      engine.selectMap(gameConfig.selectedMapId);

    // 이벤트 리스너 재등록
    engine.on('playerJoined', (playerId: string, gameIndex: number) => {
      const player = externalPlayers.find((p) => p.id === playerId);
      if (player) {
        callbacks.onPlayerJoined?.(player, gameIndex);
      }
    });

    engine.on('playerEliminated', (_: number, rank: number) => {
      callbacks.onPlayerEliminated?.('', rank);
    });

    gameEngineRef.current = engine;
    setGameState(engine.getGameState());
    setExternalState(engine.getExternalGameState());
    setStep(0);
    setPlayerIdMap(new Map());

    callbacks.onGameStateChange?.('stopped');
    callbacks.onGameReset?.();
  };

  if (!gameState || !externalState) {
    return <div>Loading...</div>;
  }

  const gameOverInfo = gameEngineRef.current?.isGameOver() || {
    isOver: false,
    totalPlayers: 0,
    remainingPlayers: 0,
  };

  const startDisabled =
    playerIdMap.size <= 1 ||
    isRunning ||
    gameOverInfo.isOver ||
    (gameConfig.gameStarted && !isRunning);

  const stopDisabled = !isRunning || gameOverInfo.isOver;

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        color: '#333',
      }}
    >
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <GameBoard
            gameState={gameState}
            cellSize={gameConfig.cellSize || 45}
            externalPlayers={externalPlayers}
            playerIdMap={playerIdMap}
          />

          {gameOverInfo.isOver && (
            <div
              style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '5px',
                padding: '10px',
                textAlign: 'center',
                marginTop: '10px',
              }}
            >
              <h3 style={{ margin: 0 }}>🎉 게임 종료!</h3>
            </div>
          )}
        </div>

        {showRankings && (
          <div style={{ width: '300px', flexShrink: 0 }}>
            {showControls && (
              <div
                style={{
                  marginBottom: '20px',
                  textAlign: 'center',
                  gap: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={handleStart}
                  disabled={
                    playerIdMap.size <= 1 ||
                    isRunning ||
                    gameOverInfo.isOver ||
                    (gameConfig.gameStarted && !isRunning)
                  }
                  style={{
                    width: '100%',
                    ...(startDisabled
                      ? {}
                      : {
                          backgroundColor: '#28a745',
                          color: 'white',
                        }),
                  }}
                >
                  🚀 시작
                </button>
                <button
                  onClick={handleStop}
                  disabled={!isRunning || gameOverInfo.isOver}
                  style={{
                    width: '100%',
                    ...(stopDisabled
                      ? {}
                      : {
                          backgroundColor: '#dc3545',
                          color: 'white',
                        }),
                  }}
                >
                  ⏸️ 일시정지
                </button>
                <button onClick={handleReset} style={{ width: '100%' }}>
                  🔄 리셋
                </button>
              </div>
            )}
            <RankingBoard
              externalPlayers={externalPlayers}
              rankings={gameState.rankings}
              totalPlayers={gameOverInfo.totalPlayers}
              remainingPlayers={gameOverInfo.remainingPlayers}
            />
          </div>
        )}
      </div>

      <FloatingGameInfo
        gameState={gameState}
        gameOver={gameOverInfo}
        step={step}
        externalPlayers={externalPlayers}
        playerIdMap={playerIdMap}
      />
    </div>
  );
};
