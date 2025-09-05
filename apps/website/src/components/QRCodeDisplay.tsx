import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export const QRCodeDisplay = ({ value, size = 150 }: QRCodeDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    }
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        border: '2px solid #007bff',
        borderRadius: '8px',
        backgroundColor: 'white',
      }}
    />
  );
};
