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

const CurrencyDisplay = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 1.2rem;
  color: rgba(255, 215, 0, 0.9);
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
  
  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ShopButton = styled.button`
  position: absolute;
  top: 80px;
  left: 20px;
  font-size: 1rem;
  color: rgba(255, 215, 0, 0.9);
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 20px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  z-index: 10;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.5s ease, transform 0.5s ease, background 0.3s ease;
  backdrop-filter: blur(4px);
  cursor: pointer;
  
  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  &:hover {
    background: rgba(0, 0, 0, 0.6);
  }
`;

const ShopPanel = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  width: 320px;
  max-width: 90vw;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 20px;
  font-family: 'Montserrat', sans-serif;
  z-index: 20;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease, transform 0.5s ease;
  backdrop-filter: blur(10px);
  
  &.visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    pointer-events: auto;
  }
  
  h2 {
    color: rgba(255, 215, 0, 0.9);
    text-align: center;
    margin-bottom: 20px;
    font-size: 1.5rem;
  }
  
  .shop-close {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 24px;
    height: 24px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.3s;
    
    &:hover {
      opacity: 1;
    }
    
    &::before, &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 2px;
      background: rgba(255, 215, 0, 0.9);
    }
    
    &::before {
      transform: rotate(45deg);
    }
    
    &::after {
      transform: rotate(-45deg);
    }
  }
