import { GameEngine } from './GameEngine';
import { MapGenerator, MapInfo } from './MapGenerator';
import { SmoothMovement } from './SmoothMovement';
import { PlayerEngine } from './PlayerEngine';
import type { GameState, Position } from './types';
import type {
  ExternalPlayer,
  PlayerCommand,
  PlayerEffect,
  ExternalGameState,
} from './external-types';
import { isValidPosition } from './utils';

export class ExternalGameEngine extends GameEngine {
  private externalPlayerMap = new Map<string, number>(); // externalId -> gameIndex
  private playerInfo = new Map<string, ExternalPlayer>(); // externalId -> player info
  private playerEffects = new Map<number, PlayerEffect[]>(); // gameIndex -> effects
  private eventListeners = new Map<string, Function[]>();
  private maxPlayers: number = 10; // 기본 최대 플레이어 수
  private currentMapId: string = 'classic'; // 현재 선택된 맵 ID
  private gameStarted: boolean = false; // 게임 시작 여부

  constructor(initialState?: Partial<GameState>) {
    const defaultState = {
      players: [],
      ghost: { x: 10, y: 6 },
      ...MapGenerator.createPacmanMap(),
      eliminatedPlayers: [],
      rankings: [],
      gameStep: 0,
      ...initialState,
    };
    super(defaultState);
  }

  // 최대 플레이어 수 설정
  setMaxPlayers(maxPlayers: number): void {
    this.maxPlayers = maxPlayers;
  }

  // 최대 플레이어 수 반환
  getMaxPlayers(): number {
    return this.maxPlayers;
  }

  // 맵 선택 (게임 시작 전에만 가능)
  selectMap(mapId: string): boolean {
    if (this.gameStarted) {
      return false;
    }

    const mapInfo = MapGenerator.getMapById(mapId);
    if (!mapInfo) {
      return false;
    }

    this.currentMapId = mapId;

    const ghostPos = {
      x: Math.floor(mapInfo.mapSize.width / 2),
      y: Math.floor(mapInfo.mapSize.height / 2),
    };

    this.updateMapState(mapInfo.walls, mapInfo.mapSize, ghostPos);
    this.repositionPlayersForNewMap();

    return true;
  }

  // 현재 맵 정보 반환
  getCurrentMapInfo(): MapInfo | null {
    return MapGenerator.getMapById(this.currentMapId);
  }

  // 사용 가능한 모든 맵 목록 반환
  getAvailableMaps(): MapInfo[] {
    return MapGenerator.getAllMaps();
  }

  // 게임 시작 상태 설정
  setGameStarted(started: boolean): void {
    this.gameStarted = started;
  }

  // 게임 시작 상태 반환
  isGameStarted(): boolean {
    return this.gameStarted;
  }

  // 외부 플레이어 추가
  addExternalPlayer(
    playerId: string,
    playerInfo?: ExternalPlayer,
    position?: Position,
  ): number {
    // 이미 존재하는 플레이어인지 확인
    if (this.externalPlayerMap.has(playerId)) {
      return this.externalPlayerMap.get(playerId)!;
    }

    // 최대 플레이어 수 확인
    const currentPlayerCount = this.getGameState().players.length;
    if (currentPlayerCount >= this.maxPlayers) {
      throw new Error(
        `최대 플레이어 수(${this.maxPlayers})를 초과할 수 없습니다.`,
      );
    }

    const gameIndex = currentPlayerCount;

    if (position) {
      // 지정된 위치에 추가
      if (this.isPositionAvailable(position)) {
        this.addPlayerAt(position);
      } else {
        this.addPlayerToCorner(); // 코너에 추가
      }
    } else {
      this.addPlayerToCorner(); // 코너에 추가
    }

    this.externalPlayerMap.set(playerId, gameIndex);
    if (playerInfo) {
      this.playerInfo.set(playerId, playerInfo);
    }
    this.emit('playerJoined', playerId, gameIndex);
    return gameIndex;
  }

