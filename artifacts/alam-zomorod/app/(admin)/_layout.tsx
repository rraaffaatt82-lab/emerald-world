import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

export default function AdminTabLayout() {
  const { user, isLoading } = useAuth();
  const { notifications, walletTopupRequests, packages } = useData();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const unreadAdmin = notifications.filter((n) => n.role === "admin" && !n.isRead).length;
  const pendingTopups = walletTopupRequests.filter((r) => r.status === "pending").length;
  const pendingPackages = packages.filter((p) => p.status === "pending").length;
  const providerBadge = pendingTopups + pendingPackages;

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [user, isLoading]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#c8a951",
        tabBarInactiveTintColor: "#888",
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#1a1a2e",
          borderTopWidth: 0,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarLabelStyle: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#1a1a2e" }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "لوحة التحكم",
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="providers"
        options={{
          title: "المزودون",
          tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} />,
          tabBarBadge: providerBadge > 0 ? providerBadge : undefined,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "الطلبات",
          tabBarIcon: ({ color }) => <Feather name="list" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="coupons"
        options={{
          title: "الكوبونات",
          tabBarIcon: ({ color }) => <Feather name="tag" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "الإعدادات",
          tabBarIcon: ({ color }) => <Feather name="settings" size={22} color={color} />,
          tabBarBadge: unreadAdmin > 0 ? unreadAdmin : undefined,
        }}
      />
    </Tabs>
  );
}
