import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Image, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  const [logoUri, setLogoUri] = useState(systemSettings.appLogoUri || "");
  const [mapsApiKey, setMapsApiKey] = useState(systemSettings.googleMapsApiKey || "");
  const [locationEnabled, setLocationEnabled] = useState(systemSettings.locationEnabled !== false);
  const [offerExpiryDays, setOfferExpiryDays] = useState(String(systemSettings.offerExpiryDays ?? 2));
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  async function pickLogo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  }

  function handleSave() {
    const r = parseInt(radius);
    const w = parseInt(window);
    const c = parseFloat(commission);
    const m = parseFloat(minOffer);
    if (isNaN(r) || isNaN(w) || isNaN(c) || isNaN(m)) {
      setSaveError("يرجى إدخال قيم صحيحة");
      setSaveSuccess(false);
      return;
    }
    const expiry = parseInt(offerExpiryDays);
    updateSystemSettings({
      radiusKm: r, offerWindowMinutes: w, commissionPercent: c, minOfferAmount: m,
      appLogoUri: logoUri.trim() || undefined,
      googleMapsApiKey: mapsApiKey.trim() || undefined,
      locationEnabled,
      offerExpiryDays: isNaN(expiry) || expiry < 1 ? 2 : expiry,
    });
    setSaveError("");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
        <SettingField
          icon="calendar"
          label="مدة انتهاء صلاحية العروض (أيام)"
          value={offerExpiryDays}
          onChange={setOfferExpiryDays}
          desc="بعد انقضاء هذه المدة تُخفى العروض القديمة ويُرسَل إشعار للعميل للاختيار"
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
          label="الحد الأدنى للعرض (د.أ)"
          value={minOffer}
          onChange={setMinOffer}
          desc="أقل مبلغ يمكن لمزود الخدمة تقديمه كعرض"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إعدادات الموقع والخريطة</Text>
        <View style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: "#333", true: "#c8a951" }}
              thumbColor="#fff"
            />
            <View style={styles.fieldLabel}>
              <Text style={styles.fieldLabelText}>تفعيل خدمة الموقع</Text>
              <Feather name="map-pin" size={16} color="#c8a951" />
            </View>
          </View>
          <Text style={styles.fieldDesc}>السماح للتطبيق بتحديد موقع العميل تلقائياً وإرسال الطلبات لمزودي الخدمة القريبين</Text>
        </View>
        <View style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <TextInput
              style={[styles.fieldInput, { fontSize: 13, flex: 1 }]}
              value={mapsApiKey}
              onChangeText={setMapsApiKey}
              placeholder="أدخل مفتاح Google Maps API"
              placeholderTextColor="#555"
              textAlign="right"
              secureTextEntry={false}
            />
            <View style={styles.fieldLabel}>
              <Text style={styles.fieldLabelText}>مفتاح Google Maps</Text>
              <Feather name="navigation" size={16} color="#c8a951" />
            </View>
          </View>
          <Text style={styles.fieldDesc}>مطلوب لتفعيل الخريطة التفاعلية وتحديد المواقع بدقة — احصل عليه من Google Cloud Console</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إعدادات واجهة التطبيق</Text>
        <View style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <View style={{ flex: 1 }} />
            <View style={styles.fieldLabel}>
              <Text style={styles.fieldLabelText}>شعار التطبيق</Text>
              <Feather name="image" size={16} color="#c8a951" />
            </View>
          </View>
          <Text style={styles.fieldDesc}>اختر صورة الشعار من استوديو الهاتف (PNG/JPG) — سيظهر في شاشة الدخول بدلاً من الشعار الافتراضي</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={{ width: 64, height: 64, borderRadius: 16, borderWidth: 2, borderColor: "#c8a951" }} />
            ) : (
              <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: "#2a2a3e", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#333" }}>
                <Feather name="image" size={24} color="#555" />
              </View>
            )}
            <View style={{ flex: 1, gap: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: "#c8a951", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" }}
                onPress={pickLogo}
              >
                <Feather name="camera" size={16} color="#000" />
                <Text style={{ color: "#000", fontSize: 13, fontFamily: "Inter_700Bold" }}>اختيار من الاستوديو</Text>
              </TouchableOpacity>
              {logoUri ? (
                <TouchableOpacity
                  style={{ paddingVertical: 8, alignItems: "center" }}
                  onPress={() => setLogoUri("")}
                >
                  <Text style={{ color: "#f44336", fontSize: 12, fontFamily: "Inter_400Regular" }}>إزالة الشعار</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
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

      {saveError !== "" && (
        <View style={{ backgroundColor: "#f44336" + "20", borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <Text style={{ color: "#f44336", fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>{saveError}</Text>
        </View>
      )}
      {saveSuccess && (
        <View style={{ backgroundColor: "#4caf50" + "20", borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <Text style={{ color: "#4caf50", fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>✓ تم حفظ الإعدادات بنجاح</Text>
        </View>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Feather name="save" size={18} color="#000" />
        <Text style={styles.saveBtnText}>حفظ الإعدادات</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutConfirm(true)}>
        <Feather name="log-out" size={16} color="#f44336" />
        <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
      </TouchableOpacity>

      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>تسجيل الخروج</Text>
            <Text style={styles.confirmMsg}>هل أنت متأكد من تسجيل الخروج؟</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.confirmCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmLogout}
                onPress={async () => { setShowLogoutConfirm(false); await logout(); router.replace("/login"); }}
              >
                <Text style={styles.confirmLogoutText}>خروج</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 },
  confirmBox: { backgroundColor: "#1a1a2e", borderRadius: 20, padding: 24, gap: 14 },
  confirmTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  confirmMsg: { color: "#888", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  confirmActions: { flexDirection: "row", gap: 12 },
  confirmCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#444", alignItems: "center" },
  confirmCancelText: { color: "#888", fontSize: 14, fontFamily: "Inter_700Bold" },
  confirmLogout: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: "#f44336", alignItems: "center" },
  confirmLogoutText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
});
