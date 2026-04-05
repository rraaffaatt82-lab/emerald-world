import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useData, PROVIDERS, SERVICES, CATEGORIES } from "@/context/DataContext";
import { STRINGS } from "@/constants/strings";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { ServiceCard } from "@/components/ui/ServiceCard";

export default function ProviderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToFavorites, favorites } = useData();
  const provider = PROVIDERS.find((p) => p.id === id);

  if (!provider) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>
          مزود الخدمة غير موجود
        </Text>
      </View>
    );
  }

  const providerServices = SERVICES.filter((s) => provider.services.includes(s.id));
  const isFav = favorites.includes(provider.id);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 30,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.heroBg,
          { backgroundColor: colors.primary },
        ]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => addToFavorites(provider.id)}
            style={[styles.topBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
          >
            <Feather
              name="heart"
              size={20}
              color={isFav ? "#ff6b6b" : "#fff"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.topBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
          >
            <Feather name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroContent}>
          <View style={styles.heroAvatar}>
            <Feather name="user" size={40} color={colors.primary} />
          </View>
          <Text style={styles.heroName}>{provider.name}</Text>
          <View style={styles.heroBadgeRow}>
            {provider.isVerified && (
              <View style={styles.verifiedRow}>
                <Feather name="check-circle" size={14} color="#90ee90" />
                <Text style={styles.verifiedText}> موثق</Text>
              </View>
            )}
            <Badge
              label={provider.type === "salon" ? STRINGS.auth.salon : STRINGS.auth.freelancer}
              variant="outline"
              style={{ borderColor: "rgba(255,255,255,0.5)" }}
            />
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <StarRating rating={provider.rating} size={14} />
              <Text style={styles.heroStatValue}>{provider.rating}</Text>
              <Text style={styles.heroStatLabel}>{provider.reviewsCount} تقييم</Text>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <Feather name="briefcase" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatValue}>{provider.totalOrders}</Text>
              <Text style={styles.heroStatLabel}>طلب منجز</Text>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <Feather name="map-pin" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatValue}>{provider.distance}</Text>
              <Text style={styles.heroStatLabel}>{STRINGS.home.km}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={[styles.statusBar, {
          backgroundColor: provider.isAvailable ? colors.success + "15" : colors.muted,
          borderColor: provider.isAvailable ? colors.success + "30" : colors.border,
        }]}>
          <View style={[styles.statusDot, { backgroundColor: provider.isAvailable ? colors.success : colors.mutedForeground }]} />
          <Text style={[styles.statusText, { color: provider.isAvailable ? colors.success : colors.mutedForeground }]}>
            {provider.isAvailable ? "متاح الآن" : "غير متاح حالياً"}
          </Text>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>عن المزود</Text>
          <Text style={[styles.bioText, { color: colors.mutedForeground }]}>
            {provider.bio}
          </Text>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الموقع</Text>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={16} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
              {provider.location.address}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>
          الخدمات المقدمة
        </Text>
        {providerServices.map((s) => {
          const cat = CATEGORIES.find((c) => c.id === s.categoryId);
          return (
            <ServiceCard
              key={s.id}
              service={s}
              categoryColor={cat?.color}
              onOrder={() =>
                router.push({
                  pathname: "/request-service",
                  params: { serviceId: s.id },
                })
              }
            />
          );
        })}

        {provider.isAvailable && (
          <TouchableOpacity
            style={[styles.requestBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/request-service")}
          >
            <Feather name="send" size={18} color="#fff" />
            <Text style={styles.requestBtnText}>{STRINGS.home.requestService}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {},
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  heroBg: {
    paddingBottom: 0,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 8,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    alignItems: "center",
    paddingBottom: 32,
    paddingHorizontal: 20,
    gap: 10,
  },
  heroAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  heroName: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  heroBadgeRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedText: {
    color: "#90ee90",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 14,
    width: "100%",
    justifyContent: "space-around",
    marginTop: 4,
  },
  heroStat: {
    alignItems: "center",
    gap: 4,
  },
  heroStatValue: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  heroStatDiv: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  body: {
    padding: 20,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  section: {
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    justifyContent: "flex-start",
  },
  locationText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  requestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  requestBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
});
