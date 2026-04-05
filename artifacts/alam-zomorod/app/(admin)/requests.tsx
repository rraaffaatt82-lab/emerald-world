import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { FlatList, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";

type FilterTab = "all" | "pending" | "active" | "completed" | "cancelled";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "انتظار", color: "#ff9800" },
  offers_received: { label: "عروض", color: "#2196f3" },
  accepted: { label: "مقبول", color: "#9c27b0" },
  in_progress: { label: "جارٍ", color: "#c8a951" },
  completed: { label: "مكتمل", color: "#4caf50" },
  cancelled: { label: "ملغي", color: "#f44336" },
};

export default function AdminRequestsScreen() {
  const insets = useSafeAreaInsets();
  const { requests } = useData();
  const [tab, setTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const filtered = requests.filter((r) => {
    if (tab === "all") return true;
    if (tab === "pending") return ["pending", "offers_received"].includes(r.status);
    if (tab === "active") return ["accepted", "in_progress"].includes(r.status);
    if (tab === "completed") return r.status === "completed";
    return r.status === "cancelled";
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "pending", label: "انتظار" },
    { key: "active", label: "نشطة" },
    { key: "completed", label: "منجزة" },
    { key: "cancelled", label: "ملغاة" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: "#0d0d1a" }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopPad + 10 }]}>
        <Text style={styles.title}>جميع الطلبات</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{requests.length} طلب</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
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
            <Feather name="clipboard" size={40} color="#444" />
            <Text style={styles.emptyText}>لا توجد طلبات</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const st = STATUS_LABELS[item.status] || { label: item.status, color: "#888" };
          const isExpanded = expandedId === item.id;
          return (
            <TouchableOpacity
              style={styles.reqCard}
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.reqTop}>
                <View style={[styles.statusPill, { backgroundColor: st.color + "20", borderColor: st.color + "50" }]}>
                  <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                </View>
                <View style={styles.reqTitleArea}>
                  <Text style={styles.reqService}>{item.serviceName}</Text>
                  <Text style={styles.reqCategory}>{item.categoryName}</Text>
                </View>
              </View>

              <View style={styles.reqDetails}>
                <ReqRow icon="user" label="العميل" value={item.customerName} />
                {item.customerPhone && (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.customerPhone}`)}>
                    <ReqRow icon="phone" label="هاتف العميل" value={item.customerPhone} highlight />
                  </TouchableOpacity>
                )}
                <ReqRow icon="map-pin" label="الموقع" value={item.address} />
                <ReqRow icon="calendar" label="الموعد" value={new Date(item.scheduledAt).toLocaleDateString("ar-SA")} />
                {item.price !== undefined && <ReqRow icon="dollar-sign" label="السعر" value={`${item.price} د.أ`} />}
                {item.couponCode && <ReqRow icon="tag" label="كوبون" value={item.couponCode} />}
                <ReqRow icon="clock" label="عدد العروض" value={`${item.offers.length} عرض`} />
              </View>

              {item.offers.length > 0 && (
                <>
                  <View style={styles.offersDivider}>
                    <Text style={styles.offersDividerText}>العروض المقدمة ({item.offers.length})</Text>
                  </View>
                  {item.offers.map((o) => (
                    <View key={o.id} style={[styles.offerRow, { borderColor: o.status === "accepted" ? "#4caf50" + "50" : "#333" }]}>
                      <View style={styles.offerRowLeft}>
                        <View style={[styles.offerStatusDot, { backgroundColor: o.status === "accepted" ? "#4caf50" : o.status === "rejected" ? "#f44336" : "#888" }]} />
                        <Text style={styles.offerStatus}>
                          {o.status === "accepted" ? "مقبول" : o.status === "rejected" ? "مرفوض" : "بانتظار"}
                        </Text>
                      </View>
                      <View style={styles.offerRowRight}>
                        <Text style={styles.offerProviderName}>{o.providerName}</Text>
                        <Text style={styles.offerPrice}>{o.price} د.أ · {o.eta} دقيقة</Text>
                        {o.note && <Text style={styles.offerNote}>💬 {o.note}</Text>}
                      </View>
                    </View>
                  ))}
                </>
              )}

              {item.providerName && (
                <View style={[styles.contactStatus, { backgroundColor: "#4caf50" + "15" }]}>
                  <Feather name="briefcase" size={14} color="#4caf50" />
                  <Text style={[styles.contactStatusText, { color: "#4caf50" }]}>
                    المزودة المقبولة: {item.providerName}
                    {item.providerPhone ? ` — ☎ ${item.providerPhone}` : ""}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function ReqRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.rowItem}>
      <Text style={[styles.rowValue, highlight && { color: "#c8a951" }]}>{value}</Text>
      <View style={styles.rowLabel}>
        <Text style={styles.rowLabelText}>{label}</Text>
        <Feather name={icon as any} size={13} color={highlight ? "#c8a951" : "#666"} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  countBadge: { backgroundColor: "#c8a951" + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#c8a951" + "40" },
  countText: { color: "#c8a951", fontSize: 13, fontFamily: "Inter_700Bold" },
  tabRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#333" },
  tabBtnActive: { backgroundColor: "#c8a951", borderColor: "#c8a951" },
  tabText: { color: "#888", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: "#000" },
  list: { paddingHorizontal: 16, gap: 12 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 14 },
  emptyText: { color: "#666", fontSize: 16, fontFamily: "Inter_400Regular" },
  reqCard: { backgroundColor: "#1a1a2e", borderRadius: 16, overflow: "hidden" },
  reqTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16, paddingBottom: 12 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  reqTitleArea: { alignItems: "flex-end" },
  reqService: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  reqCategory: { color: "#888", fontSize: 13, fontFamily: "Inter_400Regular" },
  reqDetails: { paddingHorizontal: 16, paddingBottom: 12, gap: 6, borderTopWidth: 1, borderTopColor: "#2a2a3e", paddingTop: 12 },
  rowItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowLabelText: { color: "#666", fontSize: 12, fontFamily: "Inter_400Regular" },
  rowValue: { color: "#aaa", fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1, marginStart: 10 },
  offersDivider: { backgroundColor: "#2a2a3e", paddingHorizontal: 16, paddingVertical: 8 },
  offersDividerText: { color: "#c8a951", fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right" },
  offerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  offerRowLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  offerStatusDot: { width: 8, height: 8, borderRadius: 4 },
  offerStatus: { color: "#888", fontSize: 11, fontFamily: "Inter_400Regular" },
  offerRowRight: { alignItems: "flex-end", flex: 1 },
  offerProviderName: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  offerPrice: { color: "#c8a951", fontSize: 12, fontFamily: "Inter_400Regular" },
  offerNote: { color: "#666", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  contactStatus: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 10, gap: 8 },
  contactStatusText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
