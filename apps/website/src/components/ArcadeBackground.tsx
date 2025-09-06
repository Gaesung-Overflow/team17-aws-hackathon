import React from 'react';
import '../styles/arcade-animations.css';

export const ArcadeBackground: React.FC = () => {
  return (
    <div className="arcade-background">
      <div className="floating-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={`particle particle-${i % 4}`} />
        ))}
      </div>
      <div className="grid-lines" />
    </div>
  );
};
