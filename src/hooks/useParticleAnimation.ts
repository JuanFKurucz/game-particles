import { useRef, useState, useEffect } from 'react';
import { MousePosition } from './useMousePosition';

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  isTarget?: boolean;
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
 * @returns Score and visibility states
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
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [showHint, setShowHint] = useState(true);
  
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

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Initialize particles
  const initParticles = () => {
    particlesRef.current = [];
    const canvas = canvasRef.current;
    if (!canvas) return;

    for (let i = 0; i < maxParticles; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: `rgba(0, 246, 255, ${0.5 + Math.random() * 0.5})`,
        alpha: 0.5 + Math.random() * 0.5,
        isTarget: i < 3 // Initial targets
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

  // Update particles
  const updateParticles = (ctx: CanvasRenderingContext2D, _delta: number) => {
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
      
      // After a short delay, show the score
      if (Date.now() - interactionStartTimeRef.current > 1000) {
        setShowScore(true);
        if (Date.now() - interactionStartTimeRef.current > 2000) {
          setShowHint(false);
        }
      }
    }
    
    // Check if we need to add more targets
    const targetCount = particles.filter(p => p.isTarget).length;
    if (targetCount < 3 && Math.random() < targetSpawnRate) {
      const randomIndex = Math.floor(Math.random() * particles.length);
      if (!particles[randomIndex].isTarget) {
        particles[randomIndex].isTarget = true;
      }
    }
    
    // Update each particle
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      
      // Apply mouse interaction
      if (mousePos) {
        const dx = p.x - mousePos.x;
        const dy = p.y - mousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check for target collection
        if (p.isTarget && distance < 30) {
          setScore(prev => prev + 1);
          p.isTarget = false;
          targetCollectedTimeRef.current = Date.now();
          
          // Visual effect for collection
          for (let j = 0; j < 10; j++) {
            particles.push({
              x: p.x,
              y: p.y,
              size: 1 + Math.random() * 1.5,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              color: `rgba(0, 255, 150, ${0.7 + Math.random() * 0.3})`,
              alpha: 0.7 + Math.random() * 0.3
            });
          }
        }
        
        // Apply repulsion to particles near mouse
        if (distance < interactionRadius) {
          const force = (interactionRadius - distance) / interactionRadius;
          const directionX = dx / distance || 0;
          const directionY = dy / distance || 0;
          
          p.vx += directionX * force * repulsionStrength;
          p.vy += directionY * force * repulsionStrength;
        }
      }
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Apply friction
      p.vx *= 0.98;
      p.vy *= 0.98;
      
      // Wrap around edges
      if (p.x < 0) p.x = canvasSize.width;
      if (p.x > canvasSize.width) p.x = 0;
      if (p.y < 0) p.y = canvasSize.height;
      if (p.y > canvasSize.height) p.y = 0;
      
      // Draw particle
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.isTarget 
        ? `rgba(0, 255, 150, ${0.8 + Math.sin(Date.now() / 300) * 0.2})` 
        : p.color;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isTarget ? 4 + Math.sin(Date.now() / 300) * 2 : p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw glow for targets
      if (p.isTarget) {
        // Add glow for targets
        const glow = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, 15
        );
        glow.addColorStop(0, 'rgba(0, 255, 150, 0.4)');
        glow.addColorStop(1, 'rgba(0, 255, 150, 0)');
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw connections between particles
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = 'rgba(0, 246, 255, 0.5)';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 80) {
          ctx.globalAlpha = (1 - distance / 80) * 0.2;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    
    // Clean up excess particles
    if (particles.length > maxParticles * 1.5) {
      particles.splice(maxParticles, particles.length - maxParticles);
    }
    
    ctx.globalAlpha = 1;
  };

  return {
    score,
    showScore,
    showHint
  };
};

export default useParticleAnimation; 