  // 외부 플레이어 제거
  removeExternalPlayer(playerId: string): boolean {
    const gameIndex = this.externalPlayerMap.get(playerId);
    if (gameIndex === undefined) return false;

    this.removePlayer(gameIndex);
    this.externalPlayerMap.delete(playerId);
    this.playerInfo.delete(playerId);
    this.playerEffects.delete(gameIndex);

    // 인덱스 재매핑
    const newMap = new Map<string, number>();
    this.externalPlayerMap.forEach((index, id) => {
      newMap.set(id, index > gameIndex ? index - 1 : index);
    });
    this.externalPlayerMap = newMap;

    return true;
  }

  // 플레이어 부스트
  boostPlayer(
    playerId: string,
    duration: number = 3000,
    multiplier: number = 2,
  ): boolean {
    const gameIndex = this.externalPlayerMap.get(playerId);
    if (gameIndex === undefined) return false;

    const effect: PlayerEffect = {
      type: 'speed',
      multiplier,
      endTime: performance.now() + duration,
    };

    if (!this.playerEffects.has(gameIndex)) {
      this.playerEffects.set(gameIndex, []);
    }
    this.playerEffects.get(gameIndex)!.push(effect);

    this.updatePlayerSpeed(gameIndex);
    return true;
  }

  // 플레이어 텔레포트
  teleportPlayer(playerId: string, position: Position): boolean {
    const gameIndex = this.externalPlayerMap.get(playerId);
    if (gameIndex === undefined || !this.isPositionAvailable(position))
      return false;

    const gameState = this.getGameState();
    gameState.players[gameIndex] = position;
    return true;
  }

  // 플레이어 정보 업데이트
  updatePlayerInfo(playerId: string, playerInfo: ExternalPlayer): boolean {
    if (!this.externalPlayerMap.has(playerId)) return false;
    this.playerInfo.set(playerId, playerInfo);
    return true;
  }

  // 플레이어 정보 가져오기
  getPlayerInfo(playerId: string): ExternalPlayer | undefined {
    return this.playerInfo.get(playerId);
  }

  // 명령 처리
  processCommand(command: PlayerCommand): boolean {
    switch (command.type) {
      case 'add':
        // playerInfo는 외부에서 전달되어야 함
        this.addExternalPlayer(
          command.playerId,
          undefined,
          command.data?.position,
        );
        return true;

      case 'remove':
        return this.removeExternalPlayer(command.playerId);

      case 'boost':
        return this.boostPlayer(
          command.playerId,
          command.data?.duration,
          command.data?.speedMultiplier,
        );

      case 'slow':
        return this.boostPlayer(
          command.playerId,
          command.data?.duration,
          1 / (command.data?.speedMultiplier || 2),
        );

      case 'teleport':
        return command.data?.position
          ? this.teleportPlayer(command.playerId, command.data.position)
          : false;

      default:
        return false;
    }
  }

  // 외부용 게임 상태 반환
  getExternalGameState(): ExternalGameState {
    const gameState = this.getGameState();
    const gameOver = this.isGameOver();

    // 모든 플레이어 정보를 gameIndex 순서로 정렬하여 반환
    const players: any[] = [];

    // gameState.players 배열의 각 인덱스에 대해 처리
    gameState.players.forEach((position, gameIndex) => {
      // 해당 gameIndex에 매핑된 external player 찾기
      const externalEntry = Array.from(this.externalPlayerMap.entries()).find(
        ([_, idx]) => idx === gameIndex,
      );

      if (externalEntry) {
        const [id, _] = externalEntry;
        const info = this.playerInfo.get(id);
        players[gameIndex] = {
          id,
          name: info?.name || `Player ${gameIndex + 1}`,
          emoji: info?.emoji,
          position,
          isEliminated: gameState.eliminatedPlayers.includes(gameIndex),
          effects: this.playerEffects.get(gameIndex) || [],
        };
      } else {
        // external player가 없는 경우 기본값 사용
        players[gameIndex] = {
          id: `player-${gameIndex}`,
          name: `Player ${gameIndex + 1}`,
          emoji: undefined,
          position,
          isEliminated: gameState.eliminatedPlayers.includes(gameIndex),
          effects: this.playerEffects.get(gameIndex) || [],
        };
      }
    });

    const rankings = this.getRankings()
      .map((r) => ({
        playerId:
          Array.from(this.externalPlayerMap.entries()).find(
            ([_, idx]) => idx === r.playerId,
          )?.[0] || '',
        rank: r.rank,
      }))
      .filter((r) => r.playerId);

    return {
      isRunning: false, // 외부에서 관리
      isEnded: gameOver.isOver,
      step: gameState.gameStep,
      players: players.filter((p) => p), // undefined 제거
      ghost: gameState.ghost,
      rankings,
      gameConfig: {
        ghostLevel: this.getGhostLevel(),
        playerSpeed: this.getPlayerSpeed(),
        ghostSpeed: this.getGhostSpeed(),
        maxPlayers: this.maxPlayers,
        currentMapId: this.currentMapId,
        gameStarted: this.gameStarted,
      },
    };
  }

