import { Position, Direction } from './types';
import { MovementEngine } from './MovementEngine';
import { getValidDirections, manhattanDistance, wasRecentPosition } from './utils';

export class PlayerEngine extends MovementEngine {
  getNextMove(
    currentPos: Position, 
    mapSize: { width: number; height: number }, 
    walls: Position[], 
    ghostPos?: Position,
    otherPlayers?: Position[]
  ): Direction {
    const validDirections = getValidDirections(currentPos, mapSize, walls);
    
    if (validDirections.length === 0) {
      return { x: 0, y: 0 };
    }

    const weights = this.getDirectionWeights(validDirections);
    
    // 술래 회피 로직
    if (ghostPos) {
      const distanceToGhost = manhattanDistance(currentPos, ghostPos);
      
      if (distanceToGhost <= 3) {
        validDirections.forEach(dir => {
          const newPos = { x: currentPos.x + dir.x, y: currentPos.y + dir.y };
          const newDistance = manhattanDistance(newPos, ghostPos);
          
          // 술래에서 멀어지는 방향 우선
          if (newDistance > distanceToGhost) {
            weights.set(dir, (weights.get(dir) || 1) + 5);
          } else {
            weights.set(dir, (weights.get(dir) || 1) * 0.3);
          }
        });
      }
    }

    // 최근 위치 및 다른 플레이어 회피
    validDirections.forEach(dir => {
      const newPos = { x: currentPos.x + dir.x, y: currentPos.y + dir.y };
      if (wasRecentPosition(newPos, this.history.positions)) {
        weights.set(dir, (weights.get(dir) || 1) * 0.5);
      }
      
      // 다른 플레이어와 겹치지 않도록
      if (otherPlayers?.some(p => p.x === newPos.x && p.y === newPos.y)) {
        weights.set(dir, (weights.get(dir) || 1) * 0.2);
      }
    });

    // 랜덤 요소 (25% 확률)
    if (Math.random() < 0.25) {
      const randomDir = validDirections[Math.floor(Math.random() * validDirections.length)];
      this.lastDirection = randomDir;
      this.updateHistory(currentPos);
      return randomDir;
    }

    const selectedDirection = this.selectWeightedDirection(weights);
    this.lastDirection = selectedDirection;
    this.updateHistory(currentPos);
    
    return selectedDirection;
  }
}