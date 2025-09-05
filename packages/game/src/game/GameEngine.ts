import { GhostEngine } from './GhostEngine';
import { PlayerEngine } from './PlayerEngine';
import { SmoothMovement } from './SmoothMovement';
import type { GameState, Position, PlayerRanking } from './types';
import { isValidPosition } from './utils';

export class GameEngine {
  private playerEngines: PlayerEngine[];
  private ghostEngine: GhostEngine;
  private gameState: GameState;
  private playerMovements: SmoothMovement[];
  private ghostMovement: SmoothMovement;

  constructor(initialState: GameState) {
    this.playerEngines = initialState.players.map(() => new PlayerEngine());
    this.ghostEngine = new GhostEngine();
    this.gameState = {
      ...initialState,
      eliminatedPlayers: initialState.eliminatedPlayers || [],
      rankings: initialState.rankings || [],
      gameStep: initialState.gameStep || 0,
    };
    this.playerMovements = initialState.players.map(
      (pos) => new SmoothMovement(pos),
    );
    this.ghostMovement = new SmoothMovement(initialState.ghost);
  }

  updateSmoothMovement(): GameState {
    const currentTime = performance.now();

    // 모든 이동 업데이트
    this.playerMovements.forEach((movement) => movement.update(currentTime));
    this.ghostMovement.update(currentTime);

    // 시각적 위치로 게임 상태 업데이트
    const updatedState = { ...this.gameState };
    updatedState.players = this.playerMovements.map(
      (movement) => movement.getPosition().visual,
    );
    updatedState.ghost = this.ghostMovement.getPosition().visual;

    return updatedState;
  }

  updateGame(): GameState {
    const currentTime = performance.now();
    this.gameState.gameStep++;

    // 논리적 위치로 이동 전 위치 저장
    const previousGhostPos = { ...this.ghostMovement.getPosition().logical };
    const previousPlayerPositions = this.playerMovements.map((movement) => ({
      ...movement.getPosition().logical,
    }));

    // 살아있는 플레이어들만 이동
    const activePlayerIndices = this.playerMovements
      .map((_, index) => index)
      .filter((index) => !this.gameState.eliminatedPlayers.includes(index));

    const plannedMoves = new Map<number, Position>();

    // 각 플레이어의 이동 계획 수립
    activePlayerIndices.forEach((index) => {
      const movement = this.playerMovements[index];
      const currentPos = movement.getPosition().logical;
      const otherPlayers = activePlayerIndices
        .filter((i) => i !== index)
        .map((i) => this.playerMovements[i].getPosition().logical);

      const playerMove = this.playerEngines[index].getNextMove(
        currentPos,
        this.gameState.mapSize,
        this.gameState.walls,
        this.ghostMovement.getPosition().logical,
        otherPlayers,
      );

      const newPlayerPos = {
        x: currentPos.x + playerMove.x,
        y: currentPos.y + playerMove.y,
      };

      // 다른 플레이어 위치도 고려하여 유효성 검사
      const otherPlayerPositions = activePlayerIndices
        .filter((i) => i !== index)
        .map((i) => this.playerMovements[i].getPosition().logical);

      if (
        isValidPosition(
          newPlayerPos,
          this.gameState.mapSize,
          this.gameState.walls,
          otherPlayerPositions,
        )
      ) {
        plannedMoves.set(index, newPlayerPos);
      } else {
        plannedMoves.set(index, currentPos); // 이동 불가시 제자리
      }
    });

    // 충돌 검사 및 해결
    this.resolvePlayerCollisions(plannedMoves, activePlayerIndices);

    // 최종 이동 실행
    plannedMoves.forEach((newPos, index) => {
      const movement = this.playerMovements[index];
      const currentPos = movement.getPosition().logical;
      const moveDirection = {
        x: newPos.x - currentPos.x,
        y: newPos.y - currentPos.y,
      };

      if (moveDirection.x !== 0 || moveDirection.y !== 0) {
        movement.startMove(moveDirection, currentTime);
      }
    });

    // 술래 이동
    const currentGhostPos = this.ghostMovement.getPosition().logical;
    const activePlayerPositions = activePlayerIndices.map(
      (i) => this.playerMovements[i].getPosition().logical,
    );
    const ghostMove = this.ghostEngine.getNextMove(
      currentGhostPos,
      this.gameState.mapSize,
      this.gameState.walls,
      undefined,
      activePlayerPositions,
    );

    const newGhostPos = {
      x: currentGhostPos.x + ghostMove.x,
      y: currentGhostPos.y + ghostMove.y,
    };

    if (
      isValidPosition(newGhostPos, this.gameState.mapSize, this.gameState.walls)
    ) {
      this.ghostMovement.startMove(ghostMove, currentTime);
    }

    // 잡힌 플레이어 확인 및 제거 (자리 바꿈 포함)
    this.checkAndEliminatePlayers(previousGhostPos, previousPlayerPositions);

    // 시각적 위치로 게임 상태 업데이트
    this.gameState.players = this.playerMovements.map(
      (movement) => movement.getPosition().visual,
    );
    this.gameState.ghost = this.ghostMovement.getPosition().visual;

    return { ...this.gameState };
  }

