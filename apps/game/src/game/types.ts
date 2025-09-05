export interface Position {
  x: number;
  y: number;
}

export interface Direction {
  x: number;
  y: number;
}

export interface SmoothPosition {
  logical: Position; // 게임 로직용 그리드 좌표
  visual: Position; // 렌더링용 실제 좌표
}

export interface Movement {
  from: Position;
  to: Position;
  startTime: number;
  duration: number;
  progress: number;
}

export const MovementState = {
  IDLE: 'idle',
  MOVING: 'moving',
} as const;

export type MovementState = typeof MovementState[keyof typeof MovementState];

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
} as const;

export type DirectionKey = keyof typeof DIRECTIONS;

export interface PlayerRanking {
  playerId: number;
  rank: number;
  eliminatedAt?: number;
}

export interface GameState {
  players: Position[];
  ghost: Position;
  mapSize: { width: number; height: number };
  walls: Position[];
  eliminatedPlayers: number[];
  rankings: PlayerRanking[];
  gameStep: number;
}

export interface MovementHistory {
  positions: Position[];
  maxHistory: number;
}
