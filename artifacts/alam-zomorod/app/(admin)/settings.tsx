import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { systemSettings, updateSystemSettings } = useData();
  const { logout } = useAuth();
  const [radius, setRadius] = useState(String(systemSettings.radiusKm));
  const [window, setWindow] = useState(String(systemSettings.offerWindowMinutes));
  const [commission, setCommission] = useState(String(systemSettings.commissionPercent));
  const [minOffer, setMinOffer] = useState(String(systemSettings.minOfferAmount));
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  function handleSave() {
    const r = parseInt(radius);
    const w = parseInt(window);
    const c = parseFloat(commission);
    const m = parseFloat(minOffer);
    if (isNaN(r) || isNaN(w) || isNaN(c) || isNaN(m)) {
      Alert.alert("خطأ", "يرجى إدخال قيم صحيحة");
      return;
    }
    updateSystemSettings({ radiusKm: r, offerWindowMinutes: w, commissionPercent: c, minOfferAmount: m });
    Alert.alert("تم", "تم حفظ الإعدادات بنجاح");
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: "#0d0d1a" }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + webTopPad + 10, paddingBottom: insets.bottom + webBottomPad + 90 }]}
    >
      <Text style={styles.title}>إعدادات النظام</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إعدادات الطلبات</Text>

        <SettingField
          icon="map-pin"
          label="نصف قطر البحث (كم)"
          value={radius}
          onChange={setRadius}
          desc="الحد الأقصى للمسافة التي يُرسَل فيها الطلب لمزودي الخدمة"
          keyboardType="numeric"
        />
        <SettingField
          icon="clock"
          label="نافذة استقبال العروض (دقيقة)"
          value={window}
          onChange={setWindow}
          desc="المدة التي يستقبل فيها العميل العروض قبل إغلاق الطلب"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إعدادات العمولات</Text>

        <SettingField
          icon="percent"
          label="نسبة العمولة (%)"
          value={commission}
          onChange={setCommission}
          desc="النسبة المخصومة من رصيد مزود الخدمة بعد كل طلب"
          keyboardType="numeric"
        />
        <SettingField
          icon="dollar-sign"
          label="الحد الأدنى للعرض (ريال)"
          value={minOffer}
          onChange={setMinOffer}
          desc="أقل مبلغ يمكن لمزود الخدمة تقديمه كعرض"
          keyboardType="numeric"
        />
      </View>

      <View style={[styles.infoCard, { backgroundColor: "#1a1a2e" }]}>
        <Text style={styles.infoTitle}>آلية حماية البيانات</Text>
        <View style={styles.infoRow}>
          <Feather name="check" size={14} color="#4caf50" />
          <Text style={styles.infoText}>معلومات الطرفين مخفية قبل قبول العرض</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="check" size={14} color="#4caf50" />
          <Text style={styles.infoText}>رقم هاتف العميل يظهر فقط للمزود المقبول</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="check" size={14} color="#4caf50" />
          <Text style={styles.infoText}>باقي العروض تُرفض تلقائياً عند قبول عرض واحد</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="check" size={14} color="#4caf50" />
          <Text style={styles.infoText}>العمولة تُخصم تلقائياً من رصيد المحفظة</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Feather name="save" size={18} color="#000" />
        <Text style={styles.saveBtnText}>حفظ الإعدادات</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => {
          Alert.alert("تسجيل الخروج", "تأكيد؟", [
            { text: "إلغاء", style: "cancel" },
            { text: "خروج", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
          ]);
        }}
      >
        <Feather name="log-out" size={16} color="#f44336" />
        <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SettingField({ icon, label, value, onChange, desc, keyboardType }: any) {
  return (
    <View style={styles.fieldCard}>
      <View style={styles.fieldHeader}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType || "default"}
          textAlign="right"
          placeholderTextColor="#555"
        />
        <View style={styles.fieldLabel}>
          <Text style={styles.fieldLabelText}>{label}</Text>
          <Feather name={icon} size={16} color="#c8a951" />
        </View>
      </View>
      <Text style={styles.fieldDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  title: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "right" },
  section: { gap: 10 },
  sectionTitle: { color: "#c8a951", fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "right" },
  fieldCard: { backgroundColor: "#1a1a2e", borderRadius: 14, padding: 14, gap: 8 },
  fieldHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fieldLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldLabelText: { color: "#aaa", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  fieldInput: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", minWidth: 80 },
  fieldDesc: { color: "#666", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 18 },
  infoCard: { borderRadius: 16, padding: 16, gap: 10 },
  infoTitle: { color: "#c8a951", fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "flex-end" },
  infoText: { color: "#aaa", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#c8a951", padding: 16, borderRadius: 14, gap: 10 },
  saveBtnText: { color: "#000", fontSize: 16, fontFamily: "Inter_700Bold" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#f44336" + "50", gap: 10 },
  logoutBtnText: { color: "#f44336", fontSize: 15, fontFamily: "Inter_700Bold" },
});