  setGhostLevel(level: number): void {
    this.ghostEngine.setLevel(level);
  }

  setPlayerSpeed(speed: number): void {
    this.playerMovements.forEach((movement) => movement.setSpeed(speed));
  }

  setGhostSpeed(speed: number): void {
    this.ghostMovement.setSpeed(speed);
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  isGameOver(): {
    isOver: boolean;
    winner?: number;
    totalPlayers: number;
    remainingPlayers: number;
  } {
    const remainingPlayers =
      this.gameState.players.length - this.gameState.eliminatedPlayers.length;
    const isOver = remainingPlayers <= 1;

    let winner: number | undefined;
    if (isOver && remainingPlayers === 1) {
      winner = this.gameState.players.findIndex(
        (_, index) => !this.gameState.eliminatedPlayers.includes(index),
      );
    }

    return {
      isOver,
      winner,
      totalPlayers: this.gameState.players.length,
      remainingPlayers,
    };
  }

  resetGame(newState: GameState): void {
    this.gameState = {
      ...newState,
      eliminatedPlayers: [],
      rankings: [],
      gameStep: 0,
    };
    this.playerEngines = newState.players.map(() => new PlayerEngine());
    this.ghostEngine = new GhostEngine();
    this.playerMovements = newState.players.map(
      (pos) => new SmoothMovement(pos),
    );
    this.ghostMovement = new SmoothMovement(newState.ghost);
  }

  addPlayer(): void {
    const occupiedPositions = new Set(
      this.gameState.players.map((p) => `${p.x},${p.y}`),
    );
    occupiedPositions.add(
      `${this.gameState.ghost.x},${this.gameState.ghost.y}`,
    );

    // 기존 플레이어 근처 빈 공간 찾기
    for (const player of this.gameState.players) {
      const directions = [
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 0, y: -1 },
        { x: -1, y: 0 },
      ];
      for (const dir of directions) {
        const pos = { x: player.x + dir.x, y: player.y + dir.y };
        if (
          isValidPosition(pos, this.gameState.mapSize, this.gameState.walls) &&
          !occupiedPositions.has(`${pos.x},${pos.y}`)
        ) {
          this.gameState.players.push(pos);
          this.playerEngines.push(new PlayerEngine());
          this.playerMovements.push(new SmoothMovement(pos));
          return;
        }
      }
    }

    // 빈 공간이 없으면 첫 번째 빈 공간에 배치
    for (let y = 1; y < this.gameState.mapSize.height - 1; y++) {
      for (let x = 1; x < this.gameState.mapSize.width - 1; x++) {
        const pos = { x, y };
        if (
          isValidPosition(pos, this.gameState.mapSize, this.gameState.walls) &&
          !occupiedPositions.has(`${x},${y}`)
        ) {
          this.gameState.players.push(pos);
          this.playerEngines.push(new PlayerEngine());
          this.playerMovements.push(new SmoothMovement(pos));
          return;
        }
      }
    }
  }

