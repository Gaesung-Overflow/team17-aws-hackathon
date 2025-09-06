import { Direction, MovementHistory, Position } from './types';
import { getOppositeDirection, isSameDirection } from './utils';
import { PathContinuity } from './PathContinuity';

export abstract class MovementEngine {
  protected history: MovementHistory;
  protected lastDirection: Direction | null = null;
  protected pathContinuity: PathContinuity;

  constructor(maxHistory: number = 4) {
    this.history = { positions: [], maxHistory };
    this.pathContinuity = new PathContinuity();
  }

  protected updateHistory(pos: Position): void {
    this.history.positions.push(pos);
    if (this.history.positions.length > this.history.maxHistory) {
      this.history.positions.shift();
    }
  }

  protected getDirectionWeights(
    validDirections: Direction[],
  ): Map<Direction, number> {
    const weights = new Map<Direction, number>();

    validDirections.forEach((dir) => {
      let weight = 1;

      // 직진 우선 가중치 대폭 증가 + 경로 지속성 보너스
      if (this.lastDirection && isSameDirection(dir, this.lastDirection)) {
        weight += 15 + this.pathContinuity.getContinuityBonus();
      }

      // 되돌아가기 거의 불가능하게 차단
      if (
        this.lastDirection &&
        isSameDirection(dir, getOppositeDirection(this.lastDirection))
      ) {
        weight = 0.001;
      }

      weights.set(dir, weight);
    });

    return weights;
  }

  protected selectWeightedDirection(
    weights: Map<Direction, number>,
  ): Direction {
    const totalWeight = Array.from(weights.values()).reduce(
      (sum, w) => sum + w,
      0,
    );
    let random = Math.random() * totalWeight;

    for (const [dir, weight] of weights) {
      random -= weight;
      if (random <= 0) return dir;
    }

    return Array.from(weights.keys())[0];
  }

  abstract getNextMove(
    currentPos: Position,
    mapSize: { width: number; height: number },
    walls: Position[],
    otherPos?: Position,
  ): Direction;
}
