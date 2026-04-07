import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData, CATEGORIES, PROVIDERS } from "@/context/DataContext";
import { STRINGS } from "@/constants/strings";
import { ProviderCard } from "@/components/ui/ProviderCard";

// ─── quick-service tiles shown below the hero ────────────────────────────────
const QUICK_SERVICES = [
  { id: "q1", label: "عروسات", icon: "heart" as const, color: "#d63a6e" },
  { id: "q2", label: "مكياج", icon: "star" as const, color: "#c8a03a" },
  { id: "q3", label: "شعر", icon: "scissors" as const, color: "#7c3aed" },
  { id: "q4", label: "بشرة", icon: "droplet" as const, color: "#0ea5e9" },
];

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
    ? PROVIDERS.filter((p) => p.name.includes(search) || p.bio.includes(search))
    : topProviders;

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const activeFlash = flashOffers.filter((fo) => fo.isActive && new Date(fo.expiresAt) > new Date());

  // initials for avatar
  const initials = (user?.name || "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: "#fff0f7" }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + webTopPad,
          paddingBottom: insets.bottom + webBottomPad + 90,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HERO HEADER ─────────────────────────────────────────────── */}
      <View style={[styles.hero, { paddingTop: 14 }]}>
        {/* decorative blobs */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        {/* top row */}
        <View style={styles.heroRow}>
          {/* notification bell */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push("/(tabs)/notifications")}
          >
            <Animated.View style={{ transform: [{ translateX: bellShake }] }}>
              <Feather name="bell" size={20} color="#fff" />
            </Animated.View>
            {unreadCount > 0 && <View style={styles.bellDot} />}
          </TouchableOpacity>

          {/* greeting + avatar */}
          <View style={styles.heroGreetRow}>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.heroGreeting}>مرحباً بك 👋</Text>
              <Text style={styles.heroName}>{user?.name || ""}</Text>
            </View>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{initials}</Text>
            </View>
          </View>
        </View>

        {/* tagline */}
        <Text style={styles.heroTagline}>اكتشفي عالم جمالك من راحة بيتك ✨</Text>

        {/* search bar inside hero */}
        <View style={styles.heroSearch}>
          <Feather name="search" size={18} color="#d63a6e" />
          <TextInput
            style={styles.heroSearchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="ابحثي عن خدمة أو مزودة..."
            placeholderTextColor="#c084a0"
            textAlign="right"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#c084a0" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ── PENDING OFFERS ALERT ──────────────────────────────────────── */}
      {myPendingOffers.length > 0 && (
        <View style={[styles.offerAlertCard, { backgroundColor: "#fff", borderColor: "#fce4ec" }]}>
          <View style={styles.offerAlertHeader}>
            <TouchableOpacity onPress={() => router.push("/(tabs)/orders")}>
              <Text style={styles.offerAlertSeeAll}>عرض الكل</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.offerAlertBadge}>
                <Text style={{ color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" }}>
                  {myPendingOffers.reduce((s, r) => s + r.offers.filter((o) => o.status === "pending").length, 0)}
                </Text>
              </View>
              <Text style={styles.offerAlertTitle}>عروض تنتظر قرارك</Text>
            </View>
          </View>
          {myPendingOffers.map((req) => {
            const pendingCount = req.offers.filter((o) => o.status === "pending").length;
            const bestOffer = req.offers.filter((o) => o.status === "pending").sort((a, b) => a.price - b.price)[0];
            return (
              <TouchableOpacity
                key={req.id}
                style={styles.offerAlertRow}
                onPress={() => router.push({ pathname: "/order/[id]", params: { id: req.id } })}
              >
                <Feather name="chevron-left" size={15} color="#d63a6e" />
                <View style={{ flex: 1, alignItems: "flex-end", gap: 2 }}>
                  <Text style={styles.offerAlertService} numberOfLines={1}>{req.serviceName}</Text>
                  <Text style={styles.offerAlertMeta}>{pendingCount} عرض — أفضل سعر: {bestOffer?.price} د.أ</Text>
                </View>
                <View style={styles.offerAlertDot} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── QUICK-SERVICE CHIPS ───────────────────────────────────────── */}
      <View style={styles.quickRow}>
        {QUICK_SERVICES.map((qs) => (
          <TouchableOpacity
            key={qs.id}
            style={[styles.quickChip, { backgroundColor: qs.color + "18", borderColor: qs.color + "40" }]}
            onPress={() => router.push("/request-service")}
          >
            <Feather name={qs.icon} size={16} color={qs.color} />
            <Text style={[styles.quickChipLabel, { color: qs.color }]}>{qs.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── HERO REQUEST BANNER ───────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.requestBanner}
        onPress={() => router.push("/request-service")}
        activeOpacity={0.92}
      >
        {/* Decorative ring */}
        <View style={styles.bannerRing} />
        <View style={styles.bannerRing2} />

        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>اطلبي خدمة الآن</Text>
          <Text style={styles.bannerSub}>مزودات قريبات منك — وصول خلال 30 دقيقة</Text>
          <View style={styles.bannerCta}>
            <Feather name="arrow-left" size={14} color="#fff" />
            <Text style={styles.bannerCtaText}>ابدئي الآن</Text>
          </View>
        </View>
        <View style={styles.bannerIconWrap}>
          <Feather name="map-pin" size={36} color="rgba(255,255,255,0.9)" />
        </View>
      </TouchableOpacity>

      {/* ── FLASH OFFERS ─────────────────────────────────────────────── */}
      {activeFlash.length > 0 && (
        <View style={styles.flashSection}>
          <View style={styles.flashHeader}>
            <Feather name="zap" size={16} color="#ff6f00" />
            <Text style={styles.flashTitle}>⚡ عروض حصرية لفترة محدودة</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
            {activeFlash.slice(0, 4).map((fo) => (
              <View key={fo.id} style={styles.flashCard}>
                <View style={styles.flashBadge}>
                  <Text style={styles.flashBadgeText}>-{fo.discount}٪</Text>
                </View>
                <Text style={styles.flashProvider} numberOfLines={1}>{fo.providerName}</Text>
                <Text style={styles.flashDesc} numberOfLines={2}>{fo.description}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── CATEGORIES ───────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/categories")}>
            <Text style={styles.seeAll}>{STRINGS.home.seeAll}</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>{STRINGS.home.featuredCategories}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
          {CATEGORIES.slice(0, 6).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catCard, { backgroundColor: "#fff" }]}
              onPress={() => router.push({ pathname: "/(tabs)/categories", params: { catId: cat.id } })}
            >
              <View style={[styles.catIconWrap, { backgroundColor: cat.color + "20" }]}>
                <Feather name={cat.icon as any} size={24} color={cat.color} />
              </View>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catCount}>{cat.servicesCount} خدمة</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── PROMO STRIP ──────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.promoStrip} onPress={() => router.push("/(tabs)/profile")}>
        <Feather name="gift" size={18} color="#c8a03a" />
        <Text style={styles.promoStripText}>اشتركي في Beauty Pass واحصلي على خصم 20٪ على كل طلب</Text>
        <Feather name="chevron-left" size={16} color="#c8a03a" />
      </TouchableOpacity>

      {/* ── NEARBY PROVIDERS ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity>
            <Text style={styles.seeAll}>{STRINGS.home.seeAll}</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>{STRINGS.home.nearbyProviders}</Text>
        </View>
        {filteredProviders.map((p) => (
          <ProviderCard
            key={p.id}
            provider={p}
            isFavorite={favorites.includes(p.id)}
            onFavorite={() => addToFavorites(p.id)}
            onPress={() => router.push({ pathname: "/provider/[id]", params: { id: p.id } })}
          />
        ))}
        {filteredProviders.length === 0 && (
          <View style={styles.empty}>
            <Feather name="search" size={32} color="#d6b4c8" />
            <Text style={[styles.emptyText, { color: "#d6b4c8" }]}>لا توجد نتائج</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 0 },

  // ─── hero ────────────────────────────────────────────────────────
  hero: {
    backgroundColor: "#d63a6e",
    marginHorizontal: 0,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    gap: 14,
    marginBottom: 20,
  },
  blob1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -60,
    left: -50,
  },
  blob2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -20,
    right: 20,
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#ffd740",
    borderWidth: 1.5,
    borderColor: "#d63a6e",
  },
  heroGreetRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroGreeting: { color: "rgba(255,255,255,0.78)", fontSize: 12, fontFamily: "Inter_400Regular" },
  heroName: { color: "#fff", fontSize: 19, fontFamily: "Inter_700Bold" },
  heroAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  heroTagline: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    lineHeight: 20,
  },
  heroSearch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  heroSearchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#1a1a2e" },

  // ─── offer alert ─────────────────────────────────────────────────
  offerAlertCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    gap: 8,
    shadowColor: "#d63a6e",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  offerAlertHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  offerAlertTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#d63a6e" },
  offerAlertSeeAll: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#d63a6e" },
  offerAlertBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#d63a6e", alignItems: "center", justifyContent: "center",
  },
  offerAlertRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
    backgroundColor: "#fff5f8", borderWidth: 1, borderColor: "#fce4ec",
  },
  offerAlertService: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1a1a2e" },
  offerAlertMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#888" },
  offerAlertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#d63a6e" },

  // ─── quick chips ─────────────────────────────────────────────────
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  quickChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickChipLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  // ─── request banner ───────────────────────────────────────────────
  requestBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 22,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#b5275a",
    overflow: "hidden",
    shadowColor: "#d63a6e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  bannerRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 30,
    borderColor: "rgba(255,255,255,0.08)",
    top: -50,
    left: -40,
  },
  bannerRing2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 20,
    borderColor: "rgba(255,255,255,0.06)",
    bottom: -30,
    right: 60,
  },
  bannerTitle: { color: "#fff", fontSize: 19, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 4 },
  bannerSub: { color: "rgba(255,255,255,0.78)", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", marginBottom: 12, lineHeight: 20 },
  bannerCta: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-end",
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
  },
  bannerCtaText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  bannerIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
    marginLeft: 12,
  },

  // ─── flash offers ─────────────────────────────────────────────────
  flashSection: { marginBottom: 20, paddingHorizontal: 20 },
  flashHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  flashTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#bf360c" },
  flashCard: {
    width: 150,
    backgroundColor: "#fff8e1",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#ffcc02",
    padding: 12,
    marginRight: 10,
    gap: 6,
    overflow: "hidden",
  },
  flashBadge: {
    backgroundColor: "#ff6f00",
    alignSelf: "flex-end",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  flashBadgeText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  flashProvider: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#bf360c", textAlign: "right" },
  flashDesc: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#e65100", textAlign: "right", lineHeight: 16 },

  // ─── categories ───────────────────────────────────────────────────
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#1a1a2e" },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#d63a6e" },
  catCard: {
    width: 92,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    marginRight: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  catIconWrap: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  catName: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center", color: "#1a1a2e" },
  catCount: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#888" },

  // ─── promo strip ──────────────────────────────────────────────────
  promoStrip: {
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff9ee",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#f0d080",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  promoStripText: {
    flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold",
    color: "#7a5e00", textAlign: "right", lineHeight: 18,
  },

  // ─── empty ────────────────────────────────────────────────────────
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
