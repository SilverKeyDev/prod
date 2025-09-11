import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 9;
const SIZE = 80;
const CENTER = SIZE / 2;
const RADIUS = 25;
const BOUNCE_RADIUS = 0;
const QUICK_ANIMATION_STEPS = 6;

type Particle = {
  angle: number;
  offsetX: number;
  offsetY: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number; alpha: number }[];
};

type Connection = {
  targetIdx: number;
  progress: number;
  direction: 1 | -1;
  fadeOut?: boolean;
};

export default function OrbRippleLoader({
  message = "Thinking...",
}: {
  message?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const waveFrame = useRef(0);
  const waveIndex = useRef(Math.floor(Math.random() * PARTICLE_COUNT));
  const lastWaveIndex = useRef<number | null>(null);
  const connections = useRef<Record<number, Connection[]>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    ctx.scale(dpr, dpr);

    // Initialize particles
    particles.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      angle: (i / PARTICLE_COUNT) * 2 * Math.PI,
      offsetX: 0,
      offsetY: 0,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      trail: [],
    }));

    const animate = () => {
      waveFrame.current++;

      if (waveFrame.current % 10 === 0) {
        lastWaveIndex.current = waveIndex.current;
        waveIndex.current = (waveIndex.current + 1) % PARTICLE_COUNT;

        if (lastWaveIndex.current !== null) {
          const oldConns = connections.current[lastWaveIndex.current];
          if (oldConns) {
            oldConns.forEach((conn) => {
              conn.fadeOut = true;
              conn.direction = -1;
            });
          }
        }

        const newConns: Connection[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          if (i !== waveIndex.current) {
            newConns.push({ targetIdx: i, progress: 0, direction: 1 });
          }
        }
        connections.current[waveIndex.current] = newConns;
      }

      const positions: { x: number; y: number }[] = [];

      particles.current.forEach((p) => {
        p.offsetX += p.vx;
        p.offsetY += p.vy;
        if (p.offsetX > BOUNCE_RADIUS || p.offsetX < -BOUNCE_RADIUS) p.vx *= -1;
        if (p.offsetY > BOUNCE_RADIUS || p.offsetY < -BOUNCE_RADIUS) p.vy *= -1;

        const baseX = CENTER + RADIUS * Math.cos(p.angle);
        const baseY = CENTER + RADIUS * Math.sin(p.angle);
        const pos = { x: baseX + p.offsetX, y: baseY + p.offsetY };

        p.trail.push({ x: pos.x, y: pos.y, alpha: 1 });
        if (p.trail.length > 6) p.trail.shift();

        positions.push(pos);
      });

      ctx.clearRect(0, 0, SIZE, SIZE);

      // Draw trails
      particles.current.forEach((p) => {
        p.trail.forEach((t) => {
          ctx.beginPath();
          ctx.arc(t.x, t.y, 1, 0, Math.PI * 2); // trail circle size slightly smaller
          ctx.fillStyle = `rgba(160, 160, 160, ${t.alpha})`;
          ctx.fill();
          t.alpha *= 0.85;
        });
      });

      // Draw particles
      particles.current.forEach((_, idx) => {
        const pos = positions[idx];
        let pulse = 1;
        if (idx === waveIndex.current) {
          const phase = (waveFrame.current % 10) / 10;
          pulse += Math.sin(phase * Math.PI) * 0.7;
        }
        const radius = 1.5 * pulse; // smaller pulse size

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#888";
        ctx.fill();
      });

      // Draw and update connections
      for (const [fromIdx, conns] of Object.entries(connections.current)) {
        const from = positions[parseInt(fromIdx)];

        connections.current[parseInt(fromIdx)] = conns.filter((conn) => {
          const to = positions[conn.targetIdx];

          conn.progress += conn.direction * (1 / QUICK_ANIMATION_STEPS);
          if (conn.progress >= 1) {
            conn.progress = 1;
            conn.direction = -1;
          } else if (conn.progress <= 0) {
            return false;
          }

          const cx = (from.x + to.x) / 2;
          const cy = (from.y + to.y) / 2;

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.quadraticCurveTo(
            cx,
            cy,
            from.x + (to.x - from.x) * conn.progress,
            from.y + (to.y - from.y) * conn.progress,
          );
          ctx.strokeStyle = `rgba(204, 204, 204, ${0.4 + 0.4 * conn.progress})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();

          return true;
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-2 py-4">
      <div
        className="rounded-full"
        style={{
          width: SIZE,
          height: SIZE,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            borderRadius: "9999px",
            pointerEvents: "none",
            backgroundColor: "transparent",
          }}
        />
      </div>
      <p className="text-xs text-gray-500 animate-pulse">{message}</p>
    </div>
  );
}
