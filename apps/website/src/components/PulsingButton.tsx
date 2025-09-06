import React from 'react';
import '../styles/arcade-animations.css';

interface PulsingButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const PulsingButton: React.FC<PulsingButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className = '',
  style,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`pulsing-button ${className}`}
      style={style}
    >
      <span className="button-text">{children}</span>
      <div className="button-glow" />
    </button>
  );
};
