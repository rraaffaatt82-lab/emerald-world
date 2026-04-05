import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";

export default function ProviderProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { providers, updateProvider, getRequestsByProvider } = useData();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const provider = providers.find((p) => p.id === user?.id);
  const myJobs = getRequestsByProvider(user?.id || "");
  const completedCount = myJobs.filter((r) => r.status === "completed").length;

  function handleToggleAvailable() {
    if (!provider) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProvider(provider.id, { isAvailable: !provider.isAvailable });
  }

  function handleLogout() {
    Alert.alert("تسجيل الخروج", "هل أنت متأكد؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + webTopPad + 10, paddingBottom: insets.bottom + webBottomPad + 90 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>ملف مزود الخدمة</Text>

      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatar}>
          <Feather name="user" size={36} color={colors.primary} />
        </View>
        <Text style={styles.providerName}>{user?.name}</Text>
        <View style={styles.badges}>
          <Badge
            label={provider?.type === "salon" ? "صالون" : "فريلانسر"}
            variant="outline"
            style={{ borderColor: "rgba(255,255,255,0.5)" }}
          />
          {provider?.isVerified && (
            <Badge label="موثق" variant="outline" style={{ borderColor: "rgba(255,255,255,0.5)" }} />
          )}
          <Badge
            label={
              provider?.status === "approved" ? "نشط" :
              provider?.status === "pending" ? "قيد المراجعة" : "موقوف"
            }
            variant={
              provider?.status === "approved" ? "success" :
              provider?.status === "pending" ? "warning" : "error"
            }
          />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <StarRating rating={provider?.rating || 0} size={14} />
            <Text style={styles.statVal}>{provider?.rating || 0}</Text>
            <Text style={styles.statLab}>{provider?.reviewsCount || 0} تقييم</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{completedCount}</Text>
            <Text style={styles.statLab}>منجز</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{provider?.walletBalance || 0}</Text>
            <Text style={styles.statLab}>ر.س رصيد</Text>
          </View>
        </View>
      </View>

      <View style={[styles.availabilityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.availabilityRow}>
          <Switch
            value={provider?.isAvailable}
            onValueChange={handleToggleAvailable}
            trackColor={{ false: colors.border, true: colors.success }}
            thumbColor="#fff"
          />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={[styles.availLabel, { color: colors.foreground }]}>حالة التوفر</Text>
            <Text style={[styles.availDesc, { color: colors.mutedForeground }]}>
              {provider?.isAvailable
                ? "أنت متاح لاستقبال الطلبات"
                : "أنت غير متاح حالياً"}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.infoTitle, { color: colors.foreground }]}>معلومات الحساب</Text>
        <InfoRow icon="phone" label="رقم الهاتف" value={provider?.phone || user?.phone || "—"} colors={colors} />
        <InfoRow icon="map-pin" label="الموقع" value={provider?.location.address || "—"} colors={colors} />
        <InfoRow icon="calendar" label="تاريخ الانضمام" value={provider?.joinedAt || "—"} colors={colors} />
        <InfoRow icon="percent" label="نسبة العمولة" value={`${provider?.commission || 15}%`} colors={colors} />
        <InfoRow icon="gift" label="خدمات مجانية متبقية" value={String(provider?.freeServicesLeft || 0)} colors={colors} />
      </View>

      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { icon: "edit-2", label: "تعديل الملف الشخصي" },
          { icon: "image", label: "معرض الأعمال" },
          { icon: "list", label: "إدارة الخدمات" },
          { icon: "bell", label: "إعدادات الإشعارات" },
          { icon: "help-circle", label: "المساعدة والدعم" },
        ].map((item, i, arr) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          >
            <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
            <Feather name={item.icon as any} size={20} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.destructive }]} onPress={handleLogout}>
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, colors }: any) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      <View style={styles.infoLabel}>
        <Text style={[styles.infoLabelText, { color: colors.mutedForeground }]}>{label}</Text>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  pageTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "right" },
  heroCard: { borderRadius: 20, padding: 24, alignItems: "center", gap: 10 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  providerName: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  badges: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 14, width: "100%", justifyContent: "space-around", marginTop: 4 },
  stat: { alignItems: "center", gap: 4 },
  statVal: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  statLab: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular" },
  statDiv: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  availabilityCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  availabilityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  availLabel: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right" },
  availDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  infoCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 4 },
  infoTitle: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  infoLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabelText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1, marginStart: 12 },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", textAlign: "right" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 10 },
  logoutText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
