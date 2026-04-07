import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData, CATEGORIES, PROVIDERS } from "@/context/DataContext";
import { STRINGS } from "@/constants/strings";
import { ProviderCard } from "@/components/ui/ProviderCard";
import { Badge } from "@/components/ui/Badge";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addToFavorites, favorites, getRequestsByCustomer, notifications, flashOffers } = useData();
  const [search, setSearch] = useState("");

  const unreadCount = notifications.filter((n) => n.role === "customer" && !n.isRead).length;
  const bellShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (unreadCount === 0) return;
    const shakeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bellShake, { toValue: -6, duration: 80, useNativeDriver: true }),
        Animated.timing(bellShake, { toValue: 6, duration: 80, useNativeDriver: true }),
        Animated.timing(bellShake, { toValue: -5, duration: 70, useNativeDriver: true }),
        Animated.timing(bellShake, { toValue: 5, duration: 70, useNativeDriver: true }),
        Animated.timing(bellShake, { toValue: 0, duration: 60, useNativeDriver: true }),
        Animated.delay(3000),
      ]),
      { iterations: -1 }
    );
    shakeLoop.start();
    return () => shakeLoop.stop();
  }, [unreadCount]);

  const myPendingOffers = getRequestsByCustomer(user?.id || "")
    .filter((r) => r.status === "offers_received" && r.offers.filter((o) => o.status === "pending").length > 0)
    .slice(0, 3);

  const topProviders = PROVIDERS.filter((p) => p.isAvailable).slice(0, 4);
  const filteredProviders = search
    ? PROVIDERS.filter(
        (p) =>
          p.name.includes(search) ||
          p.bio.includes(search)
      )
    : topProviders;

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + webTopPad + 10,
          paddingBottom: insets.bottom + webBottomPad + 90,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {STRINGS.home.greeting}
          </Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user?.name || ""}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/(tabs)/notifications")}
        >
          <Animated.View style={{ transform: [{ translateX: bellShake }] }}>
            <Feather name="bell" size={22} color={unreadCount > 0 ? colors.primary : colors.foreground} />
          </Animated.View>
          {unreadCount > 0 && (
            <View style={[styles.notifDot, { backgroundColor: colors.destructive }]} />
          )}
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather name="search" size={20} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          value={search}
          onChangeText={setSearch}
          placeholder={STRINGS.home.searchPlaceholder}
          placeholderTextColor={colors.mutedForeground}
          textAlign="right"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : null}
      </View>

      {myPendingOffers.length > 0 && (
        <View style={[styles.offerAlertCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <TouchableOpacity onPress={() => router.push("/(tabs)/orders")}>
              <Text style={[styles.offerAlertSeeAll, { color: colors.primary }]}>عرض الكل</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={[styles.offerAlertBadge, { backgroundColor: colors.primary }]}>
                <Text style={{ color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" }}>{myPendingOffers.reduce((s, r) => s + r.offers.filter((o) => o.status === "pending").length, 0)}</Text>
              </View>
              <Text style={[styles.offerAlertTitle, { color: colors.primary }]}>عروض تنتظر قرارك</Text>
            </View>
          </View>
          {myPendingOffers.map((req) => {
            const pendingCount = req.offers.filter((o) => o.status === "pending").length;
            const bestOffer = req.offers.filter((o) => o.status === "pending").sort((a, b) => a.price - b.price)[0];
            return (
              <TouchableOpacity
                key={req.id}
                style={[styles.offerAlertRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: "/order/[id]", params: { id: req.id } })}
              >
                <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
                <View style={{ flex: 1, alignItems: "flex-end", gap: 2 }}>
                  <Text style={[styles.offerAlertService, { color: colors.foreground }]} numberOfLines={1}>{req.serviceName}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }}>
                    {pendingCount} عرض — أفضل سعر: {bestOffer?.price} د.أ
                  </Text>
                </View>
                <View style={[styles.offerAlertDot, { backgroundColor: colors.primary }]} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[styles.requestBanner, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/request-service")}
        activeOpacity={0.9}
      >
        <View>
          <Text style={styles.bannerTitle}>{STRINGS.home.requestService}</Text>
          <Text style={styles.bannerSub}>
            {STRINGS.home.nearbyProviders}
          </Text>
        </View>
        <View style={styles.bannerIcon}>
          <Feather name="map-pin" size={32} color="rgba(255,255,255,0.8)" />
        </View>
      </TouchableOpacity>

      {flashOffers.filter((fo) => fo.isActive && new Date(fo.expiresAt) > new Date()).length > 0 && (
        <View style={[styles.flashBannerWrap, { backgroundColor: "#fff3e0", borderColor: "#ff9800" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Feather name="zap" size={18} color="#ff9800" />
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "#e65100" }}>عروض حصرية لفترة محدودة</Text>
          </View>
          {flashOffers.filter((fo) => fo.isActive && new Date(fo.expiresAt) > new Date()).slice(0, 3).map((fo) => (
            <View key={fo.id} style={[styles.flashItem, { backgroundColor: "#fff8e1", borderColor: "#ffcc02" }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#bf360c", textAlign: "right" }}>{fo.providerName}</Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#e65100", textAlign: "right" }}>{fo.description}</Text>
              </View>
              <View style={{ backgroundColor: "#ff9800", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 }}>
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 }}>-{fo.discount}٪</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/categories")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              {STRINGS.home.seeAll}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {STRINGS.home.featuredCategories}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.slice(0, 6).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catItem,
                { backgroundColor: cat.color + "15" },
              ]}
              onPress={() =>
                router.push({ pathname: "/(tabs)/categories", params: { catId: cat.id } })
              }
            >
              <View style={[styles.catIcon, { backgroundColor: cat.color + "25" }]}>
                <Feather name={cat.icon as any} size={22} color={cat.color} />
              </View>
              <Text style={[styles.catName, { color: colors.foreground }]}>{cat.name}</Text>
              <Text style={[styles.catCount, { color: colors.mutedForeground }]}>
                {cat.servicesCount} خدمة
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              {STRINGS.home.seeAll}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {STRINGS.home.nearbyProviders}
          </Text>
        </View>
        {filteredProviders.map((p) => (
          <ProviderCard
            key={p.id}
            provider={p}
            isFavorite={favorites.includes(p.id)}
            onFavorite={() => addToFavorites(p.id)}
            onPress={() =>
              router.push({ pathname: "/provider/[id]", params: { id: p.id } })
            }
          />
        ))}
        {filteredProviders.length === 0 && (
          <View style={styles.empty}>
            <Feather name="search" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              لا توجد نتائج
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  userName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  offerAlertCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
    gap: 8,
  },
  offerAlertTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  offerAlertSeeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  offerAlertBadge: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  offerAlertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  offerAlertService: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  offerAlertDot: { width: 8, height: 8, borderRadius: 4 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  requestBanner: {
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    marginBottom: 4,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  bannerIcon: {
    opacity: 0.8,
  },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  catScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  catItem: {
    width: 90,
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    marginEnd: 12,
    gap: 6,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  catCount: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  flashBannerWrap: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  flashItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 4,
  },
});
