import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export const PlayerPage = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const playerId = searchParams.get('playerId');
  const playerName = searchParams.get('playerName');

  const [gameState] = useState<
    'waiting' | 'playing' | 'eliminated' | 'finished'
  >('waiting');

  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        maxWidth: '400px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ marginBottom: '30px' }}>
        <h1>🎮 게임 컨트롤</h1>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div>방: {roomId}</div>
          <div>플레이어: {playerName}</div>
          <div>ID: {playerId}</div>
        </div>
      </div>

      {gameState === 'waiting' && (
        <div>
          <h2>게임 시작 대기중...</h2>
          <p>방장이 게임을 시작할 때까지 기다려주세요</p>
        </div>
      )}

      {gameState === 'playing' && (
        <div>
          <h2>게임 진행중</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              marginTop: '30px',
            }}
          >
            <button
              style={{
                padding: '20px',
                fontSize: '18px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
              }}
            >
              ⬆️ 위
            </button>
            <button
              style={{
                padding: '20px',
                fontSize: '18px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
              }}
            >
              ⬇️ 아래
            </button>
            <button
              style={{
                padding: '20px',
                fontSize: '18px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
              }}
            >
              ⬅️ 왼쪽
            </button>
            <button
              style={{
                padding: '20px',
                fontSize: '18px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
              }}
            >
              ➡️ 오른쪽
            </button>
          </div>

          <div style={{ marginTop: '30px' }}>
            <button
              style={{
                padding: '15px 30px',
                fontSize: '16px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '10px',
                width: '100%',
              }}
            >
              🚀 부스터 사용
            </button>
          </div>
        </div>
      )}

      {gameState === 'eliminated' && (
        <div>
          <h2>😵 탈락!</h2>
          <p>다음 게임을 기다려주세요</p>
        </div>
      )}

      {gameState === 'finished' && (
        <div>
          <h2>🎉 게임 종료!</h2>
          <p>새로운 게임을 기다려주세요</p>
        </div>
      )}
    </div>
  );
};
