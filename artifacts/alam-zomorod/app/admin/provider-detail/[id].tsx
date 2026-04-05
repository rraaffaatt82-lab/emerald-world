import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData, SERVICES } from "@/context/DataContext";
import { StarRating } from "@/components/ui/StarRating";

type TabKey = "info" | "services" | "wallet" | "attachments";

export default function AdminProviderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    providers, walletTransactions, getRequestsByProvider,
    updateProvider, suspendProvider, approveWalletTopup,
  } = useData();
  const [tab, setTab] = useState<TabKey>("info");
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const provider = providers.find((p) => p.id === id);
  if (!provider) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={[styles.backBtn, { paddingTop: insets.top + webTopPad + 10 }]} onPress={() => router.back()}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.notFound}>المزود غير موجود</Text>
        </View>
      </View>
    );
  }

  const providerServices = SERVICES.filter((s) => provider.services.includes(s.id));
  const txs = walletTransactions.filter((t) => t.userId === provider.id);
  const jobs = getRequestsByProvider(provider.id);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "info", label: "البيانات", icon: "user" },
    { key: "services", label: "الخدمات", icon: "list" },
    { key: "wallet", label: "الحساب", icon: "credit-card" },
    { key: "attachments", label: "المرفقات", icon: "paperclip" },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopPad + 6 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل المزود</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: (provider.avatarColor || "#c8a951") + "30" }]}>
          <Text style={[styles.avatarText, { color: provider.avatarColor || "#c8a951" }]}>{provider.name[0]}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.provName}>{provider.name}</Text>
          <Text style={styles.provMeta}>
            {provider.type === "salon" ? "🏪 صالون" : "👤 فريلانسر"} · {provider.city || "—"}
          </Text>
          <View style={styles.statsRow}>
            <Stat label="طلب" value={provider.totalOrders} />
            <Stat label="رصيد" value={`${provider.walletBalance} ر.س`} />
            <Stat label="تقييم" value={provider.rating} />
          </View>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, {
          backgroundColor: provider.status === "approved" ? "#4caf50" + "20" :
            provider.status === "pending" ? "#ff9800" + "20" : "#f44336" + "20",
        }]}>
          <View style={[styles.statusDot, {
            backgroundColor: provider.status === "approved" ? "#4caf50" :
              provider.status === "pending" ? "#ff9800" : "#f44336",
          }]} />
          <Text style={[styles.statusText, {
            color: provider.status === "approved" ? "#4caf50" :
              provider.status === "pending" ? "#ff9800" : "#f44336",
          }]}>
            {provider.status === "approved" ? "نشط" : provider.status === "pending" ? "بانتظار الموافقة" : "موقوف"}
          </Text>
        </View>
        {provider.status !== "approved" ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#4caf50" }]}
            onPress={() => setShowActivateConfirm(true)}
          >
            <Feather name="check" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>تفعيل</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#f44336" + "20", borderWidth: 1, borderColor: "#f44336" }]}
            onPress={() => { setSuspendReason(""); setShowSuspendModal(true); }}
          >
            <Feather name="pause-circle" size={14} color="#f44336" />
            <Text style={[styles.actionBtnText, { color: "#f44336" }]}>تعليق</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Feather name={t.icon as any} size={14} color={tab === t.key ? "#000" : "#888"} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + webBottomPad + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "info" && (
          <View style={styles.section}>
            <InfoRow icon="phone" label="رقم الهاتف" value={provider.phone || "—"} />
            <InfoRow icon="map-pin" label="الموقع" value={provider.location.address} />
            <InfoRow icon="calendar" label="تاريخ الانضمام" value={provider.joinedAt} />
            <InfoRow icon="percent" label="نسبة العمولة" value={`${provider.commission}%`} />
            <InfoRow icon="gift" label="خدمات مجانية متبقية" value={String(provider.freeServicesLeft)} />
            <InfoRow icon="shield" label="توثيق الهوية" value={provider.idVerified ? "موثق ✓" : "غير موثق ✗"} />
            {provider.status === "suspended" && provider.suspensionReason && (
              <View style={styles.suspensionCard}>
                <Feather name="alert-circle" size={16} color="#f44336" />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.suspensionLabel}>سبب التعليق</Text>
                  <Text style={styles.suspensionReason}>{provider.suspensionReason}</Text>
                </View>
              </View>
            )}
            <View style={styles.bioCard}>
              <Text style={styles.bioLabel}>نبذة عن المزود</Text>
              <Text style={styles.bioText}>{provider.bio}</Text>
            </View>
            <Text style={styles.subTitle}>آخر الطلبات</Text>
            {jobs.slice(0, 4).map((job) => (
              <View key={job.id} style={styles.jobRow}>
                <Text style={styles.jobStatus}>
                  {job.status === "completed" ? "✓" : job.status === "cancelled" ? "✗" : "◷"}
                </Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.jobService}>{job.serviceName}</Text>
                  <Text style={styles.jobMeta}>{job.price || "—"} ر.س · {job.scheduledAt.split("T")[0]}</Text>
                </View>
              </View>
            ))}
            {jobs.length === 0 && <Text style={styles.emptyText}>لا توجد طلبات بعد</Text>}
          </View>
        )}

        {tab === "services" && (
          <View style={styles.section}>
            {providerServices.map((s) => {
              const ps = provider.providerServices?.find((ps) => ps.serviceId === s.id);
              return (
                <View key={s.id} style={styles.serviceRow}>
                  <View style={styles.serviceRight}>
                    <View style={styles.servicePriceArea}>
                      <Text style={styles.serviceCustomPrice}>
                        {ps ? `${ps.customPrice} ر.س` : `${s.basePrice} ر.س`}
                      </Text>
                      {ps && ps.customPrice !== s.basePrice && (
                        <Text style={styles.serviceBasePrice}>{s.basePrice} ر.س</Text>
                      )}
                    </View>
                    <Text style={styles.serviceDuration}>{s.duration} د</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.serviceName}>{s.name}</Text>
                    <Text style={styles.serviceDesc}>{s.description}</Text>
                  </View>
                </View>
              );
            })}
            {providerServices.length === 0 && <Text style={styles.emptyText}>لا توجد خدمات مضافة</Text>}
          </View>
        )}

        {tab === "wallet" && (
          <View style={styles.section}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>الرصيد الحالي</Text>
              <Text style={styles.balanceValue}>{provider.walletBalance.toFixed(2)} ر.س</Text>
            </View>
            <Text style={styles.subTitle}>كشف الحساب</Text>
            {txs.map((tx) => (
              <View key={tx.id} style={styles.txRow}>
                <Text style={[styles.txAmount, { color: tx.type === "credit" ? "#4caf50" : "#f44336" }]}>
                  {tx.type === "credit" ? "+" : "-"}{tx.amount.toFixed(2)} ر.س
                </Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.txDesc}>{tx.description}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
              </View>
            ))}
            {txs.length === 0 && <Text style={styles.emptyText}>لا توجد معاملات</Text>}
          </View>
        )}

        {tab === "attachments" && (
          <View style={styles.section}>
            {(provider.attachments || []).map((att, i) => (
              <View key={i} style={styles.attRow}>
                <Text style={styles.attDate}>{att.uploadedAt}</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.attName}>{att.name}</Text>
                  <Text style={styles.attType}>{att.type}</Text>
                </View>
                <Feather name="paperclip" size={16} color="#c8a951" />
              </View>
            ))}
            {(!provider.attachments || provider.attachments.length === 0) && (
              <View style={styles.emptyState}>
                <Feather name="folder" size={40} color="#444" />
                <Text style={styles.emptyText}>لا توجد مرفقات</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={showActivateConfirm} transparent animationType="fade" onRequestClose={() => setShowActivateConfirm(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Feather name="check-circle" size={32} color="#4caf50" style={{ alignSelf: "center" }} />
            <Text style={styles.confirmTitle}>تفعيل الحساب</Text>
            <Text style={styles.confirmMsg}>تفعيل حساب {provider.name}؟ سيتمكن من استقبال الطلبات فوراً.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowActivateConfirm(false)}>
                <Text style={styles.confirmCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmOk, { backgroundColor: "#4caf50" }]}
                onPress={() => { updateProvider(provider.id, { status: "approved", isAvailable: true, suspensionReason: undefined }); setShowActivateConfirm(false); }}
              >
                <Text style={styles.confirmOkText}>تفعيل</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSuspendModal} transparent animationType="slide" onRequestClose={() => setShowSuspendModal(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>تعليق الحساب</Text>
            <Text style={styles.confirmMsg}>يرجى إدخال سبب تعليق حساب {provider.name}</Text>
            <TextInput
              style={styles.suspendInput}
              value={suspendReason}
              onChangeText={setSuspendReason}
              placeholder="سبب التعليق..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={2}
              textAlign="right"
            />
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowSuspendModal(false)}>
                <Text style={styles.confirmCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmOk, { backgroundColor: "#f44336" }]}
                onPress={() => {
                  suspendProvider(provider.id, suspendReason.trim() || "تعليق من الإدارة");
                  setShowSuspendModal(false);
                }}
              >
                <Text style={styles.confirmOkText}>تعليق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value}</Text>
      <View style={styles.infoLabel}>
        <Text style={styles.infoLabelText}>{label}</Text>
        <Feather name={icon as any} size={14} color="#c8a951" />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d1a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  backBtn: { padding: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { color: "#fff", fontSize: 16 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingBottom: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 26, fontFamily: "Inter_700Bold" },
  profileInfo: { flex: 1, alignItems: "flex-end", gap: 4 },
  provName: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  provMeta: { color: "#888", fontSize: 13, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 16 },
  stat: { alignItems: "center", gap: 2 },
  statValue: { color: "#c8a951", fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { color: "#888", fontSize: 11, fontFamily: "Inter_400Regular" },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  actionBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  tabBar: { flexDirection: "row", paddingHorizontal: 16, gap: 6, marginBottom: 2 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#333" },
  tabBtnActive: { backgroundColor: "#c8a951", borderColor: "#c8a951" },
  tabText: { color: "#888", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: "#000" },
  content: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  section: { gap: 10 },
  subTitle: { color: "#c8a951", fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 10 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1a1a2e", padding: 14, borderRadius: 12 },
  infoLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabelText: { color: "#888", fontSize: 13, fontFamily: "Inter_400Regular" },
  infoValue: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1 },
  suspensionCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#f44336" + "15", padding: 14, borderRadius: 12 },
  suspensionLabel: { color: "#f44336", fontSize: 12, fontFamily: "Inter_700Bold" },
  suspensionReason: { color: "#aaa", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  bioCard: { backgroundColor: "#1a1a2e", padding: 14, borderRadius: 12, gap: 8 },
  bioLabel: { color: "#888", fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "right" },
  bioText: { color: "#aaa", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 22 },
  jobRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#1a1a2e", padding: 12, borderRadius: 10 },
  jobStatus: { fontSize: 16, color: "#c8a951" },
  jobService: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  jobMeta: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular" },
  serviceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1a1a2e", padding: 14, borderRadius: 12 },
  serviceRight: { alignItems: "flex-start", gap: 4 },
  servicePriceArea: { flexDirection: "row", alignItems: "center", gap: 8 },
  serviceCustomPrice: { color: "#c8a951", fontSize: 16, fontFamily: "Inter_700Bold" },
  serviceBasePrice: { color: "#666", fontSize: 12, fontFamily: "Inter_400Regular", textDecorationLine: "line-through" },
  serviceDuration: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular" },
  serviceName: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  serviceDesc: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular" },
  balanceCard: { backgroundColor: "#c8a951" + "20", borderRadius: 16, padding: 20, alignItems: "center", gap: 6 },
  balanceLabel: { color: "#c8a951", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  balanceValue: { color: "#fff", fontSize: 32, fontFamily: "Inter_700Bold" },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#1a1a2e", padding: 14, borderRadius: 12 },
  txAmount: { fontSize: 16, fontFamily: "Inter_700Bold", minWidth: 90, textAlign: "left" },
  txDesc: { color: "#fff", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  txDate: { color: "#888", fontSize: 11, fontFamily: "Inter_400Regular" },
  attRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#1a1a2e", padding: 14, borderRadius: 12 },
  attDate: { color: "#888", fontSize: 11, fontFamily: "Inter_400Regular" },
  attName: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  attType: { color: "#c8a951", fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { color: "#666", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 },
  confirmBox: { backgroundColor: "#1a1a2e", borderRadius: 20, padding: 24, gap: 14 },
  confirmTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  confirmMsg: { color: "#888", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  confirmActions: { flexDirection: "row", gap: 12 },
  confirmCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#444", alignItems: "center" },
  confirmCancelText: { color: "#888", fontSize: 14, fontFamily: "Inter_700Bold" },
  confirmOk: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  confirmOkText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  suspendInput: { backgroundColor: "#0d0d1a", color: "#fff", borderRadius: 12, padding: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 60, textAlignVertical: "top" },
});
