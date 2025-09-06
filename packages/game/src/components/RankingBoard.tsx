import React from 'react';
import { PlayerRanking } from '../game/types';
import { ExternalPlayer } from '../game';

interface RankingBoardProps {
  externalPlayers?: ExternalPlayer[];
  rankings: PlayerRanking[];
  totalPlayers: number;
  remainingPlayers: number;
  playerNames?: string[];
}

export const RankingBoard: React.FC<RankingBoardProps> = ({
  externalPlayers,
  rankings,
  totalPlayers,
  remainingPlayers,
  playerNames,
}) => {
  const playerEmojis = ['🔵', '🟢', '🟡', '🟣', '🟠', '🔴', '⚫', '⚪'];
  console.log(playerNames);

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${rank}위`;
    }
  };

  const sortedRankings = [...rankings].sort((a, b) => a.rank - b.rank);

  console.log(externalPlayers);

  return (
    <div
      style={{
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        width: '100%',
      }}
    >
      <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>
        🏆 순위 보드
      </h3>

      <div style={{ marginBottom: '10px', fontSize: '14px' }}>
        생존자: {remainingPlayers}명 / {totalPlayers}명
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px' }}>
        {/* 아직 살아있는 플레이어들 먼저 표시 */}
        {Array.from({ length: totalPlayers }, (_, i) => i)
          .filter((i) => !rankings.some((r) => r.playerId === i))
          .map((playerId) => {
            const externalPlayer = externalPlayers?.[playerId];
            return (
              <div
                key={`alive-${playerId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 0',
                  borderBottom: '1px solid #eee',
                  backgroundColor: '#e8f5e8',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>
                    {externalPlayer?.emoji ||
                      playerEmojis[playerId % playerEmojis.length]}
                  </span>
                  <span>
                    {externalPlayer?.name ||
                      playerNames?.[playerId] ||
                      `Player ${playerId + 1}`}
                  </span>
                </div>
                <div style={{ color: '#28a745', fontWeight: 'bold' }}>생존</div>
              </div>
            );
          })}

        {/* 순위가 매겨진 플레이어들 표시 */}
        {sortedRankings.length === 0
          ? totalPlayers === 0 && (
              <div style={{ textAlign: 'center', color: '#666' }}>
                게임을 시작하세요!
              </div>
            )
          : sortedRankings.map((ranking) => {
              const externalPlayer = externalPlayers?.[ranking.playerId];
              return (
                <div
                  key={ranking.playerId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 0',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>
                      {externalPlayer?.emoji ||
                        playerEmojis[ranking.playerId % playerEmojis.length]}
                    </span>
                    <span>
                      {externalPlayer?.name ||
                        playerNames?.[ranking.playerId] ||
                        `Player ${ranking.playerId + 1}`}
                    </span>
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    {getRankEmoji(ranking.rank)}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};
