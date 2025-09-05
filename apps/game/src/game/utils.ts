import { Direction, Position } from './types';
import { DIRECTIONS } from './types';

export const manhattanDistance = (pos1: Position, pos2: Position): number => {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
};

export const isValidPosition = (
  pos: Position,
  mapSize: { width: number; height: number },
  walls: Position[],
  occupiedPositions?: Position[]
): boolean => {
  if (
    pos.x < 0 ||
    pos.x >= mapSize.width ||
    pos.y < 0 ||
    pos.y >= mapSize.height
  ) {
    return false;
  }
  
  // 벽 충돌 검사
  if (walls.some((wall) => wall.x === pos.x && wall.y === pos.y)) {
    return false;
  }
  
  // 다른 플레이어 위치 충돌 검사
  if (occupiedPositions?.some((occupied) => occupied.x === pos.x && occupied.y === pos.y)) {
    return false;
  }
  
  return true;
};

export const getValidDirections = (
  pos: Position,
  mapSize: { width: number; height: number },
  walls: Position[],
  occupiedPositions?: Position[]
): Direction[] => {
  return Object.values(DIRECTIONS).filter((dir) => {
    const newPos = { x: pos.x + dir.x, y: pos.y + dir.y };
    return isValidPosition(newPos, mapSize, walls, occupiedPositions);
  });
};

export const getOppositeDirection = (dir: Direction): Direction => {
  return { x: -dir.x, y: -dir.y };
};

export const isSameDirection = (dir1: Direction, dir2: Direction): boolean => {
  return dir1.x === dir2.x && dir1.y === dir2.y;
};

export const wasRecentPosition = (
  pos: Position,
  history: Position[],
): boolean => {
  return history.some((histPos) => histPos.x === pos.x && histPos.y === pos.y);
};
