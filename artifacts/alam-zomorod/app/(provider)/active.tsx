import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Badge } from "@/components/ui/Badge";
import { toHijriShort } from "@/utils/date";

type FilterTab = "all" | "accepted" | "in_progress" | "completed";

export default function ProviderActiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getRequestsByProvider, startService, completeService } = useData();
  const [filter, setFilter] = useState<FilterTab>("all");
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const allJobs = getRequestsByProvider(user?.id || "").filter((r) =>
    ["accepted", "in_progress", "completed"].includes(r.status)
  );

  const filteredJobs =
    filter === "all"
      ? allJobs
      : allJobs.filter((r) => r.status === filter);

  const activeCount = allJobs.filter((r) => ["accepted", "in_progress"].includes(r.status)).length;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "accepted", label: "مقبول" },
    { key: "in_progress", label: "قيد التنفيذ" },
    { key: "completed", label: "مكتمل" },
  ];

  function handleCall(phone?: string) {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  }

  function handleStart(id: string) {
    Alert.alert("بدء الخدمة", "هل أنت في موقع العميل وجاهز للبدء؟", [
      { text: "لا", style: "cancel" },
      {
        text: "نعم، ابدأ",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          startService(id);
        },
      },
    ]);
  }

  function handleComplete(id: string) {
    Alert.alert("إنهاء الخدمة", "هل انتهيت من تقديم الخدمة للعميل؟", [
      { text: "لا", style: "cancel" },
      {
        text: "نعم، انتهيت",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          completeService(id);
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopPad + 10, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>طلباتي</Text>
        <Badge label={`${activeCount} نشط`} variant={activeCount > 0 ? "success" : "default"} />
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.muted }]}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, filter === t.key && { backgroundColor: colors.card }]}
            onPress={() => setFilter(t.key)}
          >
            <Text style={[
              styles.tabText,
              { color: filter === t.key ? colors.primary : colors.mutedForeground,
                fontFamily: filter === t.key ? "Inter_700Bold" : "Inter_400Regular" },
            ]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredJobs}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + webBottomPad + 90 }]}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="briefcase" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد طلبات</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              قدّم عروضك على طلبات العملاء من تبويب الطلبات
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isAccepted = item.status === "accepted";
          const isInProgress = item.status === "in_progress";
          const isCompleted = item.status === "completed";

          return (
            <View style={[styles.jobCard, {
              backgroundColor: colors.card,
              borderColor: isInProgress ? colors.accent : isAccepted ? colors.primary : colors.border,
              borderWidth: isInProgress || isAccepted ? 1.5 : 1,
            }]}>
              {isInProgress && (
                <View style={[styles.inProgressBanner, { backgroundColor: colors.accent }]}>
                  <Feather name="activity" size={14} color="#fff" />
                  <Text style={styles.inProgressText}>جارٍ التنفيذ الآن</Text>
                </View>
              )}

              <View style={styles.jobTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.jobService, { color: colors.foreground }]}>{item.serviceName}</Text>
                  <Text style={[styles.jobCat, { color: colors.mutedForeground }]}>{item.categoryName}</Text>
                  <View style={styles.metaRow}>
                    <Feather name="calendar" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {" "}{toHijriShort(item.scheduledAt)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.jobPrice, { color: colors.primary }]}>{item.price} ر.س</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.clientSection}>
                <View style={styles.clientRow}>
                  <View style={[styles.clientAvatar, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name="user" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={[styles.clientName, { color: colors.foreground }]}>
                      {item.contactRevealed ? item.customerName : "العميل (مخفي)"}
                    </Text>
                    <View style={styles.addrRow}>
                      <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.clientAddr, { color: colors.mutedForeground }]}> {item.address}</Text>
                    </View>
                  </View>
                  {item.contactRevealed && item.customerPhone && (
                    <TouchableOpacity
                      style={[styles.callBtn, { backgroundColor: colors.success }]}
                      onPress={() => handleCall(item.customerPhone)}
                    >
                      <Feather name="phone" size={18} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {isAccepted && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleStart(item.id)}
                >
                  <Feather name="play" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>بدء الخدمة</Text>
                </TouchableOpacity>
              )}
              {isInProgress && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.success }]}
                  onPress={() => handleComplete(item.id)}
                >
                  <Feather name="check-circle" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>إنهاء الخدمة</Text>
                </TouchableOpacity>
              )}
              {isCompleted && (
                <View style={[styles.completedBadge, { backgroundColor: colors.success + "15" }]}>
                  <Feather name="check-circle" size={14} color={colors.success} />
                  <Text style={[styles.completedText, { color: colors.success }]}>
                    مكتمل — {item.rating ? `تقييم العميل: ${item.rating}/5` : "بانتظار التقييم"}
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  tabBar: {
    flexDirection: "row",
    margin: 12,
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  tabText: { fontSize: 12 },
  list: { paddingHorizontal: 12, paddingTop: 4, gap: 12 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 14 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40, lineHeight: 22 },
  jobCard: { borderRadius: 16, overflow: "hidden" },
  inProgressBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 8, gap: 6 },
  inProgressText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  jobTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16, paddingBottom: 12 },
  jobService: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "right" },
  jobCat: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  jobPrice: { fontSize: 18, fontFamily: "Inter_700Bold" },
  divider: { height: 1, marginHorizontal: 16 },
  clientSection: { padding: 16 },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  clientAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  clientInfo: { flex: 1, alignItems: "flex-end" },
  clientName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  addrRow: { flexDirection: "row", alignItems: "center" },
  clientAddr: { fontSize: 12, fontFamily: "Inter_400Regular" },
  callBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", margin: 16, marginTop: 0, padding: 14, borderRadius: 12, gap: 8 },
  actionBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  completedBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", margin: 16, marginTop: 0, padding: 12, borderRadius: 12, gap: 8 },
  completedText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
