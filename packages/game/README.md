# 돔황챠 팩맨 게임 라이브러리

실시간 멀티플레이어 팩맨 서바이벌 게임 라이브러리입니다. 외부에서 플레이어를 제어하고 게임 상태를 모니터링할 수 있습니다.

## 설치

```bash
npm install @team17/pacman-game
# 또는
pnpm add @team17/pacman-game
```

## 기본 사용법

### 통합 컴포넌트 사용

```tsx
import React, { useState } from 'react';
import {
  PacmanGame,
  ExternalPlayer,
  PlayerCommand,
  GameCallbacks,
} from '@team17/pacman-game';

const App = () => {
  const [players, setPlayers] = useState<ExternalPlayer[]>([]);
  const [commands, setCommands] = useState<PlayerCommand[]>([]);

  const addPlayer = () => {
    const newPlayer = {
      id: `player_${Date.now()}`,
      name: 'New Player',
      avatar: '🤖', // 개별 아바타 지정
    };
    setPlayers((prev) => [...prev, newPlayer]);
    setCommands((prev) => [...prev, { playerId: newPlayer.id, type: 'add' }]);
  };

  const boostPlayer = (playerId: string) => {
    setCommands((prev) => [
      ...prev,
      {
        playerId,
        type: 'boost',
        data: { duration: 5000, speedMultiplier: 2 },
      },
    ]);
  };

  const callbacks: GameCallbacks = {
    onPlayerEliminated: (playerId, rank) => {
      console.log(`플레이어 ${playerId} 탈락 - 순위: ${rank}`);
    },
    onGameEnd: (rankings) => {
      console.log('게임 종료:', rankings);
    },
    onPlayerJoinFailed: (playerId, error) => {
      console.log(`플레이어 ${playerId} 입장 실패:`, error.message);
    },
    onGameReset: () => {
      console.log('게임이 리셋되었습니다.');
    },
  };

  return (
    <div>
      <button onClick={addPlayer}>Add Player</button>
      {players.map((player) => (
        <button key={player.id} onClick={() => boostPlayer(player.id)}>
          Boost {player.name}
        </button>
      ))}

      <PacmanGame
        externalPlayers={players}
        playerCommands={commands}
        callbacks={callbacks}
        onCommandProcessed={(index) => {
          setCommands((prev) => prev.filter((_, i) => i !== index));
        }}
        autoStart={false}
        gameConfig={{
          maxPlayers: 10,
          playerSpeed: 1,
          ghostSpeed: 1,
          ghostLevel: 1, // 0: 쉬움, 1: 보통, 2: 어려움
          cellSize: 45,
        }}
        showControls={true}
        showRankings={true}
      />
    </div>
  );
};
```

### 개별 컴포넌트 사용

```tsx
import React from 'react';
import { GameBoard, GameStats, RankingBoard } from '@team17/pacman-game';

const CustomGameUI = ({ gameState, rankings, gameOver, step }) => {
  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <GameBoard
        gameState={gameState}
        cellSize={30}
        playerEmojis={['🟦', '🟩', '🟨', '🟪']}
        ghostEmoji="👹"
        style={{ border: '3px solid red' }}
      />

      <div>
        <RankingBoard
          rankings={rankings}
          totalPlayers={gameOver.totalPlayers}
          remainingPlayers={gameOver.remainingPlayers}
          title="🏅 순위표"
          showPlayerCount={false}
        />

        <GameStats
          gameState={gameState}
          gameOver={gameOver}
          step={step}
          showStep={false}
          showPlayerPositions={false}
        />
      </div>
    </div>
  );
};
```

## API 참조

### 타입 정의

#### ExternalPlayer

```typescript
interface ExternalPlayer {
  id: string;
  name?: string; // 플레이어 이름
  emoji?: string; // 플레이어 이모지 (deprecated, avatar 사용 권장)
  avatar?: string; // 플레이어 아바타 (이모지)
  speed?: number; // 개별 플레이어 속도 (현재 미사용)
}
```

### 개별 플레이어 커스터마이징

```tsx
const players = [
  { id: 'player1', name: '유저A', avatar: '🚀' },
  { id: 'player2', name: '유저B', avatar: '🎉' },
  { id: 'player3', name: '유저C', avatar: '🎆' },
];

// 플레이어 정보 업데이트
const updatePlayer = (playerId: string, newInfo: Partial<ExternalPlayer>) => {
  setPlayers((prev) =>
    prev.map((p) => (p.id === playerId ? { ...p, ...newInfo } : p)),
  );
};
```

#### PlayerCommand

```typescript
interface PlayerCommand {
  playerId: string;
  type: 'boost' | 'slow' | 'teleport' | 'add' | 'remove';
  data?: {
    duration?: number;
    position?: Position;
    speedMultiplier?: number;
  };
}
```

#### GameCallbacks

