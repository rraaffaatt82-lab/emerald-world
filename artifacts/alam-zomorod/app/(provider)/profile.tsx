import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData, SERVICES } from "@/context/DataContext";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";

type TabKey = "overview" | "services" | "wallet" | "notifications";

export default function ProviderProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { providers, updateProvider, getRequestsByProvider, walletTransactions, requestWalletTopup, notifications, markNotificationRead, markAllRead } = useData();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;
  const [tab, setTab] = useState<TabKey>("overview");
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupNote, setTopupNote] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  const provider = providers.find((p) => p.id === user?.id);
  const myJobs = getRequestsByProvider(user?.id || "");
  const completedCount = myJobs.filter((r) => r.status === "completed").length;
  const txs = walletTransactions.filter((t) => t.userId === user?.id);
  const myNotifications = notifications.filter((n) => n.userId === user?.id);
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const providerServices = SERVICES.filter((s) => provider?.services.includes(s.id));
  const filteredServices = serviceFilter
    ? providerServices.filter((s) => s.name.includes(serviceFilter) || s.description.includes(serviceFilter))
    : providerServices;

  function handleToggleAvailable() {
    if (!provider) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProvider(provider.id, { isAvailable: !provider.isAvailable });
  }

  function handleTopupRequest() {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("خطأ", "يرجى إدخال مبلغ صحيح");
      return;
    }
    requestWalletTopup(user!.id, user!.name, amount, topupNote || undefined);
    setShowTopupModal(false);
    setTopupAmount("");
    setTopupNote("");
    Alert.alert("تم!", "تم إرسال طلب شحن الرصيد للإدارة. ستُعلَم عند الموافقة.");
  }

  function handleLogout() {
    Alert.alert("تسجيل الخروج", "هل أنت متأكد؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "خروج", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
    ]);
  }

  function handleToggleService(serviceId: string) {
    if (!provider) return;
    const hasService = provider.services.includes(serviceId);
    const updated = hasService
      ? provider.services.filter((s) => s !== serviceId)
      : [...provider.services, serviceId];
    updateProvider(provider.id, { services: updated });
  }

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "overview", label: "الملف", icon: "user" },
    { key: "services", label: "الخدمات", icon: "list" },
    { key: "wallet", label: "المحفظة", icon: "credit-card" },
    { key: "notifications", label: unreadCount > 0 ? `إشعارات (${unreadCount})` : "إشعارات", icon: "bell" },
  ];

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
        <View style={[styles.avatar, { backgroundColor: provider?.avatarColor || "#fff" }]}>
          <Text style={[styles.avatarText, { color: provider?.avatarColor ? "#fff" : colors.primary }]}>
            {user?.name?.[0] || "م"}
          </Text>
        </View>
        <Text style={styles.providerName}>{user?.name}</Text>
        <View style={styles.badges}>
          <Badge
            label={provider?.type === "salon" ? "صالون" : "فريلانسر"}
            variant="outline"
            style={{ borderColor: "rgba(255,255,255,0.5)" }}
          />
          {provider?.isVerified && (
            <Badge label="موثق ✓" variant="outline" style={{ borderColor: "rgba(255,255,255,0.5)" }} />
          )}
          <Badge
            label={provider?.status === "approved" ? "نشط" : provider?.status === "pending" ? "قيد المراجعة" : "موقوف"}
            variant={provider?.status === "approved" ? "success" : provider?.status === "pending" ? "warning" : "error"}
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

      {provider?.status === "suspended" && provider.suspensionReason && (
        <View style={[styles.suspensionBanner, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}>
          <Feather name="alert-circle" size={18} color={colors.destructive} />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={[styles.suspensionTitle, { color: colors.destructive }]}>تم تعليق حسابك</Text>
            <Text style={[styles.suspensionReason, { color: colors.mutedForeground }]}>السبب: {provider.suspensionReason}</Text>
          </View>
        </View>
      )}

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab(t.key)}
          >
            <Feather name={t.icon as any} size={14} color={tab === t.key ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabBtnText, { color: tab === t.key ? colors.primary : colors.mutedForeground, fontFamily: tab === t.key ? "Inter_700Bold" : "Inter_400Regular" }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "overview" && (
        <>
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
                  {provider?.isAvailable ? "أنت متاح لاستقبال الطلبات" : "أنت غير متاح حالياً"}
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

          <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.destructive }]} onPress={handleLogout}>
            <Feather name="log-out" size={18} color={colors.destructive} />
            <Text style={[styles.logoutText, { color: colors.destructive }]}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </>
      )}

      {tab === "services" && (
        <>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={serviceFilter}
              onChangeText={setServiceFilter}
              placeholder="ابحث في الخدمات..."
              placeholderTextColor={colors.mutedForeground}
              textAlign="right"
            />
          </View>
          <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
            اختاري الخدمات التي تقدمينها — يمكن تفعيل/تعطيل كل خدمة بشكل مستقل
          </Text>
          {filteredServices.map((s) => {
            const ps = provider?.providerServices?.find((ps) => ps.serviceId === s.id);
            const isActive = provider?.services.includes(s.id);
            return (
              <View key={s.id} style={[styles.serviceRow, { backgroundColor: colors.card, borderColor: isActive ? colors.primary + "40" : colors.border }]}>
                <View style={styles.serviceRight}>
                  <Switch
                    value={!!isActive}
                    onValueChange={() => handleToggleService(s.id)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  <View style={styles.servicePriceArea}>
                    <Text style={[styles.serviceCustomPrice, { color: colors.primary }]}>
                      {ps ? `${ps.customPrice} ر.س` : `${s.basePrice} ر.س`}
                    </Text>
                    <Text style={[styles.serviceDuration, { color: colors.mutedForeground }]}>{s.duration} د</Text>
                  </View>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[styles.serviceName, { color: colors.foreground }]}>{s.name}</Text>
                  <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{s.description}</Text>
                </View>
              </View>
            );
          })}
          {filteredServices.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="search" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد نتائج</Text>
            </View>
          )}
        </>
      )}

      {tab === "wallet" && (
        <>
          <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.balanceLabel}>رصيدك الحالي</Text>
            <Text style={styles.balanceValue}>{(provider?.walletBalance || 0).toFixed(2)} ر.س</Text>
            <TouchableOpacity
              style={styles.topupBtn}
              onPress={() => setShowTopupModal(true)}
            >
              <Feather name="plus-circle" size={16} color={colors.primary} />
              <Text style={[styles.topupBtnText, { color: colors.primary }]}>طلب شحن رصيد</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
            طلبات الشحن تحتاج موافقة الإدارة قبل الإضافة
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>كشف الحساب</Text>
          {txs.map((tx) => (
            <View key={tx.id} style={[styles.txRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.txIconCircle, { backgroundColor: (tx.type === "credit" ? colors.success : colors.destructive) + "20" }]}>
                <Feather
                  name={tx.type === "credit" ? "arrow-down-left" : "arrow-up-right"}
                  size={16}
                  color={tx.type === "credit" ? colors.success : colors.destructive}
                />
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={[styles.txDesc, { color: colors.foreground }]}>{tx.description}</Text>
                <Text style={[styles.txDate, { color: colors.mutedForeground }]}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === "credit" ? colors.success : colors.destructive }]}>
                {tx.type === "credit" ? "+" : "-"}{tx.amount.toFixed(2)} ر.س
              </Text>
            </View>
          ))}
          {txs.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="credit-card" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد معاملات بعد</Text>
            </View>
          )}
        </>
      )}

      {tab === "notifications" && (
        <>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.markAllBtn, { borderColor: colors.border }]}
              onPress={() => user && markAllRead(user.id)}
            >
              <Feather name="check-square" size={14} color={colors.primary} />
              <Text style={[styles.markAllText, { color: colors.primary }]}>تحديد الكل كمقروء</Text>
            </TouchableOpacity>
          )}
          {myNotifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.notifCard, {
                backgroundColor: n.isRead ? colors.card : colors.primary + "08",
                borderColor: n.isRead ? colors.border : colors.primary + "40",
              }]}
              onPress={() => markNotificationRead(n.id)}
            >
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, { color: colors.foreground }]}>{n.title}</Text>
                <Text style={[styles.notifBody, { color: colors.mutedForeground }]}>{n.body}</Text>
                <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                  {new Date(n.createdAt).toLocaleDateString("ar-SA")}
                </Text>
              </View>
              {!n.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          ))}
          {myNotifications.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="bell-off" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد إشعارات</Text>
            </View>
          )}
        </>
      )}

      <Modal visible={showTopupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTopupModal(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>طلب شحن رصيد</Text>
            </View>
            <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
              سيتم مراجعة طلبك من قبل الإدارة وإشعارك فور الموافقة
            </Text>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>المبلغ المطلوب (ر.س) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              value={topupAmount}
              onChangeText={setTopupAmount}
              keyboardType="numeric"
              placeholder="مثال: 500"
              placeholderTextColor={colors.mutedForeground}
              textAlign="right"
            />
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ملاحظة (اختياري)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              value={topupNote}
              onChangeText={setTopupNote}
              placeholder="تفاصيل إضافية..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={2}
              textAlign="right"
            />
            <TouchableOpacity style={[styles.topupSubmitBtn, { backgroundColor: colors.primary }]} onPress={handleTopupRequest}>
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.topupSubmitText}>إرسال الطلب</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  content: { paddingHorizontal: 20, gap: 14 },
  pageTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "right" },
  heroCard: { borderRadius: 20, padding: 24, alignItems: "center", gap: 10 },
  avatar: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold" },
  providerName: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  badges: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 14, width: "100%", justifyContent: "space-around", marginTop: 4 },
  stat: { alignItems: "center", gap: 4 },
  statVal: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  statLab: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular" },
  statDiv: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  suspensionBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  suspensionTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  suspensionReason: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, marginHorizontal: -20, paddingHorizontal: 10 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 12, paddingHorizontal: 4 },
  tabBtnText: { fontSize: 11 },
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
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 10 },
  logoutText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  searchBar: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  sectionNote: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right" },
  serviceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 14, borderWidth: 1, gap: 10 },
  serviceRight: { alignItems: "flex-start", gap: 4 },
  servicePriceArea: { alignItems: "flex-start", gap: 2 },
  serviceCustomPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  serviceDuration: { fontSize: 11, fontFamily: "Inter_400Regular" },
  serviceName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  serviceDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  balanceCard: { borderRadius: 20, padding: 24, alignItems: "center", gap: 8 },
  balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  balanceValue: { color: "#fff", fontSize: 36, fontFamily: "Inter_700Bold" },
  topupBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  topupBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  txIconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "right" },
  txDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  txAmount: { fontSize: 15, fontFamily: "Inter_700Bold", minWidth: 80, textAlign: "left" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  notifCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1 },
  notifContent: { flex: 1, alignItems: "flex-end", gap: 4 },
  notifTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  notifBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, justifyContent: "center" },
  markAllText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  input: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  topupSubmitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 14, gap: 10, marginTop: 4 },
  topupSubmitText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
