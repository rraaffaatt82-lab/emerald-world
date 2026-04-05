import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";

export default function AdminCouponsScreen() {
  const insets = useSafeAreaInsets();
  const { coupons, addCoupon, updateCoupon, deleteCoupon, packages, approvePackage, rejectPackage } = useData();
  const [tab, setTab] = useState<"coupons" | "packages">("coupons");
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"fixed" | "percent">("percent");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("100");
  const [description, setDescription] = useState("");
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  function handleAdd() {
    if (!code.trim() || !value.trim()) {
      Alert.alert("خطأ", "يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) {
      Alert.alert("خطأ", "يرجى إدخال قيمة صحيحة");
      return;
    }
    if (type === "percent" && v > 100) {
      Alert.alert("خطأ", "نسبة الخصم لا يمكن أن تتجاوز 100%");
      return;
    }
    addCoupon({
      code: code.trim().toUpperCase(),
      type,
      value: v,
      maxUses: parseInt(maxUses) || 100,
      isActive: true,
      description: description.trim() || undefined,
    });
    setShowModal(false);
    setCode(""); setValue(""); setMaxUses("100"); setDescription("");
  }

  return (
    <View style={[styles.container, { backgroundColor: "#0d0d1a" }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopPad + 10 }]}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
        >
          <Feather name="plus" size={18} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>كوبونات وباقات</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "coupons" && styles.tabBtnActive]}
          onPress={() => setTab("coupons")}
        >
          <Text style={[styles.tabText, tab === "coupons" && styles.tabTextActive]}>كوبونات الخصم</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "packages" && styles.tabBtnActive]}
          onPress={() => setTab("packages")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {packages.filter((p) => p.status === "pending").length > 0 && (
              <View style={styles.pendingDot} />
            )}
            <Text style={[styles.tabText, tab === "packages" && styles.tabTextActive]}>
              الباقات ({packages.filter((p) => p.status === "pending").length} بانتظار)
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {tab === "coupons" && (
        <FlatList
          data={coupons}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + webBottomPad + 90 }]}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Feather name="tag" size={40} color="#444" />
              <Text style={styles.emptyText}>لا توجد كوبونات بعد</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.couponCard}>
              <View style={styles.couponTop}>
                <View style={styles.couponLeft}>
                  <Switch
                    value={item.isActive}
                    onValueChange={(v) => updateCoupon(item.id, { isActive: v })}
                    trackColor={{ false: "#333", true: "#c8a951" + "60" }}
                    thumbColor={item.isActive ? "#c8a951" : "#888"}
                  />
                  <TouchableOpacity
                    onPress={() => Alert.alert("حذف", `حذف كوبون ${item.code}؟`, [
                      { text: "إلغاء", style: "cancel" },
                      { text: "حذف", style: "destructive", onPress: () => deleteCoupon(item.id) },
                    ])}
                  >
                    <Feather name="trash-2" size={16} color="#f44336" />
                  </TouchableOpacity>
                </View>
                <View style={styles.couponRight}>
                  <Text style={styles.couponCode}>{item.code}</Text>
                  <View style={styles.couponBadge}>
                    <Text style={styles.couponValue}>
                      {item.type === "percent" ? `${item.value}%` : `${item.value} ر.س`}
                    </Text>
                    <Text style={styles.couponType}>{item.type === "percent" ? "نسبة" : "قيمة ثابتة"}</Text>
                  </View>
                </View>
              </View>
              {item.description && (
                <Text style={styles.couponDesc}>{item.description}</Text>
              )}
              <View style={styles.couponStats}>
                <Text style={styles.couponStatText}>{item.usedCount} / {item.maxUses} استخدام</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, (item.usedCount / item.maxUses) * 100)}%` as any }]} />
                </View>
              </View>
            </View>
          )}
        />
      )}

      {tab === "packages" && (
        <FlatList
          data={packages}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + webBottomPad + 90 }]}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Feather name="box" size={40} color="#444" />
              <Text style={styles.emptyText}>لا توجد باقات</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.pkgCard}>
              <View style={styles.pkgTop}>
                <View style={[styles.pkgStatusBadge, {
                  backgroundColor: item.status === "approved" ? "#4caf50" + "20" :
                    item.status === "rejected" ? "#f44336" + "20" : "#ff9800" + "20",
                }]}>
                  <Text style={[styles.pkgStatusText, {
                    color: item.status === "approved" ? "#4caf50" :
                      item.status === "rejected" ? "#f44336" : "#ff9800",
                  }]}>
                    {item.status === "approved" ? "معتمدة" : item.status === "rejected" ? "مرفوضة" : "بانتظار"}
                  </Text>
                </View>
                <View style={styles.pkgInfo}>
                  <Text style={styles.pkgTitle}>{item.title}</Text>
                  <Text style={styles.pkgProvider}>{item.providerName}</Text>
                </View>
              </View>
              <Text style={styles.pkgDesc}>{item.description}</Text>
              <View style={styles.pkgServices}>
                {item.serviceNames.map((s, i) => (
                  <View key={i} style={styles.serviceChip}>
                    <Text style={styles.serviceChipText}>{s}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.pkgPrices}>
                <Text style={styles.pkgOriginalPrice}>{item.originalPrice} ر.س</Text>
                <Text style={styles.pkgPrice}>{item.price} ر.س</Text>
                <Text style={styles.pkgSavings}>وفّري {item.originalPrice - item.price} ر.س</Text>
              </View>
              {item.status === "pending" && (
                <View style={styles.pkgActions}>
                  <TouchableOpacity
                    style={[styles.pkgBtn, { backgroundColor: "#f44336" + "20", borderColor: "#f44336" }]}
                    onPress={() => rejectPackage(item.id)}
                  >
                    <Text style={[styles.pkgBtnText, { color: "#f44336" }]}>رفض</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pkgBtn, { backgroundColor: "#4caf50" }]}
                    onPress={() => approvePackage(item.id)}
                  >
                    <Text style={[styles.pkgBtnText, { color: "#fff" }]}>اعتماد</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة كوبون جديد</Text>
            </View>

            <Text style={styles.fieldLabel}>كود الكوبون *</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="مثال: SUMMER30"
              placeholderTextColor="#555"
              autoCapitalize="characters"
              textAlign="right"
            />

            <Text style={styles.fieldLabel}>نوع الخصم</Text>
            <View style={styles.typeRow}>
              {(["percent", "fixed"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                    {t === "percent" ? "نسبة مئوية %" : "قيمة ثابتة ر.س"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>القيمة *</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder={type === "percent" ? "مثال: 20" : "مثال: 50"}
              placeholderTextColor="#555"
              keyboardType="numeric"
              textAlign="right"
            />

            <Text style={styles.fieldLabel}>عدد مرات الاستخدام</Text>
            <TextInput
              style={styles.input}
              value={maxUses}
              onChangeText={setMaxUses}
              keyboardType="numeric"
              textAlign="right"
              placeholder="100"
              placeholderTextColor="#555"
            />

            <Text style={styles.fieldLabel}>وصف (اختياري)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="وصف الكوبون..."
              placeholderTextColor="#555"
              textAlign="right"
            />

            <TouchableOpacity style={styles.addCouponBtn} onPress={handleAdd}>
              <Feather name="plus" size={18} color="#000" />
              <Text style={styles.addCouponBtnText}>إضافة الكوبون</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 },
  title: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  addBtn: { backgroundColor: "#c8a951", padding: 10, borderRadius: 12 },
  tabRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#333", alignItems: "center" },
  tabBtnActive: { backgroundColor: "#c8a951", borderColor: "#c8a951" },
  tabText: { color: "#888", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: "#000" },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff9800" },
  list: { paddingHorizontal: 16, gap: 12 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 14 },
  emptyText: { color: "#666", fontSize: 15, fontFamily: "Inter_400Regular" },
  couponCard: { backgroundColor: "#1a1a2e", borderRadius: 16, padding: 16, gap: 10 },
  couponTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  couponLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  couponRight: { alignItems: "flex-end", gap: 4 },
  couponCode: { color: "#c8a951", fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  couponBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  couponValue: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  couponType: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular" },
  couponDesc: { color: "#aaa", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  couponStats: { gap: 6 },
  couponStatText: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  progressBar: { height: 4, backgroundColor: "#2a2a3e", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, backgroundColor: "#c8a951", borderRadius: 2 },
  pkgCard: { backgroundColor: "#1a1a2e", borderRadius: 16, padding: 16, gap: 10 },
  pkgTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  pkgStatusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  pkgStatusText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  pkgInfo: { alignItems: "flex-end", gap: 3 },
  pkgTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  pkgProvider: { color: "#888", fontSize: 12, fontFamily: "Inter_400Regular" },
  pkgDesc: { color: "#aaa", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  pkgServices: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" },
  serviceChip: { backgroundColor: "#c8a951" + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  serviceChipText: { color: "#c8a951", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  pkgPrices: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "flex-end" },
  pkgOriginalPrice: { color: "#666", fontSize: 14, fontFamily: "Inter_400Regular", textDecorationLine: "line-through" },
  pkgPrice: { color: "#c8a951", fontSize: 20, fontFamily: "Inter_700Bold" },
  pkgSavings: { color: "#4caf50", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  pkgActions: { flexDirection: "row", gap: 10 },
  pkgBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  pkgBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#1a1a2e", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  fieldLabel: { color: "#aaa", fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  input: { backgroundColor: "#0d0d1a", color: "#fff", borderRadius: 12, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#333", alignItems: "center" },
  typeBtnActive: { backgroundColor: "#c8a951", borderColor: "#c8a951" },
  typeBtnText: { color: "#888", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  typeBtnTextActive: { color: "#000" },
  addCouponBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#c8a951", padding: 16, borderRadius: 14, gap: 10, marginTop: 4 },
  addCouponBtnText: { color: "#000", fontSize: 16, fontFamily: "Inter_700Bold" },
});
