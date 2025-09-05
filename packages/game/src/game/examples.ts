import { GameEngine, GameState, MapGenerator } from './index';

// 사용 예시들
export const createSimpleGame = () => {
  const { walls, mapSize } = MapGenerator.createPacmanMap();
  
  const initialState: GameState = {
    players: [
      { x: 1, y: 1 },
      { x: 18, y: 11 }
    ],
    ghost: { x: 10, y: 6 },
    mapSize,
    walls
  };
  
  return new GameEngine(initialState);
};

export const createMazeGame = () => {
  const mapSize = { width: 25, height: 15 };
  const walls = MapGenerator.createMazeWalls(mapSize.width, mapSize.height);
  
  const initialState: GameState = {
    players: [
      { x: 1, y: 1 },
      { x: 23, y: 13 },
      { x: 1, y: 13 }
    ],
    ghost: { x: 12, y: 7 },
    mapSize,
    walls
  };
  
  return new GameEngine(initialState);
};

export const createCustomGame = () => {
  // 커스텀 맵 패턴
  const pattern = [
    "############",
    "#..........#",
    "#.##....##.#",
    "#..........#",
    "#....##....#",
    "#..........#",
    "#.##....##.#",
    "#..........#",
    "############"
  ];
  
  const walls = MapGenerator.createCustomWalls(pattern);
  const mapSize = { width: 12, height: 9 };
  
  const initialState: GameState = {
    players: [{ x: 1, y: 1 }],
    ghost: { x: 10, y: 7 },
    mapSize,
    walls
  };
  
  return new GameEngine(initialState);
};