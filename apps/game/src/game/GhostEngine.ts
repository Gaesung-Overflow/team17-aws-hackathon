import { Position, Direction } from './types';
import { MovementEngine } from './MovementEngine';
import { getValidDirections, manhattanDistance } from './utils';

export class GhostEngine extends MovementEngine {
  private level: number = 1;
  private playerHistory: Position[] = [];
  private mapKnowledge: Set<string> = new Set();

  setLevel(level: number): void {
    this.level = Math.max(1, Math.min(4, level));
  }

  getNextMove(
    currentPos: Position,
    mapSize: { width: number; height: number },
    walls: Position[],
    playerPos?: Position,
    allPlayers?: Position[],
  ): Direction {
    const players = allPlayers || (playerPos ? [playerPos] : []);
    if (players.length === 0) {
      return this.getRandomMove(currentPos, mapSize, walls);
    }

    // 가장 가까운 플레이어를 타겟으로 선택
    const targetPlayer = this.findClosestPlayer(currentPos, players);

    this.updatePlayerHistory(targetPlayer);
    this.updateMapKnowledge(currentPos);

    const validDirections = getValidDirections(currentPos, mapSize, walls);
    if (validDirections.length === 0) {
      return { x: 0, y: 0 };
    }

    switch (this.level) {
      case 1:
        return this.basicChase(currentPos, targetPlayer, validDirections);
      case 2:
        return this.predictiveChase(currentPos, targetPlayer, validDirections);
      case 3:
        return this.strategicChase(
          currentPos,
          targetPlayer,
          validDirections,
          mapSize,
          walls,
        );
      case 4:
        return this.advancedChase(
          currentPos,
          targetPlayer,
          validDirections,
          players,
        );
      default:
        return this.basicChase(currentPos, targetPlayer, validDirections);
    }
  }

  private basicChase(
    currentPos: Position,
    playerPos: Position,
    validDirections: Direction[],
  ): Direction {
    const weights = this.getDirectionWeights(validDirections);

    validDirections.forEach((dir) => {
      const newPos = { x: currentPos.x + dir.x, y: currentPos.y + dir.y };
      const currentDistance = manhattanDistance(currentPos, playerPos);
      const newDistance = manhattanDistance(newPos, playerPos);

      if (newDistance < currentDistance) {
        weights.set(dir, (weights.get(dir) || 1) + 3);
      }
    });

    this.lastDirection = this.selectWeightedDirection(weights);
    this.updateHistory(currentPos);
    return this.lastDirection;
  }

  private predictiveChase(
    currentPos: Position,
    playerPos: Position,
    validDirections: Direction[],
  ): Direction {
    const weights = this.getDirectionWeights(validDirections);

    // 플레이어 예측 위치 계산
    const predictedPos = this.predictPlayerPosition(playerPos);

    validDirections.forEach((dir) => {
      const newPos = { x: currentPos.x + dir.x, y: currentPos.y + dir.y };
      const distanceToPlayer = manhattanDistance(newPos, playerPos);
      const distanceToPredicted = manhattanDistance(newPos, predictedPos);

      // 예측 위치와 현재 위치 모두 고려
      const combinedScore =
        1 / (distanceToPlayer + 1) + 0.7 / (distanceToPredicted + 1);
      weights.set(dir, (weights.get(dir) || 1) + combinedScore * 3);
    });

    this.lastDirection = this.selectWeightedDirection(weights);
    this.updateHistory(currentPos);
    return this.lastDirection;
  }

  private strategicChase(
    currentPos: Position,
    playerPos: Position,
    validDirections: Direction[],
    mapSize: { width: number; height: number },
    walls: Position[],
  ): Direction {
    const weights = this.getDirectionWeights(validDirections);

    validDirections.forEach((dir) => {
      const newPos = { x: currentPos.x + dir.x, y: currentPos.y + dir.y };
      let score = 0;

      // 기본 추적
      const distance = manhattanDistance(newPos, playerPos);
      score += 1 / (distance + 1);

      // 플레이어 퇴로 차단 시도
      const playerEscapeRoutes = getValidDirections(playerPos, mapSize, walls);
      if (playerEscapeRoutes.length <= 2) {
        // 플레이어가 막다른 길 근처에 있으면 더 적극적으로
        score += 2;
      }

      weights.set(dir, (weights.get(dir) || 1) + score * 3);
    });

    this.lastDirection = this.selectWeightedDirection(weights);
    this.updateHistory(currentPos);
    return this.lastDirection;
  }

