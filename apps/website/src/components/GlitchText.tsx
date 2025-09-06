import React from 'react';
import '../styles/arcade-animations.css';

interface GlitchTextProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  children,
  className = '',
  style,
}) => {
  return (
    <div
      className={`glitch-text ${className}`}
      style={style}
      data-text={children}
    >
      {children}
    </div>
  );
};
