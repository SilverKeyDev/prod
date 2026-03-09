import React, { useEffect, useRef } from "react";

import { Animated, Easing, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { Text } from "packages/ui/components/primitives";

const PARTICLE_COUNT = 9;
const SIZE = 80;
const RADIUS = 25;

type LoadingProps = {
  message?: string;
};

/**
 * Native approximation of the orb ripple loader used on web.
 *
 * Renders a ring of animated dots that pulse and orbit around a center point,
 * plus a caption message. Keeps the same public API as the web loader.
 */
function OrbRippleLoaderNative({ message = "Thinking..." }: LoadingProps) {
  const spins = useRef<Animated.Value[]>(
    Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = spins.map((spin, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(spin, {
            toValue: 1,
            duration: 1200,
            delay: (index * 1200) / PARTICLE_COUNT,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(spin, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach((animation) => {
      animation.start();
    });

    return () => {
      animations.forEach((animation) => {
        animation.stop();
      });
    };
  }, [spins]);

  return (
    <View style={styles.root}>
      <View style={styles.orbitContainer}>
        {spins.map((spin, index) => {
          const angle = (index / PARTICLE_COUNT) * 2 * Math.PI;
          const translateX = Math.cos(angle) * RADIUS;
          const translateY = Math.sin(angle) * RADIUS;

          const scale = spin.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 1.4],
          });

          const opacity = spin.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
          });

          return (
            <Animated.View
              key={`particle-${index}`}
              style={[
                styles.particle,
                {
                  transform: [{ translateX }, { translateY }, { scale }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

// Export both named and default for compatibility with the web version
export { OrbRippleLoaderNative as Loading };
export default OrbRippleLoaderNative;

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  orbitContainer: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color("neutral.500"),
  },
  message: {
    marginTop: 8,
    fontSize: 12,
    color: color("neutral.500"),
  },
});
