import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData, SERVICES } from "@/context/DataContext";
import { StarRating } from "@/components/ui/StarRating";

type FilterTab = "pending" | "approved" | "suspended" | "all";
type FilterType = "all" | "salon" | "freelancer";

export default function AdminProvidersScreen() {
  const insets = useSafeAreaInsets();
  const { providers, updateProvider, suspendProvider, walletTopupRequests, approveWalletTopup, rejectWalletTopup } = useData();
  const [tab, setTab] = useState<FilterTab>("pending");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [suspendModal, setSuspendModal] = useState<{ id: string; name: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendReasonError, setSuspendReasonError] = useState("");
  const [approveModal, setApproveModal] = useState<{ id: string; name: string } | null>(null);
  const [reactivateModal, setReactivateModal] = useState<{ id: string; name: string } | null>(null);
  const [showTopupRequests, setShowTopupRequests] = useState(false);
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const pendingTopups = walletTopupRequests.filter((r) => r.status === "pending");

  let filtered = tab === "all" ? providers : providers.filter((p) => p.status === tab);
  if (typeFilter !== "all") filtered = filtered.filter((p) => p.type === typeFilter);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.includes(q) ||
        (p.phone || "").includes(q) ||
        (p.city || "").includes(q) ||
        (p.location.address || "").includes(q)
    );
  }

  function handleApprove(id: string, name: string) {
    setApproveModal({ id, name });
  }

  function doApprove() {
    if (!approveModal) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProvider(approveModal.id, { status: "approved", isAvailable: true });
    setApproveModal(null);
  }

  function openSuspendModal(id: string, name: string) {
    setSuspendModal({ id, name });
    setSuspendReason("");
    setSuspendReasonError("");
  }

  function confirmSuspend() {
    if (!suspendModal) return;
    if (!suspendReason.trim()) {
      setSuspendReasonError("يرجى إدخال سبب التعليق");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    suspendProvider(suspendModal.id, suspendReason.trim());
    setSuspendModal(null);
    setSuspendReason("");
    setSuspendReasonError("");
  }

  function handleReactivate(id: string, name: string) {
    setReactivateModal({ id, name });
  }

  function doReactivate() {
    if (!reactivateModal) return;
    updateProvider(reactivateModal.id, { status: "approved", suspensionReason: undefined });
    setReactivateModal(null);
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
        <View style={styles.headerRow}>
          <View style={styles.headerActions}>
            {pendingTopups.length > 0 && (
              <TouchableOpacity
                style={styles.topupBadge}
                onPress={() => setShowTopupRequests(true)}
              >
                <Feather name="dollar-sign" size={14} color="#000" />
                <Text style={styles.topupBadgeText}>{pendingTopups.length} شحن</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.searchBtn}>
              <Feather name="search" size={18} color="#c8a951" />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>إدارة المزودين</Text>
        </View>

        {showSearch && (
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="ابحث بالاسم أو رقم الهاتف أو المدينة..."
              placeholderTextColor="#555"
              textAlign="right"
            />
            <TouchableOpacity onPress={() => { setSearch(""); setShowSearch(false); }}>
              <Feather name="x" size={18} color="#888" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.typeFilterRow}>
          {(["all", "salon", "freelancer"] as FilterType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, typeFilter === t && styles.typeBtnActive]}
              onPress={() => setTypeFilter(t)}
            >
              <Text style={[styles.typeBtnText, typeFilter === t && styles.typeBtnTextActive]}>
                {t === "all" ? "الكل" : t === "salon" ? "صالونات" : "فريلانسر"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
        renderItem={({ item }) => {
          const providerServices = SERVICES.filter((s) => item.services.includes(s.id));
          return (
            <TouchableOpacity
              style={styles.provCard}
              onPress={() => router.push(`/admin/provider-detail/${item.id}` as any)}
            >
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
                    <View style={[styles.provAvatar, { backgroundColor: (item.avatarColor || "#c8a951") + "30" }]}>
                      <Text style={[styles.avatarInitial, { color: item.avatarColor || "#c8a951" }]}>
                        {item.name[0]}
                      </Text>
                    </View>
                    {item.isVerified && (
                      <View style={styles.verifiedDot}>
                        <Feather name="check" size={8} color="#fff" />
                      </View>
                    )}
                  </View>
                  <View style={styles.provInfo}>
                    <Text style={styles.provName}>{item.name}</Text>
                    <Text style={styles.provType}>{item.type === "salon" ? "🏪 صالون" : "👤 فريلانسر"} · {item.city || "—"}</Text>
                    {item.rating > 0 && <StarRating rating={item.rating} size={12} />}
                  </View>
                </View>
              </View>

              <View style={styles.provDetails}>
                <Detail icon="phone" value={item.phone || "—"} />
                <Detail icon="map-pin" value={item.location.address} />
                <Detail icon="briefcase" value={`${item.totalOrders} طلب · ${item.walletBalance} ر.س رصيد`} />
                <Detail icon="calendar" value={`انضم: ${item.joinedAt}`} />
              </View>

              <View style={styles.servicesRow}>
                {providerServices.slice(0, 3).map((s) => (
                  <View key={s.id} style={styles.serviceChip}>
                    <Text style={styles.serviceChipText}>{s.name}</Text>
                  </View>
                ))}
                {providerServices.length > 3 && (
                  <Text style={styles.moreServices}>+{providerServices.length - 3}</Text>
                )}
              </View>

              {item.status === "suspended" && item.suspensionReason && (
                <View style={styles.suspensionNote}>
                  <Feather name="alert-circle" size={13} color="#f44336" />
                  <Text style={styles.suspensionText}>سبب التعليق: {item.suspensionReason}</Text>
                </View>
              )}

              {!item.idVerified && (
                <View style={styles.idWarning}>
                  <Feather name="alert-triangle" size={14} color="#ff9800" />
                  <Text style={styles.idWarningText}>لم يتم توثيق الهوية</Text>
                </View>
              )}

              <View style={styles.actions}>
                {item.status === "pending" && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#f44336" + "20", borderColor: "#f44336" }]}
                      onPress={() => openSuspendModal(item.id, item.name)}
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
                    onPress={() => openSuspendModal(item.id, item.name)}
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
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#c8a951" + "20", borderColor: "#c8a951" }]}
                  onPress={() => router.push(`/admin/provider-detail/${item.id}` as any)}
                >
                  <Feather name="eye" size={14} color="#c8a951" />
                  <Text style={[styles.actionBtnText, { color: "#c8a951" }]}>التفاصيل</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={!!suspendModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.suspendModal}>
            <Text style={styles.suspendModalTitle}>تعليق حساب {suspendModal?.name}</Text>
            <Text style={styles.suspendModalDesc}>يرجى إدخال سبب التعليق — سيُبلَّغ المزود بهذا السبب</Text>
            <TextInput
              style={[styles.suspendReasonInput, suspendReasonError ? { borderColor: "#f44336", borderWidth: 1 } : {}]}
              value={suspendReason}
              onChangeText={(t) => { setSuspendReason(t); setSuspendReasonError(""); }}
              placeholder="مثال: انتهاك شروط الخدمة، شكاوى متعددة..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={3}
              textAlign="right"
              textAlignVertical="top"
            />
            {suspendReasonError !== "" && (
              <Text style={{ color: "#f44336", fontSize: 12, textAlign: "right", fontFamily: "Inter_400Regular" }}>{suspendReasonError}</Text>
            )}
            <View style={styles.suspendActions}>
              <TouchableOpacity
                style={[styles.suspendBtn, { borderColor: "#444", borderWidth: 1 }]}
                onPress={() => setSuspendModal(null)}
              >
                <Text style={[styles.suspendBtnText, { color: "#888" }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.suspendBtn, { backgroundColor: "#f44336" }]}
                onPress={confirmSuspend}
              >
                <Text style={[styles.suspendBtnText, { color: "#fff" }]}>تأكيد التعليق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showTopupRequests} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.topupModal]}>
            <View style={styles.topupHeader}>
              <TouchableOpacity onPress={() => setShowTopupRequests(false)}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.topupTitle}>طلبات شحن الرصيد</Text>
            </View>
            {pendingTopups.map((req) => (
              <View key={req.id} style={styles.topupCard}>
                <View style={styles.topupCardInfo}>
                  <Text style={styles.topupName}>{req.providerName}</Text>
                  <Text style={styles.topupAmount}>{req.amount} ر.س</Text>
                  {req.note && <Text style={styles.topupNote}>{req.note}</Text>}
                </View>
                <View style={styles.topupBtns}>
                  <TouchableOpacity
                    style={[styles.topupActionBtn, { backgroundColor: "#f44336" }]}
                    onPress={() => rejectWalletTopup(req.id)}
                  >
                    <Text style={styles.topupActionText}>رفض</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.topupActionBtn, { backgroundColor: "#4caf50" }]}
                    onPress={() => approveWalletTopup(req.id)}
                  >
                    <Text style={styles.topupActionText}>موافقة</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {pendingTopups.length === 0 && (
              <Text style={styles.emptyText}>لا توجد طلبات معلقة</Text>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={!!approveModal} transparent animationType="fade" onRequestClose={() => setApproveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.suspendModal, { alignItems: "center", gap: 14 }]}>
            <Feather name="check-circle" size={36} color="#4caf50" />
            <Text style={[styles.suspendModalTitle, { textAlign: "center" }]}>موافقة على {approveModal?.name}</Text>
            <Text style={[styles.suspendModalDesc, { textAlign: "center" }]}>سيُفعَّل الحساب ويتمكن المزود من استقبال الطلبات فوراً</Text>
            <View style={styles.suspendActions}>
              <TouchableOpacity style={[styles.suspendBtn, { borderColor: "#444", borderWidth: 1 }]} onPress={() => setApproveModal(null)}>
                <Text style={[styles.suspendBtnText, { color: "#888" }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.suspendBtn, { backgroundColor: "#4caf50" }]} onPress={doApprove}>
                <Text style={[styles.suspendBtnText, { color: "#fff" }]}>موافقة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!reactivateModal} transparent animationType="fade" onRequestClose={() => setReactivateModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.suspendModal, { alignItems: "center", gap: 14 }]}>
            <Feather name="play-circle" size={36} color="#4caf50" />
            <Text style={[styles.suspendModalTitle, { textAlign: "center" }]}>إعادة تفعيل {reactivateModal?.name}</Text>
            <Text style={[styles.suspendModalDesc, { textAlign: "center" }]}>سيُرفع التعليق ويعود الحساب لحالة نشط</Text>
            <View style={styles.suspendActions}>
              <TouchableOpacity style={[styles.suspendBtn, { borderColor: "#444", borderWidth: 1 }]} onPress={() => setReactivateModal(null)}>
                <Text style={[styles.suspendBtnText, { color: "#888" }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.suspendBtn, { backgroundColor: "#4caf50" }]} onPress={doReactivate}>
                <Text style={[styles.suspendBtnText, { color: "#fff" }]}>تفعيل</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  title: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBtn: { padding: 8, backgroundColor: "#1a1a2e", borderRadius: 10 },
  topupBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#c8a951", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  topupBadgeText: { color: "#000", fontSize: 12, fontFamily: "Inter_700Bold" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a2e", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, fontFamily: "Inter_400Regular" },
  typeFilterRow: { flexDirection: "row", gap: 8 },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "#333" },
  typeBtnActive: { backgroundColor: "#c8a951" + "30", borderColor: "#c8a951" },
  typeBtnText: { color: "#888", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  typeBtnTextActive: { color: "#c8a951" },
  tabBar: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#333" },
  tabBtnActive: { backgroundColor: "#c8a951", borderColor: "#c8a951" },
  tabText: { color: "#888", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: "#000" },
  list: { paddingHorizontal: 16, gap: 12 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 14 },
  emptyText: { color: "#666", fontSize: 16, fontFamily: "Inter_400Regular", textAlign: "center" },
  provCard: { backgroundColor: "#1a1a2e", borderRadius: 16, overflow: "hidden" },
  provTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16 },
  provLeft: { alignItems: "flex-start", gap: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular" },
  provRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  provAvatarArea: { position: "relative" },
  provAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 20, fontFamily: "Inter_700Bold" },
  verifiedDot: { position: "absolute", bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: "#4caf50", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#1a1a2e" },
  provInfo: { alignItems: "flex-end", gap: 3 },
  provName: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  provType: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular" },
  provDetails: { paddingHorizontal: 16, paddingBottom: 10, gap: 5, borderTopWidth: 1, borderTopColor: "#2a2a3e", paddingTop: 12 },
  detailRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 },
  detailValue: { color: "#aaa", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  servicesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 16, paddingBottom: 10, justifyContent: "flex-end" },
  serviceChip: { backgroundColor: "#c8a951" + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  serviceChipText: { color: "#c8a951", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  moreServices: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular", alignSelf: "center" },
  suspensionNote: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 16, marginBottom: 8, backgroundColor: "#f44336" + "15", padding: 8, borderRadius: 8 },
  suspensionText: { color: "#f44336", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right", flex: 1 },
  idWarning: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "flex-end", marginHorizontal: 16, marginBottom: 8 },
  idWarningText: { color: "#ff9800", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", gap: 8, padding: 14, paddingTop: 0 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 10, borderRadius: 10, borderWidth: 1, gap: 6 },
  actionBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  suspendModal: { backgroundColor: "#1a1a2e", borderRadius: 20, padding: 24, gap: 14 },
  suspendModalTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "right" },
  suspendModalDesc: { color: "#888", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  suspendReasonInput: { backgroundColor: "#0d0d1a", color: "#fff", borderRadius: 12, padding: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80 },
  suspendActions: { flexDirection: "row", gap: 12 },
  suspendBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  suspendBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  topupModal: { backgroundColor: "#1a1a2e", borderRadius: 20, padding: 20, gap: 14, maxHeight: "80%" },
  topupHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topupTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  topupCard: { backgroundColor: "#0d0d1a", borderRadius: 14, padding: 14, gap: 10 },
  topupCardInfo: { alignItems: "flex-end", gap: 4 },
  topupName: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  topupAmount: { color: "#c8a951", fontSize: 20, fontFamily: "Inter_700Bold" },
  topupNote: { color: "#888", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  topupBtns: { flexDirection: "row", gap: 10 },
  topupActionBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center" },
  topupActionText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
});
