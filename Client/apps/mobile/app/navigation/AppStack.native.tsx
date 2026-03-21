import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View } from "react-native";

import { color } from "packages/design-tokens";
import { MessagingScreenNative } from "packages/features/agent/native";
import { ProfileScreenNative } from "packages/features/profile/native";
import { SavedScreenNative } from "packages/features/saved/native";
import { SearchScreenNative } from "packages/features/search/native";
import { type AppTabName, TAB_ICONS } from "packages/navigation/constants";
import { useNotificationStore } from "packages/store";
import { Icon } from "packages/ui/components/primitives";
import type { IconName } from "packages/ui/types/icons";

import { DashboardStack } from "./DashboardStack.native";

export type AppTabParamList = Record<AppTabName, { title?: string }>;

const Tab = createBottomTabNavigator<AppTabParamList>();

function TabBarIcon({
  name,
  focused,
  color: iconColor,
  size = 24,
}: {
  name: IconName;
  focused: boolean;
  color: string;
  size?: number;
}) {
  return <Icon name={name} size={size} color={iconColor} strokeWidth={focused ? 2.25 : 2} />;
}

function MessagingTabBarIcon({
  focused,
  color: iconColor,
  size,
  hasUnread,
}: {
  focused: boolean;
  color: string;
  size?: number;
  hasUnread: boolean;
}) {
  return (
    <View style={{ position: "relative" }}>
      <TabBarIcon name={TAB_ICONS.Messaging} focused={focused} color={iconColor} size={size} />
      {hasUnread ? (
        <View
          accessibilityLabel="Unread messages"
          style={{
            position: "absolute",
            top: 0,
            right: -1,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color("destructive-hover"),
          }}
        />
      ) : null}
    </View>
  );
}

export function AppStack() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const hasMessagingUnread = unreadCount > 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color("primary"),
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
          tabBarIcon: ({ focused, color, size }) => (
            <MessagingTabBarIcon
              focused={focused}
              color={color}
              size={size}
              hasUnread={hasMessagingUnread}
            />
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
