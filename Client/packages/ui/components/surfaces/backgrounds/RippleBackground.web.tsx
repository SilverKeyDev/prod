import { useEffect, useRef } from "react";

import { color } from "packages/design-tokens";
import { Box } from "packages/ui/components/structure/primitives";
import { getWindow } from "packages/utils/core/platform";

import type { RippleBackgroundProps } from "./rippleBackgroundProps";
import {
  RIPPLE_LARGE_OVERLAY_AREA_THRESHOLD,
  RIPPLE_LINE_MAX_WIDTH,
  RIPPLE_LINE_MIN_WIDTH,
  rippleDotColor,
  rippleLineColor,
  rippleLineOpacityForDistance,
} from "./rippleBackgroundTokens";

const CONNECT_DISTANCE = 95;
const MOUSE_RADIUS = 95;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export default function RippleBackground({ overlay = false }: RippleBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });
  const connectDistRef = useRef(CONNECT_DISTANCE);
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const win = getWindow();
    let raf = 0;

    const resize = () => {
      const isOverlay = overlayRef.current;
      const dpr = win?.devicePixelRatio ?? 1;
      const width = container.clientWidth;
      const height = container.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const currentArea = width * height;
      let particleCount: number;
      let margin: number;

      if (isOverlay) {
        const isLargeOverlay = currentArea > RIPPLE_LARGE_OVERLAY_AREA_THRESHOLD;
        if (isLargeOverlay) {
          connectDistRef.current = CONNECT_DISTANCE;
          margin = 20;
          const baseParticleCount = 120;
          const baseArea = 1920 * 1080;
          particleCount = Math.max(
            40,
            Math.min(180, Math.floor((baseParticleCount * currentArea) / baseArea))
          );
        } else {
          const shortSide = Math.min(width, height);
          connectDistRef.current = Math.max(24, Math.min(52, shortSide * 0.62));
          margin = Math.max(2, Math.min(10, Math.floor(shortSide * 0.12)));
          particleCount = Math.max(10, Math.min(28, Math.floor(currentArea / 1100)));
        }
      } else {
        connectDistRef.current = CONNECT_DISTANCE;
        margin = 20;
        const baseParticleCount = 260;
        const baseArea = 1920 * 1080;
        const particleDensity = baseParticleCount / baseArea;
        particleCount = Math.max(50, Math.floor(particleDensity * currentArea));
      }

      particles.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * Math.max(1, width - 2 * margin) + margin,
        y: Math.random() * Math.max(1, height - 2 * margin) + margin,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
      }));
    };

    resize();
    if (win) win.addEventListener("resize", resize);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(container);

    const animate = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const connectD = connectDistRef.current;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = rippleDotColor();
      ctx.strokeStyle = rippleLineColor();
      ctx.lineWidth = 0.5;

      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x <= 0 || p.x >= width) p.vx *= -1;
        if (p.y <= 0 || p.y >= height) p.vy *= -1;

        const dx = p.x - mouse.current.x;
        const dy = p.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * 0.002;
          p.vy += Math.sin(angle) * 0.002;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = rippleLineColor();
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const pi = particles.current[i];
          const pj = particles.current[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectD) {
            const segments = 20;
            const maxWidth = RIPPLE_LINE_MAX_WIDTH;
            const minWidth = RIPPLE_LINE_MIN_WIDTH;
            ctx.globalAlpha = rippleLineOpacityForDistance(dist, connectD);

            for (let seg = 0; seg < segments; seg++) {
              const t1 = seg / segments;
              const t2 = (seg + 1) / segments;

              const getWidth = (t: number) => {
                const centerDist = Math.abs(t - 0.5) * 2;
                const curve = Math.pow(centerDist, 2.5);
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
            ctx.globalAlpha = 1;
          }
        }
      }

      raf = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
    };
    if (win) win.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(raf);
      if (win) {
        win.removeEventListener("resize", resize);
        win.removeEventListener("mousemove", handleMouseMove);
      }
      resizeObserver?.disconnect();
    };
  }, [overlay]);

  return (
    <Box
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0"
      style={overlay ? { background: "transparent" } : { background: color("neutral.50") }}
    >
      <canvas ref={canvasRef} />
    </Box>
  );
}
