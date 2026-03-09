import React, { useEffect, useRef } from "react";

import { Animated, Easing, StyleSheet, View } from "react-native";

import { color, spacing } from "packages/design-tokens";
import { Text } from "packages/ui/components/primitives";

type KeyTurnLoaderProps = {
  message?: string;
  variant?: "default" | "gray";
};

/**
 * Native implementation of the KeyTurnLoader.
 *
 * Uses an animated key emoji that gently turns back and forth,
 * paired with a standardized text message.
 */
export default function KeyTurnLoader({
  message = "Unlocking...",
  variant = "default",
}: KeyTurnLoaderProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(spin, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(spin, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["-15deg", "15deg"],
  });

  const isGray = variant === "gray";

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.keyContainer, { transform: [{ rotate }] }]}>
        <Text style={[styles.key, isGray ? styles.keyGray : styles.keyDefault]}>🔑</Text>
      </Animated.View>
      <Text style={[styles.message, isGray && styles.messageGray]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: spacing(4),
    marginLeft: spacing(2),
  },
  keyContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  key: {
    fontSize: 28,
  },
  keyDefault: {
    color: color("off-white"),
  },
  keyGray: {
    color: color("neutral.500"),
  },
  message: {
    fontSize: 14,
    color: color("neutral.50"),
  },
  messageGray: {
    color: color("neutral.500"),
  },
});
