import { useState, useEffect } from 'react';

export interface MousePosition {
  x: number;
  y: number;
  isMoving: boolean;
}

export const useMousePosition = (): MousePosition => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0, isMoving: false });
  const [moveTimeout, setMoveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: event.clientX,
        y: event.clientY,
        isMoving: true,
      });

      if (moveTimeout) {
        clearTimeout(moveTimeout);
      }

      const timeout = setTimeout(() => {
        setMousePosition(prev => ({ ...prev, isMoving: false }));
      }, 100);

      setMoveTimeout(timeout);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (moveTimeout) {
        clearTimeout(moveTimeout);
      }
    };
  }, [moveTimeout]);

  return mousePosition;
}; 