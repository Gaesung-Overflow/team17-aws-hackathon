import { useEffect, useState } from 'react';

export const VictoryAnimation = ({ myRank }: { myRank?: number }) => {
  const [confetti, setConfetti] = useState<
    Array<{ id: number; x: number; delay: number }>
  >([]);

  useEffect(() => {
    // Generate confetti particles
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setConfetti(particles);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* Victory Text */}
      {myRank !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#FFD700',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            animation: 'victoryPulse 2s ease-in-out infinite',
          }}
        >
          🎉 {myRank} 등! 🎉
        </div>
      )}

      {/* Confetti */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: '-10px',
            fontSize: '20px',
            animation: `confettiFall 3s linear ${particle.delay}s infinite`,
          }}
        >
          🎊
        </div>
      ))}

      <style>
        {`
          @keyframes victoryPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.1); }
          }
          
          @keyframes confettiFall {
            0% { 
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% { 
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};