`;

const UpgradeOption = styled.div`
  padding: 12px;
  margin: 10px 0;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.3s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.6);
  }
  
  .upgrade-info {
    flex: 1;
    
    h3 {
      color: rgba(255, 215, 0, 0.9);
      font-size: 1rem;
      margin: 0 0 5px 0;
    }
    
    p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.8rem;
      margin: 0;
    }
  }
  
  .upgrade-level {
    color: rgba(255, 215, 0, 0.7);
    font-size: 0.9rem;
    margin-right: 10px;
  }
  
  button {
    background: rgba(255, 215, 0, 0.2);
    border: 1px solid rgba(255, 215, 0, 0.5);
    color: rgba(255, 215, 0, 0.9);
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.3s ease;
    
    &:hover:not(:disabled) {
      background: rgba(255, 215, 0, 0.4);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
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

const UiTakeoverOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0);
  z-index: 10000;
  pointer-events: none;
  transition: background 2s ease;
  
  &.active {
    background: rgba(0, 0, 0, 0.7);
    pointer-events: auto;
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

// Upgrade costs
const getUpgradeCost = (upgradeType: string, currentLevel: number) => {
  const baseCosts = {
    maxParticles: 5,
    particleSize: 10,
    interactionRadius: 8,
    targetSpawnRate: 15,
    autoCollectors: 25,
    particleSpeed: 12,
    autonomyLevel: 20
  };
  
  const scaleFactor = {
    maxParticles: 1.5,
    particleSize: 1.8,
    interactionRadius: 1.6,
    targetSpawnRate: 1.7,
    autoCollectors: 2.5,
    particleSpeed: 1.9,
    autonomyLevel: 2.2
  };
  
  // @ts-ignore - We know the keys exist
  const baseCost = baseCosts[upgradeType] || 10;
  // @ts-ignore - We know the keys exist
  const factor = scaleFactor[upgradeType] || 1.5;
  
  return Math.floor(baseCost * Math.pow(factor, currentLevel));
};

/**
 * Interactive particle canvas with game elements
 */
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useMousePosition();
  const mousePositionRef = useRef(mousePos);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [uiTakeover, setUiTakeover] = useState(false);
  
  // Keep the ref updated with the latest position
  useEffect(() => {
    mousePositionRef.current = mousePos;
  }, [mousePos]);
  
  // Get game state and controls from the hook
  const { 
    score,
    currency,
    upgrades,
    showScore,
    showHint,
    showShop,
    setShowShop,
    uiTakeover: hookUiTakeover,
    purchaseUpgrade
  } = useParticleAnimation(
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

  // UI Takeover effect
  useEffect(() => {
    if (hookUiTakeover) {
      // Find all main content elements
      const mainContent = document.querySelectorAll('main > div:not(.particle-game-container)');
      mainContent.forEach(el => {
        (el as HTMLElement).style.opacity = '0.2';
        (el as HTMLElement).style.pointerEvents = 'none';
        (el as HTMLElement).style.transition = 'opacity 1.5s ease';
      });
      
      // Make the game more visible and positioned above other content
      const gameContainer = document.querySelector('.particle-game-container');
      if (gameContainer) {
        (gameContainer as HTMLElement).style.zIndex = '1000';
      }
    }
    
    return () => {
      // Cleanup function to restore visibility
      if (hookUiTakeover) {
        const mainContent = document.querySelectorAll('main > div');
        mainContent.forEach(el => {
          (el as HTMLElement).style.opacity = '1';
          (el as HTMLElement).style.pointerEvents = 'auto';
        });
      }
    };
  }, [hookUiTakeover]);

  // Render upgrade options for the shop
  const renderUpgradeOptions = () => {
    const upgradeTypes = [
      {
        id: 'maxParticles',
        name: 'More Particles',
        description: 'Increase the maximum number of particles'
      },
      {
        id: 'particleSize',
        name: 'Larger Particles',
        description: 'Make your particles bigger and easier to see'
      },
      {
        id: 'interactionRadius',
        name: 'Interaction Range',
        description: 'Increase the area where particles react to your cursor'
      },
      {
        id: 'targetSpawnRate',
        name: 'Target Frequency',
        description: 'Targets appear more frequently'
      },
      {
        id: 'autoCollectors',
        name: 'Auto Collectors',
        description: 'Particles that automatically collect targets for you'
      },
      {
        id: 'particleSpeed',
        name: 'Particle Speed',
        description: 'Particles move faster'
      },
      {
        id: 'autonomyLevel',
        name: 'Particle Intelligence',
        description: 'Particles gain more autonomy and smarter behaviors'
      }
    ];
    
    return upgradeTypes.map(upgrade => {
      const currentLevel = upgrades[upgrade.id as keyof typeof upgrades];
      const cost = getUpgradeCost(upgrade.id, currentLevel);
      const canAfford = currency >= cost;
      
      return (
        <UpgradeOption key={upgrade.id}>
          <div className="upgrade-info">
            <h3>{upgrade.name}</h3>
            <p>{upgrade.description}</p>
          </div>
          <div className="upgrade-level">Lvl {currentLevel}</div>
          <button 
            onClick={() => purchaseUpgrade(upgrade.id as keyof typeof upgrades, cost)}
            disabled={!canAfford}
          >
            {cost} ₵
          </button>
        </UpgradeOption>
      );
    });
  };

  // Function to handle shop button click
  const handleShopButtonClick = () => {
    // Always trigger UI takeover when opening the shop
    if (!uiTakeover) {
      setUiTakeover(true);
      
      // Dispatch custom event to notify parent components
      const event = new CustomEvent('gameStateChange', {
        detail: { action: 'activateGameUI' }
      });
      window.dispatchEvent(event);
    }
    setShowShop(true);
  };

  return (
    <div 
      className="particle-game-container"
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        pointerEvents: 'auto',
        zIndex: uiTakeover ? 1000 : 1
      }}
    >
      <GameCanvas ref={canvasRef} />
      
      <ScoreDisplay className={showScore ? 'visible' : ''}>
        Score: {score}
      </ScoreDisplay>
      
      <CurrencyDisplay className={showScore ? 'visible' : ''}>
        ₵ {currency}
      </CurrencyDisplay>
      
      <ShopButton 
        className={`shop-button ${showScore ? 'visible' : ''}`}
        onClick={handleShopButtonClick}
      >
        Upgrades
      </ShopButton>
      
      <GameHint className={showHint ? 'visible' : 'hidden'}>
        Move your cursor to interact with particles. Collect the glowing targets!
      </GameHint>
      
      <ShopPanel 
        className={showShop ? 'visible' : ''} 
        style={{ 
          zIndex: 2000 
        }}
      >
        <div className="shop-close" onClick={() => setShowShop(false)}></div>
        <h2>Particle Upgrades</h2>
        {renderUpgradeOptions()}
      </ShopPanel>
      
      <CursorDot 
        style={{ 
          left: `${cursorPosition.x}px`, 
          top: `${cursorPosition.y}px` 
        }} 
      />
      
      <CursorRing 
        style={{ 
          left: `${cursorPosition.x}px`, 
          top: `${cursorPosition.y}px`,
          width: isActive ? '60px' : '40px',
          height: isActive ? '60px' : '40px'
        }} 
      />
      
      <UiTakeoverOverlay className={uiTakeover ? 'active' : ''} />
    </div>
  );
};

export default ParticleCanvas; 