  // 게임 업데이트 오버라이드 (이팩트 처리 포함)
  updateGame(): GameState {
    this.updateEffects();
    const result = super.updateGame();

    // 이동 이벤트 발생
    this.externalPlayerMap.forEach((gameIndex, playerId) => {
      const position = result.players[gameIndex];
      this.emit('playerMoved', playerId, position);
    });

    return result;
  }

  // 이벤트 시스템
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(...args));
    }
  }

  private updateEffects(): void {
    const currentTime = performance.now();

    this.playerEffects.forEach((effects, gameIndex) => {
      // 만료된 이펙트 제거
      const activeEffects = effects.filter(
        (effect) => effect.endTime > currentTime,
      );
      this.playerEffects.set(gameIndex, activeEffects);

      // 속도 업데이트
      this.updatePlayerSpeed(gameIndex);
    });
  }

  private updatePlayerSpeed(gameIndex: number): void {
    const effects = this.playerEffects.get(gameIndex) || [];
    const speedMultiplier = effects
      .filter((e) => e.type === 'speed')
      .reduce((acc, e) => acc * e.multiplier, 1);

    // 개별 플레이어 속도 설정 (기본 속도 * 배율)
    // 실제 구현에서는 SmoothMovement에 개별 속도 설정 기능이 필요
  }

  private isPositionAvailable(position: Position): boolean {
    const gameState = this.getGameState();
    return (
      isValidPosition(
        position,
        gameState.mapSize,
        gameState.walls,
        gameState.players,
      ) &&
      position.x !== gameState.ghost.x &&
      position.y !== gameState.ghost.y
    );
  }

  private addPlayerAt(position: Position): void {
    const gameState = this.getGameState();
    gameState.players.push(position);
    // PlayerEngine과 SmoothMovement 직접 추가
    (this as any).playerEngines.push(new PlayerEngine());
    (this as any).playerMovements.push(new SmoothMovement(position));
  }

  // 현재 설정값들을 가져오는 메서드들
  getGhostLevel(): number {
    return (this as any).ghostEngine.getLevel?.() || 1;
  }

  getPlayerSpeed(): number {
    return (this as any).playerMovements[0]?.getSpeed?.() || 300;
  }

  getGhostSpeed(): number {
    return (this as any).ghostMovement?.getSpeed?.() || 300;
  }

  // 게임 리셋
  reset(): void {
    const currentMap =
      this.getCurrentMapInfo() || MapGenerator.createClassicMap();
    const initialState = {
      players: [],
      ghost: {
        x: Math.floor(currentMap.mapSize.width / 2),
        y: Math.floor(currentMap.mapSize.height / 2),
      },
      walls: currentMap.walls,
      mapSize: currentMap.mapSize,
      eliminatedPlayers: [],
      rankings: [],
      gameStep: 0,
    };

    // 모든 내부 상태 완전 초기화
    this.externalPlayerMap.clear();
    this.playerInfo.clear();
    this.playerEffects.clear();
    this.eventListeners.clear();
    this.gameStarted = false; // 게임 시작 상태 리셋
    this.currentMapId = 'classic'; // 맵 ID 리셋

    // 부모 클래스 리셋
    this.resetGame(initialState);
  }

  // 새 맵에 맞게 플레이어 재배치
  private repositionPlayersForNewMap(): void {
    const gameState = this.getGameState();
    const mapSize = gameState.mapSize;

    // 기존 플레이어들을 새 맵의 코너에 재배치
    gameState.players.forEach((_, index) => {
      const corners = [
        { x: 1, y: 1 }, // 좌상
        { x: mapSize.width - 2, y: 1 }, // 우상
        { x: 1, y: mapSize.height - 2 }, // 좌하
        { x: mapSize.width - 2, y: mapSize.height - 2 }, // 우하
      ];

      const targetCorner = corners[index % 4];

      // 해당 위치가 유효한지 확인하고 재배치
      if (isValidPosition(targetCorner, mapSize, gameState.walls)) {
        gameState.players[index] = targetCorner;
        // SmoothMovement도 업데이트
        (this as any).playerMovements[index] = new SmoothMovement(targetCorner);
      } else {
        // 유효하지 않으면 가장 가까운 빈 공간 찾기
        const validPos = this.findNearestValidPosition(targetCorner, gameState);
        gameState.players[index] = validPos;
        (this as any).playerMovements[index] = new SmoothMovement(validPos);
      }
    });
  }

  // 가장 가까운 유효한 위치 찾기
  private findNearestValidPosition(
    target: Position,
    gameState: GameState,
  ): Position {
    const occupiedPositions = new Set(
      gameState.players.map((p) => `${p.x},${p.y}`),
    );
    occupiedPositions.add(`${gameState.ghost.x},${gameState.ghost.y}`);

    for (
      let radius = 0;
      radius < Math.max(gameState.mapSize.width, gameState.mapSize.height);
      radius++
    ) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius && radius > 0)
            continue;

          const pos = { x: target.x + dx, y: target.y + dy };

          if (
            isValidPosition(pos, gameState.mapSize, gameState.walls) &&
            !occupiedPositions.has(`${pos.x},${pos.y}`)
          ) {
            return pos;
          }
        }
      }
    }

    // 최후의 수단으로 (1,1) 반환
    return { x: 1, y: 1 };
  }

  private addPlayerToCorner(): void {
    const gameState = this.getGameState();
    const mapSize = gameState.mapSize;

    // 네 코너 위치 정의 (벽에서 1칸 안쪽)
    const corners = [
      { x: 1, y: 1 }, // 좌상
      { x: mapSize.width - 2, y: 1 }, // 우상
      { x: 1, y: mapSize.height - 2 }, // 좌하
      { x: mapSize.width - 2, y: mapSize.height - 2 }, // 우하
    ];

    const occupiedPositions = new Set(
      gameState.players.map((p) => `${p.x},${p.y}`),
    );
    occupiedPositions.add(`${gameState.ghost.x},${gameState.ghost.y}`);

    // 플레이어 수에 따라 코너 선택
    const playerCount = gameState.players.length;
    const targetCorner = corners[playerCount % 4];

    // 해당 코너에서 가장 가까운 빈 공간 찾기
    let bestPosition = targetCorner;
    let minDistance = Infinity;

    for (let radius = 0; radius < 5; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

          const pos = { x: targetCorner.x + dx, y: targetCorner.y + dy };
          const distance = Math.abs(dx) + Math.abs(dy);

          if (
            isValidPosition(pos, mapSize, gameState.walls) &&
            !occupiedPositions.has(`${pos.x},${pos.y}`) &&
            distance < minDistance
          ) {
            bestPosition = pos;
            minDistance = distance;
          }
        }
      }
      if (minDistance < Infinity) break;
    }

    gameState.players.push(bestPosition);
    // PlayerEngine과 SmoothMovement 직접 추가
    (this as any).playerEngines.push(new PlayerEngine());
    (this as any).playerMovements.push(new SmoothMovement(bestPosition));
  }
}
