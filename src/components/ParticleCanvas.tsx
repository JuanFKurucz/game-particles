import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import useParticleAnimation from '../hooks/useParticleAnimation';
import { useMousePosition } from '../hooks/useMousePosition';

// Styled components
const GameCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* Higher z-index to be above background */
  pointer-events: auto;
  cursor: none;
`;

const ScoreDisplay = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 1.2rem;
  color: rgba(0, 246, 255, 0.8);
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  z-index: 10;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  backdrop-filter: blur(4px);
  pointer-events: none; /* Allow events to pass through to canvas */
  
  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

const GameHint = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(0);
  font-size: 0.9rem;
  color: rgba(0, 246, 255, 0.8);
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  font-family: 'Montserrat', sans-serif;
  z-index: 10;
  text-align: center;
  opacity: 0;
  transition: opacity 0.5s ease, transform 0.5s ease;
  backdrop-filter: blur(4px);
  pointer-events: none; /* Allow events to pass through to canvas */
  
  &.visible {
    opacity: 1;
  }
  
  &.hidden {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
`;

const CursorDot = styled.div`
  position: fixed;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(0, 246, 255, 0.1);
  border: 2px solid rgba(0, 246, 255, 0.8);
  box-shadow: 0 0 10px rgba(0, 246, 255, 0.6);
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1000;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    background-color: rgba(0, 246, 255, 0.9);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
  
  /* Pulse animation ring */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid rgba(0, 246, 255, 0.4);
    transform: translate(-50%, -50%);
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% {
      width: 30px;
      height: 30px;
      opacity: 0.8;
    }
    70% {
      width: 50px;
      height: 50px;
      opacity: 0;
    }
    100% {
      width: 30px;
      height: 30px;
      opacity: 0;
    }
  }
`;

const CursorRing = styled.div`
  position: fixed;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(0, 246, 255, 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 999;
  transition: width 0.3s, height 0.3s;
  
  /* Crosshair lines */
  &::before, &::after {
    content: '';
    position: absolute;
    background-color: rgba(0, 246, 255, 0.4);
  }
  
  &::before {
    width: 1px;
    height: 10px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  &::after {
    width: 10px;
    height: 1px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

/**
 * Interactive particle canvas with game elements
 */
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useMousePosition();
  const mousePositionRef = useRef(mousePos);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  
  // Keep the ref updated with the latest position
  useEffect(() => {
    mousePositionRef.current = mousePos;
  }, [mousePos]);
  
  const { score, showScore, showHint } = useParticleAnimation(
    canvasRef,
    mousePositionRef,
    {
      maxParticles: 60,
      interactionRadius: 150,
      repulsionStrength: 0.1,
      targetSpawnRate: 0.01
    }
  );

  // Track cursor globally to ensure we always capture movement
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      mousePositionRef.current = {
        x: e.clientX,
        y: e.clientY,
        isMoving: true
      };
      
      // Update cursor position state
      setCursorPosition({
        x: e.clientX,
        y: e.clientY
      });
      
      // Show cursor is active
      setIsActive(true);
    };
    
    const handleMouseDown = () => {
      setIsActive(true);
    };
    
    const handleMouseUp = () => {
      setIsActive(false);
    };
    
    const handleMouseLeave = () => {
      setIsActive(false);
    };
    
    const handleMouseEnter = () => {
      setIsActive(true);
    };
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden', 
      pointerEvents: 'auto',
      zIndex: 1
    }}>
      <GameCanvas ref={canvasRef} />
      <ScoreDisplay className={showScore ? 'visible' : ''}>
        Score: {score}
      </ScoreDisplay>
      <GameHint className={showHint ? 'visible' : 'hidden'}>
        Move your cursor to interact with particles
        <br />
        Collect green particles to score points
      </GameHint>
      
      {/* Custom cursor elements */}
      <CursorRing style={{ 
        left: `${cursorPosition.x}px`, 
        top: `${cursorPosition.y}px`,
        opacity: isActive ? 0.8 : 0
      }} />
      <CursorDot style={{ 
        left: `${cursorPosition.x}px`, 
        top: `${cursorPosition.y}px`,
        opacity: isActive ? 1 : 0,
        transform: `translate(-50%, -50%) scale(${isActive ? 1 : 0.8})`
      }} />
    </div>
  );
};

export default ParticleCanvas; 