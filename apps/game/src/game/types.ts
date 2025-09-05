export interface Position {
  x: number;
  y: number;
}

export interface Direction {
  x: number;
  y: number;
}

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
} as const;

export type DirectionKey = keyof typeof DIRECTIONS;

export interface GameState {
  players: Position[];
  ghost: Position;
  mapSize: { width: number; height: number };
  walls: Position[];
}

export interface MovementHistory {
  positions: Position[];
  maxHistory: number;
}