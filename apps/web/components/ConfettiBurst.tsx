"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

const COLORS = ["#f5a623", "#2dd4a0", "#ff5e7a", "#60a5fa", "#fbbf24", "#f472b6"];

export default function ConfettiBurst({ trigger, originX, originY }: { trigger: boolean; originX: number; originY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const spawn = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < 48; i++) {
      const angle = (Math.PI * 2 * i) / 48 + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 5;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3, // bias upward
        size: 3 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
        maxLife: 0.6 + Math.random() * 0.5,
      });
    }
    particlesRef.current = particles;
  }, [originX, originY]);

  useEffect(() => {
    if (!trigger) return;
    spawn();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      let alive = false;

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life -= 0.02;

        if (p.life > 0) {
          alive = true;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.roundRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.6, 1);
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;
      if (alive) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger, spawn]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full"
      style={{ zIndex: 50 }}
    />
  );
}
