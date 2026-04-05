import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { StarRating } from "@/components/ui/StarRating";

type FilterTab = "pending" | "approved" | "suspended" | "all";

export default function AdminProvidersScreen() {
  const insets = useSafeAreaInsets();
  const { providers, updateProvider } = useData();
  const [tab, setTab] = useState<FilterTab>("pending");
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const filtered = tab === "all" ? providers : providers.filter((p) => p.status === tab);

  function handleApprove(id: string, name: string) {
    Alert.alert("الموافقة على المزود", `هل تريد الموافقة على ${name}؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "موافقة",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          updateProvider(id, { status: "approved", isAvailable: true });
        },
      },
    ]);
  }

  function handleSuspend(id: string, name: string) {
    Alert.alert("تعليق الحساب", `هل تريد تعليق حساب ${name}؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "تعليق",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          updateProvider(id, { status: "suspended", isAvailable: false });
        },
      },
    ]);
  }

  function handleReactivate(id: string, name: string) {
    Alert.alert("إعادة تفعيل", `هل تريد إعادة تفعيل حساب ${name}؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "تفعيل", onPress: () => updateProvider(id, { status: "approved" }) },
    ]);
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "pending", label: `بانتظار (${providers.filter((p) => p.status === "pending").length})` },
    { key: "approved", label: "نشطون" },
    { key: "suspended", label: "موقوفون" },
    { key: "all", label: "الكل" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: "#0d0d1a" }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopPad + 10 }]}>
        <Text style={styles.title}>إدارة المزودين</Text>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + webBottomPad + 90 }]}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="users" size={40} color="#444" />
            <Text style={styles.emptyText}>لا توجد نتائج</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.provCard}>
            <View style={styles.provTop}>
              <View style={styles.provLeft}>
                <View style={[styles.statusDot, {
                  backgroundColor: item.status === "approved" ? "#4caf50" : item.status === "pending" ? "#ff9800" : "#f44336",
                }]} />
                <Text style={styles.statusLabel}>
                  {item.status === "approved" ? "نشط" : item.status === "pending" ? "بانتظار" : "موقوف"}
                </Text>
              </View>
              <View style={styles.provRight}>
                <View style={styles.provAvatarArea}>
                  <View style={styles.provAvatar}>
                    <Feather name="user" size={22} color="#c8a951" />
                  </View>
                  {item.isVerified && (
                    <View style={styles.verifiedDot}>
                      <Feather name="check" size={8} color="#fff" />
                    </View>
                  )}
                </View>
                <View style={styles.provInfo}>
                  <Text style={styles.provName}>{item.name}</Text>
                  <Text style={styles.provType}>{item.type === "salon" ? "صالون" : "فريلانسر"}</Text>
                  {item.rating > 0 && <StarRating rating={item.rating} size={12} />}
                </View>
              </View>
            </View>

            <View style={styles.provDetails}>
              <Detail icon="phone" value={item.phone || "—"} />
              <Detail icon="map-pin" value={item.location.address} />
              <Detail icon="briefcase" value={`${item.totalOrders} طلب | ${item.walletBalance} ر.س رصيد`} />
              <Detail icon="calendar" value={`انضم: ${item.joinedAt}`} />
              {!item.idVerified && (
                <View style={styles.idWarning}>
                  <Feather name="alert-triangle" size={14} color="#ff9800" />
                  <Text style={styles.idWarningText}>لم يتم توثيق الهوية</Text>
                </View>
              )}
            </View>

            <View style={styles.actions}>
              {item.status === "pending" && (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#f44336" + "20", borderColor: "#f44336" }]}
                    onPress={() => handleSuspend(item.id, item.name)}
                  >
                    <Text style={[styles.actionBtnText, { color: "#f44336" }]}>رفض</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#4caf50", borderColor: "#4caf50" }]}
                    onPress={() => handleApprove(item.id, item.name)}
                  >
                    <Text style={[styles.actionBtnText, { color: "#fff" }]}>موافقة</Text>
                  </TouchableOpacity>
                </>
              )}
              {item.status === "approved" && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#f44336" + "20", borderColor: "#f44336", flex: 1 }]}
                  onPress={() => handleSuspend(item.id, item.name)}
                >
                  <Feather name="pause-circle" size={16} color="#f44336" />
                  <Text style={[styles.actionBtnText, { color: "#f44336" }]}>تعليق الحساب</Text>
                </TouchableOpacity>
              )}
              {item.status === "suspended" && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#4caf50" + "20", borderColor: "#4caf50", flex: 1 }]}
                  onPress={() => handleReactivate(item.id, item.name)}
                >
                  <Feather name="play-circle" size={16} color="#4caf50" />
                  <Text style={[styles.actionBtnText, { color: "#4caf50" }]}>إعادة التفعيل</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

function Detail({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailValue}>{value}</Text>
      <Feather name={icon as any} size={14} color="#888" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  title: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "right" },
  tabBar: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#333" },
  tabBtnActive: { backgroundColor: "#c8a951", borderColor: "#c8a951" },
  tabText: { color: "#888", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: "#000" },
  list: { paddingHorizontal: 16, gap: 12 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 14 },
  emptyText: { color: "#666", fontSize: 16, fontFamily: "Inter_400Regular" },
  provCard: { backgroundColor: "#1a1a2e", borderRadius: 16, overflow: "hidden" },
  provTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16 },
  provLeft: { alignItems: "flex-start", gap: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular" },
  provRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  provAvatarArea: { position: "relative" },
  provAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#c8a951" + "20", alignItems: "center", justifyContent: "center" },
  verifiedDot: { position: "absolute", bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: "#4caf50", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#1a1a2e" },
  provInfo: { alignItems: "flex-end", gap: 3 },
  provName: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  provType: { color: "#888", fontSize: 13, fontFamily: "Inter_400Regular" },
  provDetails: { paddingHorizontal: 16, paddingBottom: 12, gap: 6, borderTopWidth: 1, borderTopColor: "#2a2a3e", paddingTop: 12 },
  detailRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 },
  detailValue: { color: "#aaa", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  idWarning: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "flex-end" },
  idWarningText: { color: "#ff9800", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", gap: 10, padding: 14, paddingTop: 0 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
  actionBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
