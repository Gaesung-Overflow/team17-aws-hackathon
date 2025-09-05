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
    const validDirections = getValidDirections(currentPos, mapSize, walls, otherPlayers);
    
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
      
      // 다른 플레이어와 겹치지 않도록 (완전 차단)
      if (otherPlayers?.some(p => p.x === newPos.x && p.y === newPos.y)) {
        weights.set(dir, 0); // 완전히 차단
      }
    });
    
    // 모든 방향이 차단된 경우 제자리에 머물기
    const hasValidMove = Array.from(weights.values()).some(weight => weight > 0);
    if (!hasValidMove) {
      return { x: 0, y: 0 };
    }

    // 랜덤 요소 (25% 확률) - 유효한 방향만 선택
    if (Math.random() < 0.25) {
      const validWeightedDirections = validDirections.filter(dir => (weights.get(dir) || 0) > 0);
      if (validWeightedDirections.length > 0) {
        const randomDir = validWeightedDirections[Math.floor(Math.random() * validWeightedDirections.length)];
        this.lastDirection = randomDir;
        this.updateHistory(currentPos);
        return randomDir;
      }
    }

    const selectedDirection = this.selectWeightedDirection(weights);
    this.lastDirection = selectedDirection;
    this.updateHistory(currentPos);
    
    return selectedDirection;
  }
}