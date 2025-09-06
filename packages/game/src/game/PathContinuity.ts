import { Direction } from './types';
import { isSameDirection } from './utils';

export class PathContinuity {
  private consecutiveMoves = 0;
  private currentDirection: Direction | null = null;

  updateDirection(dir: Direction): void {
    if (this.currentDirection && isSameDirection(dir, this.currentDirection)) {
      this.consecutiveMoves++;
    } else {
      this.consecutiveMoves = 1;
      this.currentDirection = dir;
    }
  }

  getContinuityBonus(): number {
    return Math.min(this.consecutiveMoves * 2, 10);
  }

  reset(): void {
    this.consecutiveMoves = 0;
    this.currentDirection = null;
  }
}
