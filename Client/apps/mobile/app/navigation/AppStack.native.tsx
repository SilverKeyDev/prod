import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { MessagingScreenNative } from "packages/features/agent/native";
import { ProfileScreenNative } from "packages/features/profile/native";
import { SavedScreenNative } from "packages/features/saved/native";
import { SearchScreenNative } from "packages/features/search/native";
import { useNotificationStore } from "packages/store";

import { NativewindSmokeScreen } from "@/app/screens/NativewindSmokeScreen.native";

import { DashboardStack } from "./DashboardStack.native";

export type AppTabParamList = {
  Dashboard: { title?: string };
  Search: { title?: string };
  Saved: { title?: string };
  Messaging: { title?: string };
  Profile: { title?: string };
  NativewindSmoke: { title?: string };
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppStack() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#A3B18A",
        tabBarInactiveTintColor: "#666",
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ title: "Dashboard", tabBarLabel: "Dashboard" }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreenNative}
        options={{ title: "Search", tabBarLabel: "Search" }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreenNative}
        options={{ title: "Saved", tabBarLabel: "Saved" }}
      />
      <Tab.Screen
        name="Messaging"
        component={MessagingScreenNative}
        options={{
          title: "Messaging",
          tabBarLabel: "Messaging",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreenNative}
        options={{ title: "Profile", tabBarLabel: "Profile" }}
      />
      {__DEV__ ? (
        <Tab.Screen
          name="NativewindSmoke"
          component={NativewindSmokeScreen}
          options={{ title: "NativeWind", tabBarLabel: "NativeWind" }}
        />
      ) : null}
    </Tab.Navigator>
  );
}
