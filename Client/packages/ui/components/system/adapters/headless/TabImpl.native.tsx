import React from "react";

import { Pressable, StyleSheet, View } from "react-native";

type TabProps = {
  children?: React.ReactNode;
};

/**
 * Native: minimal tab strip. Tab.Group = container, Tab.List = tab row, Tab.Panels = content.
 */
function TabGroup({ children }: TabProps) {
  return <View style={styles.group}>{children}</View>;
}

function TabList({ children }: TabProps) {
  return <View style={styles.list}>{children}</View>;
}

function TabPanels({ children }: TabProps) {
  return <View style={styles.panels}>{children}</View>;
}

function TabPanel({ children }: TabProps) {
  return <View style={styles.panel}>{children}</View>;
}

function TabItem({ children }: TabProps) {
  return <Pressable>{children}</Pressable>;
}

TabGroup.List = TabList;
TabGroup.Panels = TabPanels;
TabGroup.Panel = TabPanel;
TabGroup.Tab = TabItem;

export const Tab = TabGroup;

const styles = StyleSheet.create({
  group: { flex: 1 },
  list: { flexDirection: "row", gap: 8 },
  panels: { flex: 1 },
  panel: { flex: 1 },
});
