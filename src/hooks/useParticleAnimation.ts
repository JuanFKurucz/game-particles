import { useRef, useState, useEffect, useCallback } from 'react';
import { MousePosition } from './useMousePosition';

// Types for game elements
interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  isTarget?: boolean;
  isCollector?: boolean;
  autonomy: number; // 0-1 value determining how much the particle moves on its own
  behavior: ParticleBehavior;
  lastDirectionChange: number;
}

// Different particle behaviors
type ParticleBehavior = 'normal' | 'seeker' | 'avoider' | 'collector';

// Game upgrades structure
interface GameUpgrades {
  maxParticles: number;
  particleSize: number;
  interactionRadius: number;
  targetSpawnRate: number;
  autoCollectors: number;
  particleSpeed: number;
  autonomyLevel: number;
}

// Game state structure
interface GameState {
  currency: number;
  score: number;
  level: number;
  upgrades: GameUpgrades;
  lastUpdate: number;
  gameStarted: boolean;
  highestCurrency: number;
}

interface ParticleAnimationOptions {
  maxParticles?: number;
  interactionRadius?: number;
  repulsionStrength?: number;
  targetSpawnRate?: number;
}

/**
 * Custom hook for interactive particle animation with game elements
 * 
 * @param canvasRef - Reference to the canvas element
 * @param mousePositionRef - Reference to the mouse position
 * @param options - Animation options
 * @returns Game state and UI control values
 */
