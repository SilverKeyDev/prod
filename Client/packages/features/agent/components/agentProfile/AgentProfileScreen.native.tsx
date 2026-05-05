import { useNavigation, useRoute } from "@react-navigation/native";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { PublicAgentProfileConnect } from "packages/features/agent/components/PublicAgentProfileConnect";
import { AgentPublicProfileView } from "packages/features/profile/components/AgentPublicProfileView";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { usePublicAgentProfile } from "packages/hooks/data/integrations/usePublicAgentProfile";
import type { AgentProfileScreenParams } from "packages/navigation/types";
import { useAuthStore } from "packages/store";
import { Loading } from "packages/ui/components/asset/loading/Loading";
import { ScrollView, Text } from "packages/ui/components/primitives";

function isSlugParams(
  p: AgentProfileScreenParams | undefined
): p is { publicProfileSlug: string } {
  return Boolean(p && "publicProfileSlug" in p && (p as { publicProfileSlug?: string }).publicProfileSlug);
}

export function AgentProfileScreenNative() {
  const { t } = useLocalization();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as AgentProfileScreenParams | undefined;

  const slugLookup = isSlugParams(params) ? params.publicProfileSlug.trim().toLowerCase() : "";
  const trimmedId =
    params && "agentUserId" in params ? (params.agentUserId?.trim() ?? "") : "";

  const { data: agent, isLoading, isFetched } = usePublicAgentProfile(
    slugLookup
      ? { publicProfileSlug: slugLookup }
      : { userId: trimmedId || undefined }
  );

  const hasLookup = Boolean(slugLookup) || Boolean(trimmedId);

  const { userProfile } = useUserData();
  const authUser = useAuthStore((s) => s.user);
  const viewerId = userProfile?.id ?? authUser?.id ?? null;
  const isOwnProfile = Boolean(viewerId && agent?.id && viewerId === agent.id.trim());

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Text className="text-text-primary text-base font-medium">{t("common.back")}</Text>
        </Pressable>
      </View>
      {!hasLookup ? (
        <View style={styles.center}>
          <Text className="text-text-secondary text-sm">
            {t("profile.public.unavailable_body")}
          </Text>
        </View>
      ) : isLoading || !isFetched ? (
        <View style={styles.center}>
          <Loading />
        </View>
      ) : agent === null ? (
        <View style={styles.center}>
          <Text className="text-text-primary mb-2 text-base font-medium">
            {t("profile.public.agent_not_found_title")}
          </Text>
          <Text className="text-text-secondary text-sm">
            {t("profile.public.unavailable_body")}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <AgentPublicProfileView
            agent={agent}
            heroActions={
              <PublicAgentProfileConnect agentId={agent.id} isOwnProfile={isOwnProfile} />
            }
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color("neutral.50") },
  toolbar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color("neutral.200"),
  },
  back: { alignSelf: "flex-start", paddingVertical: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  scroll: { paddingBottom: 32 },
});
