import { StyleSheet, Text, View } from "react-native";

type PlaceholderScreenParams = { title?: string };

type PlaceholderScreenProps = {
  route?: { params?: PlaceholderScreenParams };
  title?: string;
};

export function PlaceholderScreen({ route, title: titleProp }: PlaceholderScreenProps) {
  const title = titleProp ?? route?.params?.title ?? "Screen";
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>SilverKey · Placeholder</Text>
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
