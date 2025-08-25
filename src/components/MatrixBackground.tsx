import { useEffect, useRef } from 'react';

interface Drop {
  x: number;
  y: number;
  speed: number;
  opacity: number;
  char: string;
}

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Enhanced matrix characters including cyber/tech symbols
    const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'.split('');
    const techChars = ['▲', '▼', '◄', '►', '◆', '◇', '□', '■', '○', '●', '※', '§', '∞', '≈', '≡', '≠', '±', '∫', '∆', '∇', '∑', '∏', '√', '∂'];
    const chars = [...matrixChars, ...techChars];
    
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: Drop[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; opacity: number; size: number }[] = [];

    // Initialize drops with enhanced properties
    for (let i = 0; i < columns; i++) {
      drops.push({
        x: i * fontSize,
        y: Math.random() * canvas.height,
        speed: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        char: chars[Math.floor(Math.random() * chars.length)]
      });
    }

    // Initialize floating particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.3,
        size: Math.random() * 2 + 1
      });
    }

    let time = 0;

    // Enhanced draw function
    const draw = () => {
      time += 0.01;
      
      // Dark background with subtle fade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw matrix rain
      ctx.font = `${fontSize}px JetBrains Mono, monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        
        // Multiple shades of green for depth effect
        const intensity = Math.sin(time + i * 0.1) * 0.3 + 0.7;
        const green = Math.floor(255 * intensity);
        
        // Brightest character (head of the drop)
        ctx.fillStyle = `rgba(${Math.floor(green * 0.3)}, ${green}, ${Math.floor(green * 0.6)}, ${drop.opacity})`;
        ctx.fillText(drop.char, drop.x, drop.y);
        
        // Trail effect - draw fading characters behind
        for (let j = 1; j < 15; j++) {
          const trailY = drop.y - j * fontSize;
          if (trailY > 0) {
            const trailOpacity = drop.opacity * (1 - j / 15) * 0.7;
            const trailGreen = Math.floor(green * (1 - j / 20));
            ctx.fillStyle = `rgba(${Math.floor(trailGreen * 0.3)}, ${trailGreen}, ${Math.floor(trailGreen * 0.6)}, ${trailOpacity})`;
            const trailChar = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(trailChar, drop.x, trailY);
          }
        }

        // Update drop position
        drop.y += drop.speed;
        
        // Change character occasionally
        if (Math.random() < 0.1) {
          drop.char = chars[Math.floor(Math.random() * chars.length)];
        }
        
        // Reset drop when it goes off screen
        if (drop.y > canvas.height + fontSize * 15) {
          drop.y = -fontSize * Math.random() * 10;
          drop.speed = Math.random() * 3 + 1;
          drop.opacity = Math.random() * 0.8 + 0.2;
          drop.char = chars[Math.floor(Math.random() * chars.length)];
        }
      }

      // Draw floating particles
      ctx.fillStyle = '#00ff41';
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        
        // Create pulsing effect
        const pulse = Math.sin(time * 2 + i) * 0.5 + 0.5;
        ctx.globalAlpha = particle.opacity * pulse;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Update particle position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
      }
      
      ctx.globalAlpha = 1; // Reset alpha

      // Draw scanning lines occasionally
      if (Math.random() < 0.01) {
        const scanY = Math.random() * canvas.height;
        const gradient = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
        gradient.addColorStop(0, 'rgba(0, 255, 65, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 65, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 255, 65, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, scanY - 2, canvas.width, 4);
      }

      // Add occasional glitch effect
      if (Math.random() < 0.005) {
        const glitchHeight = 20;
        const glitchY = Math.random() * (canvas.height - glitchHeight);
        const imageData = ctx.getImageData(0, glitchY, canvas.width, glitchHeight);
        
        // Shift pixels randomly
        for (let i = 0; i < imageData.data.length; i += 4) {
          if (Math.random() < 0.1) {
            const shift = (Math.random() - 0.5) * 20;
            const newIndex = Math.max(0, Math.min(imageData.data.length - 4, i + Math.floor(shift) * 4));
            imageData.data[i] = imageData.data[newIndex];
            imageData.data[i + 1] = imageData.data[newIndex + 1];
            imageData.data[i + 2] = imageData.data[newIndex + 2];
          }
        }
        
        ctx.putImageData(imageData, Math.random() * 10 - 5, glitchY);
      }
    };

    const interval = setInterval(draw, 50); // Slightly slower for better performance

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="matrix-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: -2,
          pointerEvents: 'none',
          opacity: 0.15,
        }}
      />
      
      {/* Additional overlay effects */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -1,
          background: `
            radial-gradient(circle at 25% 25%, rgba(0, 255, 65, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
            linear-gradient(45deg, transparent 49%, rgba(0, 255, 65, 0.02) 49.5%, rgba(0, 255, 65, 0.02) 50.5%, transparent 51%)
          `,
          backgroundSize: '100px 100px, 150px 150px, 20px 20px',
          animation: 'backgroundPulse 8s ease-in-out infinite',
        }}
      />
      
    </>
  );
}
