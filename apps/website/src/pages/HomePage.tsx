import { Link } from 'react-router-dom';

export const HomePage = () => {
  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <h1>돔황챠 - 팩맨 서바이벌</h1>
      <p>실시간 멀티플레이어 팩맨 게임</p>

      <div
        style={{
          marginTop: '40px',
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
        }}
      >
        <Link
          to="/host"
          style={{
            display: 'block',
            padding: '20px 40px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '10px',
            fontSize: '18px',
          }}
        >
          방 만들기
        </Link>

        <Link
          to="/game"
          style={{
            display: 'block',
            padding: '20px 40px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '10px',
            fontSize: '18px',
          }}
        >
          로컬 게임
        </Link>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3>게임 참가 방법</h3>
        <p>1. 방장이 "방 만들기"로 게임방을 생성합니다</p>
        <p>2. QR 코드를 스캔하거나 방 ID로 접속합니다</p>
        <p>3. 이름을 입력하고 게임에 참가합니다</p>
      </div>
    </div>
  );
};
