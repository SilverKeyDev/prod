import React, { useCallback, useMemo, useState } from "react";

import { StyleSheet, View } from "react-native";

import { type ChecklistType, useChecklistData } from "packages/features/homeauth";
import { CHECKLIST_SUBTITLES, CHECKLIST_TITLES, type ChecklistTab } from "packages/types";
import ClientSelector from "packages/ui/components/button/ClientSelector";
import { Box, Loading, Pressable, Text } from "packages/ui/components/primitives";

import DashboardChecklistsHeader from "./DashboardChecklistsHeader.native";

const TAB_TO_CHECKLIST_TYPE: Record<ChecklistTab, ChecklistType> = {
  escrow: "escrow",
  inspections: "insurance",
  financing: "financing",
  closing: "closing",
};

export function DashboardChecklistsNative() {
  const [activeTab, setActiveTab] = useState<ChecklistTab>("escrow");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const checklistType = useMemo<ChecklistType>(() => TAB_TO_CHECKLIST_TYPE[activeTab], [activeTab]);

  const { items, checkedIds, isLoading, error, toggleItem, refreshChecklist } =
    useChecklistData(checklistType);
  // When checklist API supports client scoping, pass selectedClientId into useChecklistData (DASH-1).

  const completedCount = checkedIds.length;
  const totalCount = items.length;

  const handleToggleItem = useCallback(
    async (id: number) => {
      await toggleItem(id);
    },
    [toggleItem]
  );

  const handleRefresh = useCallback(async () => {
    await refreshChecklist();
  }, [refreshChecklist]);

  return (
    <Box className="gap-3">
      <Box className="mb-2">
        <ClientSelector selectedClientId={selectedClientId} onClientChange={setSelectedClientId} />
      </Box>

      <DashboardChecklistsHeader
        title={CHECKLIST_TITLES[activeTab]}
        subtitle={CHECKLIST_SUBTITLES[activeTab] ?? CHECKLIST_SUBTITLES.escrow}
        completedCount={completedCount}
        totalCount={totalCount}
        loading={isLoading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content */}
      <View style={styles.card}>
        {isLoading ? (
          <View style={styles.centered}>
            <Loading />
          </View>
        ) : error ? (
          <Box className="gap-2">
            <Text className="text-sm text-red-500">{error}</Text>
            <Pressable
              onPress={handleRefresh}
              className="bg-brand-accent self-start rounded-lg px-3 py-1.5"
            >
              <Text className="text-xs font-medium text-white">Retry</Text>
            </Pressable>
          </Box>
        ) : items.length === 0 ? (
          <View style={styles.centered}>
            <Text className="text-sm text-gray-600">No checklist items yet.</Text>
          </View>
        ) : (
          <Box className="gap-2">
            {items.map((item) => {
              const checked = checkedIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    void handleToggleItem(item.id);
                  }}
                  className="flex-row items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                >
                  <Box
                    className={`mt-1 h-5 w-5 items-center justify-center rounded border ${
                      checked ? "border-brand-accent bg-brand-accent" : "border-gray-300 bg-white"
                    }`}
                  >
                    {checked ? <Text className="text-xs font-semibold text-white">✓</Text> : null}
                  </Box>
                  <Box className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">{item.label}</Text>
                    {!checked && (
                      <>
                        {item.explanation ? (
                          <Text className="mt-1 text-xs text-gray-600">{item.explanation}</Text>
                        ) : null}
                        {item.bullets && item.bullets.length > 0 ? (
                          <Box className="mt-1 gap-1">
                            {item.bullets.map((bullet) => (
                              <Box key={bullet} className="flex-row gap-1">
                                <Text className="mt-px text-xs text-gray-500">•</Text>
                                <Text className="flex-1 text-xs text-gray-500">{bullet}</Text>
                              </Box>
                            ))}
                          </Box>
                        ) : null}
                        {item.tip ? (
                          <Text className="text-olive-700 mt-1 text-xs">{item.tip}</Text>
                        ) : null}
                      </>
                    )}
                  </Box>
                </Pressable>
              );
            })}
          </Box>
        )}
      </View>
    </Box>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: "rgba(249, 250, 251, 1)",
    padding: 12,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
});

export default DashboardChecklistsNative;
