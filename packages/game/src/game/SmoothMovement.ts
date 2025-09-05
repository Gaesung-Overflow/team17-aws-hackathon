import {
  Position,
  Direction,
  Movement,
  MovementState,
  SmoothPosition,
} from './types';

export class SmoothMovement {
  private logicalPos: Position;
  private visualPos: Position;
  private currentMove: Movement | null = null;
  private nextDirection: Direction | null = null;
  private state: MovementState = MovementState.IDLE;
  private moveSpeed: number = 200; // ms per cell

  constructor(initialPos: Position) {
    this.logicalPos = { ...initialPos };
    this.visualPos = { ...initialPos };
  }

  getPosition(): SmoothPosition {
    return {
      logical: { ...this.logicalPos },
      visual: { ...this.visualPos },
    };
  }

  isMoving(): boolean {
    return this.state === MovementState.MOVING;
  }

  canMove(): boolean {
    return (
      this.state === MovementState.IDLE ||
      (this.currentMove !== null && this.currentMove.progress > 0.5)
    );
  }

  queueDirection(direction: Direction): void {
    this.nextDirection = direction;
  }

  startMove(direction: Direction, currentTime: number): boolean {
    if (!this.canMove()) return false;

    const targetPos = {
      x: this.logicalPos.x + direction.x,
      y: this.logicalPos.y + direction.y,
    };

    this.currentMove = {
      from: { ...this.logicalPos },
      to: targetPos,
      startTime: currentTime,
      duration: this.moveSpeed,
      progress: 0,
    };

    this.logicalPos = targetPos;
    this.state = MovementState.MOVING;
    return true;
  }

  update(currentTime: number): boolean {
    if (!this.currentMove || this.state === MovementState.IDLE) {
      return false;
    }

    const elapsed = currentTime - this.currentMove.startTime;
    this.currentMove.progress = Math.min(
      elapsed / this.currentMove.duration,
      1,
    );

    // 선형 보간으로 시각적 위치 계산
    const t = this.easeInOut(this.currentMove.progress);
    this.visualPos = {
      x:
        this.currentMove.from.x +
        (this.currentMove.to.x - this.currentMove.from.x) * t,
      y:
        this.currentMove.from.y +
        (this.currentMove.to.y - this.currentMove.from.y) * t,
    };

    // 이동 완료 체크
    if (this.currentMove.progress >= 1) {
      this.visualPos = { ...this.currentMove.to };
      this.currentMove = null;
      this.state = MovementState.IDLE;

      // 대기 중인 방향이 있으면 즉시 시작
      if (this.nextDirection) {
        const nextDir = this.nextDirection;
        this.nextDirection = null;
        this.startMove(nextDir, currentTime);
      }

      return true; // 이동 완료
    }

    return false;
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  setSpeed(speed: number): void {
    this.moveSpeed = speed;
  }

  forceStop(): void {
    if (this.currentMove) {
      this.visualPos = { ...this.logicalPos };
      this.currentMove = null;
    }
    this.state = MovementState.IDLE;
    this.nextDirection = null;
  }
}
