import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { EmojiAnimation } from '../components/EmojiAnimation';
import { VictoryAnimation } from '../components/VictoryAnimation';

export const PlayerPage = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const playerId = searchParams.get('playerId');
  const playerName = searchParams.get('playerName');
  const initialEmoji = searchParams.get('emoji') || '😀';

  const { sendPlayerAction, onMessage, isConnected } = useWebSocket();
  const [gameState, setGameState] = useState<
    'waiting' | 'running' | 'eliminated' | 'finished'
  >('waiting');
  const [cheerEmojis, setCheerEmojis] = useState<string[]>([]);
  const [myRank, setMyRank] = useState<number>();

  useEffect(() => {
    onMessage((data) => {
      if (data.type === 'gameStateUpdate') {
        console.log('게임 상태 업데이트:', data);
        setGameState(data.state ?? 'waiting');
        if (data.state === 'finished' && data.winners) {
          data.winners.forEach((winner: { playerId: string; rank: number }) => {
            if (winner.playerId === playerId) {
              setMyRank(winner.rank);
            }
          });
        }
      }
      if (data.type === 'playerAction') {
        if (data.action === 'cheer') {
          setCheerEmojis([data.emoji]);
          setTimeout(() => setCheerEmojis([]), 100);
        }
      }
    });
  }, [onMessage]);

  const sendAction = (action: string) => {
    if (!isConnected || !roomId) return;
    sendPlayerAction(roomId, action, initialEmoji);
  };

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
        <h1>🎮</h1>
        <h1>컨트롤러</h1>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          <div>방: {roomId}</div>
          <div>플레이어: {playerName}</div>
          <div>ID: {playerId}</div>
          <br />
          <div
            style={{
              color: isConnected ? '#28a745' : '#dc3545',
              marginTop: '5px',
            }}
          >
            ● {isConnected ? '연결됨' : '연결 끊어짐'}
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            내 이모지: {initialEmoji}
          </div>
        </div>
      </div>

      {gameState === 'waiting' && (
        <div>
          <h2>게임 시작 대기중...</h2>
          <br />
          <p>방장이 게임을 시작할 때까지</p>
          <p>기다려주세요</p>

          <div style={{ marginTop: '30px' }}>
            <button
              onClick={() => sendAction('cheer')}
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
              가즈아 {initialEmoji}
            </button>
          </div>
        </div>
      )}

      {gameState === 'running' && (
        <div>
          <h2>게임 진행중</h2>

          <div style={{ marginTop: '30px' }}>
            <button
              onClick={() => sendAction('cheer')}
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
              응원하기 {initialEmoji}
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
          <VictoryAnimation myRank={myRank} />
        </div>
      )}

      <EmojiAnimation emojis={cheerEmojis} />
    </div>
  );
};
