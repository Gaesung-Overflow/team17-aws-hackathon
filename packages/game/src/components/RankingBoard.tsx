import React from 'react';
import { PlayerRanking } from '../game/types';

interface RankingBoardProps {
  rankings: PlayerRanking[];
  totalPlayers: number;
  remainingPlayers: number;
}

export const RankingBoard: React.FC<RankingBoardProps> = ({ 
  rankings, 
  totalPlayers, 
  remainingPlayers 
}) => {
  const playerEmojis = ['🔵', '🟢', '🟡', '🟣', '🟠', '🔴', '⚫', '⚪'];
  
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}위`;
    }
  };

  const sortedRankings = [...rankings].sort((a, b) => a.rank - b.rank);

  return (
    <div style={{
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      width: '100%'
    }}>
      <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>🏆 순위 보드</h3>
      
      <div style={{ marginBottom: '10px', fontSize: '14px' }}>
        <div>총 플레이어: {totalPlayers}명</div>
        <div>생존자: {remainingPlayers}명</div>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px' }}>
        {sortedRankings.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666' }}>
            게임을 시작하세요!
          </div>
        ) : (
          sortedRankings.map((ranking) => (
            <div
              key={ranking.playerId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 0',
                borderBottom: '1px solid #eee'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{playerEmojis[ranking.playerId % playerEmojis.length]}</span>
                <span>플레이어 {ranking.playerId + 1}</span>
              </div>
              <div style={{ fontWeight: 'bold' }}>
                {getRankEmoji(ranking.rank)}
              </div>
            </div>
          ))
        )}
        
        {/* 아직 살아있는 플레이어들 표시 */}
        {Array.from({ length: totalPlayers }, (_, i) => i)
          .filter(i => !rankings.some(r => r.playerId === i))
          .map(playerId => (
            <div
              key={`alive-${playerId}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 0',
                borderBottom: '1px solid #eee',
                backgroundColor: '#e8f5e8'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{playerEmojis[playerId % playerEmojis.length]}</span>
                <span>플레이어 {playerId + 1}</span>
              </div>
              <div style={{ color: '#28a745', fontWeight: 'bold' }}>
                생존 중
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};