export const useParticleAnimation = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  mousePositionRef: React.RefObject<MousePosition>,
  options: ParticleAnimationOptions = {}
) => {
  // Set up options with defaults
  const {
    maxParticles = 50,
    interactionRadius = 150,
    repulsionStrength = 0.08,
    targetSpawnRate = 0.01
  } = options;

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    currency: 0,
    score: 0,
    level: 1,
    upgrades: {
      maxParticles: 1,
      particleSize: 1,
      interactionRadius: 1,
      targetSpawnRate: 1,
      autoCollectors: 0,
      particleSpeed: 1,
      autonomyLevel: 0,
    },
    lastUpdate: Date.now(),
    gameStarted: false,
    highestCurrency: 0
  });
  
  // UI state
  const [showScore, setShowScore] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [showShop, setShowShop] = useState(false);
  const [uiTakeover, setUiTakeover] = useState(false);
  
  // Animation refs
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number | null>(null);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const lastTimeRef = useRef(0);
  const targetCollectedTimeRef = useRef(0);
  const interactionStartTimeRef = useRef(0);
  const scaledMousePosRef = useRef({ x: 0, y: 0 });

  // Initialize canvas and particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Get the device pixel ratio
      const dpr = window.devicePixelRatio || 1;
      
      // Get the canvas size from its parent container
      const rect = canvas.getBoundingClientRect();
      
      // Set the canvas size based on the device pixel ratio
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      canvasSizeRef.current = {
        width: canvas.width,
        height: canvas.height
      };
    };

    // Initial setup
    updateCanvasSize();
    initParticles();

    // Add mouse move listener directly to canvas
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Calculate scaled mouse position based on canvas size and DPR
      scaledMousePosRef.current = {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr
      };
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);

    // Handle window resize
    window.addEventListener('resize', () => {
      updateCanvasSize();
      initParticles();
    });

    // Load game state from localStorage if available
    loadGameState();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      // Save game state on unmount
      saveGameState();
    };
  }, []);

  // Save game state to localStorage
  const saveGameState = useCallback(() => {
    try {
      localStorage.setItem('particleGame', JSON.stringify(gameState));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }, [gameState]);

  // Load game state from localStorage
  const loadGameState = useCallback(() => {
    try {
      const savedState = localStorage.getItem('particleGame');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setGameState(parsedState);
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }, []);

  // Save game state periodically
  useEffect(() => {
    const saveInterval = setInterval(saveGameState, 30000); // Every 30 seconds
    return () => clearInterval(saveInterval);
  }, [saveGameState]);

  // Initialize particles
  const initParticles = () => {
    particlesRef.current = [];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const actualMaxParticles = Math.floor(maxParticles * (1 + gameState.upgrades.maxParticles * 0.2));

    for (let i = 0; i < actualMaxParticles; i++) {
      const isCollector = i < gameState.upgrades.autoCollectors;
      
      // Determine particle behavior
      let behavior: ParticleBehavior = 'normal';
      if (isCollector) {
        behavior = 'collector';
      } else if (i % 10 === 0 && gameState.upgrades.autonomyLevel > 2) {
        behavior = 'seeker';
      } else if (i % 15 === 0 && gameState.upgrades.autonomyLevel > 3) {
        behavior = 'avoider';
      }
      
      // Calculate autonomy based on upgrades
      const baseAutonomy = Math.min(0.8, gameState.upgrades.autonomyLevel * 0.2);
      const autonomy = baseAutonomy * (0.5 + Math.random() * 0.5);
      
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: (1 + Math.random() * 2) * (1 + gameState.upgrades.particleSize * 0.1),
        vx: (Math.random() - 0.5) * 0.5 * gameState.upgrades.particleSpeed,
        vy: (Math.random() - 0.5) * 0.5 * gameState.upgrades.particleSpeed,
        color: behavior === 'collector' 
          ? `rgba(0, 255, 150, ${0.7 + Math.random() * 0.3})`
          : behavior === 'seeker'
            ? `rgba(255, 100, 50, ${0.6 + Math.random() * 0.4})`
            : behavior === 'avoider'
              ? `rgba(150, 50, 255, ${0.6 + Math.random() * 0.4})`
              : `rgba(0, 246, 255, ${0.5 + Math.random() * 0.5})`,
        alpha: 0.5 + Math.random() * 0.5,
        isTarget: i < 3, // Initial targets
        isCollector,
        autonomy,
        behavior,
        lastDirectionChange: 0
      });
    }
  };

  // Animation loop
  useEffect(() => {
    const animate = (time: number) => {
      const delta = time - (lastTimeRef.current || time);
      lastTimeRef.current = time;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw and update particles
      updateParticles(ctx, delta);
      
      // Continue animation loop
      requestRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    requestRef.current = requestAnimationFrame(animate);
    
    // Clean up on unmount
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Check if UI takeover should be activated
  useEffect(() => {
    // If player has collected enough currency, trigger UI takeover
    if (gameState.currency > 100 && !uiTakeover) {
      setUiTakeover(true);
    }
  }, [gameState.currency, uiTakeover]);

  // Update particles
  const updateParticles = (ctx: CanvasRenderingContext2D, delta: number) => {
    // Use either the direct scaled mouse position or the one from the ref
    const mousePos = scaledMousePosRef.current.x !== 0 ? 
      scaledMousePosRef.current : 
      mousePositionRef.current;
      
    const particles = particlesRef.current;
    const canvasSize = canvasSizeRef.current;
    
    // Check if there's any interaction
    if (mousePos && mousePos.x !== 0 && mousePos.y !== 0) {
      if (interactionStartTimeRef.current === 0) {
        interactionStartTimeRef.current = Date.now();
      }
      
      if (!gameState.gameStarted) {
        setGameState(prev => ({ ...prev, gameStarted: true }));
      }
      
      // After a short delay, show the score
      if (Date.now() - interactionStartTimeRef.current > 1000) {
        setShowScore(true);
        if (Date.now() - interactionStartTimeRef.current > 2000) {
          setShowHint(false);
        }
      }
    }
    
    // Normalize delta time for consistent animations
    const normalizedDelta = Math.min(delta, 32) / 16;
    
    // Check if we need to add more targets
    const targetCount = particles.filter(p => p.isTarget).length;
    const adjustedSpawnRate = targetSpawnRate * (1 + gameState.upgrades.targetSpawnRate * 0.2);
    
    if (targetCount < 3 && Math.random() < adjustedSpawnRate) {
      const randomIndex = Math.floor(Math.random() * particles.length);
      if (!particles[randomIndex].isTarget && !particles[randomIndex].isCollector) {
        particles[randomIndex].isTarget = true;
      }
    }
    
    // Update each particle
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      
      // Apply autonomous movement based on behavior
      if (p.autonomy > 0) {
        // Change direction occasionally
        if (Date.now() - p.lastDirectionChange > 1000 + Math.random() * 2000) {
          p.lastDirectionChange = Date.now();
          
          if (p.behavior === 'seeker') {
            // Seekers look for targets
            const targets = particles.filter(t => t.isTarget);
            if (targets.length > 0) {
              // Find closest target
              let closestTarget = targets[0];
              let closestDist = Infinity;
              
              for (const target of targets) {
                const dx = target.x - p.x;
                const dy = target.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) {
                  closestDist = dist;
                  closestTarget = target;
                }
              }
              
              // Move toward target
              const dx = closestTarget.x - p.x;
              const dy = closestTarget.y - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist > 0) {
                p.vx += (dx / dist) * p.autonomy * 0.05 * gameState.upgrades.particleSpeed;
                p.vy += (dy / dist) * p.autonomy * 0.05 * gameState.upgrades.particleSpeed;
              }
            }
          } else if (p.behavior === 'avoider') {
            // Random movement, but avoiding mouse
            p.vx += (Math.random() - 0.5) * p.autonomy * 0.1 * gameState.upgrades.particleSpeed;
            p.vy += (Math.random() - 0.5) * p.autonomy * 0.1 * gameState.upgrades.particleSpeed;
          } else if (p.behavior === 'collector') {
            // Collectors look for targets more aggressively
            const targets = particles.filter(t => t.isTarget);
            if (targets.length > 0) {
              // Find closest target
              let closestTarget = targets[0];
              let closestDist = Infinity;
              
              for (const target of targets) {
                const dx = target.x - p.x;
                const dy = target.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) {
                  closestDist = dist;
                  closestTarget = target;
                }
              }
              
              // Move toward target
              const dx = closestTarget.x - p.x;
              const dy = closestTarget.y - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist > 0) {
                p.vx += (dx / dist) * 0.2 * gameState.upgrades.particleSpeed;
                p.vy += (dy / dist) * 0.2 * gameState.upgrades.particleSpeed;
              }
            } else {
              // Wander randomly
              p.vx += (Math.random() - 0.5) * 0.05 * gameState.upgrades.particleSpeed;
              p.vy += (Math.random() - 0.5) * 0.05 * gameState.upgrades.particleSpeed;
            }
          } else {
            // Normal particles just move randomly
            p.vx += (Math.random() - 0.5) * p.autonomy * 0.05 * gameState.upgrades.particleSpeed;
            p.vy += (Math.random() - 0.5) * p.autonomy * 0.05 * gameState.upgrades.particleSpeed;
          }
        }
      }
      
      // Auto-collectors can collect targets on their own
      if (p.isCollector) {
        for (let j = 0; j < particles.length; j++) {
          if (particles[j].isTarget) {
            const dx = particles[j].x - p.x;
            const dy = particles[j].y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) {
              collectTarget(j);
              break;
            }
          }
        }
      }
      
      // Apply mouse interaction
      if (mousePos) {
        const dx = p.x - mousePos.x;
        const dy = p.y - mousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check for target collection by the player
        if (p.isTarget && distance < 30) {
          collectTarget(i);
        }
        
        // Apply repulsion to particles near mouse
        const actualInteractionRadius = interactionRadius * (1 + gameState.upgrades.interactionRadius * 0.1);
        if (distance < actualInteractionRadius) {
          const force = (actualInteractionRadius - distance) / actualInteractionRadius;
          const directionX = dx / distance || 0;
          const directionY = dy / distance || 0;
          
          p.vx += directionX * force * repulsionStrength * normalizedDelta;
          p.vy += directionY * force * repulsionStrength * normalizedDelta;
        }
      }
      
      // Update position based on velocity
      p.x += p.vx * normalizedDelta;
      p.y += p.vy * normalizedDelta;
      
      // Apply friction
      p.vx *= 0.98;
      p.vy *= 0.98;
      
      // Contain within canvas
      if (p.x < 0) {
        p.x = 0;
        p.vx *= -0.7;
      } else if (p.x > canvasSize.width) {
        p.x = canvasSize.width;
        p.vx *= -0.7;
      }
      
      if (p.y < 0) {
        p.y = 0;
        p.vy *= -0.7;
      } else if (p.y > canvasSize.height) {
        p.y = canvasSize.height;
        p.vy *= -0.7;
      }
      
      // Draw particle
      ctx.beginPath();
      
      if (p.isTarget) {
        // Draw target particles with inner glow and pulsing effect
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
        const glowSize = p.size * (1.5 + pulse * 0.5);
        
        // Outer glow
        const gradient = ctx.createRadialGradient(p.x, p.y, p.size, p.x, p.y, glowSize);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner particle
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.isCollector) {
        // Draw collector particles with a different style
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 400);
        
        // Collector has a ring
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 255, 150, 0.6)';
        ctx.lineWidth = 1;
        ctx.arc(p.x, p.y, p.size * 2 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner particle
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Regular particles
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw currency display
    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`₵ ${gameState.currency}`, canvasSize.width - 20, 20);
  };

  // Function to collect a target
  const collectTarget = (index: number) => {
    const particles = particlesRef.current;
    
    // Make sure it's still a target
    if (!particles[index].isTarget) return;
    
    // Mark as collected
    particles[index].isTarget = false;
    targetCollectedTimeRef.current = Date.now();
    
    // Visual effect for collection
    const p = particles[index];
    for (let j = 0; j < 10; j++) {
      particles.push({
        x: p.x,
        y: p.y,
        size: 1 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: `rgba(255, 215, 0, ${0.7 + Math.random() * 0.3})`,
        alpha: 0.7 + Math.random() * 0.3,
        autonomy: 0,
        behavior: 'normal',
        lastDirectionChange: 0
      });
    }
    
    // Update game state
    setGameState(prev => {
      const newCurrency = prev.currency + 1;
      const newScore = prev.score + 1;
      
      return {
        ...prev,
        currency: newCurrency,
        score: newScore,
        highestCurrency: Math.max(prev.highestCurrency, newCurrency)
      };
    });
  };

  // Function to purchase an upgrade
  const purchaseUpgrade = (upgradeType: keyof GameUpgrades, cost: number) => {
    setGameState(prev => {
      // Check if player can afford the upgrade
      if (prev.currency < cost) return prev;
      
      // Apply the upgrade
      return {
        ...prev,
        currency: prev.currency - cost,
        upgrades: {
          ...prev.upgrades,
          [upgradeType]: prev.upgrades[upgradeType] + 1
        }
      };
    });
    
    // Reinitialize particles to apply upgrades
    initParticles();
  };

  // Return game state and controls
  return { 
    score: gameState.score,
    currency: gameState.currency, 
    upgrades: gameState.upgrades,
    showScore, 
    showHint,
    showShop,
    setShowShop,
    uiTakeover,
    purchaseUpgrade
  };
};

export default useParticleAnimation; 