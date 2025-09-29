import React, { useEffect, useRef } from "react";

const CONNECT_DISTANCE = 95;
const MOUSE_RADIUS = 95;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export default function RippleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const margin = 20;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Dynamically calculate particle count based on screen area
      const baseParticleCount = 260;
      const baseArea = 1920 * 1080; // Fixed base area for consistent scaling
      const currentArea = canvas.width * canvas.height;
      const particleDensity = baseParticleCount / baseArea;
      const particleCount = Math.max(
        50,
        Math.floor(particleDensity * currentArea),
      );

      // Re-initialize particles after resize
      particles.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * (canvas.width - 2 * margin) + margin,
        y: Math.random() * (canvas.height - 2 * margin) + margin,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#888";
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 0.65;

      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x <= 0 || p.x >= canvas.width) p.vx *= -1;
        if (p.y <= 0 || p.y >= canvas.height) p.vy *= -1;

        // Mouse repulsion
        const dx = p.x - mouse.current.x;
        const dy = p.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * 0.002;
          p.vy += Math.sin(angle) * 0.002;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connecting lines
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const pi = particles.current[i];
          const pj = particles.current[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0"
      style={{ background: "white" }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
