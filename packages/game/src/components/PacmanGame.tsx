import React, { useState, useEffect, useCallback } from 'react';
import { GameEngine, MapGenerator } from '../game';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { GameStats } from './GameStats';
import { RankingBoard } from './RankingBoard';
import { FloatingGameInfo } from './FloatingGameInfo';

export const PacmanGame: React.FC = () => {
  const [gameEngine, setGameEngine] = useState<GameEngine>(() => {
    const { walls, mapSize } = MapGenerator.createPacmanMap();
    return new GameEngine({
      players: [
        { x: 1, y: 1 },
        { x: 18, y: 11 },
        { x: 1, y: 11 },
        { x: 18, y: 1 },
      ],
      playerNames: ['Alice', 'Bob', 'Charlie', 'Diana'],
      ghost: { x: 10, y: 6 },
      mapSize,
      walls,
      eliminatedPlayers: [],
      rankings: [],
      gameStep: 0,
    });
  });

  const [gameState, setGameState] = useState(() => gameEngine.getGameState());
  const [isRunning, setIsRunning] = useState(false);
  const [ghostLevel, setGhostLevel] = useState(1);
  const [playerSpeed, setPlayerSpeed] = useState(200);
  const [ghostSpeed, setGhostSpeed] = useState(200);
  const [step, setStep] = useState(0);

  const gameOverInfo = gameEngine.isGameOver();
  const rankings = gameEngine.getRankings();

  const updateGame = useCallback(() => {
    if (!gameOverInfo.isOver) {
      const newState = gameEngine.updateGame();
      setGameState(newState);
      setStep((prev) => prev + 1);
    } else {
      setIsRunning(false);
    }
  }, [gameEngine, gameOverInfo.isOver]);

  useEffect(() => {
    let animationFrame: number;
    let lastLogicUpdate = 0;
    const LOGIC_INTERVAL = 300; // 논리 업데이트 간격

    const gameLoop = (currentTime: number) => {
      if (isRunning && !gameOverInfo.isOver) {
        // 논리 업데이트 (주기적)
        if (currentTime - lastLogicUpdate >= LOGIC_INTERVAL) {
          updateGame();
          lastLogicUpdate = currentTime;
        }

        // 시각적 업데이트 (매 프레임)
        const smoothState = gameEngine.updateSmoothMovement();
        setGameState(smoothState);

        animationFrame = requestAnimationFrame(gameLoop);
      }
    };

    if (isRunning && !gameOverInfo.isOver) {
      animationFrame = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isRunning, updateGame, gameOverInfo.isOver, gameEngine]);

  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);

  const handleReset = () => {
    const { walls, mapSize } = MapGenerator.createPacmanMap();
    const newEngine = new GameEngine({
      players: [
        { x: 1, y: 1 },
        { x: 18, y: 11 },
        { x: 1, y: 11 },
        { x: 18, y: 1 },
      ],
      playerNames: ['Alice', 'Bob', 'Charlie', 'Diana'],
      ghost: { x: 10, y: 6 },
      mapSize,
      walls,
      eliminatedPlayers: [],
      rankings: [],
      gameStep: 0,
    });
    newEngine.setGhostLevel(ghostLevel);
    newEngine.setPlayerSpeed(playerSpeed);
    newEngine.setGhostSpeed(ghostSpeed);
    setGameEngine(newEngine);
    setGameState(newEngine.getGameState());
    setIsRunning(false);
    setStep(0);
  };

  const handleGhostLevelChange = (level: number) => {
    setGhostLevel(level);
    gameEngine.setGhostLevel(level);
  };

  const handlePlayerSpeedChange = (speed: number) => {
    setPlayerSpeed(speed);
    gameEngine.setPlayerSpeed(speed);
  };

  const handleGhostSpeedChange = (speed: number) => {
    setGhostSpeed(speed);
    gameEngine.setGhostSpeed(speed);
  };

  const handleAddPlayer = () => {
    // 빈 공간에 플레이어 추가
    const { mapSize, walls, players, ghost } = gameState;
    for (let y = 1; y < mapSize.height - 1; y++) {
      for (let x = 1; x < mapSize.width - 1; x++) {
        const isOccupied =
          walls.some((w) => w.x === x && w.y === y) ||
          players.some((p) => p.x === x && p.y === y) ||
          (ghost.x === x && ghost.y === y);

        if (!isOccupied) {
          gameEngine.addPlayer();
          setGameState(gameEngine.getGameState());
          return;
        }
      }
    }
  };

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '100vh',
        width: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <h1>팩맨 서바이벌 게임</h1>

      <GameControls
        isRunning={isRunning}
        ghostLevel={ghostLevel}
        playerSpeed={playerSpeed}
        ghostSpeed={ghostSpeed}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
        onGhostLevelChange={handleGhostLevelChange}
        onPlayerSpeedChange={handlePlayerSpeedChange}
        onGhostSpeedChange={handleGhostSpeedChange}
        onAddPlayer={handleAddPlayer}
      />

      <div
        style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'flex-start',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '1200px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <GameBoard gameState={gameState} cellSize={25} />
          
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
              {gameOverInfo.winner !== undefined ? (
                <h3 style={{ margin: 0 }}>
                  🎉 플레이어 {gameOverInfo.winner + 1} 우승! 🎉
                </h3>
              ) : (
                <h3 style={{ margin: 0 }}>게임 종료!</h3>
              )}
            </div>
          )}
        </div>

        <div style={{ width: '300px' }}>
          <RankingBoard
            rankings={rankings}
            totalPlayers={gameState.players.length}
            remainingPlayers={gameOverInfo.remainingPlayers}
            playerNames={gameState.playerNames}
          />
        </div>
      </div>

      <FloatingGameInfo
        gameState={gameState}
        gameOver={gameOverInfo}
        step={step}
      />
    </div>
  );
};
