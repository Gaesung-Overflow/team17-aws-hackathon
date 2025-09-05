import { Position } from './types';

export class MapGenerator {
  static createEmptyMap(): Position[] {
    return [];
  }

  static createBorderWalls(width: number, height: number): Position[] {
    const walls: Position[] = [];

    // 상하 경계
    for (let x = 0; x < width; x++) {
      walls.push({ x, y: 0 });
      walls.push({ x, y: height - 1 });
    }

    // 좌우 경계
    for (let y = 1; y < height - 1; y++) {
      walls.push({ x: 0, y });
      walls.push({ x: width - 1, y });
    }

    return walls;
  }

  static createMazeWalls(width: number, height: number): Position[] {
    const walls = this.createBorderWalls(width, height);

    // 내부 벽 패턴 (격자형)
    for (let x = 2; x < width - 2; x += 4) {
      for (let y = 2; y < height - 2; y += 2) {
        walls.push({ x, y });

        // 랜덤하게 연결 통로 생성
        if (Math.random() > 0.3) {
          walls.push({ x: x + 1, y });
        }
        if (Math.random() > 0.3) {
          walls.push({ x, y: y + 1 });
        }
      }
    }

    return walls;
  }

  static createCustomWalls(pattern: string[]): Position[] {
    const walls: Position[] = [];

    pattern.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell === '#' || cell === '1') {
          walls.push({ x, y });
        }
      });
    });

    return walls;
  }

  static createRandomWalls(
    width: number,
    height: number,
    density: number = 0.2,
  ): Position[] {
    const walls = this.createBorderWalls(width, height);

    for (let x = 1; x < width - 1; x++) {
      for (let y = 1; y < height - 1; y++) {
        if (Math.random() < density) {
          walls.push({ x, y });
        }
      }
    }

    return walls;
  }

  // 팩맨 스타일 맵
  static createPacmanMap(): {
    walls: Position[];
    mapSize: { width: number; height: number };
  } {
    const pattern = [
      '####################',
      '#..................#',
      '#.##.#######.####.#',
      '#..................#',
      '#.####.##.####.###.#',
      '#..................#',
      '#.##.#######.####.#',
      '#..................#',
      '#.####.##.####.###.#',
      '#..................#',
      '#.##.#######.####.#',
      '#..................#',
      '####################',
    ];

    return {
      walls: this.createCustomWalls(pattern),
      mapSize: { width: 20, height: 13 },
    };
  }
}
