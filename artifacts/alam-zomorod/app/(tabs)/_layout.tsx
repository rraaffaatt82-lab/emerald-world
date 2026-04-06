import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, View, useColorScheme } from "react-native";
import { playNotificationBeep } from "@/utils/sound";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { STRINGS } from "@/constants/strings";

function NativeTabLayout({ unread }: { unread: number }) {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>{STRINGS.tabs.home}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="categories">
        <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <Label>{STRINGS.tabs.categories}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orders">
        <Icon sf={{ default: "list.clipboard", selected: "list.clipboard.fill" }} />
        <Label>{STRINGS.tabs.orders}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="map">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>الخريطة</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notifications">
        <Icon sf={{ default: "bell", selected: "bell.fill" }} />
        <Label>الإشعارات</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>{STRINGS.tabs.profile}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout({ unread }: { unread: number }) {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarLabelStyle: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: STRINGS.tabs.home,
          tabBarIcon: ({ color }) => isIOS ? <SymbolView name="house" tintColor={color} size={24} /> : <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: STRINGS.tabs.categories,
          tabBarIcon: ({ color }) => isIOS ? <SymbolView name="square.grid.2x2" tintColor={color} size={24} /> : <Feather name="grid" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: STRINGS.tabs.orders,
          tabBarIcon: ({ color }) => isIOS ? <SymbolView name="list.clipboard" tintColor={color} size={24} /> : <Feather name="clipboard" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "الخريطة",
          tabBarIcon: ({ color }) => isIOS ? <SymbolView name="map" tintColor={color} size={24} /> : <Feather name="map-pin" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "الإشعارات",
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color }) => isIOS
            ? <SymbolView name="bell" tintColor={color} size={24} />
            : unread > 0
              ? <AnimatedBell color={color} size={24} />
              : <Feather name="bell" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: STRINGS.tabs.profile,
          tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person" tintColor={color} size={24} /> : <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

function AnimatedBell({ color, size = 22 }: { color: string; size?: number }) {
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 100, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0.7, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -0.7, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.delay(2500),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  const rotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ["-25deg", "25deg"] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Feather name="bell" size={size} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { notifications } = useData();
  const prevUnread = useRef(0);
  const unread = notifications.filter((n) => n.userId === user?.id && !n.isRead).length;

  useEffect(() => {
    if (unread > prevUnread.current) {
      playNotificationBeep();
    }
    prevUnread.current = unread;
  }, [unread]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading]);

  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout unread={unread} />;
  }
  return <ClassicTabLayout unread={unread} />;
}

const styles = StyleSheet.create({});
