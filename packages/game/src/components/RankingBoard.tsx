import React from 'react';
import { PlayerRanking } from '../game/types';
import { ExternalPlayer } from '../game';
import '../styles/retro-arcade.css';

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
    <div className="arcade-info-panel" style={{ width: '100%' }}>
      <h3 className="retro-font neon-glow-green" style={{ margin: '0 0 15px 0', textAlign: 'center', textTransform: 'uppercase' }}>
        RANKING
      </h3>

      <div className="retro-font neon-glow-cyan" style={{ marginBottom: '10px', fontSize: '10px', textAlign: 'center' }}>
        ALIVE: {remainingPlayers} / {totalPlayers}
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
                className="retro-font"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px',
                  marginBottom: '4px',
                  backgroundColor: 'rgba(0, 255, 0, 0.1)',
                  border: '1px solid var(--neon-green)',
                  borderRadius: '4px',
                  color: 'var(--neon-green)',
                  textShadow: '0 0 5px var(--neon-green)'
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
                <div className="neon-glow-green" style={{ fontWeight: 'bold' }}>ALIVE</div>
              </div>
            );
          })}

        {/* 순위가 매겨진 플레이어들 표시 */}
        {sortedRankings.length === 0
          ? totalPlayers === 0 && (
              <div className="retro-font arcade-blink" style={{ textAlign: 'center', color: 'var(--neon-yellow)', textShadow: '0 0 5px var(--neon-yellow)' }}>
                START GAME!
              </div>
            )
          : sortedRankings.map((ranking) => {
              const externalPlayer = externalPlayers?.[ranking.playerId];
              const isTopThree = ranking.rank <= 3;
              return (
                <div
                  key={ranking.playerId}
                  className="retro-font"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px',
                    marginBottom: '4px',
                    backgroundColor: isTopThree ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 64, 0.1)',
                    border: isTopThree ? '1px solid var(--neon-green)' : '1px solid var(--neon-red)',
                    borderRadius: '4px',
                    color: isTopThree ? 'var(--neon-green)' : 'var(--neon-red)',
                    textShadow: isTopThree ? '0 0 5px var(--neon-green)' : '0 0 5px var(--neon-red)'
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
