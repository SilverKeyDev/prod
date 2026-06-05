import { useCallback } from "react";

import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { ScrollView, Text } from "packages/ui/components/structure/primitives";

import { AgentDiscoveryView } from "./AgentDiscoveryView.native";

/**
 * Native full-screen agent discovery (recommendations + search). Registered on the authenticated root stack.
 */
export function FindAgentsScreenNative() {
  const { t } = useLocalization();
  const navigation = useNavigation();

  const onOpenAgentProfile = useCallback(
    (agent: { id: string; name?: string }) => {
      navigation.navigate(
        "AgentProfile" as never,
        {
          agentUserId: agent.id,
          displayName: agent.name,
        } as never
      );
    },
    [navigation]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: color("neutral.50") }}
      edges={["top", "bottom"]}
    >
      <View style={styles.toolbar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Text className="text-text-primary text-base font-medium">{t("common.back")}</Text>
        </Pressable>
        <Text className="text-text-primary flex-1 text-lg font-semibold">
          {t("agent.discovery_page_title")}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <AgentDiscoveryView isActive onOpenAgentProfile={onOpenAgentProfile} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color("neutral.200"),
  },
  backBtn: { paddingVertical: 4 },
});
