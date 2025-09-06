export interface ExternalPlayer {
  id: string;
  name?: string;
  emoji?: string;
  speed?: number;
  joinedAt?: number;
}

export interface PlayerCommand {
  playerId: string;
  type: 'boost' | 'slow' | 'teleport' | 'add' | 'remove';
  data?: {
    duration?: number;
    position?: { x: number; y: number };
    speedMultiplier?: number;
  };
}

export interface GameCallbacks {
  onPlayerJoined?: (player: ExternalPlayer, gameIndex: number) => void;
  onPlayerJoinFailed?: (playerId: string, error: Error) => void;
  onPlayerEliminated?: (playerId: string, rank: number) => void;
  onPlayerMoved?: (
    playerId: string,
    position: { x: number; y: number },
  ) => void;
  onGameEnd?: (rankings: Array<{ playerId: string; rank: number }>) => void;
  onGameStateChange?: (state: 'running' | 'stopped' | 'ended') => void;
  onGameReset?: () => void;
  onConfigChange?: (config: {
    playerSpeedLevel: number;
    ghostSpeedLevel: number;
    ghostLevel: number;
    selectedMapId: string;
  }) => void;
}
