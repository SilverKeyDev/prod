import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";

import { PlaceholderScreen } from "./PlaceholderScreen.native";

type KeyboardAvoidingPlaceholderProps = {
  route?: { params?: { title?: string } };
  title?: string;
};

export function KeyboardAvoidingPlaceholder({ route, title }: KeyboardAvoidingPlaceholderProps) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <PlaceholderScreen route={route} title={title} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
