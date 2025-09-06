import { useEffect, useState } from 'react';

interface EmojiItem {
  id: string;
  x: number;
  y: number;
  emoji: string;
}

interface EmojiAnimationProps {
  emojis: string[];
}

export const EmojiAnimation = ({ emojis }: EmojiAnimationProps) => {
  const [animatingEmojis, setAnimatingEmojis] = useState<EmojiItem[]>([]);

  useEffect(() => {
    if (emojis.length === 0) return;

    const newEmojis = emojis.map((emoji) => ({
      id: `${Date.now()}-${Math.random()}`,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      emoji,
    }));

    setAnimatingEmojis((prev) => [...prev, ...newEmojis]);

    // Remove emojis after animation
    setTimeout(() => {
      setAnimatingEmojis((prev) =>
        prev.filter((e) => !newEmojis.some((ne) => ne.id === e.id)),
      );
    }, 2000);
  }, [emojis]);

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
      {animatingEmojis.map((item) => (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: '2rem',
            animation: 'emojiFloat 2s ease-out forwards',
          }}
        >
          {item.emoji}
        </div>
      ))}
      <style>{`
        @keyframes emojiFloat {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
};
