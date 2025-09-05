// 게임 엔진과 타입들
export * from './game';

// 컴포넌트들
export * from './components';

// 기본 게임 컴포넌트 (통합)
export { ExternalPacmanGame as PacmanGame } from './components/ExternalPacmanGame';

// 개별 컴포넌트들 (커스터마이징용)
export { GameBoard } from './components/GameBoard';
export { GameStats } from './components/GameStats';
export { RankingBoard } from './components/RankingBoard';
