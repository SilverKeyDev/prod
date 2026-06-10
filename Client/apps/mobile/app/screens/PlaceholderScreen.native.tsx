import { StyleSheet, View } from "react-native";

import { Text } from "packages/ui/components/structure/primitives";

type PlaceholderScreenParams = { title?: string };

type PlaceholderScreenProps = {
  route?: { params?: PlaceholderScreenParams };
  title?: string;
};

/** Generic empty-state screen for routes that have no content yet. No "Placeholder" or "coming soon" copy. */
export function PlaceholderScreen({ route, title: titleProp }: PlaceholderScreenProps) {
  const sectionTitle = titleProp ?? route?.params?.title ?? "";
  return (
    <View style={styles.container}>
      {sectionTitle ? <Text style={styles.title}>{sectionTitle}</Text> : null}
      <Text style={styles.subtitle}>This section is empty.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f0",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
});