  private advancedChase(
    currentPos: Position,
    playerPos: Position,
    validDirections: Direction[],
    allPlayers: Position[],
  ): Direction {
    const weights = this.getDirectionWeights(validDirections);

    // A* 스타일 최적 경로 고려
    const optimalDirection = this.findOptimalDirection(currentPos, playerPos);

    validDirections.forEach((dir) => {
      let score = 0;

      // 최적 경로 가중치
      if (
        optimalDirection &&
        dir.x === optimalDirection.x &&
        dir.y === optimalDirection.y
      ) {
        score += 4;
      }

      // 플레이어 패턴 분석
      const patternScore = this.analyzePlayerPattern(dir);
      score += patternScore;

      // 다른 플레이어들도 고려한 전략
      const nearbyPlayers = allPlayers.filter(
        (p) => manhattanDistance(currentPos, p) <= 4,
      );
      if (nearbyPlayers.length > 1) {
        score += nearbyPlayers.length * 0.5; // 여러 플레이어가 근처에 있으면 더 적극적
      }

      // 가끔 의도적으로 거리두기 (10% 확률)
      if (Math.random() < 0.1) {
        const distance = manhattanDistance(currentPos, playerPos);
        if (distance < 3) {
          score *= 0.3;
        }
      }

      weights.set(dir, (weights.get(dir) || 1) + score);
    });

    this.lastDirection = this.selectWeightedDirection(weights);
    this.updateHistory(currentPos);
    return this.lastDirection;
  }

  private getRandomMove(
    currentPos: Position,
    mapSize: { width: number; height: number },
    walls: Position[],
  ): Direction {
    const validDirections = getValidDirections(currentPos, mapSize, walls);
    if (validDirections.length === 0) return { x: 0, y: 0 };

    return validDirections[Math.floor(Math.random() * validDirections.length)];
  }

  private updatePlayerHistory(playerPos: Position): void {
    this.playerHistory.push(playerPos);
    if (this.playerHistory.length > 5) {
      this.playerHistory.shift();
    }
  }

  private updateMapKnowledge(pos: Position): void {
    const key = `${pos.x},${pos.y}`;
    this.mapKnowledge.add(key);
  }

  private predictPlayerPosition(currentPlayerPos: Position): Position {
    if (this.playerHistory.length < 2) return currentPlayerPos;

    const recent = this.playerHistory.slice(-2);
    const dx = recent[1].x - recent[0].x;
    const dy = recent[1].y - recent[0].y;

    return {
      x: currentPlayerPos.x + dx,
      y: currentPlayerPos.y + dy,
    };
  }

  private findOptimalDirection(
    currentPos: Position,
    targetPos: Position,
  ): Direction | null {
    const dx = targetPos.x - currentPos.x;
    const dy = targetPos.y - currentPos.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
      return dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }
  }

  private analyzePlayerPattern(dir: Direction): number {
    if (this.playerHistory.length < 3) return 0;

    // 플레이어가 자주 가는 방향 분석
    const recentMoves = this.playerHistory.slice(-3);
    let patternScore = 0;

    // 간단한 패턴 분석 (실제로는 더 복잡한 ML 모델을 사용할 수 있음)
    for (let i = 1; i < recentMoves.length; i++) {
      const moveDir = {
        x: recentMoves[i].x - recentMoves[i - 1].x,
        y: recentMoves[i].y - recentMoves[i - 1].y,
      };

      if (moveDir.x === dir.x && moveDir.y === dir.y) {
        patternScore += 0.5;
      }
    }

    return patternScore;
  }

  private findClosestPlayer(
    currentPos: Position,
    players: Position[],
  ): Position {
    let closest = players[0];
    let minDistance = manhattanDistance(currentPos, closest);

    for (const player of players) {
      const distance = manhattanDistance(currentPos, player);
      if (distance < minDistance) {
        minDistance = distance;
        closest = player;
      }
    }

    return closest;
  }
}
