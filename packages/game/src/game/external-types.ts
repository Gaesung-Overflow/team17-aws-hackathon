import { Position } from './types';

export interface ExternalPlayer {
  id: string;
  name?: string;
  emoji?: string;
  speed?: number;
}

export interface PlayerCommand {
  playerId: string;
  type: 'boost' | 'slow' | 'teleport' | 'add' | 'remove';
  data?: {
    duration?: number;
    position?: Position;
    speedMultiplier?: number;
  };
}

export interface GameCallbacks {
  onPlayerJoined?: (player: ExternalPlayer, gameIndex: number) => void;
  onPlayerJoinFailed?: (playerId: string, error: Error) => void;
  onPlayerEliminated?: (playerId: string, rank: number) => void;
  onPlayerMoved?: (playerId: string, position: Position) => void;
  onPlayerLeft?: (playerId: string) => void;
  onGameEnd?: (rankings: Array<{ playerId: string; rank: number }>) => void;
  onGameStateChange?: (state: 'running' | 'stopped' | 'ended') => void;
  onGameReset?: () => void;
}

export interface PlayerEffect {
  type: 'speed';
  multiplier: number;
  endTime: number;
}

export interface ExternalGameState {
  isRunning: boolean;
  isEnded: boolean;
  step: number;
  players: Array<{
    id: string;
    name?: string;
    emoji?: string;
    position: Position;
    isEliminated: boolean;
    effects: PlayerEffect[];
  }>;
  ghost: Position;
  rankings: Array<{ playerId: string; rank: number }>;
  gameConfig: {
    ghostLevel: number;
    playerSpeed: number;
    ghostSpeed: number;
    maxPlayers: number;
    currentMapId?: string;
    gameStarted?: boolean;
  };
}
