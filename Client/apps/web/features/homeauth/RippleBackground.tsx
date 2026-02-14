import { useEffect, useRef } from "react";

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
      // Get device pixel ratio for high-DPI displays (Retina, etc.)
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Set canvas internal resolution (accounting for DPI)
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // Set canvas CSS size (actual display size)
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Scale context to match DPI
      ctx.scale(dpr, dpr);

      // Dynamically calculate particle count based on screen area
      const baseParticleCount = 260;
      const baseArea = 1920 * 1080; // Fixed base area for consistent scaling
      const currentArea = width * height;
      const particleDensity = baseParticleCount / baseArea;
      const particleCount = Math.max(
        50,
        Math.floor(particleDensity * currentArea),
      );

      // Re-initialize particles after resize (use CSS dimensions, not canvas dimensions)
      particles.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * (width - 2 * margin) + margin,
        y: Math.random() * (height - 2 * margin) + margin,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#888";
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 1.2;

      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x <= 0 || p.x >= width) p.vx *= -1;
        if (p.y <= 0 || p.y >= height) p.vy *= -1;

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

      // Connecting lines with variable width
      ctx.strokeStyle = "#999";
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const pi = particles.current[i];
          const pj = particles.current[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            // Draw line as multiple segments with varying width
            const segments = 20;
            const maxWidth = 1.2;
            const minWidth = 0.5;

            for (let seg = 0; seg < segments; seg++) {
              const t1 = seg / segments;
              const t2 = (seg + 1) / segments;

              // Calculate width using smooth curve (thicker at ends, thinner in middle)
              // Using a power function for faster taper
              const getWidth = (t: number) => {
                const centerDist = Math.abs(t - 0.5) * 2; // 0 at center, 1 at edges
                const curve = Math.pow(centerDist, 2.5); // Higher power = faster taper
                return minWidth + (maxWidth - minWidth) * curve;
              };

              const x1 = pi.x + (pj.x - pi.x) * t1;
              const y1 = pi.y + (pj.y - pi.y) * t1;
              const x2 = pi.x + (pj.x - pi.x) * t2;
              const y2 = pi.y + (pj.y - pi.y) * t2;

              ctx.lineWidth = getWidth((t1 + t2) / 2);
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
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
