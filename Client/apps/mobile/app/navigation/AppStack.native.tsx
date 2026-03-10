import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { MessagingScreenNative } from "packages/features/agent/native";
import { ProfileScreenNative } from "packages/features/profile/native";
import { SavedScreenNative } from "packages/features/saved/native";
import { SearchScreenNative } from "packages/features/search/native";
import { type AppTabName, getTabBarBadge, TAB_ICONS } from "packages/navigation/constants";
import { useNotificationStore } from "packages/store";
import { Icon } from "packages/ui/components/primitives";
import type { IconName } from "packages/ui/types/icons";

import { DashboardStack } from "./DashboardStack.native";

export type AppTabParamList = Record<AppTabName, { title?: string }>;

const Tab = createBottomTabNavigator<AppTabParamList>();

function TabBarIcon({
  name,
  focused,
  color,
  size = 24,
}: {
  name: IconName;
  focused: boolean;
  color: string;
  size?: number;
}) {
  return <Icon name={name} size={size} color={color} strokeWidth={focused ? 2.25 : 2} />;
}

export function AppStack() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const messagingBadge = getTabBarBadge(unreadCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#A3B18A",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          paddingBottom: 6,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon name={TAB_ICONS.Dashboard} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreenNative}
        options={{
          title: "Search",
          tabBarLabel: "Search",
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon name={TAB_ICONS.Search} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreenNative}
        options={{
          title: "Saved",
          tabBarLabel: "Saved",
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon name={TAB_ICONS.Saved} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Messaging"
        component={MessagingScreenNative}
        options={{
          title: "Messaging",
          tabBarLabel: "Messaging",
          tabBarBadge: messagingBadge,
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon name={TAB_ICONS.Messaging} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreenNative}
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon name={TAB_ICONS.Profile} focused={focused} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
