import { Position } from './types';

export interface MapInfo {
  id: string;
  name: string;
  description: string;
  walls: Position[];
  mapSize: { width: number; height: number };
  difficulty: 'easy' | 'medium' | 'hard';
}

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

  // 연결성 검사 (모든 빈 공간이 연결되어 있는지 확인)
  static isConnected(
    walls: Position[],
    mapSize: { width: number; height: number },
  ): boolean {
    const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));
    const visited = new Set<string>();

    // 첫 번째 빈 공간 찾기
    let startPos: Position | null = null;
    for (let y = 1; y < mapSize.height - 1; y++) {
      for (let x = 1; x < mapSize.width - 1; x++) {
        if (!wallSet.has(`${x},${y}`)) {
          startPos = { x, y };
          break;
        }
      }
      if (startPos) break;
    }

    if (!startPos) return false;

    // BFS로 연결된 모든 공간 탐색
    const queue = [startPos];
    visited.add(`${startPos.x},${startPos.y}`);

    while (queue.length > 0) {
      const pos = queue.shift()!;
      const neighbors = [
        { x: pos.x + 1, y: pos.y },
        { x: pos.x - 1, y: pos.y },
        { x: pos.x, y: pos.y + 1 },
        { x: pos.x, y: pos.y - 1 },
      ];

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (
          !visited.has(key) &&
          !wallSet.has(key) &&
          neighbor.x >= 0 &&
          neighbor.x < mapSize.width &&
          neighbor.y >= 0 &&
          neighbor.y < mapSize.height
        ) {
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }

    // 모든 빈 공간이 방문되었는지 확인
    let totalEmptySpaces = 0;
    for (let y = 0; y < mapSize.height; y++) {
      for (let x = 0; x < mapSize.width; x++) {
        if (!wallSet.has(`${x},${y}`)) {
          totalEmptySpaces++;
        }
      }
    }

    return visited.size === totalEmptySpaces;
  }

  // 클래식 팩맨 맵
  static createClassicMap(): MapInfo {
    const pattern = [
      '####################',
      '#..................#',
      '#.##.######.####.#',
      '#..................#',
      '#.####.##.####.##..#',
      '#..................#',
      '#.##.######.####.#',
      '#..................#',
      '#.####.##.####.##..#',
      '#..................#',
      '#.##.######.####.#',
      '#..................#',
      '####################',
    ];

    return {
      id: 'classic',
      name: '클래식',
      description: '전통적인 팩맨 스타일 맵',
      walls: this.createCustomWalls(pattern),
      mapSize: { width: 20, height: 13 },
      difficulty: 'medium',
    };
  }

  // 미로 맵
  static createMazeMap(): MapInfo {
    const pattern = [
      '####################',
      '#..................#',
      '#.##.##.##.##.##.#',
      '#....##....##....#',
      '##.#....##....#.##',
      '#..##.######.##..#',
      '#.....#....#.....#',
      '#.##..#....#..##.#',
      '#....##....##....#',
      '##.#....##....#.##',
      '#....##....##....#',
      '#..................#',
      '####################',
    ];

    return {
      id: 'maze',
      name: '미로',
      description: '복잡한 미로 구조의 맵',
      walls: this.createCustomWalls(pattern),
      mapSize: { width: 20, height: 13 },
      difficulty: 'hard',
    };
  }

  // 오픈 필드 맵
  static createOpenMap(): MapInfo {
    const pattern = [
      '####################',
      '#..................#',
      '#..................#',
      '#......####........#',
      '#......#..#........#',
      '#.........#........#',
      '#......####........#',
      '#..................#',
      '#........####......#',
      '#........#.........#',
      '#........####......#',
      '#..................#',
      '####################',
    ];

    return {
      id: 'open',
      name: '오픈 필드',
      description: '넓은 공간에서 자유로운 움직임',
      walls: this.createCustomWalls(pattern),
      mapSize: { width: 20, height: 13 },
      difficulty: 'easy',
    };
  }

  // 십자가 맵
  static createCrossMap(): MapInfo {
    const pattern = [
      '####################',
      '#......####........#',
      '#......#..#........#',
      '#......#..#........#',
      '#..................#',
      '#######......#######',
      '#..................#',
      '######..........####',
      '#........#..#......#',
      '#........#..#......#',
      '#........#..#......#',
      '#........####......#',
      '####################',
    ];

    return {
      id: 'cross',
      name: '십자가',
      description: '십자 모양의 전략적 맵',
      walls: this.createCustomWalls(pattern),
      mapSize: { width: 20, height: 13 },
      difficulty: 'medium',
    };
  }

  // 스파이럴 맵
  static createSpiralMap(): MapInfo {
    const pattern = [
      '####################',
      '#..................#',
      '#.################.#',
      '#.#..............#.#',
      '#.#.############.#.#',
      '#.#.#..........#.#.#',
      '#.#.#.########.#.#.#',
      '#.#.#........#.#.#.#',
      '#.#.##########.#.#.#',
      '#.#............#.#.#',
      '#.##############.#.#',
      '#..................#',
      '####################',
    ];

    return {
      id: 'spiral',
      name: '스파이럴',
      description: '나선��� 구조의 도전적인 맵',
      walls: this.createCustomWalls(pattern),
      mapSize: { width: 20, height: 13 },
      difficulty: 'hard',
    };
  }

  // 모든 맵 목록 반환
  static getAllMaps(): MapInfo[] {
    const maps = [
      this.createClassicMap(),
      this.createOpenMap(),
      this.createCrossMap(),
      this.createMazeMap(),
      this.createSpiralMap(),
    ];

    return maps.filter((map) => this.isConnected(map.walls, map.mapSize));
  }

  // ID로 맵 가져오기
  static getMapById(id: string): MapInfo | null {
    return this.getAllMaps().find((map) => map.id === id) || null;
  }

  // 팩맨 스타일 맵 (하위 호환성)
  static createPacmanMap(): {
    walls: Position[];
    mapSize: { width: number; height: number };
  } {
    const classic = this.createClassicMap();
    return {
      walls: classic.walls,
      mapSize: classic.mapSize,
    };
  }
}
