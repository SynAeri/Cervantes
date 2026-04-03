// Interactive particle wheat field background for La Mancha
// Uses HTML5 Canvas with physics-based particle system
// Particles repel from mouse and slowly converge back to original positions

'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
}

export function WheatField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setupCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particlesRef.current = [];
      const spacing = 25;
      const cols = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const jitterX = (Math.random() - 0.5) * 8;
          const jitterY = (Math.random() - 0.5) * 8;
          const x = i * spacing + jitterX;
          const y = j * spacing + jitterY;

          particlesRef.current.push({
            x,
            y,
            originX: x,
            originY: y,
            vx: 0,
            vy: 0,
          });
        }
      }
    };

    const interpolateColor = (force: number): string => {
      // Base color: muted wheat grain
      const baseR = 138;
      const baseG = 127;
      const baseB = 114;

      // Active color: fresh bright wheat gold
      const activeR = 218;
      const activeG = 182;
      const activeB = 89;

      // Use exponential curve for smoother gradient
      const smoothForce = Math.pow(force, 0.8);

      const r = Math.floor(baseR + (activeR - baseR) * smoothForce);
      const g = Math.floor(baseG + (activeG - baseG) * smoothForce);
      const b = Math.floor(baseB + (activeB - baseB) * smoothForce);

      // Alpha blends from 0.8 (close) to 0.1 (far)
      const alpha = 0.1 + (0.7 * smoothForce);

      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const repulsionRadius = 60;
      const colorRadius = 150;
      const springConstant = 0.008;
      const friction = 0.88;

      particlesRef.current.forEach((particle) => {
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Apply repulsion force only within smaller radius
        if (distance < repulsionRadius) {
          const force = (repulsionRadius - distance) / repulsionRadius;
          const angle = Math.atan2(dy, dx);

          particle.vx -= Math.cos(angle) * force * 2;
          particle.vy -= Math.sin(angle) * force * 2;
        }

        // Apply color gradient within larger radius
        if (distance < colorRadius) {
          const colorForce = (colorRadius - distance) / colorRadius;
          ctx.fillStyle = interpolateColor(colorForce);
        } else {
          ctx.fillStyle = 'rgba(138, 127, 114, 0.1)';
        }

        particle.vx += (particle.originX - particle.x) * springConstant;
        particle.vy += (particle.originY - particle.y) * springConstant;

        particle.vx *= friction;
        particle.vy *= friction;

        particle.x += particle.vx;
        particle.y += particle.vy;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    const handleResize = () => {
      setupCanvas();
      initParticles();
    };

    setupCanvas();
    initParticles();
    animate();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
