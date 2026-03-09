import React from "react";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ClientHubScreenNative, DashboardScreen } from "packages/features/dashboard/native";

export type DashboardStackParamList = {
  DashboardMain: undefined;
  ClientHub: { clientId: string };
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStack() {
  return (
    <Stack.Navigator
      initialRouteName="DashboardMain"
      screenOptions={{
        headerShown: false,
        contentStyle: { flex: 1 },
      }}
    >
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="ClientHub" component={ClientHubScreenNative} />
    </Stack.Navigator>
  );
}
