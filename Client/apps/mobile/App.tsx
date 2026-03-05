import "./tailwind-input.css";
import "./global.css";

import { StyleSheet, View } from "react-native";

import { AppRoot } from "./app/AppRoot.native";

export default function App() {
  return (
    <View style={styles.root}>
      <AppRoot />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