  private checkAndEliminatePlayers(
    previousGhostPos: Position,
    previousPlayerPositions: Position[],
  ): void {
    const newlyEliminated: number[] = [];

    this.playerMovements.forEach((movement, index) => {
      if (this.gameState.eliminatedPlayers.includes(index)) {
        return; // 이미 제거된 플레이어는 건너뛰기
      }

      const currentPlayerPos = movement.getPosition().logical;
      const currentGhostPos = this.ghostMovement.getPosition().logical;
      const previousPlayerPos = previousPlayerPositions[index];

      // 케이스 1: 같은 칸에 있는 경우
      const samePosition =
        currentPlayerPos.x === currentGhostPos.x &&
        currentPlayerPos.y === currentGhostPos.y;

      // 케이스 2: 서로 자리를 바꾼 경우
      const swappedPositions =
        currentPlayerPos.x === previousGhostPos.x &&
        currentPlayerPos.y === previousGhostPos.y &&
        currentGhostPos.x === previousPlayerPos.x &&
        currentGhostPos.y === previousPlayerPos.y;

      if (samePosition || swappedPositions) {
        newlyEliminated.push(index);
      }
    });

    // 새로 제거된 플레이어들을 순위에 추가
    newlyEliminated.forEach((playerId) => {
      this.gameState.eliminatedPlayers.push(playerId);
      const currentRank =
        this.gameState.players.length -
        this.gameState.eliminatedPlayers.length +
        1;
      this.gameState.rankings.push({
        playerId,
        rank: currentRank,
        eliminatedAt: this.gameState.gameStep,
      });
    });

    // 게임이 끝났을 때 마지막 생존자를 1등으로 추가
    const remainingPlayers =
      this.gameState.players.length - this.gameState.eliminatedPlayers.length;
    if (remainingPlayers === 1) {
      const winnerId = this.gameState.players.findIndex(
        (_, index) => !this.gameState.eliminatedPlayers.includes(index),
      );
      if (
        winnerId !== -1 &&
        !this.gameState.rankings.some((r) => r.playerId === winnerId)
      ) {
        this.gameState.rankings.push({
          playerId: winnerId,
          rank: 1,
          eliminatedAt: this.gameState.gameStep,
        });
      }
    }
  }

  private resolvePlayerCollisions(
    plannedMoves: Map<number, Position>,
    activePlayerIndices: number[],
  ): void {
    const positionCounts = new Map<string, number[]>();

    // 각 위치에 몇 명의 플레이어가 이동하려는지 계산
    plannedMoves.forEach((pos, index) => {
      const key = `${pos.x},${pos.y}`;
      if (!positionCounts.has(key)) {
        positionCounts.set(key, []);
      }
      positionCounts.get(key)!.push(index);
    });

    // 충돌하는 위치들 처리
    positionCounts.forEach((playerIndices) => {
      if (playerIndices.length > 1) {
        // 여러 플레이어가 같은 위치로 이동하려는 경우
        // 모든 플레이어를 원래 위치에 유지
        playerIndices.forEach((index) => {
          const currentPos = this.playerMovements[index].getPosition().logical;
          plannedMoves.set(index, currentPos);
        });
      }
    });

    // 자리 바꿈 충돌 검사
    const swapPairs = new Set<string>();
    activePlayerIndices.forEach((i) => {
      activePlayerIndices.forEach((j) => {
        if (i >= j) return;

        const currentPosI = this.playerMovements[i].getPosition().logical;
        const currentPosJ = this.playerMovements[j].getPosition().logical;
        const plannedPosI = plannedMoves.get(i)!;
        const plannedPosJ = plannedMoves.get(j)!;

        // 서로 자리를 바꾸려는 경우
        if (
          currentPosI.x === plannedPosJ.x &&
          currentPosI.y === plannedPosJ.y &&
          currentPosJ.x === plannedPosI.x &&
          currentPosJ.y === plannedPosI.y
        ) {
          const pairKey = `${Math.min(i, j)}-${Math.max(i, j)}`;
          if (!swapPairs.has(pairKey)) {
            swapPairs.add(pairKey);
            // 두 플레이어 모두 원래 위치에 유지
            plannedMoves.set(i, currentPosI);
            plannedMoves.set(j, currentPosJ);
          }
        }
      });
    });
  }

  getRankings(): PlayerRanking[] {
    return [...this.gameState.rankings].sort((a, b) => a.rank - b.rank);
  }

  removePlayer(index: number): void {
    if (index >= 0 && index < this.gameState.players.length) {
      this.gameState.players.splice(index, 1);
      this.playerEngines.splice(index, 1);
      this.playerMovements.splice(index, 1);
      // 제거된 플레이어 인덱스들을 업데이트
      this.gameState.eliminatedPlayers = this.gameState.eliminatedPlayers
        .map((i) => (i > index ? i - 1 : i))
        .filter((i) => i !== index);
      // 순위 정보도 업데이트
      this.gameState.rankings = this.gameState.rankings
        .map((r) => ({
          ...r,
          playerId: r.playerId > index ? r.playerId - 1 : r.playerId,
        }))
        .filter((r) => r.playerId !== index);
    }
  }
}
