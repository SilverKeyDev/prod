/**
 * Native rippled background: particle network (dots + connecting lines) with subtle motion.
 * Matches web RippleBackground aesthetic; uses react-native-svg (no canvas on RN).
 */

import React, { useEffect, useMemo, useState } from "react";

import { Dimensions, StyleSheet, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

import { color } from "packages/design-tokens";

const CONNECT_DISTANCE = 95;
const PARTICLE_COUNT = 80;
const DOT_RADIUS = 2;
const LINE_STROKE_WIDTH = 0.5;
const MARGIN = 20;
const DRIFT_AMPLITUDE = 2.5;
const TICK_MS = 80;

type Point = { x: number; y: number };

function useBaseParticles(width: number, height: number): Point[] {
  return useMemo(() => {
    const w = width - 2 * MARGIN;
    const h = height - 2 * MARGIN;
    if (w <= 0 || h <= 0) return [];
    const points: Point[] = [];
    const rng = (seed: number) => {
      const x = Math.sin(seed * 9999) * 10000;
      return x - Math.floor(x);
    };
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      points.push({
        x: MARGIN + rng(i) * w,
        y: MARGIN + rng(i + 1000) * h,
      });
    }
    return points;
  }, [width, height]);
}

function useDriftedParticles(base: Point[], tick: number): Point[] {
  return useMemo(() => {
    return base.map((p, i) => ({
      x: p.x + Math.sin(tick * 0.02 + i) * DRIFT_AMPLITUDE,
      y: p.y + Math.cos(tick * 0.015 + i * 1.3) * DRIFT_AMPLITUDE,
    }));
  }, [base, tick]);
}

export default function RippleBackground() {
  const { width, height } = Dimensions.get("window");
  const [tick, setTick] = useState(0);
  const baseParticles = useBaseParticles(width, height);
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

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});