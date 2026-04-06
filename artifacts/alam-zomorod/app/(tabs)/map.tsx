import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useData } from "@/context/DataContext";
import { Badge } from "@/components/ui/Badge";

const { width: SW } = Dimensions.get("window");
const MAP_SIZE = Math.min(SW - 32, 420);

function getProviderPosition(distance: number, index: number, total: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const maxR = MAP_SIZE / 2 - 40;
  const r = Math.min((distance / 50) * maxR, maxR - 10);
  const x = MAP_SIZE / 2 + Math.cos(angle) * r;
  const y = MAP_SIZE / 2 + Math.sin(angle) * r;
  return { x, y };
}

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { providers, favorites } = useData();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const approved = providers.filter((p) => p.status === "approved");
  const selected = approved.find((p) => p.id === selectedId);

  const circles = [
    { r: MAP_SIZE / 6, label: "10 كم" },
    { r: MAP_SIZE / 3, label: "25 كم" },
    { r: MAP_SIZE / 2 - 12, label: "50 كم" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopPad + 10, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>الخريطة</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{approved.length} مزود خدمة قريب منك</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + webBottomPad + 100 }}>
        <View style={styles.mapWrapper}>
          <View style={[styles.map, { width: MAP_SIZE, height: MAP_SIZE, backgroundColor: colors.card, borderColor: colors.border }]}>
            {circles.map((c, i) => (
              <View key={i} style={[styles.circle, {
                width: c.r * 2, height: c.r * 2, borderRadius: c.r,
                borderColor: colors.primary + "20",
                left: MAP_SIZE / 2 - c.r, top: MAP_SIZE / 2 - c.r,
              }]}>
                <Text style={[styles.circleLabel, { color: colors.mutedForeground }]}>{c.label}</Text>
              </View>
            ))}
            <View style={[styles.center, { left: MAP_SIZE / 2 - 18, top: MAP_SIZE / 2 - 18, backgroundColor: colors.primary }]}>
              <Feather name="user" size={14} color="#fff" />
            </View>
            <Text style={[styles.youLabel, { color: colors.primary, left: MAP_SIZE / 2 - 16, top: MAP_SIZE / 2 + 22 }]}>أنتِ</Text>

            {approved.map((p, i) => {
              const pos = getProviderPosition(p.distance, i, approved.length);
              const isSelected = p.id === selectedId;
              const isFav = favorites.includes(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.providerDot, {
                    left: pos.x - 18, top: pos.y - 18,
                    backgroundColor: isSelected ? colors.primary : (p.isAvailable ? colors.card : colors.muted),
                    borderColor: isSelected ? colors.primary : (isFav ? "#f44336" : colors.border),
                    borderWidth: isSelected ? 2.5 : (isFav ? 2 : 1),
                    shadowColor: isSelected ? colors.primary : "transparent",
                  }]}
                  onPress={() => setSelectedId(p.id === selectedId ? null : p.id)}
                >
                  <Text style={[styles.dotText, { color: isSelected ? "#fff" : colors.foreground }]}>{p.name[0]}</Text>
                  {!p.isAvailable && (
                    <View style={[styles.unavailableDot, { backgroundColor: colors.mutedForeground }]} />
                  )}
                  {p.isAvailable && (
                    <View style={[styles.availableDot, { backgroundColor: "#4caf50" }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#4caf50" }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>متاحة</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.mutedForeground }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>غير متاحة</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { borderWidth: 2, borderColor: "#f44336", backgroundColor: "transparent" }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>مفضلة</Text>
            </View>
          </View>
        </View>

        {selected && (
          <View style={[styles.providerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardAvatar, { backgroundColor: selected.avatarColor || colors.primary }]}>
                <Text style={styles.cardAvatarText}>{selected.name[0]}</Text>
              </View>
              <View style={styles.cardInfo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{selected.name}</Text>
                  {selected.isVerified && <Feather name="check-circle" size={14} color={colors.primary} />}
                </View>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  {selected.type === "salon" ? "صالون" : "فريلانسر"} • {selected.city}
                </Text>
                <View style={{ flexDirection: "row", gap: 6, justifyContent: "flex-end", marginTop: 3 }}>
                  <Badge label={`${selected.rating} ★`} color="#ff9800" />
                  <Badge label={`${selected.distance} كم`} color={colors.primary} />
                  <Badge label={selected.isAvailable ? "متاحة" : "غير متاحة"} color={selected.isAvailable ? "#4caf50" : "#9e9e9e"} />
                </View>
              </View>
            </View>
            <Text style={[styles.cardBio, { color: colors.mutedForeground }]} numberOfLines={2}>{selected.bio}</Text>
            <TouchableOpacity
              style={[styles.viewBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/provider/${selected.id}`)}
            >
              <Text style={styles.viewBtnText}>عرض الملف</Text>
              <Feather name="arrow-left" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {!selected && (
          <View style={styles.nearbyList}>
            <Text style={[styles.nearbyTitle, { color: colors.foreground }]}>قائمة المزودات القريبات</Text>
            {approved
              .sort((a, b) => a.distance - b.distance)
              .map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.nearbyRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setSelectedId(p.id)}
                >
                  <View style={[styles.nearbyAvatar, { backgroundColor: p.avatarColor || colors.primary }]}>
                    <Text style={styles.nearbyAvatarText}>{p.name[0]}</Text>
                  </View>
                  <View style={styles.nearbyInfo}>
                    <Text style={[styles.nearbyName, { color: colors.foreground }]}>{p.name}</Text>
                    <Text style={[styles.nearbySub, { color: colors.mutedForeground }]}>{p.city} • {p.rating} ★</Text>
                  </View>
                  <View style={styles.nearbyRight}>
                    <Text style={[styles.nearbyDist, { color: colors.primary }]}>{p.distance} كم</Text>
                    <View style={[styles.nearbyStatus, { backgroundColor: p.isAvailable ? "#4caf50" : "#9e9e9e" }]} />
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "right" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 2 },
  mapWrapper: { alignItems: "center", paddingHorizontal: 16, paddingTop: 8 },
  map: { borderRadius: 20, borderWidth: 1, position: "relative", overflow: "hidden" },
  circle: { position: "absolute", borderWidth: 1, alignItems: "center", justifyContent: "flex-end" },
  circleLabel: { fontSize: 9, fontFamily: "Inter_400Regular", marginBottom: 4 },
  center: { position: "absolute", width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  youLabel: { position: "absolute", fontSize: 10, fontFamily: "Inter_700Bold" },
  providerDot: { position: "absolute", width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  dotText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  unavailableDot: { position: "absolute", bottom: 1, right: 1, width: 8, height: 8, borderRadius: 4 },
  availableDot: { position: "absolute", bottom: 1, right: 1, width: 8, height: 8, borderRadius: 4 },
  legendRow: { flexDirection: "row", gap: 16, marginTop: 10, justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  providerCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardHeader: { flexDirection: "row", gap: 12, alignItems: "center" },
  cardAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  cardAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  cardInfo: { flex: 1, alignItems: "flex-end" },
  cardName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  cardBio: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  viewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 10 },
  viewBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  nearbyList: { paddingHorizontal: 16, marginTop: 16, gap: 8 },
  nearbyTitle: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 6 },
  nearbyRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 12 },
  nearbyAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  nearbyAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  nearbyInfo: { flex: 1, alignItems: "flex-end" },
  nearbyName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  nearbySub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  nearbyRight: { alignItems: "flex-end", gap: 4 },
  nearbyDist: { fontSize: 14, fontFamily: "Inter_700Bold" },
  nearbyStatus: { width: 8, height: 8, borderRadius: 4 },
});
