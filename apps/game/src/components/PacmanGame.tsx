import React, { useState, useEffect, useCallback } from 'react';
import { GameEngine, MapGenerator } from '../game';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { GameStats } from './GameStats';

export const PacmanGame: React.FC = () => {
  const [gameEngine, setGameEngine] = useState<GameEngine>(() => {
    const { walls, mapSize } = MapGenerator.createPacmanMap();
    return new GameEngine({
      players: [{ x: 1, y: 1 }, { x: 18, y: 11 }],
      ghost: { x: 10, y: 6 },
      mapSize,
      walls
    });
  });

  const [gameState, setGameState] = useState(() => gameEngine.getGameState());
  const [isRunning, setIsRunning] = useState(false);
  const [ghostLevel, setGhostLevel] = useState(1);
  const [step, setStep] = useState(0);

  const gameOver = gameEngine.isGameOver();

  const updateGame = useCallback(() => {
    if (!gameOver.isOver) {
      const newState = gameEngine.updateGame();
      setGameState(newState);
      setStep(prev => prev + 1);
    } else {
      setIsRunning(false);
    }
  }, [gameEngine, gameOver.isOver]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !gameOver.isOver) {
      interval = setInterval(updateGame, 500);
    }
    return () => clearInterval(interval);
  }, [isRunning, updateGame, gameOver.isOver]);

  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);

  const handleReset = () => {
    const { walls, mapSize } = MapGenerator.createPacmanMap();
    const newEngine = new GameEngine({
      players: [{ x: 1, y: 1 }, { x: 18, y: 11 }],
      ghost: { x: 10, y: 6 },
      mapSize,
      walls
    });
    newEngine.setGhostLevel(ghostLevel);
    setGameEngine(newEngine);
    setGameState(newEngine.getGameState());
    setIsRunning(false);
    setStep(0);
  };

  const handleGhostLevelChange = (level: number) => {
    setGhostLevel(level);
    gameEngine.setGhostLevel(level);
  };

  const handleAddPlayer = () => {
    // 빈 공간에 플레이어 추가
    const { mapSize, walls, players, ghost } = gameState;
    for (let y = 1; y < mapSize.height - 1; y++) {
      for (let x = 1; x < mapSize.width - 1; x++) {
        const isOccupied = walls.some(w => w.x === x && w.y === y) ||
                          players.some(p => p.x === x && p.y === y) ||
                          (ghost.x === x && ghost.y === y);
        
        if (!isOccupied) {
          gameEngine.addPlayer({ x, y });
          setGameState(gameEngine.getGameState());
          return;
        }
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>팩맨 시뮬레이션</h1>
      
      <GameControls
        isRunning={isRunning}
        ghostLevel={ghostLevel}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
        onGhostLevelChange={handleGhostLevelChange}
        onAddPlayer={handleAddPlayer}
      />
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <GameBoard gameState={gameState} cellSize={25} />
        <GameStats gameState={gameState} gameOver={gameOver} step={step} />
      </div>
    </div>
  );
};