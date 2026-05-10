/**
 * Native rippled background: particle network (dots + connecting lines) with subtle motion.
 * Matches web RippleBackground aesthetic; uses react-native-svg (no canvas on RN).
 */

import React, { useEffect, useMemo, useState } from "react";

import type { LayoutChangeEvent } from "react-native";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

import { color } from "packages/design-tokens";

import type { RippleBackgroundProps } from "./rippleBackgroundProps";

const CONNECT_DISTANCE = 95;
const PARTICLE_COUNT_FULL = 80;
const DOT_RADIUS = 2;
const LINE_STROKE_WIDTH = 0.5;
const MARGIN = 20;
const DRIFT_AMPLITUDE = 2.5;
const TICK_MS = 80;

type Point = { x: number; y: number };

function useBaseParticles(width: number, height: number, count: number): Point[] {
  return useMemo(() => {
    const w = width - 2 * MARGIN;
    const h = height - 2 * MARGIN;
    if (w <= 0 || h <= 0 || count <= 0) return [];
    const points: Point[] = [];
    const rng = (seed: number) => {
      const x = Math.sin(seed * 9999) * 10000;
      return x - Math.floor(x);
    };
    for (let i = 0; i < count; i++) {
      points.push({
        x: MARGIN + rng(i) * w,
        y: MARGIN + rng(i + 1000) * h,
      });
    }
    return points;
  }, [width, height, count]);
}

function useOverlayBaseParticles(width: number, height: number, count: number): Point[] {
  return useMemo(() => {
    const shortSide = Math.min(width, height);
    const margin = Math.max(2, Math.min(10, Math.floor(shortSide * 0.12)));
    const w = width - 2 * margin;
    const h = height - 2 * margin;
    if (w <= 0 || h <= 0 || count <= 0) return [];
    const points: Point[] = [];
    const rng = (seed: number) => {
      const x = Math.sin(seed * 9999) * 10000;
      return x - Math.floor(x);
    };
    for (let i = 0; i < count; i++) {
      points.push({
        x: margin + rng(i + 2000) * w,
        y: margin + rng(i + 3000) * h,
      });
    }
    return points;
  }, [width, height, count]);
}

function useDriftedParticles(base: Point[], tick: number): Point[] {
  return useMemo(() => {
    return base.map((p, i) => ({
      x: p.x + Math.sin(tick * 0.02 + i) * DRIFT_AMPLITUDE,
      y: p.y + Math.cos(tick * 0.015 + i * 1.3) * DRIFT_AMPLITUDE,
    }));
  }, [base, tick]);
}

function RippleFullScreen() {
  const { width, height } = useWindowDimensions();
  const [tick, setTick] = useState(0);
  const baseParticles = useBaseParticles(width, height, PARTICLE_COUNT_FULL);
  const particles = useDriftedParticles(baseParticles, tick);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const lines = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DISTANCE) {
          result.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        }
      }
    }
    return result;
  }, [particles]);

  const fillColor = color("neutral.300");
  const strokeColor = color("neutral.200");

  return (
    <View style={[styles.container, { backgroundColor: color("neutral.50") }]} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {lines.map((line, idx) => (
          <Line
            key={`line-${idx}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={strokeColor}
            strokeWidth={LINE_STROKE_WIDTH}
          />
        ))}
        {particles.map((p, idx) => (
          <Circle key={`dot-${idx}`} cx={p.x} cy={p.y} r={DOT_RADIUS} fill={fillColor} />
        ))}
      </Svg>
    </View>
  );
}

function RippleOverlayMeasured({ width, height }: { width: number; height: number }) {
  const shortSide = Math.min(width, height);
  const connectDistance = Math.max(24, Math.min(52, shortSide * 0.62));
  const particleCount = Math.max(10, Math.min(28, Math.floor((width * height) / 1100)));
  const [tick, setTick] = useState(0);
  const baseParticles = useOverlayBaseParticles(width, height, particleCount);
  const particles = useDriftedParticles(baseParticles, tick);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const lines = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectDistance) {
          result.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        }
      }
    }
    return result;
  }, [particles, connectDistance]);

  const fillColor = color("neutral.300");
  const strokeColor = color("neutral.200");

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {lines.map((line, idx) => (
        <Line
          key={`oline-${idx}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={strokeColor}
          strokeWidth={LINE_STROKE_WIDTH}
        />
      ))}
      {particles.map((p, idx) => (
        <Circle key={`odot-${idx}`} cx={p.x} cy={p.y} r={DOT_RADIUS} fill={fillColor} />
      ))}
    </Svg>
  );
}

function RippleOverlay() {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
    }
  };

  return (
    <View style={styles.overlayRoot} pointerEvents="none" onLayout={onLayout}>
      {size.w > 0 && size.h > 0 ? <RippleOverlayMeasured width={size.w} height={size.h} /> : null}
    </View>
  );
}

export default function RippleBackground({ overlay = false }: RippleBackgroundProps) {
  if (overlay) {
    return <RippleOverlay />;
  }
  return <RippleFullScreen />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    backgroundColor: "transparent",
  },
});
