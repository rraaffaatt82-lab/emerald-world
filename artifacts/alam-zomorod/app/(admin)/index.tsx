import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { providers, requests, walletTransactions, notifications, walletTopupRequests, packages } = useData();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const pendingProviders = providers.filter((p) => p.status === "pending");
  const approvedProviders = providers.filter((p) => p.status === "approved");
  const totalRevenue = walletTransactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const activeRequests = requests.filter((r) => ["pending", "offers_received", "accepted", "in_progress"].includes(r.status));
  const completedRequests = requests.filter((r) => r.status === "completed");

  const stats = [
    { label: "إجمالي المزودين", value: providers.length, icon: "users", color: "#9c27b0", sub: `${pendingProviders.length} بانتظار الموافقة` },
    { label: "إجمالي الطلبات", value: requests.length, icon: "clipboard", color: "#2196f3", sub: `${activeRequests.length} نشط` },
    { label: "طلبات منجزة", value: completedRequests.length, icon: "check-circle", color: "#4caf50", sub: "إجمالي" },
    { label: "إيرادات العمولات", value: `${totalRevenue.toFixed(0)} د.أ`, icon: "trending-up", color: "#c8a951", sub: "مجموع العمولات" },
  ];

  const quickActions = [
    { label: "مراجعة المزودين", icon: "user-check", badge: pendingProviders.length, onPress: () => router.push("/(admin)/providers") },
    { label: "جميع الطلبات", icon: "list", badge: activeRequests.length, onPress: () => router.push("/(admin)/requests") },
    { label: "إعدادات النظام", icon: "settings", badge: 0, onPress: () => router.push("/(admin)/settings") },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: "#0d0d1a" }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + webTopPad + 10, paddingBottom: insets.bottom + webBottomPad + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>مرحباً، المدير</Text>
          <Text style={styles.headerTitle}>لوحة تحكم عالم زمرد</Text>
        </View>
        <View style={styles.adminBadge}>
          <Feather name="shield" size={18} color="#c8a951" />
          <Text style={styles.adminBadgeText}>أدمن</Text>
        </View>
      </View>

      {pendingProviders.length > 0 && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => router.push("/(admin)/providers")}
        >
          <Feather name="alert-circle" size={18} color="#fff" />
          <Text style={styles.alertText}>
            {pendingProviders.length} مزود خدمة بانتظار الموافقة
          </Text>
          <Feather name="chevron-left" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statCard, { borderLeftColor: s.color }]}>
            <View style={[styles.statIcon, { backgroundColor: s.color + "20" }]}>
              <Feather name={s.icon as any} size={22} color={s.color} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statSub}>{s.sub}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>الإجراءات السريعة</Text>
      <View style={styles.quickActions}>
        {quickActions.map((a) => (
          <TouchableOpacity key={a.label} style={styles.quickBtn} onPress={a.onPress}>
            <View style={styles.quickBtnLeft}>
              {a.badge > 0 && (
                <View style={styles.quickBadge}>
                  <Text style={styles.quickBadgeText}>{a.badge}</Text>
                </View>
              )}
              <Feather name="chevron-left" size={16} color="#888" />
            </View>
            <View style={styles.quickBtnRight}>
              <Text style={styles.quickBtnLabel}>{a.label}</Text>
              <View style={[styles.quickIcon, { backgroundColor: "#c8a951" + "20" }]}>
                <Feather name={a.icon as any} size={20} color="#c8a951" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>آخر الطلبات</Text>
      {requests.slice(0, 5).map((r) => (
        <View key={r.id} style={styles.recentRow}>
          <View style={[styles.statusDot, {
            backgroundColor:
              r.status === "completed" ? "#4caf50" :
              r.status === "cancelled" ? "#f44336" :
              r.status === "in_progress" ? "#c8a951" : "#2196f3",
          }]} />
          <View style={styles.recentInfo}>
            <Text style={styles.recentService}>{r.serviceName}</Text>
            <Text style={styles.recentCustomer}>{r.customerName}</Text>
          </View>
          <Text style={[styles.recentPrice, { color: "#c8a951" }]}>
            {r.price} د.أ
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  greeting: { color: "#888", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  headerTitle: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "right" },
  adminBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#c8a951" + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: "#c8a951" + "40" },
  adminBadgeText: { color: "#c8a951", fontSize: 13, fontFamily: "Inter_700Bold" },
  alertBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#f44336", padding: 14, borderRadius: 14, gap: 10 },
  alertText: { flex: 1, color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "right" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: { width: "47%", backgroundColor: "#1a1a2e", borderRadius: 16, padding: 16, gap: 6, borderLeftWidth: 3 },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  statValue: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "right" },
  statLabel: { color: "#ccc", fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  statSub: { color: "#888", fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  sectionTitle: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "right" },
  quickActions: { gap: 10 },
  quickBtn: { backgroundColor: "#1a1a2e", borderRadius: 14, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  quickBtnLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  quickBadge: { backgroundColor: "#f44336", width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  quickBadgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  quickBtnRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  quickBtnLabel: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  quickIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  recentRow: { backgroundColor: "#1a1a2e", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  recentInfo: { flex: 1, alignItems: "flex-end" },
  recentService: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  recentCustomer: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular" },
  recentPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