```typescript
interface GameCallbacks {
  onPlayerJoined?: (player: ExternalPlayer, gameIndex: number) => void;
  onPlayerJoinFailed?: (playerId: string, error: Error) => void;
  onPlayerEliminated?: (playerId: string, rank: number) => void;
  onPlayerMoved?: (playerId: string, position: Position) => void;
  onGameEnd?: (rankings: Array<{ playerId: string; rank: number }>) => void;
  onGameStateChange?: (state: 'running' | 'stopped' | 'ended') => void;
  onGameReset?: () => void;
}
```

### 컴포넌트 Props

#### PacmanGame (ExternalPacmanGame)

- `externalPlayers`: 외부 플레이어 배열
- `playerCommands`: 플레이어 명령 배열
- `callbacks`: 게임 이벤트 콜백
- `onCommandProcessed`: 명령 처리 완료 콜백
- `autoStart`: 자동 시작 여부 (기본값: false)
- `gameConfig`: 게임 설정
  - `maxPlayers`: 최대 플레이어 수 (기본값: 4)
  - `playerSpeed`: 플레이어 속도 배율 (기본값: 1)
  - `ghostSpeed`: 고스트 속도 배율 (기본값: 1)
  - `ghostLevel`: 고스트 난이도 0-2 (기본값: 1)
  - `cellSize`: 게임 셀 크기 (기본값: 45)
- `showControls`: 게임 컨트롤 버튼 표시 여부 (기본값: true)
- `showRankings`: 순위표 표시 여부 (기본값: true)

#### GameBoard

- `gameState`: 게임 상태
- `cellSize`: 셀 크기
- `playerEmojis`: 플레이어 이모지 배열
- `ghostEmoji`: 고스트 이모지
- `wallEmoji`: 벽 이모지
- `eliminatedEmoji`: 제거된 플레이어 이모지
- `style`: 커스텀 스타일

#### RankingBoard

- `rankings`: 순위 배열
- `totalPlayers`: 총 플레이어 수
- `remainingPlayers`: 생존 플레이어 수
- `playerEmojis`: 플레이어 이모지 배열
- `title`: 제목
- `style`: 커스텀 스타일
- `showPlayerCount`: 플레이어 수 표시 여부

#### GameStats

- `gameState`: 게임 상태
- `gameOver`: 게임 종료 정보
- `step`: 게임 스텝
- `title`: 제목
- `style`: 커스텀 스타일
- `showStep`: 스텝 표시 여부
- `showGhostPosition`: 고스트 위치 표시 여부
- `showMapSize`: 맵 크기 표시 여부
- `showPlayerPositions`: 플레이어 위치 표시 여부

## 게임 특징

### 🎮 게임 규칙
- 플레이어들은 미로에서 고스트를 피해 생존해야 합니다
- 고스트에게 잡히면 탈락하며 순위가 결정됩니다
- 마지막까지 살아남은 플레이어가 승리합니다
- 최소 2명 이상의 플레이어가 있어야 게임을 시작할 수 있습니다

### ⚙️ 게임 설정
- **난이도 조절**: 고스트 속도와 AI 레벨 조정 가능
- **속도 설정**: 플레이어와 고스트의 이동 속도 개별 조정
- **최대 인원**: 동시 참여 가능한 최대 플레이어 수 설정
- **실시간 업데이트**: 게임 중에도 설정 변경 가능

## 플레이어 제어

### 플레이어 추가 (externalPlayers 배열 사용 권장)

```typescript
// 권장 방법: externalPlayers 배열에 추가
const newPlayer: ExternalPlayer = {
  id: 'unique-player-id',
  name: '플레이어 이름',
  avatar: '🚀', // 이모지 아바타
};
setPlayers(prev => [...prev, newPlayer]);
```

### 플레이어 부스트 (현재 미구현)

```typescript
const boostCommand: PlayerCommand = {
  playerId: 'player-id',
  type: 'boost',
  data: { duration: 3000, speedMultiplier: 2 },
};
```

### 플레이어 제거

```typescript
// 권장 방법: externalPlayers 배열에서 제거
setPlayers(prev => prev.filter(p => p.id !== 'player-id'));
```

## 이벤트 처리

```typescript
const callbacks: GameCallbacks = {
  // 플레이어 입장 성공
  onPlayerJoined: (player, gameIndex) => {
    console.log(`${player.name} 입장 (게임 인덱스: ${gameIndex})`);
  },
  
  // 플레이어 입장 실패 (인원 초과 등)
  onPlayerJoinFailed: (playerId, error) => {
    alert(`입장 실패: ${error.message}`);
  },
  
  // 플레이어 탈락
  onPlayerEliminated: (playerId, rank) => {
    console.log(`플레이어 탈락 - 순위: ${rank}`);
  },
  
  // 게임 종료
  onGameEnd: (rankings) => {
    console.log('최종 순위:', rankings);
  },
  
  // 게임 리셋
  onGameReset: () => {
    // 플레이어 목록 초기화 등
    setPlayers([]);
  },
};
```