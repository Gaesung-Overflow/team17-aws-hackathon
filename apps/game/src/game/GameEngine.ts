import { GhostEngine } from './GhostEngine';
import { PlayerEngine } from './PlayerEngine';
import type { GameState, Position } from './types';
import { isValidPosition } from './utils';

export class GameEngine {
  private playerEngines: PlayerEngine[];
  private ghostEngine: GhostEngine;
  private gameState: GameState;

  constructor(initialState: GameState) {
    this.playerEngines = initialState.players.map(() => new PlayerEngine());
    this.ghostEngine = new GhostEngine();
    this.gameState = { ...initialState };
  }

  updateGame(): GameState {
    // 모든 플레이어 이동
    this.gameState.players = this.gameState.players.map((player, index) => {
      const otherPlayers = this.gameState.players.filter((_, i) => i !== index);

      const playerMove = this.playerEngines[index].getNextMove(
        player,
        this.gameState.mapSize,
        this.gameState.walls,
        this.gameState.ghost,
        otherPlayers,
      );

      const newPlayerPos = {
        x: player.x + playerMove.x,
        y: player.y + playerMove.y,
      };

      if (
        isValidPosition(
          newPlayerPos,
          this.gameState.mapSize,
          this.gameState.walls,
        )
      ) {
        return newPlayerPos;
      }
      return player;
    });

    // 술래 이동
    const ghostMove = this.ghostEngine.getNextMove(
      this.gameState.ghost,
      this.gameState.mapSize,
      this.gameState.walls,
      undefined,
      this.gameState.players,
    );

    const newGhostPos = {
      x: this.gameState.ghost.x + ghostMove.x,
      y: this.gameState.ghost.y + ghostMove.y,
    };

    if (
      isValidPosition(newGhostPos, this.gameState.mapSize, this.gameState.walls)
    ) {
      this.gameState.ghost = newGhostPos;
    }

    return { ...this.gameState };
  }

  setGhostLevel(level: number): void {
    this.ghostEngine.setLevel(level);
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  isGameOver(): { isOver: boolean; caughtPlayers: number[] } {
    const caughtPlayers = this.gameState.players
      .map((player, index) =>
        player.x === this.gameState.ghost.x &&
        player.y === this.gameState.ghost.y
          ? index
          : -1,
      )
      .filter((index) => index !== -1);

    return {
      isOver: caughtPlayers.length > 0,
      caughtPlayers,
    };
  }

  resetGame(newState: GameState): void {
    this.gameState = { ...newState };
    this.playerEngines = newState.players.map(() => new PlayerEngine());
    this.ghostEngine = new GhostEngine();
  }

  addPlayer(position: Position): void {
    this.gameState.players.push(position);
    this.playerEngines.push(new PlayerEngine());
  }

  removePlayer(index: number): void {
    if (index >= 0 && index < this.gameState.players.length) {
      this.gameState.players.splice(index, 1);
      this.playerEngines.splice(index, 1);
    }
  }
}
